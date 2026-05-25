const canvas = document.getElementById('gameCanvas');
const ctx = canvas.getContext('2d');

// UI-Elemente greifen
const overlay = document.getElementById('overlay');
const gameOverScreen = document.getElementById('game-over-screen');
const deathReasonText = document.getElementById('death-reason');
const scoreDisplay = document.getElementById('score');
const finalScoreDisplay = document.getElementById('final-score');

// Konstanten für das Gameplay
const BLOCK_HEIGHT = 30;
const CANVAS_WIDTH = 400;
const CANVAS_HEIGHT = 500;
const GROUND_Y = CANVAS_HEIGHT - 30;

// Spielvariablen
let score = 0;
let gameActive = false;
let cameraY = 0; // verschiebt Sichtfeld (flüssig) nach oben

// Die Seilwinde ganz oben
let crane = {
    x: 0,
    y: 40,
    width: 40,
    speed: 3,
    direction: 1
};

// Stein, der gerade gesteuert wird
let activeBlock = {
    x: 0,
    y: 0,
    width: 140,
    isDropping: false,
    dropSpeed: 10
};

// Array für alle festen Steine des Turms
let towerStack = [];

// Event-Listener für Klicks und Tasten
document.getElementById('start-btn').addEventListener('click', startGame);
document.getElementById('restart-btn').addEventListener('click', startGame);

window.addEventListener('keydown', (e) => {
    if (e.code === 'Space') {
        e.preventDefault(); // Verhindert Scrollen der Seite
        triggerDrop();
    }
});
canvas.addEventListener('click', triggerDrop);

function startGame() {
    score = 0;
    cameraY = 0;
    gameActive = true;
    
    // Erstes solides Fundament legen
    towerStack = [{
        x: (CANVAS_WIDTH - 150) / 2,
        width: 150,
        y: GROUND_Y - BLOCK_HEIGHT,
        color: '#4a4e51'
    }];
    
    activeBlock.width = 150;
    crane.speed = 3.5;
    
    scoreDisplay.innerText = score;
    overlay.classList.add('hidden');
    gameOverScreen.classList.add('hidden');
    
    prepareNextBlock();
    requestAnimationFrame(update);
}

function prepareNextBlock() {
    activeBlock.isDropping = false;
    activeBlock.y = crane.y + 10;
}

function triggerDrop() {
    if (!gameActive || activeBlock.isDropping) return;
    activeBlock.isDropping = true;
}

// Unendlicher Render-Loop des Canvas
function update() {
    if (!gameActive) return;

    // --- LOGIK & BEWEGUNG ---
    if (!activeBlock.isDropping) {
        // Kran pendelt hin und her
        crane.x += crane.speed * crane.direction;
        if (crane.x <= 0 || crane.x + crane.width >= CANVAS_WIDTH) {
            crane.direction *= -1;
        }
        // Block bleibt exakt zentriert unter der Winde hängen
        activeBlock.x = crane.x + (crane.width / 2) - (activeBlock.width / 2);
    } else {
        // Stein kommt nach unten
        activeBlock.y += activeBlock.dropSpeed;
        
        // Berechnen, auf welcher Höhe der Stein landen muss (abhängig von Turmhöhe und Kamera)
        let targetY = GROUND_Y - (towerStack.length * BLOCK_HEIGHT) + cameraY;
        
        if (activeBlock.y >= targetY) {
            activeBlock.y = targetY;
            handleLanding();
        }
    }

    // --- ZEICHNEN (RENDERING) ---
    ctx.clearRect(0, 0, CANVAS_WIDTH, CANVAS_HEIGHT);
    
    // Fundament am Boden zeichnen (wandert mit Kamera nach unten weg)
    ctx.fillStyle = '#5c4d3c';
    ctx.fillRect(0, GROUND_Y + cameraY, CANVAS_WIDTH, 40);
    ctx.fillStyle = '#c5a059';
    ctx.fillRect(0, GROUND_Y + cameraY, CANVAS_WIDTH, 4);

    // Bereits gebaute Turmschichten zeichnen
    towerStack.forEach((block) => {
        ctx.fillStyle = block.color;
        ctx.fillRect(block.x, block.y + cameraY, block.width, BLOCK_HEIGHT);
        ctx.strokeStyle = '#110f0d';
        ctx.lineWidth = 2;
        ctx.strokeRect(block.x, block.y + cameraY, block.width, BLOCK_HEIGHT);
    });

    // Der Ghostblock (Schattenlinie fürs Zielen)
    if (!activeBlock.isDropping) {
        let shadowY = GROUND_Y - (towerStack.length * BLOCK_HEIGHT) + cameraY;
        ctx.fillStyle = 'rgba(212, 175, 55, 0.12)';
        ctx.fillRect(activeBlock.x, shadowY, activeBlock.width, BLOCK_HEIGHT);
        ctx.strokeStyle = 'rgba(212, 175, 55, 0.3)';
        ctx.setLineDash([4, 4]);
        ctx.strokeRect(activeBlock.x, shadowY, activeBlock.width, BLOCK_HEIGHT);
        ctx.setLineDash([]); 
    }

    // Seilwinde zeichnen
    ctx.fillStyle = '#8b7355';
    ctx.fillRect(crane.x, crane.y, crane.width, 10);
    
    // Halteseil spannen
    ctx.strokeStyle = '#726555';
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.moveTo(crane.x + (crane.width / 2), crane.y + 10);
    ctx.lineTo(activeBlock.x + (activeBlock.width / 2), activeBlock.y);
    ctx.stroke();

    // Aktuell fallenden Stein zeichnen
    ctx.fillStyle = '#7d8a96';
    ctx.fillRect(activeBlock.x, activeBlock.y, activeBlock.width, BLOCK_HEIGHT);
    ctx.strokeStyle = '#3a444d';
    ctx.lineWidth = 2;
    ctx.strokeRect(activeBlock.x, activeBlock.y, activeBlock.width, BLOCK_HEIGHT);

    requestAnimationFrame(update);
}

function handleLanding() {
    const lowerBlock = towerStack[towerStack.length - 1];
    
    // Überhang berechnen (Wie weit steht der Block links oder rechts über)
    let leftCut = lowerBlock.x - activeBlock.x;
    let rightCut = (activeBlock.x + activeBlock.width) - (lowerBlock.x + lowerBlock.width);

    // SPIELER HAT KOMPLETT DANEBEN GEHAUEN, man
    if (activeBlock.x + activeBlock.width <= lowerBlock.x || activeBlock.x >= lowerBlock.x + lowerBlock.width) {
        endGame("Ihr habt den Festungsstein komplett ins Leere geworfen! Die Mauern kippten ungebremst in den Schlossgraben.");
        return;
    }

    // Stein beschneiden
    let newX = activeBlock.x;
    let newWidth = activeBlock.width;

    if (leftCut > 0) {
        newX = lowerBlock.x;
        newWidth -= leftCut;
    } else if (rightCut > 0) {
        newWidth -= rightCut;
    }

    // Neue Breite abspeichern
    activeBlock.width = newWidth;

    // FEHLERKONTROLLE: Wenn der Stein zu dünn wird, balanciert es nicht mehr
    if (activeBlock.width < 16) {
        endGame("Euer Turm wurde so schmal wie eine Lanzenspitze. Eine kleine Windböe stieß das Prachtwerk um!");
        return;
    }

    // Absolute Y-Koordinate berechnen (unabhängig von der Kamera-Verschiebung abspeichern)
    let savedY = GROUND_Y - ((towerStack.length + 1) * BLOCK_HEIGHT);
    
    // Abwechselnde Steinfarben für eine Art Mustereffekt
    let colorHex = score % 2 === 0 ? '#636e72' : '#b2bec3';

    // Fest in den Stack einbetten
    towerStack.push({
        x: newX,
        width: activeBlock.width,
        y: savedY,
        color: colorHex
    });

    score++;
    scoreDisplay.innerText = score;

    // KAMERA-SCHWENK: Sobald der Turm höher als 5 Schichten ist, wird das Bild (flüssig) hochgeschoben
    if (towerStack.length > 5) {
        cameraY += BLOCK_HEIGHT;
    }

    // Kran wird progressiv schneller
    crane.speed += 0.22;

    prepareNextBlock();
}

function endGame(reason) {
    gameActive = false;
    deathReasonText.innerText = reason;
    finalScoreDisplay.innerText = score;
    gameOverScreen.classList.remove('hidden');
}