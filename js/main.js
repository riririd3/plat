// js/main.js
import { waitForKontra, setKontra, getKontra } from './globals.js';
import { createGameState, loadLevel, updateGameState } from './game-state.js';
import { createPlayer, updatePlayerGround } from './player.js';
import { handlePlatformCollision, checkSpikeCollision, checkStarCollection } from './collisions.js';
import { setupRendering } from './rendering.js';
import { setupTouchControls } from './ui-controls.js';

// Wait for kontra
await waitForKontra();
const kontra = getKontra();
setKontra(kontra); // Make sure it's set globally

// Constants
const BASE_WIDTH = 960;
const BASE_HEIGHT = 540;
const LEFT_UI = () => 160;
const RIGHT_UI = () => 160;
const GAME_X = () => LEFT_UI();
const GAME_WIDTH = () => canvas.width - LEFT_UI() - RIGHT_UI();

// Initialize kontra
let { canvas, context } = kontra.init("game");
kontra.initKeys();

// Make canvas globally available for other modules
window.canvas = canvas;
window.context = context;

// Resize handling
function resizeGame() {
    const scale = Math.min(window.innerWidth / BASE_WIDTH, window.innerHeight / BASE_HEIGHT);
    canvas.width = BASE_WIDTH;
    canvas.height = BASE_HEIGHT;
    canvas.style.width = BASE_WIDTH * scale + "px";
    canvas.style.height = BASE_HEIGHT * scale + "px";
    canvas.style.position = "absolute";
    canvas.style.left = (window.innerWidth - BASE_WIDTH * scale) / 2 + "px";
    canvas.style.top = (window.innerHeight - BASE_HEIGHT * scale) / 2 + "px";
    canvas.style.imageRendering = "pixelated";
}
resizeGame();
window.addEventListener("resize", resizeGame);

// Helper to get bounds
function getGameBounds() {
    return {
        leftUI: LEFT_UI,
        rightUI: RIGHT_UI,
        gameX: GAME_X(),
        gameWidth: GAME_WIDTH(),
        canvasWidth: canvas.width,
        canvasHeight: canvas.height
    };
}

// Create game state
const gameState = createGameState();
const gameStateRef = { current: gameState.gameState };

// Touch reference
const touchRef = { current: { left: false, right: false, jump: false } };

// Create player
const player = createPlayer(gameStateRef, touchRef, kontra.keyPressed, getGameBounds, kontra);

// Setup touch controls
const { touch, resetTouch } = setupTouchControls(
    canvas, getGameBounds,
    () => {
        // Restart current level
        loadLevel(gameState, player, GAME_X(), GAME_WIDTH(), canvas, kontra);
    },
    () => {
        // Start new game
        gameState.currentLevelIndex = 0;
        gameState.totalPlayTime = 0;
        gameState.gameState = "menu";
        loadLevel(gameState, player, GAME_X(), GAME_WIDTH(), canvas, kontra);
    },
    async () => {
        if (!document.fullscreenElement) {
            await document.documentElement.requestFullscreen();
        } else {
            await document.exitFullscreen();
        }
    },
    gameStateRef
);

// Update touch references
touchRef.current = touch;

// Setup rendering
const renderer = setupRendering(canvas, context);

// Initial level load
console.log("Loading initial level...");
loadLevel(gameState, player, GAME_X(), GAME_WIDTH(), canvas, kontra);

// Game loop
let loop = kontra.GameLoop({
    update(dt) {
        if (gameState.gameState === "menu" || gameState.gameState === "victory") return;
        
        // Update game state
        updateGameState(gameState, 1/60,
            () => { // Level complete
                gameState.currentLevelIndex++;
                loadLevel(gameState, player, GAME_X(), GAME_WIDTH(), canvas, kontra);
            },
            () => { // Death
                loadLevel(gameState, player, GAME_X(), GAME_WIDTH(), canvas, kontra);
            }
        );
        
        // Update player
        player.update();
        updatePlayerGround(player, canvas);
        
        // Platform collisions
        for (let platform of gameState.platforms) {
            handlePlatformCollision(player, platform);
        }
        
        // Spike collisions
        checkSpikeCollision(player, gameState.spikes, () => {
            loadLevel(gameState, player, GAME_X(), GAME_WIDTH(), canvas, kontra);
        });
        
        // Star collection
        checkStarCollection(gameState.stars, player, () => {
            gameState.currentLevelIndex++;
            loadLevel(gameState, player, GAME_X(), GAME_WIDTH(), canvas, kontra);
        });
    },
    
    render() {
        context.clearRect(0, 0, canvas.width, canvas.height);
        
        const { gameX, gameWidth, leftUI, rightUI } = getGameBounds();
        
        // Background
        renderer.drawGameArea(gameX, gameWidth, canvas.height);
        renderer.drawGround(gameX, gameWidth, canvas.height);
        
        // Game objects
        gameState.platforms.forEach(p => p.render());
        gameState.spikes.forEach(s => s.render());
        gameState.stars.forEach(star => star.render());
        
        // Fog
        renderer.drawFog(gameX, gameWidth, canvas.height, player);
        
        // Player
        if (gameState.gameState !== "menu" && gameState.gameState !== "victory") {
            player.render();
        }
        
        // UI
        renderer.drawControlsBackground(leftUI, rightUI, canvas.width, canvas.height);
        if (gameState.gameState !== "menu" && gameState.gameState !== "victory") {
            renderer.drawDpad(leftUI, canvas.height, touch);
            renderer.drawJumpButton(canvas.width, rightUI, canvas.height, touch);
            renderer.drawRestartButton(canvas.width, rightUI);
        }
        
        // HUD
        renderer.drawUI(leftUI, canvas.height, gameState.currentLevelIndex, 
                       gameState.totalPlayTime, gameState.gameState, gameState.stateTimer,
                       gameX, gameWidth);
        
        // Menu or victory screen
        if (gameState.gameState === "menu") {
            renderer.drawMenuScreen(gameX, gameWidth, canvas.height);
            renderer.drawMenuButtons(gameX, gameWidth, canvas.height, gameState.gameState);
        } else if (gameState.gameState === "victory") {
            renderer.drawVictoryScreen(gameX, gameWidth, canvas.height, gameState.totalPlayTime);
            renderer.drawMenuButtons(gameX, gameWidth, canvas.height, gameState.gameState);
        }
    }
});

console.log("Starting game loop...");
loop.start();
