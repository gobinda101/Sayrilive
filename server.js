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
const userCommentTracker = new Map();

if (LIVE_ID) {
    const liveChat = new LiveChat({ liveId: LIVE_ID });
    const sayris = JSON.parse(fs.readFileSync(path.join(__dirname, 'sayris.json'), 'utf8'));
    const jokes = JSON.parse(fs.readFileSync(path.join(__dirname, 'jokes.json'), 'utf8'));

    liveChat.on('chat', (chatItem) => {
        const messageText = chatItem.message ? chatItem.message.map(m => m.text).join('') : '';
        const author = chatItem.author.name;
        const upperMsg = messageText.toUpperCase();

        console.log(`[CHAT] ${author}: ${messageText}`);

        // --- SIMPLIFIED AVATAR EXTRACTION ---
        let thumbnail = 'https://fonts.gstatic.com/s/i/productlogos/avatar_anonymous/v4/web-512dp.png';
        try {
            if (chatItem.author.thumbnail) {
                if (typeof chatItem.author.thumbnail === 'string') {
                    thumbnail = chatItem.author.thumbnail;
                } else if (chatItem.author.thumbnail.url) {
                    thumbnail = chatItem.author.thumbnail.url;
                } else if (Array.isArray(chatItem.author.thumbnail) && chatItem.author.thumbnail.length > 0) {
                    thumbnail = chatItem.author.thumbnail[chatItem.author.thumbnail.length - 1].url || chatItem.author.thumbnail[0].url;
                }
            }
            if (thumbnail.startsWith('//')) thumbnail = 'https:' + thumbnail;
        } catch (e) {
            console.log('Photo error');
        }

        console.log(`[PHOTO LINK] ${author}: ${thumbnail}`);

        // --- DOUBLE, FREQUENT & BIG THANKS COMMENT CHECK ---
        const nowTime = Date.now();
        let userRecord = userCommentTracker.get(author);
        let isDoubleComment = false;
        let isFrequentComment = false;
        let isBigThanks = false;

        if (userRecord) {
            userRecord.count++;
            userRecord.totalCount = (userRecord.totalCount || userRecord.count) + 1;
            userRecord.lastTime = nowTime;

            if (userRecord.count === 2) {
                isDoubleComment = true;
            } else if (userRecord.count > 2 && !userRecord.askedSubscribe) {
                isFrequentComment = true;
                userRecord.askedSubscribe = true;
            }

            if (userRecord.totalCount >= 5 && !userRecord.thanked) {
                isBigThanks = true;
                userRecord.thanked = true;
            }
        } else {
            userCommentTracker.set(author, { count: 1, totalCount: 1, lastTime: nowTime, askedSubscribe: false, thanked: false });
        }

        let resultText = '';
        let takeover = null;
        let isVip = false;
        let soundEffect = null;

        if (isBigThanks) {
            resultText = `Suno na ${author} ji, aapne 5 se zyada comments karke hum par jo apna pyaar barasaya hai, uske liye aapka dil se bahut-bahut shukriya! Thank you so much! ❤️`;
            io.emit('big-thanks', { name: author, avatar: thumbnail });
        }
        else if (isFrequentComment) {
            resultText = `Suno na ${author} ji, aapka ye baar-baar aana aur itna pyaar dena bahut achha lag raha hai, please video ko like aur channel ko subscribe zaroor kar dena! ❤️`;
        }
        else if (upperMsg.includes('HAHA')) soundEffect = 'laugh';
        else if (upperMsg.includes('CLAP')) soundEffect = 'clap';
        else if (upperMsg.includes('OOPS')) soundEffect = 'oops';
        else if (upperMsg.includes('PRESENT') && hajiriCount < 10 && !hajiriList.has(author)) {
            hajiriCount++;
            hajiriList.add(author);
            isVip = true;
            resultText = `VIP Entry for ${author}! You are an Early Bird! 🌟`;
        }
        else if (upperMsg.includes('LOVE')) resultText = sayris.LOVE[Math.floor(Math.random() * sayris.LOVE.length)];
        else if (upperMsg.includes('SAD')) resultText = sayris.SAD[Math.floor(Math.random() * sayris.SAD.length)];
        else if (upperMsg.includes('DOSTI')) resultText = sayris.DOSTI[Math.floor(Math.random() * sayris.DOSTI.length)];
        else if (upperMsg.includes('JOKE')) {
            resultText = jokes[Math.floor(Math.random() * jokes.length)];
            takeover = 'LAUGH';
        }
        else {
            const cat = Math.random() < 0.8 ? 'LOVE' : ['SAD', 'DOSTI', 'RANDOM'][Math.floor(Math.random() * 3)];
            resultText = sayris[cat][Math.floor(Math.random() * sayris[cat].length)];
        }

        if (upperMsg.includes('DIL')) takeover = 'HEARTS';
        if (upperMsg.includes('FIRE')) takeover = 'FIREWORKS';

        if (isDoubleComment) {
            const shayari = sayris.RANDOM[Math.floor(Math.random() * sayris.RANDOM.length)];
            const romanticQuote = sayris.LOVE[Math.floor(Math.random() * sayris.LOVE.length)];

            // First emit Shayari
            io.emit('new-comment', {
                name: author,
                avatar: thumbnail,
                sayri: shayari,
                isVip: isVip || hajiriList.has(author),
                takeover: takeover,
                soundEffect: soundEffect
            });

            // Then emit Romantic Quote sequentially
            setTimeout(() => {
                io.emit('new-comment', {
                    name: author,
                    avatar: thumbnail,
                    sayri: romanticQuote,
                    isVip: isVip || hajiriList.has(author),
                    takeover: null,
                    soundEffect: null
                });
            }, 600);

            return;
        }

        io.emit('new-comment', {
            name: author,
            avatar: thumbnail,
            sayri: resultText,
            isVip: isVip || hajiriList.has(author),
            takeover: takeover,
            soundEffect: soundEffect
        });
    });

    liveChat.start().then(() => console.log('🟢 Connected')).catch(e => console.error(e));
}

server.listen(PORT, () => console.log(`Server running at http://localhost:${PORT}`));
