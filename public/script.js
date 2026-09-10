const socket = io();
const sayriChatHistory = document.getElementById('sayri-chat-history');
const bannerEl = document.querySelector('.notebook-banner');

// Engagement "Traps" Messages
const traps = [
    "💬 Type 'HI' to see your name on the Notebook! 💬",
    "✨ Comment 'SAYRI' for a personalized Shayari! ✨",
    "😂 Type 'JOKE' for a funny Hindi Joke! 😂",
    "❤️ Shayari Lovers, comment 'WOW' right now! ❤️",
    "🔥 Apne naam ki shayari sunne ke liye ek comment karein! 🔥",
    "🌹 Send a message and join our Live History! 🌹"
];

let currentTrapIndex = 0;
setInterval(() => {
    currentTrapIndex = (currentTrapIndex + 1) % traps.length;
    if (bannerEl) {
        bannerEl.style.opacity = 0;
        setTimeout(() => {
            bannerEl.innerText = traps[currentTrapIndex];
            bannerEl.style.opacity = 1;
        }, 500);
    }
}, 25000); // Change every 25 seconds

// Queue to store incoming comments/sayris
const commentQueue = [];
let isSpeaking = false;
let audioUnlocked = false;

// Function to unlock audio context in Chrome/OBS
function unlockAudio() {
    try {
        const AudioContext = window.AudioContext || window.webkitAudioContext;
        if (AudioContext) {
            const ctx = new AudioContext();
            if (ctx.state === 'suspended') ctx.resume();
            const osc = ctx.createOscillator();
            const gain = ctx.createGain();
            gain.gain.value = 0.001;
            osc.connect(gain);
            gain.connect(ctx.destination);
            osc.start(0);
            osc.stop(ctx.currentTime + 0.05);
        }
    } catch (e) {}

    audioUnlocked = true;
    const overlay = document.getElementById('audio-unlock-overlay');
    if (overlay) overlay.style.display = 'none';
    console.log('Audio Context Unlocked');
}

socket.on('new-comment', (data) => {
    commentQueue.push(data);
    processQueue();
});

function processQueue() {
    if (isSpeaking || commentQueue.length === 0) return;

    isSpeaking = true;
    const currentData = commentQueue.shift();

    // 1. Create New Chat Card
    const card = document.createElement('div');
    card.className = 'sayri-card';

    let avatarUrl = currentData.avatar || 'https://fonts.gstatic.com/s/i/productlogos/avatar_anonymous/v4/web-512dp.png';
    if (avatarUrl.startsWith('//')) avatarUrl = 'https:' + avatarUrl;

    card.innerHTML = `
        <img src="${avatarUrl}" class="card-avatar">
        <div class="card-body">
            <h4 class="card-author">${currentData.name}</h4>
            <p class="card-text">${currentData.sayri}</p>
        </div>
    `;

    // 2. Add to History and manage FIFO (max 5-6 items)
    sayriChatHistory.appendChild(card);

    if (sayriChatHistory.children.length > 5) {
        const oldest = sayriChatHistory.children[0];
        oldest.classList.add('exit');
        setTimeout(() => {
            if (oldest.parentNode === sayriChatHistory) {
                sayriChatHistory.removeChild(oldest);
            }
        }, 500);
    }

    // 3. Update Global History & Emojis
    addAvatarToHistory(currentData.name, avatarUrl);
    launchEmojiAnimation();

    // 4. Text to Speech
    speak(currentData.name, currentData.sayri);
}

function speak(name, sayri) {
    // Remove '@' from name for clean Text-to-Speech
    const cleanName = name.replace(/@/g, '').trim();
    const textToSpeak = `${cleanName} ke liye... ${sayri}`;
    const url = `/tts?text=${encodeURIComponent(textToSpeak)}`;
    const audio = new Audio(url);
    audio.volume = 1.0;

    audio.onended = () => {
        isSpeaking = false;
        setTimeout(() => {
            processQueue();
        }, 800);
    };

    audio.onerror = (err) => {
        console.error('Audio Error:', err);
        isSpeaking = false;
        processQueue();
    };

    audio.play().catch(err => {
        console.warn('Autoplay blocked.', err);
        const overlay = document.getElementById('audio-unlock-overlay');
        if (overlay) overlay.style.display = 'flex';
        isSpeaking = false;
    });
}

const uniqueCommenters = new Set();
function addAvatarToHistory(name, avatarUrl) {
    if (uniqueCommenters.has(name)) return;
    uniqueCommenters.add(name);

    const countEl = document.getElementById('viewer-count');
    if (countEl) countEl.innerText = uniqueCommenters.size;

    const historyList = document.getElementById('avatar-history-list');
    const img = document.createElement('img');
    img.src = avatarUrl;
    img.className = 'history-avatar-item';
    img.title = name;
    historyList.appendChild(img);
    historyList.scrollLeft = historyList.scrollWidth;
}

const emojiPool = ['❤️', '💖', '✨', '🌹', '👏', '😍', '🔥', '😇', '🎈', '🎉'];
function launchEmojiAnimation() {
    const container = document.getElementById('emoji-container');
    const count = 8 + Math.floor(Math.random() * 5);
    for (let i = 0; i < count; i++) {
        setTimeout(() => {
            const emojiEl = document.createElement('div');
            emojiEl.className = 'floating-emoji';
            emojiEl.innerText = emojiPool[Math.floor(Math.random() * emojiPool.length)];
            const randomX = Math.floor(Math.random() * window.innerWidth);
            emojiEl.style.left = `${randomX}px`;
            const randomSize = 24 + Math.floor(Math.random() * 20);
            emojiEl.style.fontSize = `${randomSize}px`;
            const duration = 2.5 + Math.random() * 1.5;
            emojiEl.style.animationDuration = `${duration}s`;
            container.appendChild(emojiEl);
            setTimeout(() => { emojiEl.remove(); }, duration * 1000);
        }, i * 150);
    }
}

// Ensure first trap is set correctly
if (bannerEl) {
    bannerEl.style.transition = "opacity 0.5s ease";
    bannerEl.innerText = traps[0];
}
