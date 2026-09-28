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
    const trimmed = url.trim();
    const match = trimmed.match(/(?:v=|\/live\/|youtu\.be\/|\/v\/|\/embed\/)([^&\?\/#]+)/);
    if (match && match[1]) return match[1];

    if (/^[a-zA-Z0-9_-]{10,12}$/.test(trimmed)) {
        return trimmed;
    }
    return trimmed;
}

const LIVE_ID = extractLiveId(LIVE_URL);
// ⚠️ APNE YOUTUBE CHANNEL KI DP / LOGO KA IMAGE LINK YAHAN PASTE KAREIN:
const BOT_AVATAR = "https://cdn-icons-png.flaticon.com/512/2583/2583344.png";

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
const userLastChatTime = new Map();

const TAAREEF_LINES = [
    "Aap humari live mehfil ke sabse haseen aur pyaare viewer ho! Aapka saath humare liye bahut khas hai! 💖✨",
    "Aapki presence se humari live stream mein chaar chaand lag jaate hain! Aise hi apna pyaar banaye rakhiye! 🌸",
    "Aapka har ek comment humare dil ko choo leta hai! Aap jaisa pyaara supporter milna naseeb ki baat hai! 💕",
    "Mehfil ki asli shaan toh aap hi hain! Aapke bina ye live stream bilkul adhuri hai! ✨",
    "Aapki meethi baatein aur pyaar humare liye sabse bada tohfa hai! Dil se shukriya! 🌺"
];

function findMatchingViewer(messageText) {
    if (!messageText || userCommentTracker.size === 0) return null;
    const cleanMsg = messageText.toUpperCase().replace(/@/g, '').trim();

    for (let [username, record] of userCommentTracker.entries()) {
        const cleanUsername = username.toUpperCase().replace(/@/g, '').trim();
        if (cleanUsername.includes('RUCHIGUPTA')) continue;

        const nameParts = cleanUsername.split(' ').filter(p => p.length > 2);

        if (cleanMsg.includes(cleanUsername)) {
            return { username, avatar: record.avatar || 'https://fonts.gstatic.com/s/i/productlogos/avatar_anonymous/v4/web-512dp.png' };
        }

        for (let part of nameParts) {
            if (part.length >= 3 && cleanMsg.includes(part) && !['THE', 'OFFICIAL', 'LIVE', 'USER', 'GAMING'].includes(part)) {
                return { username, avatar: record.avatar || 'https://fonts.gstatic.com/s/i/productlogos/avatar_anonymous/v4/web-512dp.png' };
            }
        }
    }
    return null;
}

let isPaused = false;
let isViewerListOpen = false;

function getViewerListData() {
    const list = [];
    for (let [username, record] of userCommentTracker.entries()) {
        list.push({
            name: username,
            avatar: record.avatar || 'https://fonts.gstatic.com/s/i/productlogos/avatar_anonymous/v4/web-512dp.png',
            totalCount: record.totalCount || 1,
            vipLevel: record.vipLevel || 'NONE'
        });
    }
    list.sort((a, b) => b.totalCount - a.totalCount);
    return list;
}

function getTopCommenter() {
    let topUser = "Guest Viewer";
    let topAvatar = "https://fonts.gstatic.com/s/i/productlogos/avatar_anonymous/v4/web-512dp.png";
    let maxCount = 0;

    if (userCommentTracker.size > 0) {
        for (let [username, record] of userCommentTracker.entries()) {
            if (record.totalCount > maxCount) {
                maxCount = record.totalCount;
                topUser = username;
                topAvatar = record.avatar || topAvatar;
            }
        }
    }
    return { topUser, topAvatar, maxCount };
}

const SERVER_START_TIME = Date.now();

// --- ALWAYS LOAD DATA AT TOP LEVEL ---
const sayris = JSON.parse(fs.readFileSync(path.join(__dirname, 'sayris.json'), 'utf8'));
const jokes = JSON.parse(fs.readFileSync(path.join(__dirname, 'jokes.json'), 'utf8'));
const idlePromptsData = JSON.parse(fs.readFileSync(path.join(__dirname, 'idle_prompts.json'), 'utf8'));

// --- HELPER FUNCTION FOR IDLE SHAYARI, QUOTES & PROMPTS ---
function getIdleText(sayris, idleData) {
    // 50% Shayari, 35% Mahan Logon Ke Anmol Vichar, 15% CTA prompt
    const rand = Math.random();

    if (rand < 0.50 && sayris) {
        const categories = ['LOVE', 'LOVE', 'LOVE', 'DOSTI', 'RANDOM', 'SAD'];
        const chosenCat = categories[Math.floor(Math.random() * categories.length)];
        const list = (sayris && sayris[chosenCat]) ? sayris[chosenCat] : sayris.LOVE;
        if (list && list.length > 0) {
            const selectedSayri = list[Math.floor(Math.random() * list.length)];
            const intros = (idleData && idleData.intros && idleData.intros.length > 0)
                ? idleData.intros
                : ["Mehfil mein thodi khamoshi hai, chaliye ek pyaari si shayari sunati hoon... "];
            const intro = intros[Math.floor(Math.random() * intros.length)];
            return intro + selectedSayri;
        }
    } else if (rand < 0.85 && idleData && idleData.quotes && idleData.quotes.length > 0) {
        const selectedQuote = idleData.quotes[Math.floor(Math.random() * idleData.quotes.length)];
        const quoteIntros = (idleData.quoteIntros && idleData.quoteIntros.length > 0)
            ? idleData.quoteIntros
            : ["Suno na, ek mahan aatma ke anmol vichar suniye... "];
        const intro = quoteIntros[Math.floor(Math.random() * quoteIntros.length)];
        return intro + selectedQuote;
    }

    const ctas = (idleData && idleData.callToActions && idleData.callToActions.length > 0)
        ? idleData.callToActions
        : ["Aap sabhi khamosh kyun ho? Jaldi se comment karke batao na! 💕"];
    return ctas[Math.floor(Math.random() * ctas.length)];
}

let lastCommenterObj = null;

// --- SOCKET CONNECTION INITIAL WELCOME CARD ---
io.on('connection', (socket) => {
    console.log('⚡ New client connected to overlay');
    const welcomeText = getIdleText(sayris, idlePromptsData);
    socket.emit('new-comment', {
        name: "Ruchi Gupta 💖",
        avatar: BOT_AVATAR,
        sayri: welcomeText,
        isVip: true,
        vipLevel: 'HOST',
        badge: '💖',
        isSystem: true
    });
});

// --- ALWAYS RUN IDLE SHAYARI & CALL-TO-ACTION SYSTEM ---
setInterval(() => {
    if (isPaused) return; // Skip generating idle shayari if paused!
    const now = Date.now();
    if (now - lastChatTime > 12000) {
        let promptText = "";

        // If a viewer recently commented and no one commented after them, give a sweet personal welcome & thanks!
        if (lastCommenterObj && !lastCommenterObj.welcomed) {
            lastCommenterObj.welcomed = true;
            promptText = `Suno na ${lastCommenterObj.name} ji, hamari live stream mein aapka dil se bahut-bahut swagat hai! Aapke pyaare comment ke liye thank you so much! Agar aapko hamari baatein aur shayari pasand aa rahi hain, toh please video ko like aur channel ko subscribe zaroor kar dena na! 💕✨`;
        } else {
            promptText = getIdleText(sayris, idlePromptsData);
        }

        let data = {
            name: "Ruchi Gupta 💖",
            avatar: BOT_AVATAR,
            sayri: promptText,
            isVip: true,
            vipLevel: 'HOST',
            badge: '💖',
            isSystem: true
        };

        io.emit('new-comment', data);
        lastChatTime = now;
    }
}, 6000);

if (LIVE_ID) {
    const liveChat = new LiveChat({ liveId: LIVE_ID });

    // --- TOP SUPPORTER ANNOUNCEMENT EVERY 10 MINUTES ---
    setInterval(() => {
        if (userCommentTracker.size > 0) {
            let topUser = null;
            let maxCount = 0;
            for (let [username, record] of userCommentTracker.entries()) {
                if (record.totalCount > maxCount) {
                    maxCount = record.totalCount;
                    topUser = username;
                }
            }
            if (topUser && maxCount >= 3) {
                const announcement = `Aaj ki mehfil ke hamare Top Romantic Supporter hain ${topUser} ji! Jinhone sabse zyada ${maxCount} baar pyaar bhare comments kiye hain. Aapka dil se bahut-bahut shukriya! 💖`;
                io.emit('new-comment', {
                    name: "Ruchi Gupta 💖",
                    avatar: BOT_AVATAR,
                    sayri: announcement,
                    isVip: true,
                    vipLevel: 'GOLD',
                    isSystem: true
                });
            }
        }
    }, 600000);

    // --- FEATURE 5: LUCKY VIEWER SELECTION EVERY 5 MINUTES ---
    setInterval(() => {
        if (userCommentTracker.size > 0) {
            const users = Array.from(userCommentTracker.entries());
            if (users.length > 0) {
                const randomIndex = Math.floor(Math.random() * users.length);
                const [winnerName, winnerRecord] = users[randomIndex];
                const avatar = winnerRecord.avatar || 'https://fonts.gstatic.com/s/i/productlogos/avatar_anonymous/v4/web-512dp.png';

                io.emit('lucky-winner', {
                    name: winnerName,
                    avatar: avatar,
                    totalCount: winnerRecord.totalCount
                });

                const announcement = `🎉 WAH! Aaj ki mehfil ke Lucky Shayari King/Queen bane hain ${winnerName} Ji! Aapko dil se bahut-bahut mubarakbaad! 👑✨`;
                io.emit('new-comment', {
                    name: "Ruchi Gupta 💖",
                    avatar: BOT_AVATAR,
                    sayri: announcement,
                    isVip: true,
                    vipLevel: winnerRecord.vipLevel || 'GOLD',
                    isSystem: true,
                    takeover: 'WINNER'
                });
            }
        }
    }, 300000);

    liveChat.on('chat', (chatItem) => {
        // --- RESTART BACKLOG FILTER (Ignore old messages on server restart) ---
        if (Date.now() - SERVER_START_TIME < 6000) {
            console.log(`[RESTART BACKLOG SKIPPED] ${chatItem.author ? chatItem.author.name : ''}`);
            return;
        }

        if (chatItem.timestamp) {
            const msgTime = new Date(chatItem.timestamp).getTime();
            if (msgTime && msgTime < SERVER_START_TIME - 2000) {
                console.log(`[OLD BACKLOG SKIPPED] ${chatItem.author ? chatItem.author.name : ''}`);
                return;
            }
        }

        lastChatTime = Date.now();
        const messageText = chatItem.message ? chatItem.message.map(m => m.text).join('') : '';
        const author = chatItem.author ? chatItem.author.name : 'Viewer';
        const upperMsg = messageText.toUpperCase();
        const trimmedMsg = messageText.trim();

        // --- GLOBAL SLASH COMMAND IGNORE FILTER FOR VIEWERS ---
        if (trimmedMsg.startsWith('/')) {
            console.log(`[SLASH COMMAND IGNORED] ${author}: ${messageText}`);
            return;
        }

        // --- 15 SECONDS ANTI-SPAM COOLDOWN PER USER ---
        const nowTimeForSpam = Date.now();
        if (userLastChatTime.has(author)) {
            if (nowTimeForSpam - userLastChatTime.get(author) < 15000) {
                console.log(`[SPAM SKIPPED] ${author} is commenting too fast.`);
                return;
            }
        }
        userLastChatTime.set(author, nowTimeForSpam);

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

        // --- HOST / STREAMER OWNER CHECK & EXCLUSIVE CONTROLS (@Ruchi-gupta101) ---
        const cleanAuthorUpper = author.toUpperCase().replace(/@/g, '').replace(/_/g, '').replace(/-/g, '').trim();
        const isOwnerHost = cleanAuthorUpper.includes('RUCHIGUPTA101') || cleanAuthorUpper.includes('RUCHIGUPTA');

        if (isOwnerHost) {
            // HOST CONTROL 1: STOP (Pause Shayari & Audio System)
            if (upperMsg === 'STOP' || upperMsg === '/STOP' || upperMsg.includes('STOP SHAYARI') || upperMsg === 'ROK DO') {
                isPaused = true;
                io.emit('toggle-speech', { paused: true });
                io.emit('new-comment', {
                    name: "Ruchi Gupta 💖",
                    avatar: BOT_AVATAR,
                    sayri: "⏸️ Shayari aur audio system pause kar diya gaya hai!",
                    isVip: true,
                    vipLevel: 'HOST',
                    badge: '💖',
                    isHost: true,
                    isSystem: true
                });
                return;
            }

            // HOST CONTROL 2: START (Resume Shayari & Audio System)
            if (upperMsg === 'START' || upperMsg === '/START' || upperMsg.includes('START SHAYARI') || upperMsg === 'SHURU KARO') {
                isPaused = false;
                lastChatTime = Date.now();
                io.emit('toggle-speech', { paused: false });
                io.emit('new-comment', {
                    name: "Ruchi Gupta 💖",
                    avatar: BOT_AVATAR,
                    sayri: "▶️ Shayari aur audio system phir se chalu ho gaya hai!",
                    isVip: true,
                    vipLevel: 'HOST',
                    badge: '💖',
                    isHost: true,
                    isSystem: true
                });
                return;
            }

            // HOST CONTROL 3: WINNER (Pop Up Top Commenter Profile for 3 Seconds)
            if (upperMsg.includes('WINNER') || upperMsg.includes('/WINNER')) {
                const { topUser, topAvatar, maxCount } = getTopCommenter();

                io.emit('pop-winner', {
                    name: topUser,
                    avatar: topAvatar,
                    totalCount: maxCount
                });

                io.emit('new-comment', {
                    name: "Ruchi Gupta 💖",
                    avatar: BOT_AVATAR,
                    sayri: `🏆 Aaj ki mehfil ke TOP WINNER hain ${topUser} Ji! Jinhone sabse zyada ${maxCount} comments kiye hain! 🎉`,
                    isVip: true,
                    vipLevel: 'HOST',
                    badge: '💖',
                    isHost: true,
                    isSystem: true,
                    takeover: 'WINNER'
                });
                return;
            }

            // HOST CONTROL 4: LIST (Show Viewers Directory List)
            if (upperMsg === 'LIST' || upperMsg === '/LIST' || upperMsg === 'SHOW LIST') {
                isViewerListOpen = true;
                const viewers = getViewerListData();
                io.emit('toggle-viewer-list', { show: true, viewers });
                io.emit('new-comment', {
                    name: "Ruchi Gupta 💖",
                    avatar: BOT_AVATAR,
                    sayri: "📋 Stream ke sabhi active viewers ki list screen par show kar di gayi hai!",
                    isVip: true,
                    vipLevel: 'HOST',
                    badge: '💖',
                    isHost: true,
                    isSystem: true
                });
                return;
            }

            // HOST CONTROL 5: CLOSE LIST (Hide Viewers Directory List)
            if (upperMsg === 'CLOSE LIST' || upperMsg === '/CLOSE LIST' || upperMsg === 'HIDE LIST' || upperMsg === 'CLOSELIST') {
                isViewerListOpen = false;
                io.emit('toggle-viewer-list', { show: false });
                io.emit('new-comment', {
                    name: "Ruchi Gupta 💖",
                    avatar: BOT_AVATAR,
                    sayri: "❌ Viewers list ko close kar diya gaya hai!",
                    isVip: true,
                    vipLevel: 'HOST',
                    badge: '💖',
                    isHost: true,
                    isSystem: true
                });
                return;
            }

            // Ignore host slash commands
            if (trimmedMsg.startsWith('/')) {
                console.log(`[HOST SLASH COMMAND IGNORED] ${author}: ${messageText}`);
                return;
            }

            // CHECK IF HOST IS MENTIONING / PRAISING A VIEWER BY NAME
            const matchedViewer = findMatchingViewer(messageText);
            if (matchedViewer) {
                const randomPraise = TAAREEF_LINES[Math.floor(Math.random() * TAAREEF_LINES.length)];

                io.emit('viewer-praise', {
                    name: matchedViewer.username,
                    avatar: matchedViewer.avatar,
                    praiseText: randomPraise
                });

                io.emit('new-comment', {
                    name: "Ruchi Gupta 💖",
                    avatar: BOT_AVATAR,
                    sayri: `💖 ${matchedViewer.username} Ji ke liye taareef... ${randomPraise}`,
                    isVip: true,
                    vipLevel: 'HOST',
                    badge: '💖',
                    isHost: true,
                    isSystem: true,
                    takeover: 'HEARTS'
                });
                return;
            }

            const hasReadKeyword = upperMsg.includes('READ');
            let textToDisplay = messageText;

            if (hasReadKeyword) {
                textToDisplay = messageText.replace(/read/gi, '').trim();
                if (!textToDisplay) textToDisplay = messageText;
            }

            io.emit('new-comment', {
                name: author,
                avatar: thumbnail,
                sayri: textToDisplay,
                isVip: true,
                vipLevel: 'HOST',
                badge: '💖',
                isHost: true,
                isSystem: true,
                noTTS: !hasReadKeyword,
                takeover: hasReadKeyword ? 'HEARTS' : null
            });
            return;
        }

        // Track last viewer for personalized idle welcome & thank you!
        lastCommenterObj = {
            name: author,
            avatar: thumbnail,
            welcomed: false
        };

        // --- FEATURE 7: MULTI-LEVEL VIP TRACKER (BRONZE, GOLD, DIAMOND) ---
        const nowTime = Date.now();
        let userRecord = userCommentTracker.get(author);
        if (!userRecord) {
            userRecord = { count: 0, totalCount: 0, lastTime: nowTime, askedSubscribe: false, vipLevel: 'NONE', avatar: thumbnail };
            userCommentTracker.set(author, userRecord);
        }

        userRecord.count++;
        userRecord.totalCount = (userRecord.totalCount || 0) + 1;
        userRecord.lastTime = nowTime;
        userRecord.avatar = thumbnail;

        // If List Overlay is open on screen, update it with new comment counts in real time
        if (isViewerListOpen) {
            io.emit('toggle-viewer-list', { show: true, viewers: getViewerListData() });
        }

        let isDoubleComment = false;
        let isFrequentComment = false;
        let isBronzeUpgrade = false;
        let isGoldUpgrade = false;
        let isDiamondUpgrade = false;

        if (userRecord.count === 2) {
            isDoubleComment = true;
        } else if (userRecord.count > 2 && !userRecord.askedSubscribe) {
            isFrequentComment = true;
            userRecord.askedSubscribe = true;
        }

        // Tier 1: 5 Comments -> Bronze Badge 🥉
        if (userRecord.totalCount >= 5 && userRecord.vipLevel === 'NONE') {
            userRecord.vipLevel = 'BRONZE';
            isBronzeUpgrade = true;
        }
        // Tier 2: 10 Comments -> Gold VIP Badge 👑
        else if (userRecord.totalCount >= 10 && (userRecord.vipLevel === 'BRONZE' || userRecord.vipLevel === 'NONE')) {
            userRecord.vipLevel = 'GOLD';
            isGoldUpgrade = true;
        }
        // Tier 3: 25 Comments -> Diamond Legend Badge 💎
        else if (userRecord.totalCount >= 25 && userRecord.vipLevel !== 'DIAMOND') {
            userRecord.vipLevel = 'DIAMOND';
            isDiamondUpgrade = true;
        }

        let resultText = '';
        let takeover = null;
        let isVip = (userRecord.vipLevel !== 'NONE');
        let soundEffect = null;

        if (isDiamondUpgrade) {
            const diamondMsg = `WAH! ${author} ji, aapne 25 comments poore karke humare highest Diamond Legend Badge 💎 haasil kar liya hai! Aap humari mehfil ke sabse khaas sitare hain! 🌟`;
            io.emit('big-diamond', { name: author, avatar: thumbnail });
            io.emit('new-comment', {
                name: "Ruchi Gupta 💖",
                avatar: BOT_AVATAR,
                sayri: diamondMsg,
                isVip: true,
                vipLevel: 'DIAMOND',
                isSystem: true,
                takeover: 'FIREWORKS'
            });
            return;
        }

        if (isGoldUpgrade) {
            const goldMsg = `${author} ji, aapne 10 comments poore karke Gold VIP Badge 👑 haasil kar liya hai! Aap meri bahut hi special viewer ho. 🌟`;
            io.emit('big-vip', { name: author, avatar: thumbnail });
            io.emit('new-comment', {
                name: "Ruchi Gupta 💖",
                avatar: BOT_AVATAR,
                sayri: goldMsg,
                isVip: true,
                vipLevel: 'GOLD',
                isSystem: true,
                takeover: 'HEARTS'
            });
            return;
        }

        if (isBronzeUpgrade) {
            const bronzeMsg = `Suno na ${author} ji, aapne 5 comments karke Bronze Badge 🥉 haasil kar liya hai! Aapka dil se bahut-bahut shukriya! ❤️`;
            io.emit('big-thanks', { name: author, avatar: thumbnail });
            io.emit('new-comment', {
                name: "Ruchi Gupta 💖",
                avatar: BOT_AVATAR,
                sayri: bronzeMsg,
                isVip: true,
                vipLevel: 'BRONZE',
                isSystem: true
            });
            return;
        }
        else if (isFrequentComment) {
            resultText = `Suno na ${author} ji, aapka ye baar-baar aana aur itna pyaar dena bahut achha lag raha hai, please video ko like aur channel ko subscribe zaroor kar dena! ❤️`;
        }
        else if (upperMsg.includes('ROSE') || upperMsg.includes('GULAB')) {
            resultText = `Suno na ${author} ji, aapne mere liye pyaar bhara gulaab bheja hai... aapka ye gulaab meri duniya mein khushboo bhar gaya! 🌹`;
            takeover = 'HEARTS';
        }
        else if (upperMsg.includes('CHOCOLATE')) {
            resultText = `Arey wah ${author} ji! Itni meethi chocolate bheji hai aapne, jaise meri zindagi mein mithas ghul gayi ho! 🍫`;
            takeover = 'HEARTS';
        }
        else if (upperMsg.includes('RING') || upperMsg.includes('ANGOOTHI')) {
            resultText = `${author} ji, itni pyaari angoothi... mera dil toh aapne pehle hi chura liya tha! 💕`;
            takeover = 'HEARTS';
        }
        else if (upperMsg.includes('HAHA')) soundEffect = 'laugh';
        else if (upperMsg.includes('CLAP')) soundEffect = 'clap';
        else if (upperMsg.includes('OOPS')) soundEffect = 'oops';
        else if (upperMsg.includes('VIP') && hajiriCount < 10 && !hajiriList.has(author)) {
            hajiriCount++;
            hajiriList.add(author);
            if (userRecord.vipLevel === 'NONE') userRecord.vipLevel = 'BRONZE';
            isVip = true;
            resultText = `VIP Entry for ${author}! You are an Early Bird! 🌟`;
        }
        else if (upperMsg.includes('I LOVE YOU') || upperMsg.includes('LOVE YOU')) {
            resultText = `Aww, I love you too ${author} ji! Aapka ye pyaar mere dil ko choo gaya... 💕`;
            takeover = 'HEARTS';
        }
        else if (upperMsg.includes('BDAY') || upperMsg.includes('BIRTHDAY') || upperMsg.includes('JANAMDIN')) {
            resultText = `Arey wah! Aaj kisi ka khaas din hai... ${author} ji ki taraf se dher saari birthday wishes! Khuda aapko hamesha khush rakhe aur aapki har khwahish poori ho! 🎂✨`;
            takeover = 'FIREWORKS';
        }
        else if (upperMsg.includes('LOVE')) resultText = sayris.LOVE[Math.floor(Math.random() * sayris.LOVE.length)];
        else if (upperMsg.includes('SAD')) resultText = sayris.SAD[Math.floor(Math.random() * sayris.SAD.length)];
        else if (upperMsg.includes('DOSTI')) resultText = sayris.DOSTI[Math.floor(Math.random() * sayris.DOSTI.length)];
        else if (upperMsg.includes('JOKE')) {
            resultText = jokes[Math.floor(Math.random() * jokes.length)];
            takeover = 'LAUGH';
        }
        else if (upperMsg.includes('VICHAR') || upperMsg.includes('QUOTE') || upperMsg.includes('MOTIVATION') || upperMsg.includes('KALAM') || upperMsg.includes('GANDHI') || upperMsg.includes('AMBEDKAR')) {
            if (idlePromptsData && idlePromptsData.quotes && idlePromptsData.quotes.length > 0) {
                resultText = idlePromptsData.quotes[Math.floor(Math.random() * idlePromptsData.quotes.length)];
            }
        }
        else {
            if (messageText.length > 12 && !['LOVE', 'SAD', 'DOSTI', 'JOKE', 'VIP', 'DIL', 'FIRE', 'ROSE', 'CHOCOLATE', 'RING', 'BDAY', 'BIRTHDAY', 'JANAMDIN'].some(k => upperMsg.includes(k))) {
                resultText = messageText;
            } else {
                const cat = Math.random() < 0.8 ? 'LOVE' : ['SAD', 'DOSTI', 'RANDOM'][Math.floor(Math.random() * 3)];
                resultText = sayris[cat][Math.floor(Math.random() * sayris[cat].length)];
            }
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
                vipLevel: userRecord.vipLevel,
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
                    vipLevel: userRecord.vipLevel,
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
            vipLevel: userRecord.vipLevel,
            takeover: takeover,
            soundEffect: soundEffect
        });
    });

    liveChat.on('error', (err) => {
        console.error('⚠️ LiveChat Warning:', err.message || err);
    });

    function startLiveChatConnection() {
        console.log(`📡 Connecting to YouTube Live ID: ${LIVE_ID}...`);
        liveChat.start()
            .then(() => console.log('🟢 Connected to YouTube Live Chat successfully!'))
            .catch(e => {
                console.error('❌ Live Chat Connection Failed:', e.message || e);
                console.log('⚠️ HINT: Kripya check karein ki YouTube Stream abhi LIVE hai aur usme Live Chat Enabled hai.');
                console.log('🔄 10 seconds mein dobara connect kar rahe hain...');
                setTimeout(startLiveChatConnection, 10000);
            });
    }

    startLiveChatConnection();
}

server.listen(PORT, () => console.log(`Server running at http://localhost:${PORT}`));
