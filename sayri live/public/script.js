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
    "😂 'JOKE' type karo, ek majedar kahani suno! 😂",
    "💎 25 Comments = DIAMOND LEGEND BADGE! 💎"
];

let currentTrapIndex = 0;
setInterval(() => {
    if (bannerEl && !bannerEl.classList.contains('paheli-active')) {
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
            <h2>🥉 BRONZE SUPPORTER 🥉</h2>
            <img src="${avatarUrl}" class="big-thanks-avatar" onerror="this.src='https://fonts.gstatic.com/s/i/productlogos/avatar_anonymous/v4/web-512dp.png'">
            <h3>${data.name} Ji</h3>
            <p>Aapne 5 comments karke Bronze Badge haasil kar liya hai! Hum par jo pyaara barasaya hai, uske liye dil se shukriya! 🎉</p>
        </div>
    `;
    document.body.appendChild(overlay);

    launchTakeoverAnimation('HEARTS');

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
            <h2>👑 GOLD VIP SUPPORTER 👑</h2>
            <h3>${data.name} Ji</h3>
            <p>Aapne 10 comments poore karke permanent Gold VIP badge 👑 hasil kar liya hai! Aap meri bahut hi special viewer ho. 🎉</p>
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

// --- DIAMOND LEGEND OVERLAY ---
socket.on('big-diamond', (data) => {
    let avatarUrl = data.avatar || 'https://fonts.gstatic.com/s/i/productlogos/avatar_anonymous/v4/web-512dp.png';
    if (avatarUrl.startsWith('//')) avatarUrl = 'https:' + avatarUrl;

    const overlay = document.createElement('div');
    overlay.className = 'big-diamond-overlay';
    overlay.innerHTML = `
        <div class="big-diamond-card">
            <div class="big-diamond-avatar-wrapper">
                <span class="big-diamond-crown">💎</span>
                <img src="${avatarUrl}" class="big-diamond-avatar" onerror="this.src='https://fonts.gstatic.com/s/i/productlogos/avatar_anonymous/v4/web-512dp.png'">
            </div>
            <h2>💎 DIAMOND LEGEND 💎</h2>
            <h3>${data.name} Ji</h3>
            <p>WAH! Aapne 25 comments poore karke humare highest Diamond Legend badge 💎 hasil kar liya hai! Aap humari mehfil ke sabse chamakte sitare ho! 🎉</p>
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

// --- LUCKY VIEWER / SPIN THE WHEEL OVERLAY ---
socket.on('lucky-winner', (data) => {
    let avatarUrl = data.avatar || 'https://fonts.gstatic.com/s/i/productlogos/avatar_anonymous/v4/web-512dp.png';
    if (avatarUrl.startsWith('//')) avatarUrl = 'https:' + avatarUrl;

    const overlay = document.createElement('div');
    overlay.className = 'lucky-winner-overlay';
    overlay.innerHTML = `
        <div class="lucky-winner-card">
            <div class="lucky-winner-avatar-wrapper">
                <span class="lucky-winner-crown">👑</span>
                <img src="${avatarUrl}" class="lucky-winner-avatar" onerror="this.src='https://fonts.gstatic.com/s/i/productlogos/avatar_anonymous/v4/web-512dp.png'">
            </div>
            <h2>✨ LUCKY SHAYARI KING / QUEEN ✨</h2>
            <h3>${data.name} Ji</h3>
            <p>Mubarak ho! Aapko aaj ki live mehfil ka Lucky Viewer chuna gaya hai! Aapke ${data.totalCount || 1} comments ne mehfil mein jaan daal di! 🎉</p>
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

// --- TOGGLE SPEECH (STOP / START COMMANDS) ---
let isSystemPaused = false;

socket.on('toggle-speech', (data) => {
    isSystemPaused = data.paused;
    if (isSystemPaused) {
        stopCurrentAudio();
    } else if (commentQueue.length > 0 && !isProcessing) {
        processQueue();
    }
});

// --- POP WINNER PROFILE OVERLAY (POPUP FOR 3 SECONDS) ---
socket.on('pop-winner', (data) => {
    let avatarUrl = data.avatar || 'https://fonts.gstatic.com/s/i/productlogos/avatar_anonymous/v4/web-512dp.png';
    if (avatarUrl.startsWith('//')) avatarUrl = 'https:' + avatarUrl;

    const overlay = document.createElement('div');
    overlay.className = 'pop-winner-overlay';
    overlay.innerHTML = `
        <div class="pop-winner-card">
            <div class="pop-winner-avatar-wrapper">
                <span class="pop-winner-crown">🏆</span>
                <img src="${avatarUrl}" class="pop-winner-avatar" onerror="this.src='https://fonts.gstatic.com/s/i/productlogos/avatar_anonymous/v4/web-512dp.png'">
            </div>
            <h2>🏆 TOP COMMENTER WINNER 🏆</h2>
            <h3>${data.name} Ji</h3>
            <p>Sabse zyada 🌟 ${data.totalCount || 0} Comments 🌟</p>
        </div>
    `;
    document.body.appendChild(overlay);

    launchTakeoverAnimation('FIREWORKS');
    launchTakeoverAnimation('HEARTS');

    // Auto remove overlay after EXACTLY 3 SECONDS
    setTimeout(() => {
        overlay.classList.add('fade-out');
        setTimeout(() => overlay.remove(), 400);
    }, 3000);
});

// --- VIEWER PRAISE / TAAREEF BIG DP OVERLAY ---
socket.on('viewer-praise', (data) => {
    let avatarUrl = data.avatar || 'https://fonts.gstatic.com/s/i/productlogos/avatar_anonymous/v4/web-512dp.png';
    if (avatarUrl.startsWith('//')) avatarUrl = 'https:' + avatarUrl;

    const overlay = document.createElement('div');
    overlay.className = 'praise-modal-overlay';
    overlay.innerHTML = `
        <div class="praise-modal-card">
            <div class="praise-avatar-wrapper">
                <span class="praise-heart-badge">💖</span>
                <img src="${avatarUrl}" class="praise-avatar-big" onerror="this.src='https://fonts.gstatic.com/s/i/productlogos/avatar_anonymous/v4/web-512dp.png'">
            </div>
            <h2>💖 DIL SE TAAREEF 💖</h2>
            <h3>${data.name} Ji</h3>
            <p>${data.praiseText || 'Aap humare live stream ke sabse pyaare viewer hain!'}</p>
        </div>
    `;
    document.body.appendChild(overlay);

    launchTakeoverAnimation('HEARTS');
    launchTakeoverAnimation('FIREWORKS');

    setTimeout(() => {
        overlay.classList.add('fade-out');
        setTimeout(() => overlay.remove(), 800);
    }, 6000);
});

// --- DYNAMIC LIVE VIEWERS DIRECTORY LIST OVERLAY ---
socket.on('toggle-viewer-list', (data) => {
    let existingModal = document.getElementById('viewer-list-modal-overlay');

    if (!data.show) {
        if (existingModal) {
            existingModal.classList.add('fade-out');
            setTimeout(() => existingModal.remove(), 500);
        }
        return;
    }

    if (!existingModal) {
        existingModal = document.createElement('div');
        existingModal.id = 'viewer-list-modal-overlay';
        existingModal.className = 'viewer-list-modal-overlay';
        document.body.appendChild(existingModal);
    }

    const viewersHtml = (data.viewers && data.viewers.length > 0)
        ? data.viewers.map(v => {
            let badgeEmoji = '';
            if (v.vipLevel === 'HOST') badgeEmoji = '💖';
            else if (v.vipLevel === 'DIAMOND') badgeEmoji = '💎';
            else if (v.vipLevel === 'GOLD') badgeEmoji = '👑';
            else if (v.vipLevel === 'BRONZE') badgeEmoji = '🥉';

            let avatarUrl = v.avatar || 'https://fonts.gstatic.com/s/i/productlogos/avatar_anonymous/v4/web-512dp.png';
            if (avatarUrl.startsWith('//')) avatarUrl = 'https:' + avatarUrl;

            return `
                <div class="viewer-list-card">
                    <img src="${avatarUrl}" class="viewer-list-avatar" onerror="this.src='https://fonts.gstatic.com/s/i/productlogos/avatar_anonymous/v4/web-512dp.png'">
                    <div class="viewer-list-info">
                        <span class="viewer-list-name">${v.name} ${badgeEmoji}</span>
                        <span class="viewer-list-count">${v.totalCount} Comments</span>
                    </div>
                </div>
            `;
        }).join('')
        : '<p style="color:#fff; text-align:center; width:100%;">Abhi tak kisi viewer ne comment nahi kiya hai.</p>';

    existingModal.innerHTML = `
        <div class="viewer-list-modal-card">
            <div class="viewer-list-header">
                <h2>📋 LIVE VIEWERS DIRECTORY 📋</h2>
                <span class="viewer-list-total">Total Active Viewers: ${data.viewers ? data.viewers.length : 0}</span>
            </div>
            <div class="viewer-list-grid">
                ${viewersHtml}
            </div>
            <div class="viewer-list-footer">
                Type 'close list' in chat to close
            </div>
        </div>
    `;
});

// --- VS BATTLE & LIVE VOTING OVERLAY ---
socket.on('start-vs-battle', (data) => {
    let existingVs = document.getElementById('vs-battle-modal-overlay');
    if (!existingVs) {
        existingVs = document.createElement('div');
        existingVs.id = 'vs-battle-modal-overlay';
        existingVs.className = 'vs-battle-modal-overlay';
        document.body.appendChild(existingVs);
    }

    renderVsBattleUI(existingVs, data.userA, data.userB);
    launchTakeoverAnimation('FIREWORKS');
});

socket.on('update-vs-votes', (data) => {
    let existingVs = document.getElementById('vs-battle-modal-overlay');
    if (existingVs) {
        renderVsBattleUI(existingVs, data.userA, data.userB);
    }
});

socket.on('end-vs-battle', (data) => {
    let existingVs = document.getElementById('vs-battle-modal-overlay');
    if (existingVs) {
        existingVs.classList.add('fade-out');
        setTimeout(() => existingVs.remove(), 500);
    }

    // Show VS Battle Winner Celebration
    if (data.winner) {
        let avatarUrl = data.winner.avatar || 'https://fonts.gstatic.com/s/i/productlogos/avatar_anonymous/v4/web-512dp.png';
        if (avatarUrl.startsWith('//')) avatarUrl = 'https:' + avatarUrl;

        const overlay = document.createElement('div');
        overlay.className = 'pop-winner-overlay';
        overlay.innerHTML = `
            <div class="pop-winner-card">
                <div class="pop-winner-avatar-wrapper">
                    <span class="pop-winner-crown">🏆</span>
                    <img src="${avatarUrl}" class="pop-winner-avatar" onerror="this.src='https://fonts.gstatic.com/s/i/productlogos/avatar_anonymous/v4/web-512dp.png'">
                </div>
                <h2>🏆 VS BATTLE WINNER 🏆</h2>
                <h3>${data.winner.name} Ji</h3>
                <p>Jeeta ${data.winner.votes || 0} Votes Se! 🎉</p>
            </div>
        `;
        document.body.appendChild(overlay);

        launchTakeoverAnimation('FIREWORKS');
        launchTakeoverAnimation('HEARTS');

        setTimeout(() => {
            overlay.classList.add('fade-out');
            setTimeout(() => overlay.remove(), 500);
        }, 6000);
    }
});

function renderVsBattleUI(container, userA, userB) {
    const totalVotes = (userA.votes + userB.votes) || 1;
    const percentA = Math.round((userA.votes / totalVotes) * 100);
    const percentB = 100 - percentA;

    let avatarA = userA.avatar || 'https://fonts.gstatic.com/s/i/productlogos/avatar_anonymous/v4/web-512dp.png';
    let avatarB = userB.avatar || 'https://fonts.gstatic.com/s/i/productlogos/avatar_anonymous/v4/web-512dp.png';
    if (avatarA.startsWith('//')) avatarA = 'https:' + avatarA;
    if (avatarB.startsWith('//')) avatarB = 'https:' + avatarB;

    container.innerHTML = `
        <div class="vs-battle-modal-card">
            <h2 class="vs-header">⚔️ SHAYARI MAHASANGRAM ⚔️</h2>
            <div class="vs-fighters-wrapper">
                <!-- Fighter A -->
                <div class="vs-fighter-card vs-left">
                    <div class="vs-avatar-wrapper">
                        <span class="vs-option-tag">A</span>
                        <img src="${avatarA}" class="vs-avatar" onerror="this.src='https://fonts.gstatic.com/s/i/productlogos/avatar_anonymous/v4/web-512dp.png'">
                    </div>
                    <h3>${userA.name}</h3>
                    <div class="vs-vote-badge">${userA.votes} VOTES</div>
                    <span class="vs-instruction">Comment 'A' to vote</span>
                </div>

                <!-- Center VS Flame -->
                <div class="vs-center-badge">
                    <span>VS</span>
                </div>

                <!-- Fighter B -->
                <div class="vs-fighter-card vs-right">
                    <div class="vs-avatar-wrapper">
                        <span class="vs-option-tag tag-b">B</span>
                        <img src="${avatarB}" class="vs-avatar" onerror="this.src='https://fonts.gstatic.com/s/i/productlogos/avatar_anonymous/v4/web-512dp.png'">
                    </div>
                    <h3>${userB.name}</h3>
                    <div class="vs-vote-badge badge-b">${userB.votes} VOTES</div>
                    <span class="vs-instruction">Comment 'B' to vote</span>
                </div>
            </div>

            <!-- Live Progress Bar -->
            <div class="vs-progress-container">
                <div class="vs-progress-bar-fill fill-a" style="width: ${percentA}%;"></div>
                <div class="vs-progress-bar-fill fill-b" style="width: ${percentB}%;"></div>
            </div>
            <div class="vs-percent-labels">
                <span>Option A: ${percentA}%</span>
                <span>Option B: ${percentB}%</span>
            </div>
        </div>
    `;
}

const commentQueue = [];
let isProcessing = false;
let currentAudioElement = null;

function stopCurrentAudio() {
    if (currentAudioElement) {
        try {
            currentAudioElement.pause();
            currentAudioElement.src = "";
            currentAudioElement = null;
        } catch (e) {}
    }
}

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

// --- RENDER CARD DIRECTLY ON DAIRY SCREEN ---
function renderCardDOM(data) {
    const card = document.createElement('div');

    let vipCardClass = '';
    let badgeEmoji = '';
    if (data.isHost || data.vipLevel === 'HOST') {
        vipCardClass = 'host-card';
        badgeEmoji = '💖';
    } else if (data.vipLevel === 'DIAMOND') {
        vipCardClass = 'diamond-card';
        badgeEmoji = '💎';
    } else if (data.vipLevel === 'GOLD' || data.isVip) {
        vipCardClass = 'vip-card';
        badgeEmoji = '👑';
    } else if (data.vipLevel === 'BRONZE') {
        vipCardClass = 'bronze-card';
        badgeEmoji = '🥉';
    }

    card.className = `sayri-card ${vipCardClass} ${data.takeover === 'WINNER' ? 'winner-card' : ''} ${data.isSystem ? 'system-card' : ''}`;

    let avatarUrl = data.avatar || 'https://fonts.gstatic.com/s/i/productlogos/avatar_anonymous/v4/web-512dp.png';
    if (avatarUrl.startsWith('//')) avatarUrl = 'https:' + avatarUrl;

    card.innerHTML = `
        <div class="avatar-wrapper">
            <img src="${avatarUrl}" class="card-avatar" onerror="this.src='https://fonts.gstatic.com/s/i/productlogos/avatar_anonymous/v4/web-512dp.png'">
            ${badgeEmoji ? `<span class="crown-badge">${badgeEmoji}</span>` : ''}
        </div>
        <div class="card-body">
            <h4 class="card-author">${data.name} ${badgeEmoji}</h4>
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

    if (!data.isSystem) {
        addAvatarToHistory(data.name, avatarUrl);
    }

    return card;
}

// --- PROCESS INCOMING COMMENT (INSTANT SHOW FOR HOST @Ruchi-gupta101) ---
async function processIncomingData(data) {
    if (data.isHost) {
        // Render card on dairy screen INSTANTLY!
        const card = renderCardDOM(data);

        // If host typed "Read", interrupt TTS audio and speak host message immediately!
        if (!data.noTTS) {
            stopCurrentAudio();
            card.classList.add('speaking');
            const ttsText = data.sayri.replace(/([\u2700-\u27BF]|[\uE000-\uF8FF]|\uD83C[\uDC00-\uDFFF]|\uD83D[\uDC00-\uDFFF]|[\u2011-\u26FF]|\uD83E[\uDD00-\uDDFF]|[\u{1F000}-\u{1F9FF}]|[\u{2600}-\u{27BF}]|[\u{1F600}-\u{1F64F}]|[\u{1F680}-\u{1F6FF}]|[\u{2300}-\u{23FF}])/gu, '').trim();
            const url = `/tts?text=${encodeURIComponent(ttsText)}`;
            playAudioSecurely(url, 15000).then(() => card.classList.remove('speaking'));
        }
        return;
    }

    commentQueue.push(data);
    if (!isProcessing) processQueue();
}

async function processQueue() {
    if (commentQueue.length === 0 || isSystemPaused) { isProcessing = false; return; }
    isProcessing = true;
    const data = commentQueue.shift();

    const card = renderCardDOM(data);

    if (data.soundEffect && sounds[data.soundEffect]) {
        await playAudioSecurely(sounds[data.soundEffect], 4000);
    }

    if (!data.noTTS) {
        card.classList.add('speaking');
        let cleanName = data.name.replace(/@/g, '').trim();
        if (cleanName.includes('-')) {
            cleanName = cleanName.split('-')[0].trim();
        }
        cleanName = cleanName.replace(/[0-9]/g, '').trim();

        const prefix = data.isSystem ? '' : (cleanName + " ke liye... ");
        const rawText = prefix + data.sayri;
        const ttsText = rawText.replace(/([\u2700-\u27BF]|[\uE000-\uF8FF]|\uD83C[\uDC00-\uDFFF]|\uD83D[\uDC00-\uDFFF]|[\u2011-\u26FF]|\uD83E[\uDD00-\uDDFF]|[\u{1F000}-\u{1F9FF}]|[\u{2600}-\u{27BF}]|[\u{1F600}-\u{1F64F}]|[\u{1F680}-\u{1F6FF}]|[\u{2300}-\u{23FF}])/gu, '').trim();
        const url = `/tts?text=${encodeURIComponent(ttsText)}`;

        await playAudioSecurely(url, 15000);
        card.classList.remove('speaking');
    }

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

    if (avatarHistoryList) {
        const img = document.createElement('img');
        img.src = avatarUrl;
        img.className = 'history-avatar-item';
        img.title = name;
        avatarHistoryList.appendChild(img);
        avatarHistoryList.scrollLeft = avatarHistoryList.scrollWidth;
    }
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
            if (emojiContainer) emojiContainer.appendChild(el);
            setTimeout(() => el.remove(), 3000);
        }, i * 50);
    }
}
