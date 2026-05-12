const {
  init,
  GameLoop,
  Sprite,
  initKeys,
  keyPressed
} = kontra;

let { canvas, context } = init("game");

initKeys();

function resizeGame() {
  canvas.width = window.innerWidth;
  canvas.height = window.innerHeight;
}

resizeGame();

window.addEventListener("resize", resizeGame);

// layout
const LEFT_UI = () => canvas.width / 6;
const RIGHT_UI = () => canvas.width / 6;

const GAME_X = () => LEFT_UI();
const GAME_WIDTH = () => canvas.width - LEFT_UI() - RIGHT_UI();
const SAFE = 50;
// touch
let touch = {
  left: false,
  right: false,
  jump: false
};

// controls
const dpad = {
  size: 70
};

const jumpBtn = {
  size: 90
};

const fullscreenBtn = {
  size: 60
};
// player
let player = Sprite({
  x: GAME_X() + 100,
  y: 200,

  width: 40,
  height: 40,

  color: "lime",

  dy: 0,
  grounded: false,

  update() {
    if (keyPressed("left") || touch.left) {
      this.x -= 4;
    }

    if (keyPressed("right") || touch.right) {
      this.x += 4;
    }

    if ((keyPressed("space") || touch.jump) && this.grounded) {
      this.dy = -12;
      this.grounded = false;
    }

    // gravity
    this.dy += 0.6;
    this.y += this.dy;

    // floor
    const floor = canvas.height - 60;

    if (this.y + this.height >= floor) {
      this.y = floor - this.height;
      this.dy = 0;
      this.grounded = true;
    }

    // keep inside game area
    if (this.x < GAME_X()) {
      this.x = GAME_X();
    }

    if (this.x + this.width > GAME_X() + GAME_WIDTH()) {
      this.x = GAME_X() + GAME_WIDTH() - this.width;
    }
  },

  render() {
    this.draw();
  }
});

// drawing
function drawGameArea() {
  context.fillStyle = "#1e293b";

  context.fillRect(
    GAME_X(),
    0,
    GAME_WIDTH(),
    canvas.height
  );
}

function drawGround() {
  context.fillStyle = "#444";

  context.fillRect(
    GAME_X(),
    canvas.height - 60,
    GAME_WIDTH(),
    60
  );
}

function drawControlsBackground() {
  context.fillStyle = "#111";

  // left panel
  context.fillRect(
    0,
    0,
    LEFT_UI(),
    canvas.height
  );

  // right panel
  context.fillRect(
    canvas.width - RIGHT_UI(),
    0,
    RIGHT_UI(),
    canvas.height
  );
}

function drawDpad() {
  const centerX = LEFT_UI() / 2;
  const centerY = canvas.height - 140 - SAFE;

  context.globalAlpha = 0.5;
  context.fillStyle = "white";

  // left
  context.fillRect(
    centerX - dpad.size - 10,
    centerY,
    dpad.size,
    dpad.size
  );

  // right
  context.fillRect(
    centerX + 10,
    centerY,
    dpad.size,
    dpad.size
  );

  context.globalAlpha = 1;
}

function drawJumpButton() {
  const x = canvas.width - RIGHT_UI() / 2 - jumpBtn.size / 2;
  const y = canvas.height - 140 - SAFE;

  context.globalAlpha = 0.5;

  context.fillStyle = "red";

  context.fillRect(
    x,
    y,
    jumpBtn.size,
    jumpBtn.size
  );

  context.globalAlpha = 1;
}

function drawFullscreenButton() {
  const x = canvas.width - RIGHT_UI() / 2;
  const y = canvas.height - 260 - SAFE;

  context.globalAlpha = 0.5;

  context.fillStyle = "white";

  context.fillRect(
    x - fullscreenBtn.size / 2,
    y - fullscreenBtn.size / 2,
    fullscreenBtn.size,
    fullscreenBtn.size
  );

  // icon corners
  context.strokeStyle = "black";
  context.lineWidth = 4;

  context.strokeRect(
    x - 16,
    y - 16,
    32,
    32
  );

  context.globalAlpha = 1;
}
// touch controls
function resetTouch() {
  touch.left = false;
  touch.right = false;
  touch.jump = false;
}

canvas.addEventListener("touchstart", handleTouch);
canvas.addEventListener("touchmove", handleTouch);

canvas.addEventListener("touchend", resetTouch);
async function toggleFullscreen() {
  if (!document.fullscreenElement) {
    await document.documentElement.requestFullscreen();
  } else {
    await document.exitFullscreen();
  }
}

function handleTouch(e) {
  e.preventDefault();

  resetTouch();

  for (let t of e.touches) {
    const x = t.clientX;
    const y = t.clientY;

    // left controls
    if (x < LEFT_UI()) {
      if (x < LEFT_UI() / 2) {
        touch.left = true;
      } else {
        touch.right = true;
      }
    }
    const fullscreenX = canvas.width - RIGHT_UI() / 2;
const fullscreenY = canvas.height - 260 -SAFE;

const fullscreenDist = Math.hypot(
  x - fullscreenX,
  y - fullscreenY
);

if (fullscreenDist < fullscreenBtn.size / 2) {
  toggleFullscreen();
}

    // jump button
    const jumpX =
  canvas.width - RIGHT_UI() / 2 - jumpBtn.size / 2;

const jumpY = canvas.height - 140;

if (
  x > jumpX &&
  x < jumpX + jumpBtn.size &&
  y > jumpY &&
  y < jumpY + jumpBtn.size
) {
  touch.jump = true;
}
  }
}

// loop
let loop = GameLoop({
  update() {
    player.update();
  },

  render() {
    context.clearRect(0, 0, canvas.width, canvas.height);

    drawControlsBackground();

    drawGameArea();

    drawGround();

    player.render();

    drawDpad();

    drawJumpButton();
    
    drawFullscreenButton();
  }
});

loop.start();
