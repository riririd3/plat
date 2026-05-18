window.currentLevelIndex = 0;
let platforms = [];
let spikes = [];
let stars = [];

window.loadLevel = function(index) {
  if (index >= LEVEL_MAPS.length) {
    window.gameState = "victory";
    return;
  }

  window.gameState = "memorize";
  window.stateTimer = 3.0;

  resetTouch();
  platforms = [];
  spikes = [];
  stars = [];

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

  // Load Platforms
  if (currentLevel.platforms) {
    currentLevel.platforms.forEach(p => {
      platforms.push(Sprite({
        x: GAME_X() + p.x, y: p.y, width: p.w, height: p.h, color: "#64748b",
        render() { this.draw(); }
      }));
    });
  }

  // Load Spikes
  if (currentLevel.spikes) {
    currentLevel.spikes.forEach(s => {
      spikes.push(Sprite({
        x: GAME_X() + s.x, 
        y: s.y, 
        width: s.w,
        height: s.h,
        color: "#ef4444",
        render() { this.draw(); }
      }));
    });
  }

  // Load Stars
  if (currentLevel.stars && currentLevel.stars.length > 0) {
    const s = currentLevel.stars[0];
    stars.push(Sprite({
      x: GAME_X() + s.x,
      y: s.y,
      width: 20,
      height: 20,
      color: "gold",
      pickedUp: false,
      render() { if (!this.pickedUp) this.draw(); }
    }));
  }
};
