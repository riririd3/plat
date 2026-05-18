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

initKeys();

// Global game state
let gameState = "menu";
let stateTimer = 3.0;
let totalPlayTime = 0.0;

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
    if (gameState === "menu" || gameState === "victory") return;

    totalPlayTime += 1 / 60;

    if (gameState === "memorize") {
      stateTimer -= 1 / 60;
      if (stateTimer <= 0) gameState = "play";
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

    if (gameState !== "menu" && gameState !== "victory") {
      player.render();
    }

    drawControlsBackground();
    if (gameState !== "menu" && gameState !== "victory") {
      drawDpad();
      drawJumpButton();
      drawRestartButton();
    }

    drawUI();
  }
});

// Start the game
gameState = "menu";
loop.start();