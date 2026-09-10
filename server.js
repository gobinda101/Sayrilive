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

// YouTube Live URL from Command Line Argument
const LIVE_URL = process.argv[2];

// Function to extract Live ID from URL
function extractLiveId(url) {
    if (!url || url.includes('YOUR_YOUTUBE_LIVE_ID_HERE')) return null;
    const match = url.match(/(?:v=|\/live\/|youtu\.be\/)([^&\?]+)/);
    return match ? match[1] : null;
}

const LIVE_ID = extractLiveId(LIVE_URL);
console.log('Target YouTube Video ID:', LIVE_ID || 'NONE (Mock Mode)');

// Serve static files from the 'public' directory
app.use(express.static(path.join(__dirname, 'public')));

// TTS Proxy Route to bypass OBS CORS/Autoplay blocks
app.get('/tts', (req, res) => {
    const text = req.query.text;
    if (!text) return res.status(400).send('Text is required');

    // Google TTS URL for Hindi
    const url = `https://translate.google.com/translate_tts?ie=UTF-8&q=${encodeURIComponent(text)}&tl=hi&client=tw-ob`;

    https.get(url, (response) => {
        res.setHeader('Content-Type', 'audio/mpeg');
        response.pipe(res);
    }).on('error', (err) => {
        console.error('TTS Proxy Error:', err);
        res.status(500).send('Error fetching TTS');
    });
});

io.on('connection', (socket) => {
    console.log('OBS Browser Source connected');
});

// Initialize YouTube Chat listener
if (LIVE_ID) {
    const liveChat = new LiveChat({ liveId: LIVE_ID });
    const sayris = JSON.parse(fs.readFileSync(path.join(__dirname, 'sayris.json'), 'utf8'));

    liveChat.on('chat', (chatItem) => {
        const messageText = chatItem.message ? chatItem.message.map(m => m.text).join('') : '';
        const author = chatItem.author.name;

        let thumbnail = '';
        if (chatItem.author.thumbnail) {
            if (typeof chatItem.author.thumbnail === 'string') {
                thumbnail = chatItem.author.thumbnail;
            } else if (chatItem.author.thumbnail.url) {
                thumbnail = chatItem.author.thumbnail.url;
            } else if (Array.isArray(chatItem.author.thumbnail) && chatItem.author.thumbnail.length > 0) {
                thumbnail = chatItem.author.thumbnail[0].url;
            }
        }

        let randomSayri = '';
        if (author.toLowerCase() === 'gobinda') {
            randomSayri = "Tanhaayi mein aksar tujhe yaad karte hain, teri tasveer se ghanto baat karte hain.";
            console.log(`[VIP CHAT] Gobinda detected! Forcing special sayri.`);
        } else {
            randomSayri = sayris[Math.floor(Math.random() * sayris.length)];
        }

        console.log(`[CHAT] ${author}: ${messageText} -> Picked Sayri: ${randomSayri}`);

        io.emit('new-comment', {
            name: author,
            avatar: thumbnail,
            sayri: randomSayri
        });
    });

    liveChat.start()
        .then(() => {
            console.log('🟢 Successfully connected to YouTube Live Chat!');
            setTimeout(() => {
                io.emit('new-comment', {
                    name: "System Test",
                    avatar: "https://fonts.gstatic.com/s/i/productlogos/avatar_anonymous/v4/web-512dp.png",
                    sayri: sayris[0]
                });
            }, 5000);
        })
        .catch((err) => console.error('❌ Error starting YouTube Chat:', err));
}

server.listen(PORT, () => {
    console.log(`Server running at http://localhost:${PORT}`);
});
