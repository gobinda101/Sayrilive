const express = require('express');
const http = require('http');
const { Server } = require('socket.io');
const { LiveChat } = require('youtube-chat');
const path = require('path');
const https = require('https');
const fs = require('fs');

const app = express();
const server = http.createServer(app);
const io = new Server(server);

const PORT = 3000;
const LOG_FILE = path.join(__dirname, 'viewers_log.txt');

const LIVE_URL = process.argv[2];

function extractLiveId(url) {
    if (!url || url.includes('YOUR_YOUTUBE_LIVE_ID_HERE')) return null;
    const match = url.match(/(?:v=|\/live\/|youtu\.be\/)([^&\?]+)/);
    return match ? match[1] : null;
}

const LIVE_ID = extractLiveId(LIVE_URL);
app.use(express.static(path.join(__dirname, 'public')));

app.get('/tts', (req, res) => {
    const text = req.query.text;
    const url = `https://translate.google.com/translate_tts?ie=UTF-8&q=${encodeURIComponent(text)}&tl=hi&client=tw-ob`;
    https.get(url, (response) => {
        res.setHeader('Content-Type', 'audio/mpeg');
        response.pipe(res);
    });
});

let hajiriCount = 0;
const hajiriList = new Set();
let currentPaheli = null;

if (LIVE_ID) {
    const liveChat = new LiveChat({ liveId: LIVE_ID });
    const sayris = JSON.parse(fs.readFileSync(path.join(__dirname, 'sayris.json'), 'utf8'));
    const jokes = JSON.parse(fs.readFileSync(path.join(__dirname, 'jokes.json'), 'utf8'));
    const paheliyan = JSON.parse(fs.readFileSync(path.join(__dirname, 'paheli.json'), 'utf8'));

    // Interval to send Paheli every 3 minutes
    setInterval(() => {
        currentPaheli = paheliyan[Math.floor(Math.random() * paheliyan.length)];
        io.emit('new-paheli', currentPaheli.question);
        console.log(`[PAHELI] ${currentPaheli.question}`);
    }, 180000);

    liveChat.on('chat', (chatItem) => {
        const messageText = chatItem.message ? chatItem.message.map(m => m.text).join('') : '';
        const author = chatItem.author.name;
        const upperMsg = messageText.toUpperCase();

        let resultText = '';
        let takeover = null;
        let isVip = false;
        let soundEffect = null;

        // 1. Paheli Answer Check
        if (currentPaheli && upperMsg.includes(currentPaheli.answer.toUpperCase())) {
            resultText = `WOW! ${author} ne sahi jawab diya! Answer tha: ${currentPaheli.answer}. Aap bante hain Winner!`;
            takeover = 'WINNER';
            currentPaheli = null; // Reset paheli
        }
        // 2. Sound Triggers
        else if (upperMsg.includes('HAHA')) soundEffect = 'laugh';
        else if (upperMsg.includes('CLAP')) soundEffect = 'clap';
        else if (upperMsg.includes('OOPS')) soundEffect = 'oops';

        // 3. Hajiri
        else if (upperMsg.includes('PRESENT') && hajiriCount < 10 && !hajiriList.has(author)) {
            hajiriCount++;
            hajiriList.add(author);
            isVip = true;
            resultText = `VIP Shoutout to ${author}! Early bird badge unlocked!`;
        }
        // 4. Mood Control
        else if (upperMsg.includes('LOVE')) resultText = sayris.LOVE[Math.floor(Math.random() * sayris.LOVE.length)];
        else if (upperMsg.includes('SAD')) resultText = sayris.SAD[Math.floor(Math.random() * sayris.SAD.length)];
        else if (upperMsg.includes('DOSTI')) resultText = sayris.DOSTI[Math.floor(Math.random() * sayris.DOSTI.length)];
        else if (upperMsg.includes('JOKE')) {
            resultText = jokes[Math.floor(Math.random() * jokes.length)];
            takeover = 'LAUGH';
        }
        else {
            const cat = ['LOVE', 'SAD', 'DOSTI', 'RANDOM'][Math.floor(Math.random() * 4)];
            resultText = sayris[cat][Math.floor(Math.random() * sayris[cat].length)];
        }

        if (upperMsg.includes('DIL')) takeover = 'HEARTS';
        if (upperMsg.includes('FIRE')) takeover = 'FIREWORKS';

        io.emit('new-comment', {
            name: author,
            avatar: chatItem.author.thumbnail ? (typeof chatItem.author.thumbnail === 'string' ? chatItem.author.thumbnail : chatItem.author.thumbnail[0].url) : '',
            sayri: resultText,
            isVip: isVip || hajiriList.has(author),
            takeover: takeover,
            soundEffect: soundEffect
        });
    });

    liveChat.start().then(() => console.log('🟢 Connected')).catch(e => console.error(e));
}

server.listen(PORT, () => console.log(`Server running at http://localhost:${PORT}`));
