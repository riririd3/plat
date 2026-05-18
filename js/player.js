// player.js
import { GAME_X, GAME_WIDTH } from './utils.js';
import { gameState } from './level.js';
import { touch } from './input.js';

export let player = kontra.Sprite({
  x: 0, y: 0, width: 32, height: 32, color: "lime", dy: 0, grounded: false,
  update() {
    if (gameState !== "play") {
      this.dy = 0;
      return;
    }
    if (kontra.keyPressed("left") || touch.left) this.x -= 4;
    if (kontra.keyPressed("right") || touch.right) this.x += 4;
    if ((kontra.keyPressed("space") || touch.jump) && this.grounded) {
      this.dy = -11;
      this.grounded = false;
    }
    this.dy += 0.5;
    this.y += this.dy;

    if (this.x < GAME_X()) this.x = GAME_X();
    if (this.x + this.width > GAME_X() + GAME_WIDTH()) this.x = GAME_X() + GAME_WIDTH() - this.width;
  },
  render() { this.draw(); }
});

export function updatePlayerGrounded(canvas) {
  const floor = canvas.height - 40;
  if (player.y + player.height >= floor) {
    player.y = floor - player.height;
    player.dy = 0;
    player.grounded = true;
  }
}
