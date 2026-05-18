// main.js
import { resizeGame } from './utils.js';
import { handleTouch } from './input.js';
import { player, updatePlayerGrounded } from './player.js';
import { handlePlatformCollisions, handleSpikeCollisions, handleStarCollection } from './collisions.js';
import { gameState, updateTimers, platforms, spikes, stars } from './level.js';
import { drawGameArea, drawGround, drawFog, drawControlsBackground, drawDpad, drawJumpButton, drawRestartButton, drawUI } from './ui.js';

const canvas = document.getElementById("game");
const context = canvas.getContext("2d");
const BASE_WIDTH = 960;
const BASE_HEIGHT = 540;

kontra.initKeys();

// Setup responsive sizes
resizeGame(BASE_WIDTH, BASE_HEIGHT, canvas);
window.addEventListener("resize", () => resizeGame(BASE_WIDTH, BASE_HEIGHT, canvas));

// Universal inputs hookup
canvas.addEventListener("touchstart", (e) => handleTouch(e, canvas), { passive: false });
canvas.addEventListener("touchmove", (e) => handleTouch(e, canvas), { passive: false });
canvas.addEventListener("touchend", (e) => handleTouch(e, canvas), { passive: false });

let loop = kontra.GameLoop({
  update() {
    if (gameState === "menu" || gameState === "victory") return;

    updateTimers(1 / 60);
    player.update();
    updatePlayerGrounded(canvas);

    handlePlatformCollisions();
    handleSpikeCollisions();
    handleStarCollection();
  },

  render() {
    context.clearRect(0, 0, canvas.width, canvas.height);

    drawGameArea(context);
    drawGround(context, canvas);

    platforms.forEach(p => p.render());
    spikes.forEach(s => s.render());
    stars.forEach(star => star.render());

    drawFog(context);

    if (gameState !== "menu" && gameState !== "victory") {
      player.render();
    }

    drawControlsBackground(context, canvas);
    if (gameState !== "menu" && gameState !== "victory") {
      drawDpad(context, canvas);
      drawJumpButton(context, canvas);
      drawRestartButton(context, canvas);
    }

    drawUI(context, canvas);
  }
});

loop.start();
