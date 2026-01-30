const canvas = document.getElementById('gameCanvas');
const ctx = canvas.getContext('2d');

const GAMEESTATES = {
    MENU: 'MENU',
    PLAYING: 'PLAYING',
    PAUSED: 'PAUSED',
    GAMEOVER: 'GAMEOVER'
};

const ASSETS = {
    player: 'Sprites/frog.png',
};

const PLAYERSTATES = {
    IDLE: 'IDLE',
    EXTENDING: 'EXTENDING',
    RETRACTING: 'RETRACTING',
    DEATH: 'DEATH'
};
let playerState = PLAYERSTATES.IDLE;

// Player Object
const player = {
    x: 400,
    y: 350,
    size: 50,
    speed: 5
};

const tongue = {
    x: player.x + player.size / 2,
    y: player.y,
    color: 'pink',
    width: 5,
    length: 0,
    extendSpeed: 170,
    retractSpeed: 250,
    maxLength: 140
};

const images = {};
let loadedCount = 0;
const totalAssets = Object.keys(ASSETS).length;

function preloadAssets(callback) {
    for (let key in ASSETS) {
        const img = new Image();
        img.src = ASSETS[key];
        img.onload = () => {
            loadedCount++;
            images[key] = img; // Save to cache
            if (loadedCount === totalAssets) {
                callback(); // Start the game loop
            }
        };
    }
}

let currentState = GAMEESTATES.MENU;

let keys = {};

let lastTime = 0;

// Listen for keyboard input
window.addEventListener('keydown', e => keys[e.code] = true);
window.addEventListener('keyup', e => keys[e.code] = false);

function update() {
    if (keys['ArrowUp'])    player.y -= player.speed;
    if (keys['ArrowDown'])  player.y += player.speed;
    if (keys['ArrowLeft'])  player.x -= player.speed;
    if (keys['ArrowRight']) player.x += player.speed;

    // Simple Boundary Detection
    if (player.x < 0) player.x = 0;
    if (player.y < 0) player.y = 0;
    if (player.x + player.size > canvas.width) player.x = canvas.width - player.size;
    if (player.y + player.size > canvas.height) player.y = canvas.height - player.size;
}

function drawMenu() {
    ctx.clearRect(0, 0, canvas.width, canvas.height);

    ctx.fillStyle = 'black';
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    // Draw Title
    ctx.fillStyle = 'white';
    ctx.textAlign = "center";
    ctx.font = '48px Arial';
    ctx.fillText("Tongue Punch", canvas.width/2, canvas.height/2 - 50);

    // Draw Instructions
    ctx.fillStyle = 'white';
    ctx.textAlign = "center";
    ctx.font = '28px Arial';
    ctx.fillText("Press SPACE to Start", canvas.width/2, canvas.height/2+150);

    if (keys['Space']) {
        currentState = GAMEESTATES.PLAYING;
    }
}

function drawGameWorld() {
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    ctx.fillStyle = 'lightblue';
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    // Draw Player
    ctx.drawImage(images.player, player.x, player.y, player.size, player.size);

    //Draw Tongue
    ctx.fillStyle = tongue.color;
    ctx.fillRect(tongue.x, tongue.y - tongue.length, tongue.width, tongue.length);
}

function updatePhysics(deltaSeconds){
    updateTongue(deltaSeconds);
}

function updateTongue(deltaSeconds) {
        tongue.x = player.x + 23;
    tongue.y = player.y + 18;

    if (keys['Space'] && playerState === PLAYERSTATES.IDLE) {
        playerState = PLAYERSTATES.EXTENDING;
    }

    switch (playerState) {
        case PLAYERSTATES.EXTENDING:
            tongue.length += tongue.extendSpeed * deltaSeconds;
            if (tongue.length >= tongue.maxLength) {
                tongue.length = tongue.maxLength;
                playerState = PLAYERSTATES.RETRACTING;
            }
            break;
        case PLAYERSTATES.RETRACTING:
            tongue.length -= tongue.retractSpeed * deltaSeconds;
            if (tongue.length <= 0) {
                tongue.length = 0;
                playerState = PLAYERSTATES.IDLE;
            }
            break;
    }
}

preloadAssets(() => {
    console.log("All assets loaded!");
    gameLoop(); 
});

function gameLoop(timestamp) {
    if (!lastTime) {
        lastTime = timestamp;
    }

    const deltaSeconds = (timestamp - lastTime) / 1000;
    lastTime = timestamp;

    ctx.clearRect(0, 0, canvas.width, canvas.height);

    switch (currentState) {
        case GAMEESTATES.MENU:
            drawMenu();
            break;
            
        case GAMEESTATES.PLAYING:
            updatePhysics(deltaSeconds);
            //checkCollisions();
            drawGameWorld();
            break;

        case GAMEESTATES.PAUSED:
            drawGameWorld();
            drawPauseOverlay();
            break;

        case GAMEESTATES.GAMEOVER:
            drawGameOverScreen();
            break;
    }

    requestAnimationFrame(gameLoop);
}

gameLoop();