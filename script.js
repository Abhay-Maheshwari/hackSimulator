// Configuration
const CHARS_PER_KEYPRESS = 1;
const SCROLL_SPEED = 100;

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

// Sound Manager using Web Audio API
class SoundManager {
    constructor() {
        this.context = new (window.AudioContext || window.webkitAudioContext)();
        this.masterGain = this.context.createGain();
        this.masterGain.gain.value = 1; // Volume control
        this.masterGain.connect(this.context.destination);
    }

    playTone(freq, type, duration) {
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
        // Short, high-pitched click
        this.playTone(800 + Math.random() * 200, 'square', 0.05);
    }

    playAccessGranted() {
        // Success chime (major triad arpeggio)
        this.playTone(440, 'sine', 0.2); // A4
        setTimeout(() => this.playTone(554, 'sine', 0.2), 100); // C#5
        setTimeout(() => this.playTone(659, 'sine', 0.4), 200); // E5
    }

    playAccessDenied() {
        // Error buzzer (low saw waves)
        this.playTone(150, 'sawtooth', 0.3);
        setTimeout(() => this.playTone(100, 'sawtooth', 0.4), 150);
    }
}

const soundManager = new SoundManager();

// Main Typing Logic
function typeCode() {
    const chunkSize = CHARS_PER_KEYPRESS;
    const nextChunk = codeData.substring(codeIndex, codeIndex + chunkSize);

    if (nextChunk) {
        codeOutput.textContent += nextChunk;
        codeIndex += chunkSize;

        // Loop code if we reach the end
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

themeBtns.forEach(btn => {
    btn.addEventListener('click', (e) => {
        e.stopPropagation();
        const theme = btn.dataset.setTheme;
        if (theme === 'green') {
            document.body.removeAttribute('data-theme');
        } else {
            document.body.setAttribute('data-theme', theme);
        }
        soundManager.playTypingSound();
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
    if (autoTypingInterval) clearInterval(autoTypingInterval);
    const speed = 51 - speedSlider.value; // Invert: higher value = faster (lower interval)
    autoTypingInterval = setInterval(() => {
        typeCode();
    }, speed * 5); // Scale factor
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
        if (autoTypingInterval) {
            startAutoHack(); // Restart with new speed
        }
    });
    // Prevent typing when dragging slider
    speedSlider.addEventListener('click', (e) => e.stopPropagation());
    speedSlider.addEventListener('mousedown', (e) => e.stopPropagation());
    speedSlider.addEventListener('touchstart', (e) => e.stopPropagation());
}

// Code Selection Logic
const codeSelect = document.getElementById('code-select');
if (codeSelect) {
    codeSelect.addEventListener('change', (e) => {
        e.stopPropagation();
        const selected = e.target.value;
        if (selected === 'kernel') {
            codeData = kernelCode;
        } else if (selected === 'html') {
            codeData = htmlCode;
        } else if (selected === 'matrix') {
            codeData = matrixCode;
        }
        codeIndex = 0; // Reset typing
        codeOutput.textContent += "\n--- SYSTEM SWITCH ---\n";
    });
    // Prevent typing when clicking select
    codeSelect.addEventListener('click', (e) => e.stopPropagation());
    codeSelect.addEventListener('mousedown', (e) => e.stopPropagation());
}

// Fullscreen Logic
if (fullscreenBtn) {
    fullscreenBtn.addEventListener('click', (e) => {
        e.stopPropagation();
        if (!document.fullscreenElement) {
            document.documentElement.requestFullscreen();
        } else {
            if (document.exitFullscreen) {
                document.exitFullscreen();
            }
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
        terminal.scrollTop = terminal.scrollHeight; // Scroll back to bottom
    }
}

function executeCommand(cmd) {
    const parts = cmd.trim().split(' ');
    const command = parts[0].toLowerCase();
    const args = parts.slice(1);

    codeOutput.textContent += `\n> ${cmd}\n`;

    switch (command) {
        case '/help':
            codeOutput.textContent += "Available commands:\n  /help - Show this help\n  /clear - Clear terminal\n  /theme [green|amber|matrix|cyberpunk] - Set theme\n  /speed [1-50] - Set auto-type speed\n";
            break;
        case '/clear':
            codeOutput.textContent = "";
            codeIndex = 0;
            break;
        case '/theme':
            if (args.length > 0) {
                const theme = args[0];
                if (['green', 'amber', 'matrix', 'cyberpunk'].includes(theme)) {
                    if (theme === 'green') {
                        document.body.removeAttribute('data-theme');
                    } else {
                        document.body.setAttribute('data-theme', theme);
                    }
                    codeOutput.textContent += `Theme set to ${theme}\n`;
                } else {
                    codeOutput.textContent += `Unknown theme: ${theme}\n`;
                }
            } else {
                codeOutput.textContent += "Usage: /theme [green|amber|matrix|cyberpunk]\n";
            }
            break;
        case '/speed':
            if (args.length > 0) {
                const speed = parseInt(args[0]);
                if (speed >= 1 && speed <= 50) {
                    speedSlider.value = speed;
                    if (autoTypingInterval) startAutoHack();
                    codeOutput.textContent += `Speed set to ${speed}\n`;
                } else {
                    codeOutput.textContent += "Speed must be between 1 and 50\n";
                }
            } else {
                codeOutput.textContent += "Usage: /speed [1-50]\n";
            }
            break;
        default:
            codeOutput.textContent += `Unknown command: ${command}\n`;
    }
    scrollToBottom();
    toggleCommandLine();
}

if (cmdInput) {
    cmdInput.addEventListener('keydown', (e) => {
        e.stopPropagation(); // Prevent main typing
        if (e.key === 'Enter') {
            executeCommand(cmdInput.value);
        }
        if (e.key === 'Escape') {
            toggleCommandLine();
        }
    });
}

// Event Listeners
document.addEventListener('keydown', (e) => {
    if (soundManager.context.state === 'suspended') {
        soundManager.context.resume();
    }

    // Toggle Command Line with Tilde (~) or Backtick (`)
    if (e.key === '`' || e.key === '~') {
        e.preventDefault();
        toggleCommandLine();
        return;
    }

    // If command line is open, don't type code
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

document.addEventListener('touchstart', (e) => {
    if (soundManager.context.state === 'suspended') {
        soundManager.context.resume();
    }
    if (e.target !== terminal) {
        // Allow clicking buttons without typing
        if (e.target.tagName === 'BUTTON' || e.target.closest('#settings-panel')) {
            return;
        }
        e.preventDefault();
    }
    typeCode();
}, { passive: false });

document.addEventListener('click', (e) => {
    if (soundManager.context.state === 'suspended') {
        soundManager.context.resume();
    }
    // Don't type if clicking UI elements
    if (e.target.tagName === 'BUTTON' || e.target.closest('#settings-panel')) {
        return;
    }
    typeCode();
});

window.onload = () => {
    // Initial setup if needed
};
