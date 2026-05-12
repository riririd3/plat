const {
  init,
  GameLoop,
  Sprite,
  initKeys,
  keyPressed
} = kontra;

let { canvas, context } = init("game");

initKeys();

const SIDE_UI = window.innerWidth / 6;

canvas.width = window.innerWidth - SIDE_UI * 2;
canvas.height = window.innerHeight;

canvas.style.position = "absolute";
canvas.style.left = SIDE_UI + "px";
canvas.style.top = "0px";

function resizeGame() {
  const side = window.innerWidth / 6;

  canvas.width = window.innerWidth - side * 2;
  canvas.height = window.innerHeight;

  canvas.style.left = side + "px";

  dpad.y = canvas.height - 160;

  jumpBtn.x = window.innerWidth - 100;
  jumpBtn.y = canvas.height - 120;
}

window.addEventListener("resize", resizeGame);

let touch = {
  left: false,
  right: false,
  jump: false
};

const dpad = {
  x: 90,
  y: canvas.height - 160,
  size: 60
};

const jumpBtn = {
  x: window.innerWidth - 100,
  y: canvas.height - 120,
  size: 80
};

let player = Sprite({
  x: 100,
  y: 300,

  width: 40,
  height: 40,

  color: "lime",

  dy: 0,
  grounded: false,

  update() {
    // movement
    if (keyPressed("left") || touch.left) {
      this.x -= 4;
    }

    if (keyPressed("right") || touch.right) {
      this.x += 4;
    }

    // jump
    if ((keyPressed("space") || touch.jump) && this.grounded) {
      this.dy = -12;
      this.grounded = false;
    }

    // gravity
    this.dy += 0.6;
    this.y += this.dy;

    // floor
    if (this.y + this.height >= canvas.height - 50) {
      this.y = canvas.height - 50 - this.height;

      this.dy = 0;
      this.grounded = true;
    }
  },

  render() {
    this.draw();
  }
});

function drawGround() {
  context.fillStyle = "#444";

  context.fillRect(
    0,
    canvas.height - 50,
    canvas.width,
    50
  );
}

function drawDpad() {
  context.globalAlpha = 0.5;

  context.fillStyle = "black";

  // left
  context.fillRect(
    dpad.x - dpad.size,
    dpad.y,
    dpad.size,
    dpad.size
  );

  // right
  context.fillRect(
    dpad.x + dpad.size,
    dpad.y,
    dpad.size,
    dpad.size
  );

  context.globalAlpha = 1;
}

function drawJumpButton() {
  context.globalAlpha = 0.5;

  context.beginPath();

  context.arc(
    jumpBtn.x,
    jumpBtn.y,
    jumpBtn.size / 2,
    0,
    Math.PI * 2
  );

  context.fillStyle = "red";
  context.fill();

  context.globalAlpha = 1;
}

function resetTouch() {
  touch.left = false;
  touch.right = false;
  touch.jump = false;
}

canvas.addEventListener("touchstart", handleTouch);
canvas.addEventListener("touchmove", handleTouch);

canvas.addEventListener("touchend", () => {
  resetTouch();
});

function handleTouch(e) {
  e.preventDefault();

  resetTouch();

  const rect = canvas.getBoundingClientRect();

  for (let t of e.touches) {
    const x = t.clientX;
    const y = t.clientY;

    // LEFT SIDE
    if (
      x < SIDE_UI
    ) {
      if (y > dpad.y) {
        if (x < dpad.x) {
          touch.left = true;
        } else {
          touch.right = true;
        }
      }
    }

    // RIGHT SIDE
    if (
      x > window.innerWidth - SIDE_UI
    ) {
      const dist = Math.hypot(
        x - jumpBtn.x,
        y - jumpBtn.y
      );

      if (dist < jumpBtn.size) {
        touch.jump = true;
      }
    }
  }
}

let loop = GameLoop({
  update() {
    player.update();
  },

  render() {
    context.clearRect(
      0,
      0,
      canvas.width,
      canvas.height
    );

    drawGround();

    player.render();

    drawDpad();

    drawJumpButton();
  }
});

loop.start();
