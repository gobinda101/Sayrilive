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

// YouTube Live URL from Command Line Argument
const LIVE_URL = process.argv[2];

function extractLiveId(url) {
    if (!url || url.includes('YOUR_YOUTUBE_LIVE_ID_HERE')) return null;
    const match = url.match(/(?:v=|\/live\/|youtu\.be\/)([^&\?]+)/);
    return match ? match[1] : null;
}

const LIVE_ID = extractLiveId(LIVE_URL);
console.log('Target YouTube Video ID:', LIVE_ID || 'NONE (Mock Mode)');

app.use(express.static(path.join(__dirname, 'public')));

// TTS Proxy Route
app.get('/tts', (req, res) => {
    const text = req.query.text;
    if (!text) return res.status(400).send('Text is required');
    const url = `https://translate.google.com/translate_tts?ie=UTF-8&q=${encodeURIComponent(text)}&tl=hi&client=tw-ob`;
    https.get(url, (response) => {
        res.setHeader('Content-Type', 'audio/mpeg');
        response.pipe(res);
    }).on('error', (err) => {
        console.error('TTS Proxy Error:', err);
        res.status(500).send('Error fetching TTS');
    });
});

// Function to log unique viewers to a file
function logViewer(name) {
    const timestamp = new Date().toLocaleString();
    const logEntry = `[${timestamp}] Name: ${name}\n`;
    fs.appendFileSync(LOG_FILE, logEntry);
}

io.on('connection', (socket) => {
    console.log('OBS Browser Source connected');
});

if (LIVE_ID) {
    const liveChat = new LiveChat({ liveId: LIVE_ID });
    const sayris = JSON.parse(fs.readFileSync(path.join(__dirname, 'sayris.json'), 'utf8'));
    const uniqueSessionViewers = new Set();

    liveChat.on('chat', (chatItem) => {
        const author = chatItem.author.name;

        // Log to file if it's the first time they chat in this session
        if (!uniqueSessionViewers.has(author)) {
            uniqueSessionViewers.add(author);
            logViewer(author);
            console.log(`[NEW VIEWER LOGGED] ${author}`);
        }

        let thumbnail = '';
        if (chatItem.author.thumbnail) {
            if (typeof chatItem.author.thumbnail === 'string') thumbnail = chatItem.author.thumbnail;
            else if (chatItem.author.thumbnail.url) thumbnail = chatItem.author.thumbnail.url;
            else if (Array.isArray(chatItem.author.thumbnail) && chatItem.author.thumbnail.length > 0) thumbnail = chatItem.author.thumbnail[0].url;
        }

        let randomSayri = sayris[Math.floor(Math.random() * sayris.length)];
        if (author.toLowerCase() === 'gobinda') {
            randomSayri = "Tanhaayi mein aksar tujhe yaad karte hain, teri tasveer se ghanto baat karte hain.";
        }

        io.emit('new-comment', { name: author, avatar: thumbnail, sayri: randomSayri });
    });

    liveChat.start()
        .then(() => {
            console.log('🟢 Connected to YouTube Live Chat!');
        })
        .catch((err) => console.error('❌ YouTube Chat Error:', err));
}

server.listen(PORT, () => {
    console.log(`Server running at http://localhost:${PORT}`);
    console.log(`Viewers will be logged in: ${LOG_FILE}`);
});
