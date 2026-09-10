const socket = io();

const sayriChatHistory = document.getElementById('sayri-chat-history');
const bannerEl = document.querySelector('.notebook-banner');
const emojiContainer = document.getElementById('emoji-container');

// Sound Effects URLs (Free CDN Sounds)
const sounds = {
    laugh: "https://www.myinstants.com/media/sounds/laughing-emoji.mp3",
    clap: "https://www.myinstants.com/media/sounds/applause_8.mp3",
    oops: "https://www.myinstants.com/media/sounds/oh-no-sound-effect.mp3"
};

const traps = [
    "🔥 Type 'PRESENT' for a VIP Badge! 🔥",
    "❤️ Select Mood: Type 'LOVE', 'SAD', or 'DOSTI'! ❤️",
    "✨ Type 'DIL' for Heart Explosion! ✨",
    "😂 Type 'JOKE' for a Hindi Joke! 😂",
    "🧩 Paheli ka jawab do aur Winner bano! 🧩"
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
    if (data.soundEffect) {
        const audio = new Audio(sounds[data.soundEffect]);
        audio.play();
    }
    processIncomingData(data);
});

socket.on('new-paheli', (question) => {
    bannerEl.classList.add('paheli-active');
    bannerEl.innerHTML = `🧩 PAHELI: ${question}`;
    bannerEl.style.background = "#f39c12";
    setTimeout(() => {
        bannerEl.classList.remove('paheli-active');
        bannerEl.style.background = "#ff4757";
    }, 60000); // Show paheli for 1 minute
});

const commentQueue = [];
let isProcessing = false;

async function processIncomingData(data) {
    commentQueue.push(data);
    if (!isProcessing) processQueue();
}

async function processQueue() {
    if (commentQueue.length === 0) { isProcessing = false; return; }
    isProcessing = true;
    const data = commentQueue.shift();

    const card = document.createElement('div');
    card.className = `sayri-card ${data.isVip ? 'vip-card' : ''} ${data.takeover === 'WINNER' ? 'winner-card' : ''}`;

    let avatarUrl = data.avatar || 'https://fonts.gstatic.com/s/i/productlogos/avatar_anonymous/v4/web-512dp.png';
    card.innerHTML = `
        <div class="avatar-wrapper">
            <img src="${avatarUrl}" class="card-avatar">
        </div>
        <div class="card-body">
            <h4 class="card-author">${data.name} ${data.isVip ? '🌟' : ''}</h4>
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

    card.classList.add('speaking');
    const cleanName = data.name.replace(/@/g, '').trim();
    const url = `/tts?text=${encodeURIComponent(cleanName + " ke liye... " + data.sayri)}`;
    const audio = new Audio(url);
    await new Promise(res => {
        audio.onended = res;
        audio.onerror = res;
        setTimeout(res, 12000);
        audio.play().catch(res);
    });
    card.classList.remove('speaking');

    setTimeout(processQueue, 800);
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

function unlockAudio() {
    const ctx = new (window.AudioContext || window.webkitAudioContext)();
    if (ctx.state === 'suspended') ctx.resume();
    document.getElementById('audio-unlock-overlay').style.display = 'none';
}
