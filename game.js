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
      this.dy = 0; // stop gravity from pulling them down during countdown
      return;      // exit the update function early
    }
    if (keyPressed("left") || touch.left) {
      this.x -= 4;
    }
    if (keyPressed("right") || touch.right) {
      this.x += 4;
    }
    if ((keyPressed("space") || touch.jump) && this.grounded) {
      this.dy = -11;
      this.grounded = false;
    }

    // Gravity application
    this.dy += 0.5;
    this.y += this.dy;

    // Hard floor boundary (Fallback)
    const floor = canvas.height - 40;
    if (this.y + this.height >= floor) {
      this.y = floor - this.height;
      this.dy = 0;
      this.grounded = true;
    }

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

  platforms = [];
  stars = [];

  const currentLevel = LEVEL_MAPS[index];

  // Dynamically set the player spawn point from the level file!
  // If a level doesn't have a playerSpawn defined, it defaults to a safe backup.
  if (currentLevel.playerSpawn) {
    player.x = GAME_X() + currentLevel.playerSpawn.x;
    player.y = currentLevel.playerSpawn.y;
  } else {
    // Default fallback spawn point
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

// Initial Level Boot
loadLevel(currentLevelIndex);

// Graphics Rendering Blocks
function drawGameArea() {
  context.fillStyle = "#1e293b";
  context.fillRect(GAME_X(), 0, GAME_WIDTH(), canvas.height);
}

function drawControlsBackground() {
  context.fillStyle = "#111";
  // Left Sidebar Panel
  context.fillRect(0, 0, LEFT_UI(), canvas.height);
  // Right Sidebar Panel
  context.fillRect(canvas.width - RIGHT_UI(), 0, RIGHT_UI(), canvas.height);
}

function drawDpad() {
  const centerX = LEFT_UI() / 2;
  const centerY = canvas.height - 140 - SAFE;

  context.save();
  context.globalAlpha = touch.left ? 0.8 : 0.4;
  context.fillStyle = "white";
  // Left Button Arrow
  context.fillRect(centerX - dpad.size - 10, centerY, dpad.size, dpad.size);

  context.globalAlpha = touch.right ? 0.8 : 0.4;
  // Right Button Arrow
  context.fillRect(centerX + 10, centerY, dpad.size, dpad.size);
  context.restore();
}

function drawJumpButton() {
  const x = canvas.width - RIGHT_UI() / 2;
  const y = canvas.height - 140 - SAFE + jumpBtn.size / 2;

  context.save();
  context.globalAlpha = touch.jump ? 0.8 : 0.4;
  context.fillStyle = "#ef4444";
  
  // Clean ergonomic circle button design
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
  // Fill entire game board view dark
  context.fillStyle = "rgba(0, 0, 0, 1.0)";
  context.fillRect(GAME_X(), 0, GAME_WIDTH(), canvas.height);

  // Mask cutout to highlight player's structural surroundings
  context.globalCompositeOperation = 'destination-out';
  context.beginPath();
  const maskRadius = 75;
  context.arc(
    player.x + player.width / 2,
    player.y + player.height / 2,
    maskRadius,
    0,
    Math.PI * 2
  );
  context.fill();
  context.restore();
}

// Touch Handling Logic & Precision Layout Updates
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

  // Handle auto-fullscreen on initial game play input interaction
  if (!hasInteracted) {
    toggleFullscreen().catch(err => console.log("Engine Focus Notification: Fullscreen deferred."));
    hasInteracted = true;
  }

  const rect = canvas.getBoundingClientRect();
  const scaleX = canvas.width / rect.width;
  const scaleY = canvas.height / rect.height;

  for (let t of e.touches) {
    const x = (t.clientX - rect.left) * scaleX;
    const y = (t.clientY - rect.top) * scaleY;

    // 1. LEFT PANEL (D-PAD) TOUCH DETECTION
    if (x < LEFT_UI()) {
      const centerX = LEFT_UI() / 2;
      if (x < centerX) {
        touch.left = true;
      } else {
        touch.right = true;
      }
    }

    // 2. RIGHT PANEL TOUCH DETECTION
    if (x > canvas.width - RIGHT_UI()) {
      // Fullscreen Button Bounds Hit check
      const fsX = canvas.width - RIGHT_UI() / 2;
      const fsY = canvas.height - 260 - SAFE;
      if (Math.hypot(x - fsX, y - fsY) < fullscreenBtn.size / 2) {
        if (e.type === "touchstart") toggleFullscreen();
        continue;
      }

      // Jump Button Radial Touch Bounds Hit check
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

// Core Loop
let loop = GameLoop({
  update() {
    // Run timer countdown if in memorization mode
    if (gameState === "memorize") {
      stateTimer -= 1 / 60; // Assumes targeted standard 60fps refresh step rate
      if (stateTimer <= 0) {
        gameState = "play";
      }
    }

    player.update();

    // --- ADVANCED 4-SIDED SOLID PLATFORM COLLISIONS ---
    player.grounded = false;

    for (let p of platforms) {
      // Check if player and platform are overlapping at all
      if (
        player.x < p.x + p.width &&
        player.x + player.width > p.x &&
        player.y < p.y + p.height &&
        player.y + player.height > p.y
      ) {
        // Calculate how deep the player has overlapped into the platform on both axes
        let overlapX = Math.min(player.x + player.width - p.x, p.x + p.width - player.x);
        let overlapY = Math.min(player.y + player.height - p.y, p.y + p.height - player.y);

        // Resolve collision along the axis with the SMALLEST overlap (prevents glitchy snapping)
        if (overlapX < overlapY) {
          // Horizontal collision (Left or Right wall hit)
          if (player.x + player.width / 2 < p.x + p.width / 2) {
            player.x -= overlapX; // Pushed left
          } else {
            player.x += overlapX; // Pushed right
          }
        } else {
          // Vertical collision (Floor or Ceiling hit)
          if (player.y + player.height / 2 < p.y + p.height / 2) {
            // Landing on top of a platform
            player.y -= overlapY;
            player.dy = 0;
            player.grounded = true;
          } else {
            // BONK! Hitting your head from below
            player.y += overlapY;
            player.dy = 0; // kill upward momentum immediately so they drop
          }
        }
      }
        }

    // Star dynamic score goal checking logic loop
    for (let star of stars) {
      if (
        !star.pickedUp &&
        player.x < star.x + star.width &&
        player.x + player.width > star.x &&
        player.y < star.y + star.height &&
        player.y + player.height > star.y
      ) {
        star.pickedUp = true;
        
        // Progress into next stage
        currentLevelIndex++;
        loadLevel(currentLevelIndex);
      }
    }
  },

  render() {
    context.clearRect(0, 0, canvas.width, canvas.height);

    // 1. Draw level gameplay layers beneath mask layers
    drawGameArea();
    platforms.forEach(p => p.render());
    stars.forEach(star => star.render());
    player.render();

    // 2. Render Blind Fog layout immediately overlaying items inside game area viewport
    drawFog();

    // 3. Render persistent UI elements completely clear above darkness
    drawControlsBackground();
    drawDpad();
    drawJumpButton();
    drawFullscreenButton();

    // Context Notice layout feedback texts
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
