const yesBtn = document.getElementById('yes-btn');
const noBtn = document.getElementById('no-btn');
const fallingContainer = document.getElementById('falling-container');

// Game Elements
const gamePanel = document.getElementById('game-panel');
const pourBtn = document.getElementById('pour-btn');
const waterFill = document.getElementById('water-fill');
const targetLine = document.getElementById('target-line');
const targetLabel = document.getElementById('target-label');
const gameMessage = document.getElementById('game-message');
const contentWrapper = document.querySelector('.content-wrapper');
const waterJug = document.getElementById('water-jug');

// Trap Elements
const trapModal = document.getElementById('trap-modal');
const trapYesVal = document.getElementById('trap-yes-val');
const trapDiffGame = document.getElementById('trap-diff-game');

// Falling Flowers Effect
const symbols = ['🌸', '🌹', '🌺', '❤️', '💕', '✨'];
setInterval(() => {
    const el = document.createElement('div');
    el.classList.add('falling-item');
    el.textContent = symbols[Math.floor(Math.random() * symbols.length)];
    el.style.left = Math.random() * 100 + 'vw';
    el.style.fontSize = (Math.random() * 20 + 20) + 'px';
    el.style.animationDuration = (Math.random() * 5 + 5) + 's';
    fallingContainer.appendChild(el);
    setTimeout(() => el.remove(), 10000);
}, 300);

// Logic State
let noClickCount = 0;
const noTexts = [
    "No",
    "Are you sure?",
    "Very sure?",
    "Super sure???",
    "Okay..." // Triggers game
];

// No Button Interaction
noBtn.addEventListener('click', () => {
    noClickCount++;

    // Grow Yes Button
    const yesScale = 1 + (noClickCount * 0.2);
    yesBtn.style.transform = `scale(${yesScale})`;

    // Shrink No Button
    const noScale = 1 - (noClickCount * 0.1);
    noBtn.style.transform = `scale(${Math.max(0.5, noScale)})`; // Cap minimum size

    if (noClickCount < 4) {
        noBtn.textContent = noTexts[noClickCount];
    } else {
        startGame();
    }
});


// --- Water Game Logic ---
let isPouring = false;
let waterLevel = 0;
let targetLevel = 0;
let pourInterval;
let attempts = 0;

function startGame() {
    gamePanel.classList.remove('hidden');
    contentWrapper.style.filter = "blur(5px)";
    resetRound();
}

function resetRound() {
    targetLevel = Math.floor(Math.random() * 30) + 60; // 60-90%
    targetLine.style.bottom = targetLevel + '%';
    targetLabel.textContent = `Target: Fill to ${targetLevel}%`;
    waterLevel = 0;
    waterFill.style.height = '0%';
    gameMessage.textContent = "";
    gameMessage.style.color = "#333";
    waterJug.classList.remove('pouring');
}

pourBtn.addEventListener('mousedown', startPouring);
pourBtn.addEventListener('touchstart', (e) => { e.preventDefault(); startPouring(); });

pourBtn.addEventListener('mouseup', stopPouring);
pourBtn.addEventListener('touchend', stopPouring);
pourBtn.addEventListener('mouseleave', stopPouring);

function startPouring() {
    // Reset water to 0 if this is a fresh pour
    if (waterLevel >= 100 || waterLevel === 0) {
        waterLevel = 0;
        waterFill.style.height = '0%';
    }

    if (waterLevel >= 120) return; // Overflow protection
    isPouring = true;
    waterJug.classList.add('pouring');

    pourInterval = setInterval(() => {
        if (!isPouring) return;

        // Fast fill speed
        waterLevel += 1.5;

        waterFill.style.height = Math.min(100, waterLevel) + '%';
    }, 20);
}

function stopPouring() {
    if (!isPouring) return;
    isPouring = false;
    clearInterval(pourInterval);
    waterJug.classList.remove('pouring');

    checkResult();
}

function checkResult() {
    // RIGGED: 0 tolerance. Unless they hit EXACTLY float, which is nearly impossible.
    // We can also just force fail.
    const diff = Math.abs(waterLevel - targetLevel);

    // Always fail unless by miracle
    // Actually, let's make it 0.1 tolerance to be "fair" but effectively impossible
    if (diff < 0.1) {
        // Miracle win code (Unlikely)
        gameMessage.textContent = "Okay... you win.";
        setTimeout(triggerYes, 1000);
        return;
    }

    // FAIL
    attempts++;
    gameMessage.textContent = `Oops! (${Math.floor(waterLevel)}%). Try again!`;
    gameMessage.style.color = "red";

    if (attempts >= 3) {
        setTimeout(() => {
            gamePanel.classList.add('hidden');
            trapModal.classList.remove('hidden');
        }, 1000);
    } else {
        setTimeout(resetRound, 1500);
    }
}

// --- Trap Logic ---

// 1. Success Option
yesBtn.addEventListener('click', triggerYes);
trapYesVal.addEventListener('click', triggerYes);

// 2. Impossible Option (Simple Always-Away)
let isActive = false;

trapDiffGame.addEventListener('mouseenter', () => {
    if (!isActive) {
        const rect = trapDiffGame.getBoundingClientRect();
        trapDiffGame.style.position = 'fixed';
        trapDiffGame.style.left = rect.left + 'px';
        trapDiffGame.style.top = rect.top + 'px';
        trapDiffGame.style.width = rect.width + 'px';
        trapDiffGame.style.zIndex = '1000';
        trapDiffGame.style.transition = 'left 0.3s ease-out, top 0.3s ease-out';
        isActive = true;
    }
    moveAway();
});

document.addEventListener('mousemove', (e) => {
    if (isActive) {
        moveAway();
    }
});

function moveAway() {
    const rect = trapDiffGame.getBoundingClientRect();
    const btnCenterX = rect.left + rect.width / 2;
    const btnCenterY = rect.top + rect.height / 2;

    // Get mouse position from last event
    const mouseX = lastMouseX;
    const mouseY = lastMouseY;

    // Distance check
    const dx = btnCenterX - mouseX;
    const dy = btnCenterY - mouseY;
    const distance = Math.sqrt(dx * dx + dy * dy);

    // Only move if mouse is getting close (within 150px)
    if (distance < 150) {
        const padding = 50;
        const maxX = window.innerWidth - rect.width - padding;
        const maxY = window.innerHeight - rect.height - padding;

        // Simple: go to opposite side of screen from mouse
        let newLeft = window.innerWidth - mouseX - rect.width / 2;
        let newTop = window.innerHeight - mouseY - rect.height / 2;

        // Clamp to screen
        newLeft = Math.max(padding, Math.min(maxX, newLeft));
        newTop = Math.max(padding, Math.min(maxY, newTop));

        trapDiffGame.style.left = newLeft + 'px';
        trapDiffGame.style.top = newTop + 'px';
    }
}

let lastMouseX = 0;
let lastMouseY = 0;
document.addEventListener('mousemove', (e) => {
    lastMouseX = e.clientX;
    lastMouseY = e.clientY;
});

function triggerYes() {
    // Hide all overlays
    gamePanel.classList.add('hidden');
    trapModal.classList.add('hidden');
    contentWrapper.style.filter = "none";

    document.querySelector('.content-wrapper').innerHTML = `
        <h1 style="font-size: 6rem; animation: popIn 0.5s cubic-bezier(0.175, 0.885, 0.32, 1.275);">YES! ❤️</h1>
        <p style="font-size: 2rem; color: #5d2e42;">Best decision ever!</p>
        <p style="font-size: 1.5rem; color: #5d2e42; margin-top: 10px;">never doubted you would choose another option</p>
    `;

    // Intense Confetti
    const end = Date.now() + 5000;
    (function frame() {
        confetti({
            particleCount: 7,
            angle: 60,
            spread: 55,
            origin: { x: 0 },
            colors: ['#d45079', '#eebec2']
        });
        confetti({
            particleCount: 7,
            angle: 120,
            spread: 55,
            origin: { x: 1 },
            colors: ['#d45079', '#eebec2']
        });
        if (Date.now() < end) requestAnimationFrame(frame);
    }());
}
