const {
  init,
  GameLoop,
  Sprite,
  initKeys,
  keyPressed
} = kontra;

let { canvas, context } = init("game");
const BASE_WIDTH = 960;
const BASE_HEIGHT = 540;

// Make canvas and context global
window.canvas = canvas;
window.context = context;

initKeys();

// Global game state - make them window properties
window.gameState = "menu";
window.stateTimer = 3.0;
window.totalPlayTime = 0.0;

// Initialize
resizeGame();
window.addEventListener("resize", resizeGame);

// Setup touch events
canvas.addEventListener("touchstart", handleTouch, { passive: false });
canvas.addEventListener("touchmove", handleTouch, { passive: false });
canvas.addEventListener("touchend", handleTouch, { passive: false });

// Game Loop
let loop = GameLoop({
  update() {
    if (window.gameState === "menu" || window.gameState === "victory") return;

    window.totalPlayTime += 1 / 60;

    if (window.gameState === "memorize") {
      window.stateTimer -= 1 / 60;
      if (window.stateTimer <= 0) window.gameState = "play";
    }

    player.update();

    const floor = canvas.height - 40;
    updatePlayerGrounded(floor);

    handlePlatformCollisions();
    handleSpikeCollisions();
    handleStarCollection();
  },

  render() {
    context.clearRect(0, 0, canvas.width, canvas.height);

    drawGameArea();
    drawGround();

    platforms.forEach(p => p.render());
    spikes.forEach(s => s.render());
    stars.forEach(star => star.render());

    drawFog();

    if (window.gameState !== "menu" && window.gameState !== "victory") {
      player.render();
    }

    drawControlsBackground();
    if (window.gameState !== "menu" && window.gameState !== "victory") {
      drawDpad();
      drawJumpButton();
      drawRestartButton();
    }

    drawUI();
  }
});

// Start the game
window.gameState = "menu";
loop.start();
