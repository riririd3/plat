const {
  init,
  GameLoop,
  Sprite,
  initKeys,
  keyPressed
} = kontra;

let { canvas, context } = init("game");

initKeys();

const BASE_WIDTH = 960;
const BASE_HEIGHT = 540;

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
  canvas.style.left = (window.innerWidth - BASE_WIDTH * scale) / 2 + "px";
  canvas.style.top = (window.innerHeight - BASE_HEIGHT * scale) / 2 + "px";
  canvas.style.imageRendering = "pixelated";
}

resizeGame();
window.addEventListener("resize", resizeGame);

// Layout settings
const LEFT_UI = () => 160;
const RIGHT_UI = () => 160;
const GAME_X = () => LEFT_UI();
const GAME_WIDTH = () => canvas.width - LEFT_UI() - RIGHT_UI();
const SAFE = 10;

// Game State Engine
let currentLevelIndex = 0;
let gameState = "memorize"; // Can be: "memorize" or "play"
let stateTimer = 3.0;       // 3 seconds window to memorize the map
let platforms = [];
let stars = [];

// Touch state
let touch = {
  left: false,
  right: false,
  jump: false
};

let hasInteracted = false;

// Controls Layout Dimensions
const dpad = { size: 50 };
const jumpBtn = { size: 50 };
const fullscreenBtn = { size: 50 };

// Player Sprite configuration
let player = Sprite({
  x: 0,
  y: 0,
  width: 32,
  height: 32,
  color: "lime",
  dy: 0,
  grounded: false,

  update() {
    // FREEZE PLAYER DURING MEMORIZATION WINDOW
    if (gameState === "memorize") {
      this.dy = 0; 
      return;      
    }

    if (keyPressed("left") || touch.left) {
      this.x -= 4;
    }
    if (keyPressed("right") || touch.right) {
      this.x += 4;
    }
    
    // Jump Execution Check
    if ((keyPressed("space") || touch.jump) && this.grounded) {
      this.dy = -11;
      this.grounded = false;
    }

    // Gravity application
    this.dy += 0.5;
    this.y += this.dy;

    // Restrict within the active game viewport boundaries
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

// Level Builder Parser
function loadLevel(index) {
  if (index >= LEVEL_MAPS.length) {
    alert("Incredible! You memorized and beat every single level!");
    currentLevelIndex = 0;
    index = 0;
  }

  gameState = "memorize";
  stateTimer = 3.0;

  // Clear touch inputs between level loading states
  resetTouch();

  platforms = [];
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

  // 1. Load Pixel-Based Platforms
  currentLevel.platforms.forEach(p => {
    platforms.push(Sprite({
      x: GAME_X() + p.x,
      y: p.y,
      width: p.w,
      height: p.h,
      color: "#64748b",
      render() { this.draw(); }
    }));
  });

  // 2. Load Pixel-Based Stars
  currentLevel.stars.forEach(s => {
    stars.push(Sprite({
      x: GAME_X() + s.x,
      y: s.y,
      width: 20,
      height: 20,
      color: "gold",
      pickedUp: false,
      render() { if (!this.pickedUp) this.draw(); }
    }));
  });
}

// Graphics Rendering Blocks
function drawGameArea() {
  context.fillStyle = "#1e293b";
  context.fillRect(GAME_X(), 0, GAME_WIDTH(), canvas.height);
}

function drawControlsBackground() {
  context.fillStyle = "#111";
  context.fillRect(0, 0, LEFT_UI(), canvas.height);
  context.fillRect(canvas.width - RIGHT_UI(), 0, RIGHT_UI(), canvas.height);
}

function drawDpad() {
  const centerX = LEFT_UI() / 2;
  const centerY = canvas.height - 140 - SAFE;

  context.save();
  context.globalAlpha = touch.left ? 0.8 : 0.4;
  context.fillStyle = "white";
  context.fillRect(centerX - dpad.size - 10, centerY, dpad.size, dpad.size);

  context.globalAlpha = touch.right ? 0.8 : 0.4;
  context.fillRect(centerX + 10, centerY, dpad.size, dpad.size);
  context.restore();
}

function drawJumpButton() {
  const x = canvas.width - RIGHT_UI() / 2;
  const y = canvas.height - 140 - SAFE + jumpBtn.size / 2;

  context.save();
  context.globalAlpha = touch.jump ? 0.8 : 0.4;
  context.fillStyle = "#ef4444";
  
  context.beginPath();
  context.arc(x, y, jumpBtn.size / 2, 0, Math.PI * 2);
  context.fill();
  context.restore();
}

function drawFullscreenButton() {
  const x = canvas.width - RIGHT_UI() / 2;
  const y = canvas.height - 260 - SAFE;

  context.save();
  context.globalAlpha = 0.5;
  context.fillStyle = "white";
  context.fillRect(x - fullscreenBtn.size / 2, y - fullscreenBtn.size / 2, fullscreenBtn.size, fullscreenBtn.size);

  context.strokeStyle = "black";
  context.lineWidth = 4;
  context.strokeRect(x - 16, y - 16, 32, 32);
  context.restore();
}

function drawFog() {
  if (gameState !== "play") return;

  context.save();
  context.fillStyle = "rgba(0, 0, 0, 1.0)";
  context.fillRect(GAME_X(), 0, GAME_WIDTH(), canvas.height);

  context.globalCompositeOperation = 'destination-out';
  context.beginPath();
  const maskRadius = 75;
  context.arc(player.x + player.width / 2, player.y + player.height / 2, maskRadius, 0, Math.PI * 2);
  context.fill();
  
  context.restore();
}

function resetTouch() {
  touch.left = false;
  touch.right = false;
  touch.jump = false;
}

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

  if (!hasInteracted) {
    toggleFullscreen().catch(err => console.log("Fullscreen request deferred."));
    hasInteracted = true;
  }

  const rect = canvas.getBoundingClientRect();
  const scaleX = canvas.width / rect.width;
  const scaleY = canvas.height / rect.height;

  // Use e.targetTouches so we don't accidentally check dropped tracking data during touchend
  let activeTouches = e.type === "touchend" ? e.touches : e.targetTouches;

  for (let t of activeTouches) {
    const x = (t.clientX - rect.left) * scaleX;
    const y = (t.clientY - rect.top) * scaleY;

    // Left Panel D-pad
    if (x < LEFT_UI()) {
      const centerX = LEFT_UI() / 2;
      if (x < centerX) {
        touch.left = true;
      } else {
        touch.right = true;
      }
    }

    // Right Panel Buttons
    if (x > canvas.width - RIGHT_UI()) {
      const fsX = canvas.width - RIGHT_UI() / 2;
      const fsY = canvas.height - 260 - SAFE;
      if (Math.hypot(x - fsX, y - fsY) < fullscreenBtn.size / 2) {
        if (e.type === "touchstart") toggleFullscreen();
        continue;
      }

      const jumpX = canvas.width - RIGHT_UI() / 2;
      const jumpY = canvas.height - 140 - SAFE + jumpBtn.size / 2;
      if (Math.hypot(x - jumpX, y - jumpY) < jumpBtn.size / 2) {
        touch.jump = true;
      }
    }
  }
}

canvas.addEventListener("touchstart", handleTouch, { passive: false });
canvas.addEventListener("touchmove", handleTouch, { passive: false });
canvas.addEventListener("touchend", handleTouch, { passive: false });

// Initial Level Boot
loadLevel(currentLevelIndex);

// Core Loop
let loop = GameLoop({
  update() {
    if (gameState === "memorize") {
      stateTimer -= 1 / 60; 
      if (stateTimer <= 0) {
        gameState = "play";
      }
    }

    player.update();

    // --- ADVANCED 4-SIDED SOLID PLATFORM COLLISIONS ---
    player.grounded = false;

    // Hard floor boundary fallback 
    const floor = canvas.height - 40;
    if (player.y + player.height >= floor) {
      player.y = floor - player.height;
      player.dy = 0;
      player.grounded = true;
    }

    for (let p of platforms) {
      if (
        player.x < p.x + p.width &&
        player.x + player.width > p.x &&
        player.y < p.y + p.height &&
        player.y + player.height > p.y
      ) {
        let overlapX = Math.min(player.x + player.width - p.x, p.x + p.width - player.x);
        let overlapY = Math.min(player.y + player.height - p.y, p.y + p.height - player.y);

        if (overlapX < overlapY) {
          if (player.x + player.width / 2 < p.x + p.width / 2) {
            player.x -= overlapX;
          } else {
            player.x += overlapX;
          }
        } else {
          if (player.y + player.height / 2 < p.y + p.height / 2) {
            player.y -= overlapY;
            player.dy = 0;
            player.grounded = true; 
          } else {
            player.y += overlapY;
            player.dy = 0; // Head bonk!
          }
        }
      }
    }

    // Star collection detection
    for (let star of stars) {
      if (
        !star.pickedUp &&
        player.x < star.x + star.width &&
        player.x + player.width > star.x &&
        player.y < star.y + star.height &&
        player.y + player.height > star.y
      ) {
        star.pickedUp = true;
        currentLevelIndex++;
        loadLevel(currentLevelIndex);
      }
    }
  },

  render() {
    context.clearRect(0, 0, canvas.width, canvas.height);

    // 1. Draw the basic dark blue game background
    drawGameArea();

    // 2. Draw platforms and stars (they are drawn on the background first)
    platforms.forEach(p => p.render());
    stars.forEach(star => star.render());

    // 3. Render the Blind Fog directly over the background and objects
    // This will paint black over EVERYTHING, then punch out a clean window 
    // revealing the platforms, stars, and background only inside the circle!
    drawFog();

    // 4. Render the player last so they are always perfectly visible on top
    player.render();

    // 5. Render your absolute UI sidebars and touch controls over the top of the fog
    drawControlsBackground();
    drawDpad();
    drawJumpButton();
    drawFullscreenButton();

    if (gameState === "memorize") {
      context.fillStyle = "#fbbf24";
      context.font = "bold 22px Arial";
      context.textAlign = "center";
      context.fillText(
        `MEMORIZE MAP: ${Math.ceil(stateTimer)}s`, 
        GAME_X() + GAME_WIDTH() / 2, 
        45
      );
    }
  }
});

loop.start();
