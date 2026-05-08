const {
  init,
  GameLoop,
  Sprite,
  initKeys,
  keyPressed
} = kontra;

let { canvas, context } = init("game");

function resizeGame() {
  canvas.width = window.innerWidth;
  canvas.height = window.innerHeight;

  canvas.style.width = "100vw";
  canvas.style.height = "100vh";
  canvas.style.display = "block";

  dpad.y = canvas.height - 140;
}

resizeGame();

window.addEventListener("resize", resizeGame);

initKeys();

let touch = {
  up: false,
  down: false,
  left: false,
  right: false
};

const dpad = {
  x: 110,
  y: canvas.height - 140,
  size: 60
};

function drawDpad() {
  context.globalAlpha = 0.5;
  context.fillStyle = "black";

  // up
  context.fillRect(
    dpad.x,
    dpad.y - dpad.size,
    dpad.size,
    dpad.size
  );

  // left
  context.fillRect(
    dpad.x - dpad.size,
    dpad.y,
    dpad.size,
    dpad.size
  );

  // down
  context.fillRect(
    dpad.x,
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

let player = Sprite({
  x: 100,
  y: 100,
  width: 40,
  height: 40,
  color: "lime",

  update() {
    if (keyPressed("left") || touch.left) {
      this.x -= 4;
    }

    if (keyPressed("right") || touch.right) {
      this.x += 4;
    }

    if (keyPressed("up") || touch.up) {
      this.y -= 4;
    }

    if (keyPressed("down") || touch.down) {
      this.y += 4;
    }
  },

  render() {
    this.draw();
  }
});

let loop = GameLoop({
  update() {
    player.update();
  },

  render() {
    player.render();
    drawDpad();
  }
});

function resetTouch() {
  touch.up = false;
  touch.down = false;
  touch.left = false;
  touch.right = false;
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
    const x = t.clientX - rect.left;
    const y = t.clientY - rect.top;

    // UP
    if (
      x > dpad.x &&
      x < dpad.x + dpad.size &&
      y > dpad.y - dpad.size &&
      y < dpad.y
    ) {
      touch.up = true;
    }

    // LEFT
    if (
      x > dpad.x - dpad.size &&
      x < dpad.x &&
      y > dpad.y &&
      y < dpad.y + dpad.size
    ) {
      touch.left = true;
    }

    // DOWN
    if (
      x > dpad.x &&
      x < dpad.x + dpad.size &&
      y > dpad.y &&
      y < dpad.y + dpad.size
    ) {
      touch.down = true;
    }

    // RIGHT
    if (
      x > dpad.x + dpad.size &&
      x < dpad.x + dpad.size * 2 &&
      y > dpad.y &&
      y < dpad.y + dpad.size
    ) {
      touch.right = true;
    }
  }
}

loop.start();

// fullscreen
async function goFullscreen() {
  const elem = document.documentElement;

  if (!document.fullscreenElement) {
    try {
      await elem.requestFullscreen();
    } catch (err) {}
  }
}

document.addEventListener("touchstart", goFullscreen, {
  once: true
});

document.addEventListener("mousedown", goFullscreen, {
  once: true
});
