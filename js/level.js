// level.js
import { GAME_X, resetTouch } from './utils.js';
import { player } from './player.js';

export let currentLevelIndex = 0;
export let gameState = "menu";
export let stateTimer = 3.0;
export let totalPlayTime = 0.0;

export let platforms = [];
export let spikes = [];
export let stars = [];

export function setGameStateAndTimer(levelIdx, timeValue) {
  currentLevelIndex = levelIdx;
  totalPlayTime = timeValue;
}

export function updateTimers(dt) {
  totalPlayTime += dt;
  if (gameState === "memorize") {
    stateTimer -= dt;
    if (stateTimer <= 0) gameState = "play";
  }
}

export function incrementLevel() {
  currentLevelIndex++;
  loadLevel(currentLevelIndex);
}

export function loadLevel(index) {
  const canvas = document.getElementById("game");
  const context = canvas.getContext("2d");

  if (index >= LEVEL_MAPS.length) {
    gameState = "victory";
    return;
  }

  gameState = "memorize";
  stateTimer = 3.0;

  resetTouch();
  platforms.length = 0;
  spikes.length = 0;
  stars.length = 0;

  const currentLevel = LEVEL_MAPS[index];

  if (currentLevel.playerSpawn) {
    player.x = GAME_X() + currentLevel.playerSpawn.x;
    player.y = currentLevel.playerSpawn.y;
  } else {
    player.x = GAME_X() + 40;
    player.y = canvas.height - 120;
  }
  player.dy = 0;
  player.grounded = false;

  if (currentLevel.platforms) {
    currentLevel.platforms.forEach(p => {
      platforms.push(kontra.Sprite({
        x: GAME_X() + p.x, y: p.y, width: p.w, height: p.h, color: "#64748b",
        render() { this.draw(); }
      }));
    });
  }

  if (currentLevel.spikes) {
    currentLevel.spikes.forEach(s => {
      spikes.push(kontra.Sprite({
        x: GAME_X() + s.x, y: s.y, width: s.w, height: s.h, color: "#ef4444",
        render() { this.draw(); }
      }));
    });
  }

  if (currentLevel.stars && currentLevel.stars.length > 0) {
    const s = currentLevel.stars[0];
    stars.push(kontra.Sprite({
      x: GAME_X() + s.x, y: s.y, width: 20, height: 20, color: "gold", pickedUp: false,
      render() { if (!this.pickedUp) this.draw(); }
    }));
  }
}
