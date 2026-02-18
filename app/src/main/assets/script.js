const screens = { home: document.getElementById('home-screen'), countdown: document.getElementById('countdown-screen'), play: document.getElementById('play-screen'), result: document.getElementById('result-screen') };
const modals = { stats: document.getElementById('stats-modal'), history: document.getElementById('history-modal') };
const ui = {
    startBtn: document.getElementById('start-btn'), playArea: document.getElementById('tap-area'),
    playAgainBtn: document.getElementById('play-again-btn'), homeBtn: document.getElementById('home-btn'),
    countdownText: document.getElementById('countdown-text'), resultMessage: document.getElementById('result-message'),
    reactionTimeDisplay: document.getElementById('reaction-time-display'), playScreenBg: document.getElementById('play-screen'),
    diffSelect: document.getElementById('difficulty'), rankBadge: document.getElementById('rank-badge')
};

let gameState = 'IDLE'; let timeoutId; let startTime;

// Advanced Data Structure Upgrade
let db = JSON.parse(localStorage.getItem('novah_reaction_db')) || {
    history: [], streak: 0, bestStreak: 0, tooEarly: 0, totalGames: 0
};
// Migrate old users to new database
if (Array.isArray(JSON.parse(localStorage.getItem('novah_reaction_data')))) {
    localStorage.removeItem('novah_reaction_data'); // Clear old format
}

function saveDB() { localStorage.setItem('novah_reaction_db', JSON.stringify(db)); }

function vibrate(ms) {
    if ("vibrate" in navigator) navigator.vibrate(ms);
}

function getRank(time) {
    if (time <= 180) return "⚡ LIGHTNING FAST";
    if (time <= 250) return "🚀 FAST";
    if (time <= 350) return "⏱️ AVERAGE";
    return "🐢 SLOW";
}

function updateStatsUI() {
    const times = db.history.map(h => h.time);
    
    document.getElementById('s-best').innerText = times.length ? Math.min(...times) + ' ms' : '-';
    document.getElementById('s-worst').innerText = times.length ? Math.max(...times) + ' ms' : '-';
    document.getElementById('s-avg').innerText = times.length ? Math.round(times.reduce((a, b) => a + b, 0) / times.length) + ' ms' : '-';
    
    const last5 = times.slice(-5);
    document.getElementById('s-last5').innerText = last5.length ? Math.round(last5.reduce((a, b) => a + b, 0) / last5.length) + ' ms' : '-';
    
    document.getElementById('s-streak').innerText = db.streak;
    document.getElementById('s-best-streak').innerText = db.bestStreak;
    document.getElementById('s-total').innerText = db.totalGames;
    document.getElementById('s-early').innerText = db.tooEarly;

    // Build History List
    const historyList = document.getElementById('history-list');
    historyList.innerHTML = db.history.slice().reverse().map(item => `
        <div class="history-item">
            <div class="time">${item.time} ms</div>
            <div class="details">${item.rank}<br>${item.diff} • ${item.date}</div>
        </div>
    `).join('');
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
    vibrate(50);
    
    const countInterval = setInterval(() => {
        count--;
        if (count > 0) {
            ui.countdownText.innerText = count;
            vibrate(50);
        } else {
            clearInterval(countInterval);
            vibrate([50, 50, 50]); // Triple buzz for start
            startWaitingPhase();
        }
    }, 1000);
}

function startWaitingPhase() {
    switchScreen('play');
    gameState = 'WAITING';
    ui.playScreenBg.className = 'screen active clay-red'; 
    
    // Difficulty logic
    const diff = ui.diffSelect.value;
    let minD = 2000, maxD = 5000;
    if (diff === 'easy') { minD = 1000; maxD = 3000; }
    if (diff === 'hard') { minD = 3000; maxD = 8000; }
    
    const randomDelay = Math.floor(Math.random() * (maxD - minD)) + minD;
    
    timeoutId = setTimeout(() => {
        gameState = 'READY';
        ui.playScreenBg.className = 'screen active clay-green'; 
        startTime = Date.now();
    }, randomDelay);
}

function handleTap() {
    if (gameState === 'WAITING') {
        clearTimeout(timeoutId);
        db.tooEarly++;
        db.streak = 0; // Break streak
        db.totalGames++;
        saveDB();
        vibrate([200, 100, 200]); // Angry vibrate
        showResult("TOO EARLY", "You tapped on red.", "❌ FAILED");
    } else if (gameState === 'READY') {
        const reactionTime = Date.now() - startTime;
        const rank = getRank(reactionTime);
        
        db.streak++;
        if (db.streak > db.bestStreak) db.bestStreak = db.streak;
        db.totalGames++;
        
        const dateStr = new Date().toLocaleDateString('en-US', { month: 'short', day: 'numeric', hour: '2-digit', minute:'2-digit' });
        db.history.push({ time: reactionTime, rank: rank, diff: ui.diffSelect.value.toUpperCase(), date: dateStr });
        
        saveDB();
        vibrate(100); // Success vibrate
        showResult(`${reactionTime} ms`, "Great job!", rank);
    }
}

function showResult(main, sub, rankText) {
    gameState = 'IDLE';
    ui.resultMessage.innerText = main;
    ui.reactionTimeDisplay.innerText = sub;
    ui.rankBadge.innerText = rankText;
    ui.playScreenBg.className = 'screen';
    switchScreen('result');
}

// Listeners
ui.startBtn.addEventListener('click', startGame);
ui.playAgainBtn.addEventListener('click', startGame);
ui.homeBtn.addEventListener('click', () => switchScreen('home'));
ui.playArea.addEventListener('mousedown', handleTap);
ui.playArea.addEventListener('touchstart', (e) => { e.preventDefault(); handleTap(); });

// Modals
document.getElementById('show-stats-btn').addEventListener('click', () => { updateStatsUI(); modals.stats.classList.add('active'); });
document.getElementById('show-history-btn').addEventListener('click', () => { updateStatsUI(); modals.history.classList.add('active'); });
document.getElementById('close-stats').addEventListener('click', () => modals.stats.classList.remove('active'));
document.getElementById('close-history').addEventListener('click', () => modals.history.classList.remove('active'));

document.getElementById('reset-btn').addEventListener('click', () => {
    if(confirm("Are you sure you want to delete all stats?")) {
        db = { history: [], streak: 0, bestStreak: 0, tooEarly: 0, totalGames: 0 };
        saveDB(); updateStatsUI();
    }
});

updateStatsUI();
