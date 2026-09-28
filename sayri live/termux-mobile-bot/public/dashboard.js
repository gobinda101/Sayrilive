const socket = io();

// DOM Elements
const statusBadge = document.getElementById('connection-status-badge');
const statusText = document.getElementById('status-text');

const liveUrlInput = document.getElementById('live-url-input');
const btnConnectStream = document.getElementById('btn-connect-stream');
const obsUrlInput = document.getElementById('obs-url-input');
const btnCopyObs = document.getElementById('btn-copy-obs');

const btnModeSayri = document.getElementById('btn-mode-sayri');
const btnModeChat = document.getElementById('btn-mode-chat');
const btnPauseAudio = document.getElementById('btn-pause-audio');
const btnResumeAudio = document.getElementById('btn-resume-audio');

const btnTriggerWinner = document.getElementById('btn-trigger-winner');
const btnToggleList = document.getElementById('btn-toggle-list');

const hostMsgInput = document.getElementById('host-msg-input');
const chkReadTts = document.getElementById('chk-read-tts');
const btnSendAnnouncement = document.getElementById('btn-send-announcement');

const praiseViewerInput = document.getElementById('praise-viewer-input');
const btnPraiseViewer = document.getElementById('btn-praise-viewer');

const vsUserA = document.getElementById('vs-user-a');
const vsUserB = document.getElementById('vs-user-b');
const btnStartVs = document.getElementById('btn-start-vs');
const btnEndVs = document.getElementById('btn-end-vs');

// Auto set OBS Link in input
if (obsUrlInput) {
    obsUrlInput.value = `${window.location.protocol}//${window.location.host}`;
}

// Copy OBS Link
btnCopyObs.addEventListener('click', () => {
    obsUrlInput.select();
    navigator.clipboard.writeText(obsUrlInput.value);
    btnCopyObs.innerText = 'Copied! ✅';
    setTimeout(() => { btnCopyObs.innerText = 'Copy Link 📋'; }, 2000);
});

// Socket Status
socket.on('connect', () => {
    statusBadge.className = 'status-badge status-online';
    statusText.innerText = 'Server Connected 🟢';
});

socket.on('disconnect', () => {
    statusBadge.className = 'status-badge status-offline';
    statusText.innerText = 'Disconnected 🔴';
});

// 1. Connect YouTube Live Stream
btnConnectStream.addEventListener('click', () => {
    const url = liveUrlInput.value.trim();
    if (!url) {
        alert('Kripya YouTube Live URL ya Video ID enter karein!');
        return;
    }
    btnConnectStream.innerText = 'Connecting... 📡';

    socket.emit('connect-youtube-stream', { url });
});

socket.on('youtube-status', (data) => {
    if (data.connected) {
        btnConnectStream.innerText = 'Connected 🟢';
        btnConnectStream.classList.remove('btn-primary');
        btnConnectStream.classList.add('btn-success');
    } else {
        btnConnectStream.innerText = 'Connect Stream 🚀';
        btnConnectStream.classList.remove('btn-success');
        btnConnectStream.classList.add('btn-primary');
        if (data.message) alert(data.message);
    }
});

// 2. Modes Controls
btnModeSayri.addEventListener('click', () => {
    socket.emit('dashboard-control', { command: 'SAYRI MODE' });
    btnModeSayri.classList.add('active');
    btnModeChat.classList.remove('active');
});

btnModeChat.addEventListener('click', () => {
    socket.emit('dashboard-control', { command: 'CHAT MODE' });
    btnModeChat.classList.add('active');
    btnModeSayri.classList.remove('active');
});

btnPauseAudio.addEventListener('click', () => {
    socket.emit('dashboard-control', { command: 'STOP' });
});

btnResumeAudio.addEventListener('click', () => {
    socket.emit('dashboard-control', { command: 'START' });
});

// 3. Quick Triggers
btnTriggerWinner.addEventListener('click', () => {
    socket.emit('dashboard-control', { command: 'WINNER' });
});

let isListOpen = false;
btnToggleList.addEventListener('click', () => {
    if (!isListOpen) {
        socket.emit('dashboard-control', { command: 'LIST' });
        btnToggleList.innerText = 'Hide Viewers List ❌';
        isListOpen = true;
    } else {
        socket.emit('dashboard-control', { command: 'CLOSE LIST' });
        btnToggleList.innerText = 'Show Viewers Directory 📋';
        isListOpen = false;
    }
});

// 4. Send Host Announcement
btnSendAnnouncement.addEventListener('click', () => {
    const msg = hostMsgInput.value.trim();
    if (!msg) return;

    socket.emit('dashboard-announcement', {
        message: msg,
        readTTS: chkReadTts.checked
    });

    hostMsgInput.value = '';
});

// 5. Praise Viewer
btnPraiseViewer.addEventListener('click', () => {
    const name = praiseViewerInput.value.trim();
    if (!name) return;

    socket.emit('dashboard-control', { command: `PRAISE ${name}` });
    praiseViewerInput.value = '';
});

// 6. VS Battle Controls
btnStartVs.addEventListener('click', () => {
    const nameA = vsUserA.value.trim();
    const nameB = vsUserB.value.trim();
    if (!nameA || !nameB) {
        alert('Kripya dono viewers ke naam enter karein!');
        return;
    }

    socket.emit('dashboard-control', { command: `${nameA} VS ${nameB}` });
});

btnEndVs.addEventListener('click', () => {
    socket.emit('dashboard-control', { command: 'CLOSE VS' });
});
