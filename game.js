const {
  init,
  GameLoop,
  Sprite,
  initKeys,
  keyPressed
} = kontra;

let { canvas, context } = init("game");

initKeys();

// =====================================
// BASE RESOLUTION
// =====================================

const BASE_WIDTH = 960;
const BASE_HEIGHT = 540;

const SAFE_X = 25;
const SAFE_Y = 25;

// =====================================
// RESIZE
// =====================================

function resizeGame() {
  const scale = Math.min(
    window.innerWidth / BASE_WIDTH,
    window.innerHeight / BASE_HEIGHT
  );

  canvas.width = BASE_WIDTH;
  canvas.height = BASE_HEIGHT;

  canvas.style.width = BASE_WIDTH * scale + "px";
  canvas.style.height = BASE_HEIGHT * scale + "px";

  canvas.style.position = "absolute";

  canvas.style.left =
    (window.innerWidth - BASE_WIDTH * scale) / 2 + "px";

  canvas.style.top =
    (window.innerHeight - BASE_HEIGHT * scale) / 2 + "px";

  canvas.style.imageRendering = "pixelated";
}

resizeGame();

window.addEventListener("resize", resizeGame);

// =====================================
// LAYOUT
// =====================================

const LEFT_UI = () => 160;
const RIGHT_UI = () => 160;

const GAME_X = () => LEFT_UI();
const GAME_WIDTH = () =>
  canvas.width - LEFT_UI() - RIGHT_UI();

// =====================================
// LEVELS
// =====================================

let currentLevel = 0;
let level = levels[currentLevel];

function nextLevel() {
  currentLevel++;

  if (currentLevel >= levels.length) {
    currentLevel = 0;
  }

  level = levels[currentLevel];

  player.x = level.playerSpawn.x;
  player.y = level.playerSpawn.y;

  player.dy = 0;
}

// =====================================
// CAMERA
// =====================================

const camera = {
  x: 0,
  y: 0
};

// =====================================
// TOUCH
// =====================================

let touch = {
  left: false,
  right: false,
  jump: false
};

function resetTouch() {
  touch.left = false;
  touch.right = false;
  touch.jump = false;
}

// =====================================
// CONTROLS
// =====================================

const dpad = {
  size: 70
};

const jumpBtn = {
  size: 90
};

// =====================================
// PLAYER
// =====================================

let player = Sprite({
  x: level.playerSpawn.x,
  y: level.playerSpawn.y,

  width: 40,
  height: 40,

  color: "lime",

  dx: 0,
  dy: 0,

  grounded: false,

  update() {
    // movement
    this.dx = 0;

    if (keyPressed("left") || touch.left) {
      this.dx = -4;
    }

    if (keyPressed("right") || touch.right) {
      this.dx = 4;
    }

    this.x += this.dx;

    // jump
    if ((keyPressed("space") || touch.jump) && this.grounded) {
      this.dy = -12;
      this.grounded = false;
    }

    // variable jump
    if (!touch.jump && this.dy < 0) {
      this.dy += 0.4;
    }

    // gravity
    this.dy += 0.6;
    this.y += this.dy;

    // platform collision
    this.grounded = false;

    for (let p of level.platforms) {
      if (
        this.x < p.x + p.width &&
        this.x + this.width > p.x &&
        this.y + this.height < p.y + 20 &&
        this.y + this.height + this.dy >= p.y
      ) {
        this.y = p.y - this.height;
        this.dy = 0;
        this.grounded = true;
      }
    }

    // goal collision
    if (
      this.x < level.goal.x + level.goal.width &&
      this.x + this.width > level.goal.x &&
      this.y < level.goal.y + level.goal.height &&
      this.y + this.height > level.goal.y
    ) {
      nextLevel();
    }

    // camera follow
    camera.x =
      this.x - GAME_WIDTH() / 2 + this.width / 2;

    // camera clamp
    if (camera.x < 0) {
      camera.x = 0;
    }

    if (camera.x > level.width - GAME_WIDTH()) {
      camera.x = level.width - GAME_WIDTH();
    }
  },

  render() {
    context.fillStyle = this.color;

    context.fillRect(
      this.x - camera.x + GAME_X(),
      this.y,
      this.width,
      this.height
    );
  }
});

// =====================================
// DRAWING
// =====================================

function drawControlsBackground() {
  context.fillStyle = "#111";

  context.fillRect(
    0,
    0,
    LEFT_UI(),
    canvas.height
  );

  context.fillRect(
    canvas.width - RIGHT_UI(),
    0,
    RIGHT_UI(),
    canvas.height
  );
}

function drawGameArea() {
  context.fillStyle = "#1e293b";

  context.fillRect(
    GAME_X(),
    0,
    GAME_WIDTH(),
    canvas.height
  );
}

function drawPlatforms() {
  context.fillStyle = "#666";

  for (let p of level.platforms) {
    context.fillRect(
      p.x - camera.x + GAME_X(),
      p.y,
      p.width,
      p.height
    );
  }
}

function drawGoal() {
  context.fillStyle = "yellow";

  context.fillRect(
    level.goal.x - camera.x + GAME_X(),
    level.goal.y,
    level.goal.width,
    level.goal.height
  );
}

function drawDpad() {
  const centerX = LEFT_UI() / 2;
  const centerY = canvas.height - 140 - SAFE_Y;

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
  const x =
    canvas.width - RIGHT_UI() / 2 - jumpBtn.size / 2;

  const y = canvas.height - 140 - SAFE_Y;

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

// =====================================
// TOUCH EVENTS
// =====================================

canvas.addEventListener("touchstart", handleTouch);
canvas.addEventListener("touchmove", handleTouch);
canvas.addEventListener("touchend", handleTouch);

function handleTouch(e) {
  e.preventDefault();

  resetTouch();

  const rect = canvas.getBoundingClientRect();

  const scaleX = canvas.width / rect.width;
  const scaleY = canvas.height / rect.height;

  for (let t of e.touches) {
    const x = (t.clientX - rect.left) * scaleX;
    const y = (t.clientY - rect.top) * scaleY;

    // dpad
    if (x < LEFT_UI()) {
      const centerX = LEFT_UI() / 2;

      if (x < centerX) {
        touch.left = true;
      } else {
        touch.right = true;
      }
    }

    // jump
    const jumpX =
      canvas.width - RIGHT_UI() / 2 - jumpBtn.size / 2;

    const jumpY = canvas.height - 140 - SAFE_Y;

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

// =====================================
// LOOP
// =====================================

let loop = GameLoop({
  update() {
    player.update();
  },

  render() {
    context.clearRect(0, 0, canvas.width, canvas.height);

    drawControlsBackground();

    drawGameArea();

    drawPlatforms();

    drawGoal();

    player.render();

    drawDpad();

    drawJumpButton();
  }
});

loop.start();

