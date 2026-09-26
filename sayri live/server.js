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

let lastChatTime = Date.now();
let hajiriCount = 0;
const hajiriList = new Set();
const userCommentTracker = new Map();

if (LIVE_ID) {
    const liveChat = new LiveChat({ liveId: LIVE_ID });
    const sayris = JSON.parse(fs.readFileSync(path.join(__dirname, 'sayris.json'), 'utf8'));
    const jokes = JSON.parse(fs.readFileSync(path.join(__dirname, 'jokes.json'), 'utf8'));

    // --- LOVING IDLE CALL-TO-ACTION SYSTEM ---
    setInterval(() => {
        const now = Date.now();
        if (now - lastChatTime > 45000) {
            const idlePrompts = [
                "Suno na sabhi, yahan itni pyaari baatein ho rahi hain, aap log bhi jaldi se kuch pyare-pyare comments karke is mehfil ko aur bhi haseen bana do na! 💕",
                "Aap sabhi khamosh kyun ho? Jaldi se apni favourite romantic baat ya sawal comment karo, mujhe aapka intezar hai! ✨",
                "Har koi chup-chap kyu baitha hai? Ek chota sa comment karke batao na, aapko meri baatein kaisi lag rahi hain? 💖",
                "Suno ji, aise khamosh rahoge toh kaise chalega? Jaldi se comment box mein kuch pyaara sa likho na! 🌹"
            ];
            const promptText = idlePrompts[Math.floor(Math.random() * idlePrompts.length)];
            let data = {
                name: "💖 Pyari Baatein",
                avatar: "https://cdn-icons-png.flaticon.com/512/2583/2583344.png",
                sayri: promptText,
                isVip: false,
                isSystem: true
            };

            io.emit('new-comment', data);
            lastChatTime = now;
        }
    }, 20000);

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
        if (!userRecord) {
            userRecord = { count: 0, totalCount: 0, lastTime: nowTime, askedSubscribe: false, thanked: false, givenVip: false };
            userCommentTracker.set(author, userRecord);
        }

        userRecord.count++;
        userRecord.totalCount = (userRecord.totalCount || 0) + 1;
        userRecord.lastTime = nowTime;

        let isDoubleComment = false;
        let isFrequentComment = false;
        let isBigThanks = false;

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

        let resultText = '';
        let takeover = null;
        let isVip = false;
        let soundEffect = null;
        let isNewVip = false;

        if (userRecord.totalCount >= 8 && !userRecord.givenVip) {
            userRecord.givenVip = true;
            isNewVip = true;
            isVip = true;
        }

        if (isBigThanks) {
            resultText = `Suno na ${author} ji, aapne 5 se zyada comments karke hum par jo apna pyaar barasaya hai, uske liye aapka dil se bahut-bahut shukriya! Thank you so much! ❤️`;
            io.emit('big-thanks', { name: author, avatar: thumbnail });
        }
        else if (isNewVip) {
            resultText = `${author} ji, aapne 8 se zyada comments kiye hain, isliye aapko VIP badge de rahi hoon! Aap meri bahut hi special viewer ho. Aur baaki sabhi viewers se bhi kehna chahti hoon ki agar aap bhi 8 se zyada comments karenge, toh aapko bhi ye VIP badge milega! Jaldi-jaldi comments karo! ✨`;
            isVip = true;
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
