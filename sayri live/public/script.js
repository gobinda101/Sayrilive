const socket = io();

const sayriChatHistory = document.getElementById('sayri-chat-history');
const bannerEl = document.querySelector('.notebook-banner');
const emojiContainer = document.getElementById('emoji-container');
const viewerCountEl = document.getElementById('viewer-count');
const avatarHistoryList = document.getElementById('avatar-history-list');

const sounds = {
    laugh: "https://www.myinstants.com/media/sounds/laughing-emoji.mp3",
    clap: "https://www.myinstants.com/media/sounds/applause_8.mp3",
    oops: "https://www.myinstants.com/media/sounds/oh-no-sound-effect.mp3"
};

const traps = [
    "🔥 Be the first to type 'VIP' for a Gold VIP Card! 🔥",
    "❤️ Comment 'LOVE' or 'SAD' to control my mood! ❤️",
    "✨ Type 'DIL' for Heart Explosion! ✨",
    "✨ Type 'FIRE' for Firework Show! ✨",
    "😂 'JOKE' type karo, ek majedar kahani suno! 😂"
];

let currentTrapIndex = 0;
setInterval(() => {
    if (!bannerEl.classList.contains('paheli-active')) {
        currentTrapIndex = (currentTrapIndex + 1) % traps.length;
        bannerEl.style.opacity = 0;
        setTimeout(() => {
            bannerEl.innerText = traps[currentTrapIndex];
            bannerEl.style.opacity = 1;
        }, 500);
    }
}, 20000);

socket.on('new-comment', (data) => {
    processIncomingData(data);
});

socket.on('new-paheli', (data) => {
    const qText = typeof data === 'string' ? data : data.keyword || data.question;
    const authorName = data && data.author ? data.author : 'Sabke liye';

    const overlay = document.createElement('div');
    overlay.className = 'paheli-modal-overlay';
    overlay.innerHTML = `
        <div class="paheli-modal-card">
            <h2>🧩 PAHELI FOR ${authorName.toUpperCase()} JI 🧩</h2>
            <p>${qText}</p>
        </div>
    `;
    document.body.appendChild(overlay);

    setTimeout(() => {
        overlay.classList.add('fade-out');
        setTimeout(() => overlay.remove(), 800);
    }, 20000);
});

socket.on('big-thanks', (data) => {
    let avatarUrl = data.avatar || 'https://fonts.gstatic.com/s/i/productlogos/avatar_anonymous/v4/web-512dp.png';
    if (avatarUrl.startsWith('//')) avatarUrl = 'https:' + avatarUrl;

    const overlay = document.createElement('div');
    overlay.className = 'big-thanks-overlay';
    overlay.innerHTML = `
        <div class="big-thanks-card">
            <h2>💖 SPECIAL THANKS 💖</h2>
            <img src="${avatarUrl}" class="big-thanks-avatar" onerror="this.src='https://fonts.gstatic.com/s/i/productlogos/avatar_anonymous/v4/web-512dp.png'">
            <h3>${data.name} Ji</h3>
            <p>Aapne 5 se zyada comments karke hum par jo pyaar barasaya hai, uske liye dil se bahut-bahut shukriya! Thank you so much! 🎉</p>
        </div>
    `;
    document.body.appendChild(overlay);

    launchTakeoverAnimation('HEARTS');
    launchTakeoverAnimation('FIREWORKS');

    setTimeout(() => {
        overlay.classList.add('fade-out');
        setTimeout(() => overlay.remove(), 800);
    }, 8000);
});

socket.on('big-vip', (data) => {
    let avatarUrl = data.avatar || 'https://fonts.gstatic.com/s/i/productlogos/avatar_anonymous/v4/web-512dp.png';
    if (avatarUrl.startsWith('//')) avatarUrl = 'https:' + avatarUrl;

    const overlay = document.createElement('div');
    overlay.className = 'big-vip-overlay';
    overlay.innerHTML = `
        <div class="big-vip-card">
            <div class="big-vip-avatar-wrapper">
                <span class="big-vip-crown">👑</span>
                <img src="${avatarUrl}" class="big-vip-avatar" onerror="this.src='https://fonts.gstatic.com/s/i/productlogos/avatar_anonymous/v4/web-512dp.png'">
            </div>
            <h2>👑 NEW VIP SUPPORTER 👑</h2>
            <h3>${data.name} Ji</h3>
            <p>Aapne 10 comments poore karke permanent VIP badge hasil kar liya hai! Aap meri bahut hi special viewer ho. 🎉</p>
        </div>
    `;
    document.body.appendChild(overlay);

    launchTakeoverAnimation('HEARTS');
    launchTakeoverAnimation('FIREWORKS');

    setTimeout(() => {
        overlay.classList.add('fade-out');
        setTimeout(() => overlay.remove(), 800);
    }, 8000);
});

const commentQueue = [];
let isProcessing = false;

async function processIncomingData(data) {
    commentQueue.push(data);
    if (!isProcessing) processQueue();
}

let currentAudioElement = null;

function playAudioSecurely(url, timeoutMs) {
    return new Promise((resolve) => {
        if (currentAudioElement) {
            try {
                currentAudioElement.pause();
                currentAudioElement.src = "";
                currentAudioElement = null;
            } catch (e) {}
        }

        const audio = new Audio(url);
        currentAudioElement = audio;

        let isFinished = false;
        const done = () => {
            if (!isFinished) {
                isFinished = true;
                if (currentAudioElement === audio) {
                    currentAudioElement = null;
                }
                resolve();
            }
        };

        audio.onended = done;
        audio.onerror = done;
        setTimeout(done, timeoutMs);

        audio.play().catch((err) => {
            console.log("Audio play error:", err);
            done();
        });
    });
}

async function processQueue() {
    if (commentQueue.length === 0) { isProcessing = false; return; }
    isProcessing = true;
    const data = commentQueue.shift();

    const card = document.createElement('div');
    // Add 'system-card' class for auto-featured posts
    card.className = `sayri-card ${data.isVip ? 'vip-card' : ''} ${data.takeover === 'WINNER' ? 'winner-card' : ''} ${data.isSystem ? 'system-card' : ''}`;

    let avatarUrl = data.avatar || 'https://fonts.gstatic.com/s/i/productlogos/avatar_anonymous/v4/web-512dp.png';
    if (avatarUrl.startsWith('//')) avatarUrl = 'https:' + avatarUrl;

    card.innerHTML = `
        <div class="avatar-wrapper">
            <img src="${avatarUrl}" class="card-avatar" onerror="this.src='https://fonts.gstatic.com/s/i/productlogos/avatar_anonymous/v4/web-512dp.png'">
            ${data.isVip ? '<span class="crown-badge">👑</span>' : ''}
        </div>
        <div class="card-body">
            <h4 class="card-author">${data.name} ${data.isVip ? '👑' : ''}</h4>
            <p class="card-text">${data.sayri}</p>
        </div>
    `;

    sayriChatHistory.appendChild(card);
    if (sayriChatHistory.children.length > 5) {
        const oldest = sayriChatHistory.children[0];
        oldest.classList.add('exit');
        setTimeout(() => { if (oldest.parentNode) sayriChatHistory.removeChild(oldest); }, 500);
    }

    if (data.takeover) launchTakeoverAnimation(data.takeover);

    // Add to History Box (Only for real users, not system auto-picks)
    if (!data.isSystem) {
        addAvatarToHistory(data.name, avatarUrl);
    }

    card.classList.add('speaking');

    if (data.soundEffect && sounds[data.soundEffect]) {
        await playAudioSecurely(sounds[data.soundEffect], 4000);
    }

    const cleanName = data.name.replace(/@/g, '').trim();
    const prefix = data.isSystem ? '' : (cleanName + " ke liye... ");
    const rawText = prefix + data.sayri;
    const ttsText = rawText.replace(/([\u2700-\u27BF]|[\uE000-\uF8FF]|\uD83C[\uDC00-\uDFFF]|\uD83D[\uDC00-\uDFFF]|[\u2011-\u26FF]|\uD83E[\uDD00-\uDDFF]|[\u{1F000}-\u{1F9FF}]|[\u{2600}-\u{27BF}]|[\u{1F600}-\u{1F64F}]|[\u{1F680}-\u{1F6FF}]|[\u{2300}-\u{23FF}])/gu, '').trim();
    const url = `/tts?text=${encodeURIComponent(ttsText)}`;

    await playAudioSecurely(url, 15000);
    card.classList.remove('speaking');

    setTimeout(processQueue, 800);
}

const uniqueCommenters = new Set();
const HYPE_TARGET = 20;

function addAvatarToHistory(name, avatarUrl) {
    if (uniqueCommenters.has(name) || name.includes("Trending")) return;
    uniqueCommenters.add(name);

    const count = uniqueCommenters.size;
    if (viewerCountEl) viewerCountEl.innerText = count;

    // Update Hype Goal UI
    const currentHypeEl = document.getElementById('current-hype');
    const hypeBarFill = document.getElementById('hype-bar-fill');

    if (currentHypeEl && hypeBarFill) {
        currentHypeEl.innerText = count;
        const percentage = Math.min((count / HYPE_TARGET) * 100, 100);
        hypeBarFill.style.width = `${percentage}%`;

        // Trigger Mega Celebration if target reached
        if (count === HYPE_TARGET) {
            launchTakeoverAnimation('FIREWORKS');
            launchTakeoverAnimation('HEARTS');
            processIncomingData({
                name: "System 🌟",
                avatar: "https://cdn-icons-png.flaticon.com/512/1904/1904422.png",
                sayri: "Mubarak ho! Hype goal poora ho gaya hai! Sab milkar party karenge!",
                isSystem: true
            });
        }
    }

    const img = document.createElement('img');
    img.src = avatarUrl;
    img.className = 'history-avatar-item';
    img.title = name;
    avatarHistoryList.appendChild(img);
    avatarHistoryList.scrollLeft = avatarHistoryList.scrollWidth;
}

function launchTakeoverAnimation(type) {
    const emojis = { HEARTS: '❤️', FIREWORKS: '🔥', LAUGH: '😂', WINNER: '🏆' };
    const emoji = emojis[type] || '✨';
    for (let i = 0; i < 30; i++) {
        setTimeout(() => {
            const el = document.createElement('div');
            el.className = 'takeover-emoji';
            el.innerText = emoji;
            el.style.left = Math.random() * 100 + 'vw';
            emojiContainer.appendChild(el);
            setTimeout(() => el.remove(), 3000);
        }, i * 50);
    }
}


