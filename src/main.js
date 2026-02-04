import {PLAYERSTATES, Tile, TileGrid, Frog, Tongue } from './GameObjects.js';
import { CollisionUtils } from './Collision.js';
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

let playerState = PLAYERSTATES.IDLE;

const player = new Frog(400, 350);

const tongue = new Tongue(player);

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
    // Placeholder for future updates
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

const tileGrid = new TileGrid(
    canvas.width / 4,  // startX
    0,                  // startY
    canvas.width / 2 / 30,  // cols
    canvas.height / 2 / 30, // rows
    30                  // tileSize
);

function drawGameWorld() {
    ctx.fillStyle = 'lightblue';
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    
    tileGrid.draw(ctx);
    player.draw(ctx, images);
    tongue.draw(ctx);
}

function updatePhysics(deltaSeconds) {
    player.update(deltaSeconds);
    tongue.update(deltaSeconds, keys['Space']);
}

function checkCollisions() {
    if(tongue.state !== PLAYERSTATES.EXTENDING || tongue.length <= 0) return;

    const tongueTip = tongue.rotatePoint(0, -tongue.length);
    const solidTiles = tileGrid.getSolidTiles();
    
    // Find the closest colliding SOLID tile
    let closestTile = null;
    let closestDist = Infinity;
    
    for (let tile of solidTiles) {
        // Double-check it's solid (getSolidTiles should handle this)
        if (tile.type !== 'solid') continue;
        
        if (CollisionUtils.checkAABB(tongue, tile)) {
            const tileCenterX = tile.x + tile.size / 2;
            const tileCenterY = tile.y + tile.size / 2;
            const dist = Math.hypot(tongueTip.x - tileCenterX, tongueTip.y - tileCenterY);
            if (dist < closestDist) {
                closestDist = dist;
                closestTile = tile;
            }
        }
    }
    
    if (closestTile) {
        tongue.onCollision(closestTile);
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

    //ctx.clearRect(0, 0, canvas.width, canvas.height);

    switch (currentState) {
        case GAMEESTATES.MENU:
            drawMenu();
            break;
            
        case GAMEESTATES.PLAYING:
            drawGameWorld();
            checkCollisions();
            updatePhysics(deltaSeconds);
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