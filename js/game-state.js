import { LEVEL_MAPS } from './levels.js';
const kontra = window.kontra;

export function createGameState() {
  return {
    currentLevelIndex: 0,
    gameState: "menu", // menu, memorize, play, victory
    stateTimer: 3.0,
    totalPlayTime: 0.0,
    platforms: [],
    spikes: [],
    stars: []
  };
}

export function loadLevel(state, player, gameX, gameWidth, canvas) {
  if (state.currentLevelIndex >= LEVEL_MAPS.length) {
    state.gameState = "victory";
    return;
  }
  
  state.gameState = "memorize";
  state.stateTimer = 3.0;
  state.platforms = [];
  state.spikes = [];
  state.stars = [];
  
  const currentLevel = LEVEL_MAPS[state.currentLevelIndex];
  
  // Set player position
  if (currentLevel.playerSpawn) {
    player.x = gameX + currentLevel.playerSpawn.x;
    player.y = currentLevel.playerSpawn.y;
  } else {
    player.x = gameX + 40;
    player.y = canvas.height - 120;
  }
  player.dy = 0;
  player.grounded = false;
  
  // Load platforms
  if (currentLevel.platforms) {
    currentLevel.platforms.forEach(p => {
      state.platforms.push(Sprite({
        x: gameX + p.x, y: p.y, width: p.w, height: p.h, color: "#64748b",
        render() { this.draw(); }
      }));
    });
  }
  
  // Load spikes
  if (currentLevel.spikes) {
    currentLevel.spikes.forEach(s => {
      state.spikes.push(Sprite({
        x: gameX + s.x, y: s.y, width: s.w, height: s.h, color: "#ef4444",
        render() { this.draw(); }
      }));
    });
  }
  
  // Load stars
  if (currentLevel.stars) {
    currentLevel.stars.forEach(s => {
      state.stars.push(Sprite({
        x: gameX + s.x, y: s.y, width: 20, height: 20, color: "gold", pickedUp: false,
        render() { if (!this.pickedUp) this.draw(); }
      }));
    });
  }
}

export function updateGameState(state, deltaTime, onLevelComplete, onDeath) {
  if (state.gameState === "memorize") {
    state.stateTimer -= deltaTime;
    if (state.stateTimer <= 0) {
      state.gameState = "play";
    }
  }
  
  if (state.gameState === "play") {
    state.totalPlayTime += deltaTime;
  }
  
  // Check if all stars collected (level complete)
  if (state.gameState === "play") {
    const allStarsCollected = state.stars.length > 0 && state.stars.every(star => star.pickedUp);
    if (allStarsCollected) {
      onLevelComplete();
    }
  }
}
