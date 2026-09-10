const socket = io();

const authorName = document.getElementById('author-name');
const sayriText = document.getElementById('sayri-text');
const container = document.getElementById('comment-container');

// Queue to store incoming comments/sayris
const commentQueue = [];
let isSpeaking = false;
let audioUnlocked = false;

// Function to unlock audio context in Chrome/OBS
function unlockAudio() {
    // Play a tiny silent sound to unlock Web Audio context
    try {
        const AudioContext = window.AudioContext || window.webkitAudioContext;
        if (AudioContext) {
            const ctx = new AudioContext();
            if (ctx.state === 'suspended') {
                ctx.resume();
            }
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

    // UI Updates
    const infoContainer = document.querySelector('.author-info');
    infoContainer.classList.remove('author-pop');
    sayriText.classList.remove('writing-effect');

    void infoContainer.offsetWidth;
    void sayriText.offsetWidth;

    const avatarImg = document.getElementById('author-avatar');
    if (currentData.avatar && currentData.avatar.trim() !== '') {
        let avatarUrl = currentData.avatar;
        if (avatarUrl.startsWith('//')) avatarUrl = 'https:' + avatarUrl;
        avatarImg.src = avatarUrl;
    } else {
        avatarImg.src = 'https://fonts.gstatic.com/s/i/productlogos/avatar_anonymous/v4/web-512dp.png';
    }

    authorName.innerText = currentData.name;
    sayriText.innerText = currentData.sayri;

    addAvatarToHistory(currentData.name, avatarImg.src);
    launchEmojiAnimation();

    infoContainer.classList.add('author-pop');
    sayriText.classList.add('writing-effect');

    // Text to Speech
    speak(currentData.name, currentData.sayri);
}

function speak(name, sayri) {
    const textToSpeak = `${name} ke liye... ${sayri}`;

    // Use the Proxy TTS route instead of Web Speech API for OBS reliability
    const url = `/tts?text=${encodeURIComponent(textToSpeak)}`;
    const audio = new Audio(url);
    audio.volume = 1.0;

    audio.onended = () => {
        isSpeaking = false;
        setTimeout(() => {
            processQueue();
        }, 1000);
    };

    audio.onerror = (err) => {
        console.error('Audio Error:', err);
        isSpeaking = false;
        processQueue();
    };

    audio.play().catch(err => {
        console.warn('Autoplay blocked. User needs to click first.', err);
        // Show overlay if blocked
        const overlay = document.getElementById('audio-unlock-overlay');
        if (overlay) overlay.style.display = 'flex';
        isSpeaking = false;
        // Don't process queue, wait for user to click
    });
}

const uniqueCommenters = new Set();
function addAvatarToHistory(name, avatarUrl) {
    if (uniqueCommenters.has(name)) return;
    uniqueCommenters.add(name);
    const historyList = document.getElementById('avatar-history-list');
    const img = document.createElement('img');
    img.src = avatarUrl;
    img.className = 'history-avatar-item';
    img.title = name;
    historyList.appendChild(img);
    historyList.scrollTop = historyList.scrollHeight;
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
