import { init, initKeys, keyPressed, GameLoop } from '../lib/kontra.min.js';
import { createGameState, loadLevel, updateGameState } from './game-state.js';
import { createPlayer, updatePlayerGround } from './player.js';
import { handlePlatformCollision, checkSpikeCollision, checkStarCollection } from './collision.js';
import { setupRendering } from './rendering.js';
import { setupTouchControls } from './ui-controls.js';

// Constants
const BASE_WIDTH = 960;
const BASE_HEIGHT = 540;
const LEFT_UI = () => 160;
const RIGHT_UI = () => 160;
const GAME_X = () => LEFT_UI();
const GAME_WIDTH = () => canvas.width - LEFT_UI() - RIGHT_UI();

// Initialize kontra
let { canvas, context } = init("game");
initKeys();

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

// Create player
const player = createPlayer(gameStateRef, { current: null }, keyPressed, getGameBounds);

// Setup touch controls
const { touch, resetTouch } = setupTouchControls(
  canvas, getGameBounds,
  () => loadLevel(gameState, player, GAME_X(), GAME_WIDTH(), canvas), // restart
  () => {
    gameState.currentLevelIndex = 0;
    gameState.totalPlayTime = 0;
    loadLevel(gameState, player, GAME_X(), GAME_WIDTH(), canvas);
  }, // start game
  async () => {
    if (!document.fullscreenElement) {
      await document.documentElement.requestFullscreen();
    } else {
      await document.exitFullscreen();
    }
  }, // fullscreen
  gameStateRef
);

// Update touch reference
touch.current = touch;
gameStateRef.current = gameState.gameState;

// Setup rendering
const renderer = setupRendering(canvas, context);

// Initial level load
loadLevel(gameState, player, GAME_X(), GAME_WIDTH(), canvas);

// Game loop
let loop = GameLoop({
  update(dt) {
    if (gameState.gameState === "menu" || gameState.gameState === "victory") return;
    
    // Update game state
    updateGameState(gameState, 1/60,
      () => { // Level complete
        gameState.currentLevelIndex++;
        loadLevel(gameState, player, GAME_X(), GAME_WIDTH(), canvas);
      },
      () => { // Death
        loadLevel(gameState, player, GAME_X(), GAME_WIDTH(), canvas);
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
      loadLevel(gameState, player, GAME_X(), GAME_WIDTH(), canvas);
    });
    
    // Star collection
    checkStarCollection(gameState.stars, player, () => {
      gameState.currentLevelIndex++;
      loadLevel(gameState, player, GAME_X(), GAME_WIDTH(), canvas);
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

loop.start();
