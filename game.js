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
  const scale = Math.min(window.innerWidth / BASE_WIDTH, window.innerHeight / BASE_HEIGHT);
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
let gameState = "menu"; // States: "menu", "memorize", "play", "victory"
let stateTimer = 3.0;      // Countdown window for memorizing
let totalPlayTime = 0.0;   // GLOBAL STOPWATCH (Ticks up continuously)
let platforms = [];
let spikes = [];
let stars = [];

// Touch & UI interaction state
let touch = { left: false, right: false, jump: false };
let hasInteracted = false;

// UI Layout Coordinates
const dpad = { size: 50 };
const jumpBtn = { size: 50 };
const restartBtn = { size: 40 };

// Player Sprite configuration
let player = Sprite({
  x: 0, y: 0, width: 32, height: 32, color: "lime", dy: 0, grounded: false,
  update() {
    if (gameState !== "play") {
      this.dy = 0;
      return;
    }
    if (keyPressed("left") || touch.left) this.x -= 4;
    if (keyPressed("right") || touch.right) this.x += 4;
    if ((keyPressed("space") || touch.jump) && this.grounded) {
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

function loadLevel(index) {
  // VICTORY CONDITION: Checked when passing the final level index array bound
  if (index >= LEVEL_MAPS.length) {
    gameState = "victory";
    return;
  }

  gameState = "memorize";
  stateTimer = 3.0;

  resetTouch();
  platforms = [];
  spikes = [];
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

  // Load Platforms
  if (currentLevel.platforms) {
    currentLevel.platforms.forEach(p => {
      platforms.push(Sprite({
        x: GAME_X() + p.x, y: p.y, width: p.w, height: p.h, color: "#64748b",
        render() { this.draw(); }
      }));
    });
  }

  // Load Spikes
  if (currentLevel.spikes) {
    currentLevel.spikes.forEach(s => {
      spikes.push(Sprite({
        x: GAME_X() + s.x, y: s.y, width: s.w, height: s.h, color: "#ef4444",
        render() {
          context.save();
          
          // 1. Draw the sharp white outline first (making it slightly larger)
          context.fillStyle = "white";
          context.beginPath();
          context.moveTo(this.x - 2, this.y + this.height);
          context.lineTo(this.x + this.width / 2, this.y - 3);
          context.lineTo(this.x + this.width + 2, this.y + this.height);
          context.closePath();
          context.fill();

          // 2. Draw the dangerous bright red inner spike right on top
          context.fillStyle = this.color;
          context.beginPath();
          context.moveTo(this.x, this.y + this.height);
          context.lineTo(this.x + this.width / 2, this.y);
          context.lineTo(this.x + this.width, this.y + this.height);
          context.closePath();
          context.fill();

          context.restore();
        }
      }));
    });
  }

  // Load Stars
  if (currentLevel.stars) {
    currentLevel.stars.forEach(s => {
      stars.push(Sprite({
        x: GAME_X() + s.x, y: s.y, width: 20, height: 20, color: "gold", pickedUp: false,
        render() { if (!this.pickedUp) this.draw(); }
      }));
    });
  }
}

// Rendering Layout Blocks
function drawGameArea() {
  context.fillStyle = "#1e293b";
  context.fillRect(GAME_X(), 0, GAME_WIDTH(), canvas.height);
}

function drawGround() {
  context.fillStyle = "#334155";
  context.fillRect(GAME_X(), canvas.height - 40, GAME_WIDTH(), 40);
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
  context.fillStyle = "#06b6d4";
  context.beginPath();
  context.arc(x, y, jumpBtn.size / 2, 0, Math.PI * 2);
  context.fill();
  context.restore();
}

function drawRestartButton() {
  const x = canvas.width - RIGHT_UI() / 2;
  const y = 60;
  context.save();
  context.fillStyle = "#f59e0b";
  context.fillRect(x - restartBtn.size / 2, y - restartBtn.size / 2, restartBtn.size, restartBtn.size);
  context.fillStyle = "black";
  context.font = "bold 12px Arial";
  context.textAlign = "center";
  context.fillText("RST", x, y + 4);
  context.restore();
}

function drawFog() {
  if (gameState !== "play") return;
  context.save();
  context.beginPath();
  context.rect(GAME_X(), 0, GAME_WIDTH(), canvas.height);
  const maskRadius = 75;
  context.arc(player.x + player.width / 2, player.y + player.height / 2, maskRadius, 0, Math.PI * 2, true);
  context.fillStyle = "rgba(0, 0, 0, 1.0)";
  context.fill();
  context.restore();
}

function resetTouch() {
  touch.left = false; touch.right = false; touch.jump = false;
}

function handleTouch(e) {
  e.preventDefault();
  
  const rect = canvas.getBoundingClientRect();
  const scaleX = canvas.width / rect.width;
  const scaleY = canvas.height / rect.height;

  // Handle Main Menu or Victory Screen Reset clicks
  if (gameState === "menu" || gameState === "victory") {
    if (e.type === "touchstart") {
      // Trigger fullscreen right as they start the speedrun!
      toggleFullscreen().catch(err => console.log("Fullscreen request deferred."));
      
      currentLevelIndex = 0;
      totalPlayTime = 0.0; // Reset stopwatch
      loadLevel(currentLevelIndex);
    }
    return;
  }

  resetTouch();
  let activeTouches = e.type === "touchend" ? e.touches : e.targetTouches;

  for (let t of activeTouches) {
    const x = (t.clientX - rect.left) * scaleX;
    const y = (t.clientY - rect.top) * scaleY;

    // Left Panel Movement
    if (x < LEFT_UI()) {
      const centerX = LEFT_UI() / 2;
      if (x < centerX) touch.left = true;
      else touch.right = true;
    }

    // Right Panel Actions
    if (x > canvas.width - RIGHT_UI()) {
      // Check Restart Button Hit
      const rstX = canvas.width - RIGHT_UI() / 2;
      const rstY = 60;
      if (Math.hypot(x - rstX, y - rstY) < restartBtn.size / 2 && e.type === "touchstart") {
        loadLevel(currentLevelIndex); // Quick map refresh (Stopwatch keeps tracking!)
        return;
      }

      // Check Jump Button Hit
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

// Core Loop Engine
let loop = GameLoop({
  update() {
    if (gameState === "menu" || gameState === "victory") return;

    // The Stopwatch ticks up continuously during BOTH the memorization phase and the blind run phase!
    totalPlayTime += 1 / 60;

    // Handle Memorization Phase countdown step
    if (gameState === "memorize") {
      stateTimer -= 1 / 60;
      if (stateTimer <= 0) gameState = "play";
    }

    player.update();

    // Floor Bounding Box resolution
    player.grounded = false;
    const floor = canvas.height - 40;
    if (player.y + player.height >= floor) {
      player.y = floor - player.height;
      player.dy = 0;
      player.grounded = true;
    }

    // Platform Block Axis resolution
    for (let p of platforms) {
      if (player.x < p.x + p.width && player.x + player.width > p.x &&
          player.y < p.y + p.height && player.y + player.height > p.y) {
        let overlapX = Math.min(player.x + player.width - p.x, p.x + p.width - player.x);
        let overlapY = Math.min(player.y + player.height - p.y, p.y + p.height - player.y);

        if (overlapX < overlapY) {
          if (player.x + player.width / 2 < p.x + p.width / 2) player.x -= overlapX;
          else player.x += overlapX;
        } else {
          if (player.y + player.height / 2 < p.y + p.height / 2) {
            player.y -= overlapY; player.dy = 0; player.grounded = true;
          } else {
            player.y += overlapY; player.dy = 0;
          }
        }
      }
    }

    // Spike Collision Detection (Forces a checkpoint restart)
    for (let spike of spikes) {
      if (player.x < spike.x + spike.width && player.x + player.width > spike.x &&
          player.y < spike.y + spike.height && player.y + player.height > spike.y) {
        loadLevel(currentLevelIndex); 
      }
    }

    // Star Collection Detection
    for (let star of stars) {
      if (!star.pickedUp && player.x < star.x + star.width && player.x + player.width > star.x &&
          player.y < star.y + star.height && player.y + player.height > star.y) {
        star.pickedUp = true;
        currentLevelIndex++;
        loadLevel(currentLevelIndex);
      }
    }
  },

  render() {
    context.clearRect(0, 0, canvas.width, canvas.height);

    // 1. Draw Environment Viewports
    drawGameArea();
    platforms.forEach(p => p.render());
    spikes.forEach(s => s.render());
    stars.forEach(star => star.render());

    // 2. Draw Fog Overlay
    drawFog();

    // 3. Draw Character & Floor above darkness
    drawGround();
    if (gameState !== "menu" && gameState !== "victory") {
      player.render();
    }

    // 4. Render UI Panels
    drawControlsBackground();
    if (gameState !== "menu" && gameState !== "victory") {
      drawDpad();
      drawJumpButton();
      drawRestartButton();
    }

    // 5. HUD Text Layout Displays
    context.fillStyle = "white";
    context.font = "bold 16px Arial";
    context.textAlign = "center";
    
    // Level display counter
    context.fillText(`STAGE: ${currentLevelIndex + 1}`, LEFT_UI() / 2, 45);

    // Live Stopwatch View: displays current elapsed time down to two decimal spots!
    if (gameState === "play" || gameState === "memorize") {
      context.fillStyle = "#38bdf8";
      context.fillText(`TIME: ${totalPlayTime.toFixed(2)}s`, LEFT_UI() / 2, 85);
    }

    // State Banner Screens overlay texts
    context.textAlign = "center";
    if (gameState === "menu") {
      context.fillStyle = "#06b6d4";
      context.font = "bold 32px Arial";
      context.fillText("BLIND MEMORY", GAME_X() + GAME_WIDTH() / 2, canvas.height / 2 - 20);
      context.fillStyle = "white";
      context.font = "18px Arial";
      context.fillText("Tap screen to start speedrun 🎮", GAME_X() + GAME_WIDTH() / 2, canvas.height / 2 + 30);
    } else if (gameState === "victory") {
      context.fillStyle = "#22c55e";
      context.font = "bold 36px Arial";
      context.fillText("VICTORY!", GAME_X() + GAME_WIDTH() / 2, canvas.height / 2 - 40);
      
      context.fillStyle = "white";
      context.font = "bold 22px Arial";
      context.fillText(`Final Time: ${totalPlayTime.toFixed(2)} seconds`, GAME_X() + GAME_WIDTH() / 2, canvas.height / 2 + 10);
      
      context.font = "16px Arial";
      context.fillStyle = "#94a3b8";
      context.fillText("Tap screen to challenge your highscore", GAME_X() + GAME_WIDTH() / 2, canvas.height / 2 + 60);
    } else if (gameState === "memorize") {
      context.fillStyle = "#fbbf24";
      context.font = "bold 24px Arial";
      context.fillText(`MEMORIZE MAP: ${Math.ceil(stateTimer)}s`, GAME_X() + GAME_WIDTH() / 2, 50);
    }
  }
});

loop.start();
