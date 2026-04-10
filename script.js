// Configuration
const CHARS_PER_KEYPRESS = 1;
const SCROLL_SPEED = 100;

const THEMES = ['green', 'amber', 'matrix', 'cyberpunk'];
const STORAGE = {
    theme: 'hackSim_theme',
    speed: 'hackSim_speed',
    mute: 'hackSim_mute',
    code: 'hackSim_code',
};

// State
let codeIndex = 0;
let accessGrantedCount = 0;
let accessDeniedCount = 0;
let lastKeyTime = 0;

// DOM Elements
const terminal = document.getElementById('terminal');
const codeOutput = document.getElementById('code-output');
const accessGrantedPopup = document.getElementById('access-granted');
const accessDeniedPopup = document.getElementById('access-denied');
const processingPopup = document.getElementById('processing');
const muteBtn = document.getElementById('mute-btn');
const codeSelect = document.getElementById('code-select');

// Sound Manager using Web Audio API
class SoundManager {
    constructor() {
        this.context = new (window.AudioContext || window.webkitAudioContext)();
        this.masterGain = this.context.createGain();
        this.masterGain.gain.value = 1;
        this.masterGain.connect(this.context.destination);
        this.muted = false;
    }

    playTone(freq, type, duration) {
        if (this.muted) {
            return;
        }
        if (this.context.state === 'suspended') {
            this.context.resume();
        }
        const osc = this.context.createOscillator();
        const gain = this.context.createGain();

        osc.type = type;
        osc.frequency.setValueAtTime(freq, this.context.currentTime);

        gain.gain.setValueAtTime(0.1, this.context.currentTime);
        gain.gain.exponentialRampToValueAtTime(0.01, this.context.currentTime + duration);

        osc.connect(gain);
        gain.connect(this.masterGain);

        osc.start();
        osc.stop(this.context.currentTime + duration);
    }

    playTypingSound() {
        this.playTone(800 + Math.random() * 200, 'square', 0.05);
    }

    playAccessGranted() {
        this.playTone(440, 'sine', 0.2);
        setTimeout(() => this.playTone(554, 'sine', 0.2), 100);
        setTimeout(() => this.playTone(659, 'sine', 0.4), 200);
    }

    playAccessDenied() {
        this.playTone(150, 'sawtooth', 0.3);
        setTimeout(() => this.playTone(100, 'sawtooth', 0.4), 150);
    }
}

const soundManager = new SoundManager();

function setTheme(theme, { playSound = false } = {}) {
    if (!THEMES.includes(theme)) {
        return false;
    }
    if (theme === 'green') {
        document.body.removeAttribute('data-theme');
    } else {
        document.body.setAttribute('data-theme', theme);
    }
    try {
        localStorage.setItem(STORAGE.theme, theme);
    } catch (_) {
        /* ignore quota / private mode */
    }
    if (playSound) {
        soundManager.playTypingSound();
    }
    return true;
}

function getStoredTheme() {
    try {
        const t = localStorage.getItem(STORAGE.theme);
        if (THEMES.includes(t)) {
            return t;
        }
    } catch (_) {
        /* ignore */
    }
    return 'green';
}

function applyCodeBase(key, silent) {
    const k = ['kernel', 'html', 'matrix'].includes(key) ? key : 'kernel';
    if (codeSelect) {
        codeSelect.value = k;
    }
    if (k === 'kernel') {
        codeData = kernelCode;
    } else if (k === 'html') {
        codeData = htmlCode;
    } else {
        codeData = matrixCode;
    }
    try {
        localStorage.setItem(STORAGE.code, k);
    } catch (_) {
        /* ignore */
    }
    if (!silent) {
        codeIndex = 0;
        codeOutput.textContent += '\n--- SYSTEM SWITCH ---\n';
    }
}

function updateMuteButton() {
    if (!muteBtn) {
        return;
    }
    muteBtn.textContent = soundManager.muted ? '🔇' : '🔊';
    muteBtn.title = soundManager.muted ? 'Unmute sound' : 'Mute sound';
    muteBtn.classList.toggle('muted', soundManager.muted);
}

function persistSpeed() {
    if (!speedSlider) {
        return;
    }
    try {
        localStorage.setItem(STORAGE.speed, speedSlider.value);
    } catch (_) {
        /* ignore */
    }
}

function loadPreferences() {
    setTheme(getStoredTheme());
    if (speedSlider) {
        try {
            const s = parseInt(localStorage.getItem(STORAGE.speed), 10);
            if (s >= 1 && s <= 50) {
                speedSlider.value = String(s);
            }
        } catch (_) {
            /* ignore */
        }
    }
    try {
        soundManager.muted = localStorage.getItem(STORAGE.mute) === '1';
    } catch (_) {
        /* ignore */
    }
    let storedCode = 'kernel';
    try {
        storedCode = localStorage.getItem(STORAGE.code) || 'kernel';
    } catch (_) {
        /* ignore */
    }
    applyCodeBase(storedCode, true);
    updateMuteButton();
}

// Main Typing Logic
function typeCode() {
    const chunkSize = CHARS_PER_KEYPRESS;
    const nextChunk = codeData.substring(codeIndex, codeIndex + chunkSize);

    if (nextChunk) {
        codeOutput.textContent += nextChunk;
        codeIndex += chunkSize;

        if (codeIndex >= codeData.length) {
            codeIndex = 0;
        }

        scrollToBottom();
        soundManager.playTypingSound();
    }
}

function scrollToBottom() {
    terminal.scrollTop = terminal.scrollHeight;
}

// Popup Management
function showPopup(type) {
    hidePopups();
    if (type === 'granted') {
        accessGrantedPopup.style.display = 'block';
        soundManager.playAccessGranted();
    } else if (type === 'denied') {
        accessDeniedPopup.style.display = 'block';
        soundManager.playAccessDenied();
    } else if (type === 'processing') {
        processingPopup.style.display = 'block';
        soundManager.playTone(2000, 'sine', 0.1);
    }
}

function hidePopups() {
    accessGrantedPopup.style.display = 'none';
    accessDeniedPopup.style.display = 'none';
    processingPopup.style.display = 'none';
}

function triggerProcess(message, finalType) {
    processingPopup.textContent = message;
    showPopup('processing');

    setTimeout(() => {
        showPopup(finalType);
    }, 1500);
}

// Settings & Theme Logic
const settingsBtn = document.getElementById('settings-btn');
const settingsPanel = document.getElementById('settings-panel');
const closeSettingsBtn = document.getElementById('close-settings');
const themeBtns = document.querySelectorAll('.theme-btn');
const fullscreenBtn = document.getElementById('fullscreen-btn');

if (settingsBtn) {
    settingsBtn.addEventListener('click', (e) => {
        e.stopPropagation();
        settingsPanel.classList.remove('hidden');
    });
}

if (closeSettingsBtn) {
    closeSettingsBtn.addEventListener('click', (e) => {
        e.stopPropagation();
        settingsPanel.classList.add('hidden');
    });
}

themeBtns.forEach((btn) => {
    btn.addEventListener('click', (e) => {
        e.stopPropagation();
        setTheme(btn.dataset.setTheme, { playSound: true });
    });
});

// Auto-Typing Logic
let autoTypingInterval = null;
const autoHackBtn = document.getElementById('auto-hack-btn');
const speedSlider = document.getElementById('speed-slider');

function toggleAutoHack() {
    if (autoTypingInterval) {
        clearInterval(autoTypingInterval);
        autoTypingInterval = null;
        autoHackBtn.classList.remove('active');
    } else {
        startAutoHack();
        autoHackBtn.classList.add('active');
    }
}

function startAutoHack() {
    if (autoTypingInterval) {
        clearInterval(autoTypingInterval);
    }
    const speed = 51 - speedSlider.value;
    autoTypingInterval = setInterval(() => {
        typeCode();
    }, speed * 5);
}

if (autoHackBtn) {
    autoHackBtn.addEventListener('click', (e) => {
        e.stopPropagation();
        toggleAutoHack();
    });
}

if (speedSlider) {
    speedSlider.addEventListener('input', (e) => {
        e.stopPropagation();
        persistSpeed();
        if (autoTypingInterval) {
            startAutoHack();
        }
    });
    speedSlider.addEventListener('click', (e) => e.stopPropagation());
    speedSlider.addEventListener('mousedown', (e) => e.stopPropagation());
    speedSlider.addEventListener('touchstart', (e) => e.stopPropagation());
}

if (muteBtn) {
    muteBtn.addEventListener('click', (e) => {
        e.stopPropagation();
        soundManager.muted = !soundManager.muted;
        try {
            localStorage.setItem(STORAGE.mute, soundManager.muted ? '1' : '0');
        } catch (_) {
            /* ignore */
        }
        updateMuteButton();
    });
}

// Code Selection Logic
if (codeSelect) {
    codeSelect.addEventListener('change', (e) => {
        e.stopPropagation();
        applyCodeBase(e.target.value, false);
    });
    codeSelect.addEventListener('click', (e) => e.stopPropagation());
    codeSelect.addEventListener('mousedown', (e) => e.stopPropagation());
}

// Fullscreen Logic
if (fullscreenBtn) {
    fullscreenBtn.addEventListener('click', (e) => {
        e.stopPropagation();
        if (!document.fullscreenElement) {
            document.documentElement.requestFullscreen();
        } else if (document.exitFullscreen) {
            document.exitFullscreen();
        }
    });
}

// Command Line Logic
const commandLine = document.getElementById('command-line');
const cmdInput = document.getElementById('cmd-input');

function toggleCommandLine() {
    if (commandLine.classList.contains('hidden')) {
        commandLine.classList.remove('hidden');
        cmdInput.focus();
    } else {
        commandLine.classList.add('hidden');
        cmdInput.value = '';
        terminal.scrollTop = terminal.scrollHeight;
    }
}

function executeCommand(cmd) {
    const parts = cmd.trim().split(' ');
    const command = parts[0].toLowerCase();
    const args = parts.slice(1);

    codeOutput.textContent += `\n> ${cmd}\n`;

    switch (command) {
        case '/help':
            codeOutput.textContent +=
                'Available commands:\n' +
                '  /help - Show this help\n' +
                '  /clear - Clear terminal\n' +
                '  /theme [green|amber|matrix|cyberpunk] - Set theme (saved)\n' +
                '  /speed [1-50] - Set auto-type speed (saved)\n' +
                '  /mute - Toggle sound (saved)\n';
            break;
        case '/clear':
            codeOutput.textContent = '';
            codeIndex = 0;
            break;
        case '/theme':
            if (args.length > 0) {
                if (setTheme(args[0], { playSound: true })) {
                    codeOutput.textContent += `Theme set to ${args[0]}\n`;
                } else {
                    codeOutput.textContent += `Unknown theme: ${args[0]}\n`;
                }
            } else {
                codeOutput.textContent += 'Usage: /theme [green|amber|matrix|cyberpunk]\n';
            }
            break;
        case '/speed':
            if (args.length > 0) {
                const speed = parseInt(args[0], 10);
                if (speed >= 1 && speed <= 50) {
                    speedSlider.value = String(speed);
                    persistSpeed();
                    if (autoTypingInterval) {
                        startAutoHack();
                    }
                    codeOutput.textContent += `Speed set to ${speed}\n`;
                } else {
                    codeOutput.textContent += 'Speed must be between 1 and 50\n';
                }
            } else {
                codeOutput.textContent += 'Usage: /speed [1-50]\n';
            }
            break;
        case '/mute':
            soundManager.muted = !soundManager.muted;
            try {
                localStorage.setItem(STORAGE.mute, soundManager.muted ? '1' : '0');
            } catch (_) {
                /* ignore */
            }
            updateMuteButton();
            codeOutput.textContent += soundManager.muted ? 'Sound muted\n' : 'Sound on\n';
            break;
        default:
            codeOutput.textContent += `Unknown command: ${command}\n`;
    }
    scrollToBottom();
    toggleCommandLine();
}

if (cmdInput) {
    cmdInput.addEventListener('keydown', (e) => {
        e.stopPropagation();
        if (e.key === 'Enter') {
            executeCommand(cmdInput.value);
        }
        if (e.key === 'Escape') {
            toggleCommandLine();
        }
    });
}

function isChromeUiTarget(el) {
    return (
        el.closest('#status-bar') ||
        el.closest('#settings-panel') ||
        el.closest('#command-line')
    );
}

// Event Listeners
document.addEventListener('keydown', (e) => {
    if (soundManager.context.state === 'suspended') {
        soundManager.context.resume();
    }

    if (e.key === '`' || e.key === '~') {
        e.preventDefault();
        toggleCommandLine();
        return;
    }

    if (!commandLine.classList.contains('hidden')) {
        return;
    }

    if (e.key === 'Backspace') {
        return;
    }

    if (e.key === 'Enter') {
        if (e.shiftKey) {
            e.preventDefault();
            triggerProcess('AUTHENTICATING...', 'granted');
            return;
        }
        if (e.ctrlKey) {
            e.preventDefault();
            triggerProcess('ENCRYPTING...', 'denied');
            return;
        }
    }

    if (e.key === 'Escape') {
        hidePopups();
        return;
    }

    if (['Shift', 'Control', 'Meta', 'Tab', 'Alt', 'CapsLock'].includes(e.key)) {
        return;
    }

    typeCode();
});

document.addEventListener(
    'touchstart',
    (e) => {
        if (soundManager.context.state === 'suspended') {
            soundManager.context.resume();
        }
        if (isChromeUiTarget(e.target)) {
            return;
        }
        if (!terminal.contains(e.target)) {
            e.preventDefault();
        }
        typeCode();
    },
    { passive: false }
);

document.addEventListener('click', (e) => {
    if (soundManager.context.state === 'suspended') {
        soundManager.context.resume();
    }
    if (isChromeUiTarget(e.target)) {
        return;
    }
    typeCode();
});

loadPreferences();
