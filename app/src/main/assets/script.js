// Connect HTML elements
const screens = {
    home: document.getElementById('home-screen'),
    countdown: document.getElementById('countdown-screen'),
    play: document.getElementById('play-screen'),
    result: document.getElementById('result-screen')
};

const ui = {
    startBtn: document.getElementById('start-btn'),
    playArea: document.getElementById('tap-area'),
    playAgainBtn: document.getElementById('play-again-btn'),
    resetBtn: document.getElementById('reset-btn'),
    countdownText: document.getElementById('countdown-text'),
    resultMessage: document.getElementById('result-message'),
    reactionTimeDisplay: document.getElementById('reaction-time-display'),
    avgTimeText: document.getElementById('avg-time'),
    bestTimeText: document.getElementById('best-time'),
    playScreenBg: document.getElementById('play-screen')
};

// Game Variables
let gameState = 'IDLE'; // States: IDLE, COUNTDOWN, WAITING, READY
let timeoutId;
let startTime;

// Load average history from Android's local storage
let history = JSON.parse(localStorage.getItem('novah_reaction_data')) || [];

function updateStats() {
    if (history.length === 0) {
        ui.avgTimeText.innerText = '--';
        ui.bestTimeText.innerText = '--';
        return;
    }
    // Calculate Average
    const sum = history.reduce((a, b) => a + b, 0);
    const avg = Math.round(sum / history.length);
    // Find Best
    const best = Math.min(...history);
    
    ui.avgTimeText.innerText = avg;
    ui.bestTimeText.innerText = best;
}

function switchScreen(screenName) {
    Object.values(screens).forEach(s => s.classList.remove('active'));
    screens[screenName].classList.add('active');
}

function startGame() {
    switchScreen('countdown');
    gameState = 'COUNTDOWN';
    let count = 3;
    ui.countdownText.innerText = count;
    
    // 3 Second Countdown Logic
    const countInterval = setInterval(() => {
        count--;
        if (count > 0) {
            ui.countdownText.innerText = count;
        } else {
            clearInterval(countInterval);
            startWaitingPhase();
        }
    }, 1000);
}

function startWaitingPhase() {
    switchScreen('play');
    gameState = 'WAITING';
    
    // Apply Claymorphism RED
    ui.playScreenBg.className = 'screen active clay-red'; 
    
    // Random delay between 2 and 6 seconds
    const randomDelay = Math.floor(Math.random() * 4000) + 2000;
    
    timeoutId = setTimeout(() => {
        gameState = 'READY';
        // Apply Claymorphism GREEN
        ui.playScreenBg.className = 'screen active clay-green'; 
        startTime = Date.now();
    }, randomDelay);
}

function handleTap() {
    if (gameState === 'WAITING') {
        // Tapped while screen was still Red
        clearTimeout(timeoutId);
        showResult("Too early!", "You tapped on the red screen.");
    } else if (gameState === 'READY') {
        // Tapped when screen was Green
        const reactionTime = Date.now() - startTime;
        
        // Save to local storage for averages
        history.push(reactionTime);
        localStorage.setItem('novah_reaction_data', JSON.stringify(history));
        updateStats();
        
        showResult(`${reactionTime} ms`, "Excellent timing!");
    }
}

function showResult(mainText, subText) {
    gameState = 'IDLE';
    ui.resultMessage.innerText = mainText;
    ui.reactionTimeDisplay.innerText = subText;
    ui.playScreenBg.className = 'screen'; // Strip clay colors
    switchScreen('result');
}

// Event Listeners
ui.startBtn.addEventListener('click', startGame);
ui.playAgainBtn.addEventListener('click', () => switchScreen('home'));

// Support both mouse clicks and mobile taps
ui.playArea.addEventListener('mousedown', handleTap);
ui.playArea.addEventListener('touchstart', (e) => {
    e.preventDefault(); // Prevents double-triggering on Android
    handleTap();
});

// Reset Button
ui.resetBtn.addEventListener('click', () => {
    history = [];
    localStorage.removeItem('novah_reaction_data');
    updateStats();
});

// Initialize stats on app launch
updateStats();
