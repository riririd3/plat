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
let totalPlayTime = 0.0;   // GLOBAL STOPWATCH
let platforms = [];
let spikes = [];
let stars = [];
let particles = [];

// Cosmetic Trail System
let playerTrail = [];
let starPulseTime = 0; // Global clock to animate stars smoothly

// Touch state
let touch = { left: false, right: false, jump: false };

// UI Control Layout Dimensions
const dpad = { size: 50 };
const jumpBtn = { size: 50 };
const restartBtn = { size: 40 };

// Center Screen Menu Button Dimensions
const startMenuBtn = { w: 200, h: 50 };
const centerFullBtn = { w: 200, h: 45 };

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

    // SCREEN WRAP-AROUND LOGIC
    if (this.x + this.width < GAME_X()) {
      this.x = GAME_X() + GAME_WIDTH() - 1; 
    } 
    else if (this.x > GAME_X() + GAME_WIDTH()) {
      this.x = GAME_X() - this.width + 1;
    }
  }
});

function spawnExplosion(originX, originY, spawnColor, count = 20) {
  for (let i = 0; i < count; i++) {
    let angle = Math.random() * Math.PI * 2;
    let speed = 1 + Math.random() * 4;

    particles.push({
      x: originX,
      y: originY,
      vx: Math.cos(angle) * speed,
      vy: Math.sin(angle) * speed,
      size: 4 + Math.random() * 6,
      alpha: 1.0,
      decay: 0.02 + Math.random() * 0.02, 
      color: spawnColor
    });
  }
}

function loadLevel(index) {
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
  playerTrail = []; 

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

  // 1. Load Platforms (Upgraded for movement properties)
  if (currentLevel.platforms) {
    currentLevel.platforms.forEach(p => {
      platforms.push(Sprite({
        x: GAME_X() + p.x, 
        y: p.y, 
        width: p.w, 
        height: p.h, 
        color: "#334155",
        vx: p.vx || 0,
        vy: p.vy || 0,
        minX: p.minX ? GAME_X() + p.minX : null,
        maxX: p.maxX ? GAME_X() + p.maxX : null,
        minY: p.minY || null,
        maxY: p.maxY || null
      }));
    });
  }

  // 2. Load Spikes (Upgraded for movement properties)
  if (currentLevel.spikes) {
    currentLevel.spikes.forEach(s => {
      spikes.push(Sprite({
        x: GAME_X() + s.x, 
        y: s.y, 
        width: s.w,
        height: s.h,
        color: "#ef4444",
        vx: s.vx || 0,
        vy: s.vy || 0,
        minX: s.minX ? GAME_X() + s.minX : null,
        maxX: s.maxX ? GAME_X() + s.maxX : null,
        minY: s.minY || null,
        maxY: s.maxY || null
      }));
    });
  }

  // 3. Load Stars
  if (currentLevel.stars) {
    currentLevel.stars.forEach(s => {
      stars.push(Sprite({
        x: GAME_X() + s.x, 
        y: s.y, 
        width: 20, 
        height: 20, 
        color: "gold", 
        pickedUp: false
      }));
    });
  }
}

// Cyberpunk Grid Rendering Space Layouts
function drawGameArea() {
  let gradient = context.createLinearGradient(GAME_X(), 0, GAME_X(), canvas.height);
  gradient.addColorStop(0, "#0f172a"); 
  gradient.addColorStop(1, "#1e1e38"); 
  context.fillStyle = gradient;
  context.fillRect(GAME_X(), 0, GAME_WIDTH(), canvas.height);

  context.save();
  context.strokeStyle = "rgba(99, 102, 241, 0.08)"; 
  context.lineWidth = 1;
  
  let offsetX = (GAME_X() - (player.x * 0.1)) % 40;
  for (let x = GAME_X() + offsetX; x < GAME_X() + GAME_WIDTH(); x += 40) {
    context.beginPath();
    context.moveTo(x, 0);
    context.lineTo(x, canvas.height);
    context.stroke();
  }
  context.restore();
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

function drawMenuButtons() {
  const midX = GAME_X() + GAME_WIDTH() / 2;
  
  const startX = midX - startMenuBtn.w / 2;
  const startY = canvas.height / 2 - 20;
  context.save();
  context.fillStyle = "#10b981";
  context.fillRect(startX, startY, startMenuBtn.w, startMenuBtn.h);
  context.fillStyle = "white";
  context.font = "bold 18px Arial";
  context.textAlign = "center";
  context.fillText(gameState === "victory" ? "PLAY AGAIN" : "START GAME", midX, startY + 31);

  const fullX = midX - centerFullBtn.w / 2;
  const fullY = startY + startMenuBtn.h + 15;
  context.fillStyle = "#3b82f6";
  context.fillRect(fullX, fullY, centerFullBtn.w, centerFullBtn.h);
  context.fillStyle = "white";
  context.font = "bold 16px Arial";
  context.fillText("TOGGLE FULLSCREEN", midX, fullY + 28);
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

async function toggleFullscreen() {
  if (!document.fullscreenElement) {
    await document.documentElement.requestFullscreen();
  } else {
    await document.exitFullscreen();
  }
}

function handleTouch(e) {
  e.preventDefault();
  
  const rect = canvas.getBoundingClientRect();
  const scaleX = canvas.width / rect.width;
  const scaleY = canvas.height / rect.height;

  let activeTouches = e.type === "touchend" ? e.touches : e.targetTouches;

  for (let t of activeTouches) {
    const x = (t.clientX - rect.left) * scaleX;
    const y = (t.clientY - rect.top) * scaleY;

    if (x > canvas.width - RIGHT_UI()) {
      const rstX = canvas.width - RIGHT_UI() / 2;
      const rstY = 60;
      if (Math.hypot(x - rstX, y - rstY) < restartBtn.size / 2 && e.type === "touchstart") {
        if (gameState === "play" || gameState === "memorize") {
          loadLevel(currentLevelIndex);
        }
        return;
      }
    }
  }

  if (gameState === "menu" || gameState === "victory") {
    if (e.type === "touchstart") {
      for (let t of e.targetTouches) {
        const x = (t.clientX - rect.left) * scaleX;
        const y = (t.clientY - rect.top) * scaleY;

        const midX = GAME_X() + GAME_WIDTH() / 2;
        const startX = midX - startMenuBtn.w / 2;
        const startY = canvas.height / 2 - 20;

        const fullX = midX - centerFullBtn.w / 2;
        const fullY = startY + startMenuBtn.h + 15;

        if (x > startX && x < startX + startMenuBtn.w && y > startY && y < startY + startMenuBtn.h) {
          currentLevelIndex = 0;
          totalPlayTime = 0.0;
          loadLevel(currentLevelIndex);
          return;
        }

        if (x > fullX && x < fullX + centerFullBtn.w && y > fullY && y < fullY + centerFullBtn.h) {
          toggleFullscreen().catch(err => console.log("Fullscreen blocked"));
          return;
        }
      }
    }
    return;
  }

  resetTouch();
  for (let t of activeTouches) {
    const x = (t.clientX - rect.left) * scaleX;
    const y = (t.clientY - rect.top) * scaleY;

    if (x < LEFT_UI()) {
      const centerX = LEFT_UI() / 2;
      if (x < centerX) touch.left = true;
      else touch.right = true;
    }

    if (x > canvas.width - RIGHT_UI()) {
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
    // 1. Particle update physics mechanics
    for (let i = particles.length - 1; i >= 0; i--) {
      let p = particles[i];
      p.x += p.vx;
      p.y += p.vy;
      p.vy += 0.1; 
      p.alpha -= p.decay;

      if (p.alpha <= 0) {
        particles.splice(i, 1);
      }
    }

    if (gameState === "menu" || gameState === "victory") return;

    totalPlayTime += 1 / 60;
    starPulseTime += 0.05; 

    if (gameState === "memorize") {
      stateTimer -= 1 / 60;
      if (stateTimer <= 0) gameState = "play";
    }

    // 2. UPDATE MOVING PLATFORMS & SPIKES (Stays here in update!)
    platforms.forEach(p => {
      p.x += p.vx;
      p.y += p.vy;
      if (p.minX !== null && p.maxX !== null) {
        if (p.x <= p.minX || p.x + p.width >= p.maxX) p.vx *= -1;
      }
      if (p.minY !== null && p.maxY !== null) {
        if (p.y <= p.minY || p.y + p.height >= p.maxY) p.vy *= -1;
      }
    });

    spikes.forEach(s => {
      s.x += s.vx;
      s.y += s.vy;
      if (s.minX !== null && s.maxX !== null) {
        if (s.x <= s.minX || s.x + s.width >= s.maxX) s.vx *= -1;
      }
      if (s.minY !== null && s.maxY !== null) {
        if (s.y <= s.minY || s.y + s.height >= s.maxY) s.vy *= -1;
      }
    });

    player.update();

    if (gameState === "play") {
      playerTrail.push({ x: player.x, y: player.y, alpha: 0.45 });
      if (playerTrail.length > 8) playerTrail.shift();
      playerTrail.forEach(t => t.alpha -= 0.04);
    }

    // Ground Boundary
    player.grounded = false;
    const floor = canvas.height - 40;
    if (player.y + player.height >= floor) {
      player.y = floor - player.height;
      player.dy = 0;
      player.grounded = true;
    }

    // Upgraded Platform Collisions + Rider Physics
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
            player.y -= overlapY; 
            player.dy = 0; 
            player.grounded = true;

            // Target Rider Attachment! Drag character along with platform speeds
            player.x += p.vx;
            player.y += p.vy; 
          } else {
            player.y += overlapY; player.dy = 0;
          }
        }
      }
    }

    // Hazard Collisions
    for (let spike of spikes) {
      if (player.x < spike.x + spike.width && player.x + player.width > spike.x &&
          player.y < spike.y + spike.height && player.y + player.height > spike.y) {
        spawnExplosion(player.x + player.width / 2, player.y + player.height / 2, "#ef4444", 25);
        loadLevel(currentLevelIndex); 
      }
    }

    // Star Collisions
    for (let star of stars) {
      if (!star.pickedUp && player.x < star.x + star.width && player.x + player.width > star.x &&
          player.y < star.y + star.height && player.y + player.height > star.y) {
        star.pickedUp = true;
        spawnExplosion(star.x + star.width / 2, star.y + star.height / 2, "gold", 40);
        currentLevelIndex++;
        loadLevel(currentLevelIndex);
      }
    }
  }, 

  render() {
    context.clearRect(0, 0, canvas.width, canvas.height);

    drawGameArea();
    drawGround();

    // 1. Draw Platforms (Restored!)
    platforms.forEach(p => {
      context.save();
      context.fillStyle = "#1e293b";
      context.fillRect(p.x + 4, p.y + 4, p.width, p.height);

      context.fillStyle = p.color;
      context.fillRect(p.x, p.y, p.width, p.height);

      context.strokeStyle = "#6366f1"; 
      context.lineWidth = 3;           
      context.strokeRect(p.x, p.y, p.width, p.height);
      context.restore();
    });

    // 2. Draw Spikes
    spikes.forEach(s => {
      context.save();
      context.translate(s.x + s.width / 2, s.y + s.height / 2);
      context.fillStyle = s.color;
      context.beginPath();
      context.moveTo(0, -s.height / 2);
      context.lineTo(-s.width / 2, s.height / 2);
      context.lineTo(s.width / 2, s.height / 2);
      context.closePath();
      context.fill();
      context.restore();
    });

    // 3. Draw Stars
    stars.forEach(star => {
      if (star.pickedUp) return;
      let hoverY = Math.sin(starPulseTime) * 4;
      let auraScale = 1.0 + Math.abs(Math.sin(starPulseTime * 0.5)) * 0.6;

      context.save();
      context.translate(star.x + star.width / 2, star.y + star.height / 2 + hoverY);
      
      context.globalAlpha = 0.25;
      context.fillStyle = star.color;
      context.beginPath();
      context.arc(0, 0, (star.width / 2) * auraScale, 0, Math.PI * 2);
      context.fill();
      
      context.globalAlpha = 1.0;
      context.rotate(starPulseTime * 0.2);
      context.fillRect(-star.width / 2, -star.height / 2, star.width, star.height);
      context.restore();
    });

    drawFog();

    // 4. Draw Particles
    particles.forEach(p => {
      context.save();
      context.globalAlpha = p.alpha;
      context.fillStyle = p.color;
      context.fillRect(p.x, p.y, p.size, p.size);
      context.restore();
    });

    // 5. Draw Player, Trails, and Mirror Edge Clones
    if (gameState !== "menu" && gameState !== "victory") {
      playerTrail.forEach(t => {
        if (t.alpha > 0) {
          context.save();
          context.globalAlpha = t.alpha;
          context.fillStyle = "#22c55e"; 
          context.fillRect(t.x, t.y, player.width, player.height);
          context.restore();
        }
      });
      
      // Main Player Block
      context.save();
      context.fillStyle = player.color;
      context.fillRect(player.x, player.y, player.width, player.height);
      context.restore();
      
      // Screen wrap ghost renders
      context.save();
      context.fillStyle = player.color;
      if (player.x > GAME_X() + GAME_WIDTH() - player.width) {
        context.fillRect(player.x - GAME_WIDTH(), player.y, player.width, player.height);
      } else if (player.x < GAME_X()) {
        context.fillRect(player.x + GAME_WIDTH(), player.y, player.width, player.height);
      }
      context.restore();
    }

    drawControlsBackground();
    if (gameState !== "menu" && gameState !== "victory") {
      drawDpad();
      drawJumpButton();
      drawRestartButton();
    }

    context.fillStyle = "white";
    context.font = "bold 16px Arial";
    context.textAlign = "center";
    
    context.fillText(`STAGE: ${currentLevelIndex + 1}`, LEFT_UI() / 2, 110);

    if (gameState === "play" || gameState === "memorize") {
      context.fillStyle = "#38bdf8";
      context.fillText(`TIME: ${totalPlayTime.toFixed(2)}s`, LEFT_UI() / 2, 150);
    }

    if (gameState === "menu") {
      context.fillStyle = "#06b6d4";
      context.font = "bold 36px Arial";
      context.fillText("BLIND MEMORY", GAME_X() + GAME_WIDTH() / 2, canvas.height / 2 - 40);
      drawMenuButtons();
    } else if (gameState === "victory") {
      context.fillStyle = "#22c55e";
      context.font = "bold 36px Arial";
      context.fillText("VICTORY!", GAME_X() + GAME_WIDTH() / 2, canvas.height / 2 - 50);
      
      context.fillStyle = "white";
      context.font = "bold 20px Arial";
      context.fillText(`Final Time: ${totalPlayTime.toFixed(2)}s`, GAME_X() + GAME_WIDTH() / 2, canvas.height / 2 - 10);
      drawMenuButtons();
    } else if (gameState === "memorize") {
      context.fillStyle = "#fbbf24";
      context.font = "bold 24px Arial";
      context.fillText(`MEMORIZE MAP: ${Math.ceil(stateTimer)}s`, GAME_X() + GAME_WIDTH() / 2, 50);
    }
  } 
}); 

gameState = "menu"; 
loop.start();
