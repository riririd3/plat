const {
  init,
  GameLoop,
  Sprite,
  initKeys,
  keyPressed
} = kontra;

const touch = {
  up: false,
  down: false,
  left: false,
  right: false
};

function setupButton(id, key) {
  const btn = document.getElementById(id);

  btn.addEventListener("touchstart", (e) => {
    e.preventDefault();
    touch[key] = true;
  });

  btn.addEventListener("touchend", () => {
    touch[key] = false;
  });

  btn.addEventListener("mousedown", () => {
    touch[key] = true;
  });

  btn.addEventListener("mouseup", () => {
    touch[key] = false;
  });
}

setupButton("up", "up");
setupButton("down", "down");
setupButton("left", "left");
setupButton("right", "right");

let { canvas, context } = init("game");

canvas.width = window.innerWidth;
canvas.height = window.innerHeight;

window.addEventListener("resize", () => {
  canvas.width = window.innerWidth;
  canvas.height = window.innerHeight;
});

initKeys();

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
  }
});

loop.start();

// fullscreen on tap
document.body.addEventListener("click", async () => {
  const elem = document.documentElement;

  if (elem.requestFullscreen && !document.fullscreenElement) {
    try {
      await elem.requestFullscreen();
    } catch (err) {}
  }
});
