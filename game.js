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

let z_ctx;

// 🔊 Centralized Sound Manager
function playSound(type) {
  if (isMuted) return;
  
  // 1. Ensure AudioContext is ready
  try {
    if (!z_ctx) z_ctx = new (window.AudioContext || window.webkitAudioContext)();
    if (z_ctx.state === 'suspended') z_ctx.resume();
  } catch (e) {
    console.log("Audio context failed to start");
  }

  // 2. Play the sound (Requires ZzFXMicro.min.js loaded in index.html)
  try {
    if (type === 'jump') zzfx(...[1,,458,.05,.03,.07,,3,,198,,,,,,,.04,.53,.03,,-1462]);
    if (type === 'gravity') zzfx(...[1,,286,.01,.03,.38,2,.43,-8.1,-0.1,-50,-0.01,.02,.2,,,.01,1.09,.05,.01]);
    if (type === 'spike') zzfx(...[,,301,.04,,,3,1.46,.1,.1,-110,.18,-0.01,-0.1,-2,-0.1,,.63,,.01]);
    if (type === 'star') zzfx(...[1,0,292,.1,.31,.8,1,.7,,,99,,.1,,,,.3,.99,,.02]);
    if (type === 'buttons') zzfx(...[,0,292,.1,,.5,2,.7,,,22,,,,5,,.3,.99]);
  } catch (e) { // Fixed: added closing brace here
    console.log("Sound could not play");
  }
}

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

// Game State Engine Variables
let currentLevelIndex = 0;
let gameState = "menu"; 
let stateTimer = 3.0;      
let totalPlayTime = 0.0;   

// Dynamic Entity Arrays
let platforms = [];
let spikes = [];
let stars = [];
let particles = [];
let torches = [];
let buttons = [];
let gates = [];
let fragileBlocks = [];
let pads = [];
let gravityPlatforms = [];
let gravityDir = 1; // 1 = Normal (Down), -1 = Inverted (Up)

// Cosmetic Trail Systems
let playerTrail = [];
let starPulseTime = 0; 

// Mobile Input Structures
let touch = { left: false, right: false, jump: false };
const dpad = { size: 50 };
const jumpBtn = { size: 50 };
const restartBtn = { size: 40 };
let isMuted = false;
const startMenuBtn = { w: 200, h: 50 };
const centerFullBtn = { w: 200, h: 45 };

// Upgraded Player Configuration with variable gravity direction
let player = Sprite({
  x: 0, y: 0, width: 32, height: 32, color: "lime", dy: 0, grounded: false,
  update() {
    if (gameState !== "play") {
      this.dy = 0;
      return;
    }
    if (keyPressed("left") || touch.left) this.x -= 4;
    if (keyPressed("right") || touch.right) this.x += 4;
    
    // 🤸 JUMP LOGIC: Differentiates jump vectors depending on upside-down status
    if ((keyPressed("space") || touch.jump) && this.grounded) {
      playSound('jump');
      if (gravityDir === 1) {
        this.dy = -11; 
      } else {
        this.dy = 7; // Flings you downward away from the ceiling
      }
      this.grounded = false;
    }
    
    // DYNAMIC GRAVITY: Pulls down if gravityDir is 1, pulls up if -1
    this.dy += 0.5 * gravityDir;
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
      x: originX, y: originY,
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

  platforms = []; spikes = []; stars = []; playerTrail = [];
  torches = []; buttons = []; gates = []; fragileBlocks = []; pads = [];
  gravityPlatforms = [];
  gravityDir = 1; 

  const currentLevel = LEVEL_MAPS[index];

  if (currentLevel.gravityPlatforms) {
    currentLevel.gravityPlatforms.forEach(gp => {
      gravityPlatforms.push({
        x: GAME_X() + gp.x, y: gp.y, width: gp.w, height: gp.h, type: gp.type,
        color: gp.type === "inverter" ? "#06b6d4" : "#f97316"
      });
    });
  }

  if (currentLevel.playerSpawn) {
    player.x = GAME_X() + currentLevel.playerSpawn.x;
    player.y = currentLevel.playerSpawn.y;
  } else {
    player.x = GAME_X() + 40;
    player.y = canvas.height - 120;
  }
  player.dy = 0;
  player.grounded = false;

  if (currentLevel.platforms) {
    currentLevel.platforms.forEach(p => {
      platforms.push(Sprite({
        x: GAME_X() + p.x, y: p.y, width: p.w, height: p.h, color: "#334155",
        vx: p.vx || 0, vy: p.vy || 0,
        minX: p.minX ? GAME_X() + p.minX : null, maxX: p.maxX ? GAME_X() + p.maxX : null,
        minY: p.minY || null, maxY: p.maxY || null
      }));
    });
  }

  if (currentLevel.spikes) {
    currentLevel.spikes.forEach(s => {
      spikes.push(Sprite({
        x: GAME_X() + s.x, y: s.y, width: s.w, height: s.h, color: "#ef4444",
        vx: s.vx || 0, vy: s.vy || 0,
        minX: s.minX ? GAME_X() + s.minX : null, maxX: s.maxX ? GAME_X() + s.maxX : null,
        minY: s.minY || null, maxY: s.maxY || null
      }));
    });
  }

  if (currentLevel.stars) {
    currentLevel.stars.forEach(s => {
      stars.push(Sprite({ x: GAME_X() + s.x, y: s.y, width: 20, height: 20, color: "gold", pickedUp: false }));
    });
  }

  if (currentLevel.torches) {
    currentLevel.torches.forEach(t => {
      torches.push({ x: GAME_X() + t.x, y: t.y, radius: t.radius || 85 });
    });
  }
  
  if (currentLevel.buttons) {
    currentLevel.buttons.forEach(b => {
      buttons.push({ x: GAME_X() + b.x, y: b.y, w: b.w || 32, h: b.h || 10, pressed: false, color: "#eab308" });
    });
  }
  
  if (currentLevel.gates) {
    currentLevel.gates.forEach(g => {
      gates.push({ x: GAME_X() + g.x, y: g.y, w: g.w || 20, h: g.h || 80, opened: false, color: "#3b82f6" });
    });
  }

  if (currentLevel.fragileBlocks) {
    currentLevel.fragileBlocks.forEach(fb => {
      fragileBlocks.push({ x: GAME_X() + fb.x, y: fb.y, width: fb.w, height: fb.h, state: "solid", timer: 0.0, color: "#f43f5e" });
    });
  }

  if (currentLevel.pads) {
    currentLevel.pads.forEach(pd => {
      pads.push({ x: GAME_X() + pd.x, y: pd.y, width: pd.w || 32, height: pd.h || 12, type: pd.type, power: pd.power, color: pd.type === "dash" ? "#06b6d4" : "#a855f7" });
    });
  }
}

function drawGameArea() {
  let gradient = context.createLinearGradient(GAME_X(), 0, GAME_X(), canvas.height);
  gradient.addColorStop(0, "#0f172a"); gradient.addColorStop(1, "#1e1e38"); 
  context.fillStyle = gradient;
  context.fillRect(GAME_X(), 0, GAME_WIDTH(), canvas.height);
  context.save();
  context.strokeStyle = "rgba(99, 102, 241, 0.08)"; context.lineWidth = 1;
  let offsetX = (GAME_X() - (player.x * 0.1)) % 40;
  for (let x = GAME_X() + offsetX; x < GAME_X() + GAME_WIDTH(); x += 40) {
    context.beginPath(); context.moveTo(x, 0); context.lineTo(x, canvas.height); context.stroke();
  }
  context.restore();
}

function drawGround() { context.fillStyle = "#334155"; context.fillRect(GAME_X(), canvas.height - 40, GAME_WIDTH(), 40); }
function drawControlsBackground() { context.fillStyle = "#111"; context.fillRect(0, 0, LEFT_UI(), canvas.height); context.fillRect(canvas.width - RIGHT_UI(), 0, RIGHT_UI(), canvas.height); }
function drawDpad() { const cX = LEFT_UI() / 2; const cY = canvas.height - 140 - SAFE; context.save(); context.globalAlpha = touch.left ? 0.8 : 0.4; context.fillStyle = "white"; context.fillRect(cX - dpad.size - 10, cY, dpad.size, dpad.size); context.globalAlpha = touch.right ? 0.8 : 0.4; context.fillRect(cX + 10, cY, dpad.size, dpad.size); context.restore(); }
function drawJumpButton() { const x = canvas.width - RIGHT_UI() / 2; const y = canvas.height - 140 - SAFE + jumpBtn.size / 2; context.save(); context.globalAlpha = touch.jump ? 0.8 : 0.4; context.fillStyle = "#06b6d4"; context.beginPath(); context.arc(x, y, jumpBtn.size / 2, 0, Math.PI * 2); context.fill(); context.restore(); }
// Draw the Restart Button
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
// Draw the Mute Button
function drawMuteButton() {
  const x = canvas.width - RIGHT_UI() / 2; 
  const y = 120; 
  context.save();
  context.fillStyle = isMuted ? "#ef4444" : "#22c55e"; 
  context.fillRect(x - restartBtn.size / 2, y - restartBtn.size / 2, restartBtn.size, restartBtn.size);
  context.fillStyle = "black";
  context.font = "bold 10px Arial";
  context.textAlign = "center";
  context.fillText(isMuted ? "MUTE" : "PLAY", x, y + 4);
  context.restore();
}
function drawMenuButtons() { const midX = GAME_X() + GAME_WIDTH() / 2; const startX = midX - startMenuBtn.w / 2; const startY = canvas.height / 2 - 20; context.save(); context.fillStyle = "#10b981"; context.fillRect(startX, startY, startMenuBtn.w, startMenuBtn.h); context.fillStyle = "white"; context.font = "bold 18px Arial"; context.textAlign = "center"; context.fillText(gameState === "victory" ? "PLAY AGAIN" : "START GAME", midX, startY + 31); const fullX = midX - centerFullBtn.w / 2; const fullY = startY + startMenuBtn.h + 15; context.fillStyle = "#3b82f6"; context.fillRect(fullX, fullY, centerFullBtn.w, centerFullBtn.h); context.fillStyle = "white"; context.font = "bold 16px Arial"; context.fillText("TOGGLE FULLSCREEN", midX, fullY + 28); context.restore(); }

function drawFog() {
  if (gameState !== "play") return;

  // 1. Create a temporary, un-attached buffer canvas to calculate light layers safely
  if (!window.fogCanvas) {
    window.fogCanvas = document.createElement("canvas");
    window.fogCtx = window.fogCanvas.getContext("2d");
  }
  
  const fCanvas = window.fogCanvas;
  const fCtx = window.fogCtx;

  if (fCanvas.width !== canvas.width || fCanvas.height !== canvas.height) {
    fCanvas.width = canvas.width;
    fCanvas.height = canvas.height;
  }

  // 2. Clear out the buffer and paint it entirely solid black
  fCtx.clearRect(0, 0, fCanvas.width, fCanvas.height);
  fCtx.fillStyle = "rgba(0, 0, 0, 0.98)";
  fCtx.fillRect(GAME_X(), 0, GAME_WIDTH(), canvas.height);

  // 3. Switch the blend mode to "destination-out" (this turns solid fills into pure transparent eraser holes)
  fCtx.globalCompositeOperation = "destination-out";

  // 4. Punch out the player's flashlight hole
  const pX = player.x + player.width / 2;
  const pY = player.y + player.height / 2;
  const maskRadius = 75;
  
  fCtx.fillStyle = "black"; // Color doesn't matter for erasing, only alpha shape matters
  fCtx.beginPath();
  fCtx.arc(pX, pY, maskRadius, 0, Math.PI * 2);
  fCtx.fill();

  // 5. Punch out the static torch holes (They will merge cleanly with the flashlight hole now!)
  torches.forEach(t => {
    fCtx.beginPath();
    fCtx.arc(t.x, t.y, t.radius, 0, Math.PI * 2);
    fCtx.fill();
  });

  stars.forEach(s => {
    if (!s.pickedUp) {
      fCtx.beginPath();
      fCtx.arc(s.x + s.width / 2, s.y + s.height / 2, 30, 0, Math.PI * 2);
      fCtx.fill();
    }
  });

  // 6. Reset the buffer composition mode back to normal
  fCtx.globalCompositeOperation = "source-over";

  // 7. Paint our completed dark mask on top of the main game board
  context.drawImage(fCanvas, 0, 0);
}

function resetTouch() { touch.left = false; touch.right = false; touch.jump = false; }
async function toggleFullscreen() { if (!document.fullscreenElement) await document.documentElement.requestFullscreen(); else await document.exitFullscreen(); }

function handleTouch(e) {
  e.preventDefault();
  const rect = canvas.getBoundingClientRect();
  const scaleX = canvas.width / rect.width;
  const scaleY = canvas.height / rect.height;
  let activeTouches = e.type === "touchend" ? e.touches : e.targetTouches;

  for (let t of activeTouches) {
    const x = (t.clientX - rect.left) * scaleX; const y = (t.clientY - rect.top) * scaleY;
    const muteX = canvas.width - RIGHT_UI() / 2; 
    const muteY = 120;
    if (Math.hypot(x - muteX, y - muteY) < restartBtn.size / 2 && e.type === "touchstart") {
      isMuted = !isMuted; // Toggle sound
      return;
    }
    if (x > canvas.width - RIGHT_UI()) {
      const rstX = canvas.width - RIGHT_UI() / 2; const rstY = 60;
      if (Math.hypot(x - rstX, y - rstY) < restartBtn.size / 2 && e.type === "touchstart") {
        if (gameState === "play" || gameState === "memorize") loadLevel(currentLevelIndex);
        return;
      }
    }
  }

  if (gameState === "menu" || gameState === "victory") {
    if (e.type === "touchstart") {
      for (let t of e.targetTouches) {
        const x = (t.clientX - rect.left) * scaleX; const y = (t.clientY - rect.top) * scaleY;
        const midX = GAME_X() + GAME_WIDTH() / 2;
        const startX = midX - startMenuBtn.w / 2; const startY = canvas.height / 2 - 20;
        const fullX = midX - centerFullBtn.w / 2; const fullY = startY + startMenuBtn.h + 15;

        if (x > startX && x < startX + startMenuBtn.w && y > startY && y < startY + startMenuBtn.h) {
          currentLevelIndex = 0; totalPlayTime = 0.0; loadLevel(currentLevelIndex); return;
        }
        if (x > fullX && x < fullX + centerFullBtn.w && y > fullY && y < fullY + centerFullBtn.h) {
          toggleFullscreen().catch(err => console.log("Fullscreen blocked")); return;
        }
      }
    }
    return;
  }

  resetTouch();
  for (let t of activeTouches) {
    const x = (t.clientX - rect.left) * scaleX; const y = (t.clientY - rect.top) * scaleY;
    if (x < LEFT_UI()) {
      const cX = LEFT_UI() / 2; if (x < cX) touch.left = true; else touch.right = true;
    }
    if (x > canvas.width - RIGHT_UI()) {
      const jX = canvas.width - RIGHT_UI() / 2; const jY = canvas.height - 140 - SAFE + jumpBtn.size / 2;
      if (Math.hypot(x - jX, y - jY) < jumpBtn.size / 2) touch.jump = true;
    }
  }
}

canvas.addEventListener("touchstart", handleTouch, { passive: false });
canvas.addEventListener("touchmove", handleTouch, { passive: false });
canvas.addEventListener("touchend", handleTouch, { passive: false });

// Core Game Processing Engine
let loop = GameLoop({
  update() {
    for (let i = particles.length - 1; i >= 0; i--) {
      let p = particles[i]; p.x += p.vx; p.y += p.vy; p.vy += 0.1; p.alpha -= p.decay;
      if (p.alpha <= 0) particles.splice(i, 1);
    }

    if (gameState === "menu" || gameState === "victory") return;

    totalPlayTime += 1 / 60;
    starPulseTime += 0.05; 

    if (gameState === "memorize") {
      stateTimer -= 1 / 60;
      if (stateTimer <= 0) gameState = "play";
    }

    platforms.forEach(p => {
      p.x += p.vx; p.y += p.vy;
      if (p.minX !== null && p.maxX !== null) { if (p.x <= p.minX || p.x + p.width >= p.maxX) p.vx *= -1; }
      if (p.minY !== null && p.maxY !== null) { if (p.y <= p.minY || p.y + p.height >= p.maxY) p.vy *= -1; }
    });

    spikes.forEach(s => {
      s.x += s.vx; s.y += s.vy;
      if (s.minX !== null && s.maxX !== null) { if (s.x <= s.minX || s.x + s.width >= s.maxX) s.vx *= -1; }
      if (s.minY !== null && s.maxY !== null) { if (s.y <= s.minY || s.y + s.height >= s.maxY) s.vy *= -1; }
    });

    fragileBlocks.forEach(b => {
      if (b.state === "stepping") {
        b.timer += 1 / 60;
        if (b.timer >= 0.4) { b.state = "broken"; b.timer = 0; }
      } else if (b.state === "broken") {
        b.timer += 1 / 60;
        if (b.timer >= 1.0) { b.state = "solid"; b.timer = 0; } 
      }
    });

    player.update();

    if (gameState === "play") {
      playerTrail.push({ x: player.x, y: player.y, alpha: 0.45 });
      if (playerTrail.length > 8) playerTrail.shift();
      playerTrail.forEach(t => t.alpha -= 0.04);
    }

    player.grounded = false;
    const floor = canvas.height - 40;
    const ceiling = 0; 

    if (gravityDir === 1) {
      if (player.y + player.height >= floor) {
        player.y = floor - player.height;
        player.dy = 0;
        player.grounded = true;
      }
    } else {
      if (player.y <= ceiling) {
        player.y = ceiling;
        player.dy = 0;
        player.grounded = true;
      }
    }

    // 🧱 COLLISION SYSTEM
    for (let p of platforms) {
      if (player.x < p.x + p.width && player.x + player.width > p.x &&
          player.y < p.y + p.height && player.y + player.height > p.y) {
        let overlapX = Math.min(player.x + player.width - p.x, p.x + p.width - player.x);
        let overlapY = Math.min(player.y + player.height - p.y, p.y + p.height - player.y);
        if (overlapX < overlapY) {
          if (player.x + player.width / 2 < p.x + p.width / 2) player.x -= overlapX; else player.x += overlapX;
        } else {
          if (gravityDir === 1) {
            if (player.y + player.height / 2 < p.y + p.height / 2) {
              player.y -= overlapY; player.dy = 0; player.grounded = true;
              player.x += p.vx; player.y += p.vy; 
            } else { player.y += overlapY; player.dy = 0; }
          } else {
            if (player.y + player.height / 2 > p.y + p.height / 2) {
              player.y += overlapY; player.dy = 0; player.grounded = true;
              player.x += p.vx; player.y += p.vy; 
            } else { player.y -= overlapY; player.dy = 0; }
          }
        }
      }
    }

    fragileBlocks.forEach(b => {
      if (b.state === "solid" || b.state === "stepping") {
        if (player.x < b.x + b.width && player.x + player.width > b.x &&
            player.y < b.y + b.height && player.y + player.height > b.y) {
          let overlapY = Math.min(player.y + player.height - b.y, b.y + b.height - player.y);
          if (gravityDir === 1) {
            if (player.y + player.height / 2 < b.y + b.height / 2) {
              player.y -= overlapY; player.dy = 0; player.grounded = true;
              if (b.state === "solid") b.state = "stepping";
            } else { player.y += overlapY; player.dy = 0; }
          } else {
            if (player.y + player.height / 2 > b.y + b.height / 2) {
              player.y += overlapY; player.dy = 0; player.grounded = true;
              if (b.state === "solid") b.state = "stepping";
            } else { player.y -= overlapY; player.dy = 0; }
          }
        }
      }
    });

    gates.forEach(g => {
      if (g.opened) return; 
      if (player.x < g.x + g.w && player.x + player.width > g.x &&
          player.y < g.y + g.h && player.y + player.height > g.y) {
        let overlapX = Math.min(player.x + player.width - g.x, g.x + g.w - player.x);
        let overlapY = Math.min(player.y + player.height - g.y, g.y + g.h - player.y);
        if (overlapX < overlapY) {
          if (player.x + player.width / 2 < g.x + g.w / 2) player.x -= overlapX; else player.x += overlapX;
        } else {
          if (gravityDir === 1) {
            if (player.y + player.height / 2 < g.y + g.h / 2) { player.y -= overlapY; player.dy = 0; player.grounded = true; }
            else { player.y += overlapY; player.dy = 0; }
          } else {
            if (player.y + player.height / 2 > g.y + g.h / 2) { player.y += overlapY; player.dy = 0; player.grounded = true; }
            else { player.y -= overlapY; player.dy = 0; }
          }
        }
      }
    });

    buttons.forEach(b => {
      if (player.x < b.x + b.w && player.x + player.width > b.x &&
          player.y < b.y + b.h && player.y + player.height > b.y) {
        if (!b.pressed) {
          b.pressed = true;
          spawnExplosion(b.x + b.w/2, b.y, "#eab308", 12);
          const allPressed = buttons.every(btn => btn.pressed);
          if (allPressed) {
            gates.forEach(g => {
              if (!g.opened) {
                g.opened = true;
                playSound('buttons');
                spawnExplosion(g.x + g.w/2, g.y + g.h/2, "#3b82f6", 15);
              }
            });
          }
        }
      }
    });

    gravityPlatforms.forEach(p => {
      // Clean bounding-box check
      if (player.x < p.x + p.width && player.x + player.width > p.x &&
          player.y < p.y + p.height && player.y + player.height > p.y) {
        
        // 1. Flip Upwards
        if (p.type === "inverter" && gravityDir === 1) {
          playSound('gravity');
          gravityDir = -1;
          player.grounded = false;
          player.dy = 0; // Clear vertical speed for smooth exit transition
          spawnExplosion(p.x + p.width / 2, p.y + p.height / 2, "#06b6d4", 15);
        } 
        // 2. Restore Downwards
        else if (p.type === "restorer" && gravityDir === -1) {
          playSound('gravity');
          gravityDir = 1;
          player.grounded = false;
          player.dy = 0; 
          spawnExplosion(p.x + p.width / 2, p.y + p.height / 2, "#f97316", 15);
        }
      }
    });

    pads.forEach(p => {
      if (player.x < p.x + p.width && player.x + player.width > p.x &&
          player.y < p.y + p.height && player.y + player.height > p.y) {
        if (p.type === "jump") {
          player.dy = p.power; player.grounded = false;
          spawnExplosion(p.x + p.width/2, p.y, "#a855f7", 10);
        } else if (p.type === "dash") {
          player.x += p.power; 
          spawnExplosion(player.x + player.width/2, p.y, "#06b6d4", 10);
        }
      }
    });

    for (let spike of spikes) {
      if (player.x < spike.x + spike.width && player.x + player.width > spike.x &&
          player.y < spike.y + spike.height && player.y + player.height > spike.y) {
        playSound('spike');
        spawnExplosion(player.x + player.width / 2, player.y + player.height / 2, "#ef4444", 25);
        loadLevel(currentLevelIndex); return;
      }
    }

    for (let star of stars) {
      if (!star.pickedUp && player.x < star.x + star.width && player.x + player.width > star.x &&
          player.y < star.y + star.height && player.y + player.height > star.y) {
        star.pickedUp = true;
        playSound('star');
        spawnExplosion(star.x + star.width / 2, star.y + star.height / 2, "gold", 40);
        currentLevelIndex++; loadLevel(currentLevelIndex); return;
      }
    }
  },

  render() {
    context.clearRect(0, 0, canvas.width, canvas.height);
    
    drawGameArea();
    drawGround();
    
    // 2. Draw Player Aura Glow (Before the player sprite)
    let auraScale = 1.0 + Math.abs(Math.sin(starPulseTime * 0.5)) * 0.6;
    context.save();
    context.beginPath();
    context.arc(player.x + player.width / 2, player.y + player.height / 2, 15 * auraScale, 0, Math.PI * 2);
    context.fillStyle = "rgba(255, 255, 255, 0.15)"; 
    context.fill();
    context.restore();

    platforms.concat(spikes).forEach(p => {
      if (p.vx !== 0 && p.minX !== null && p.maxX !== null) {
        context.save(); context.strokeStyle = "rgba(99, 102, 241, 0.22)"; context.lineWidth = 2; context.setLineDash([4, 6]);
        context.beginPath(); context.moveTo(p.minX, p.y + p.height/2); context.lineTo(p.maxX, p.y + p.height/2); context.stroke(); context.restore();
      }
      if (p.vy !== 0 && p.minY !== null && p.maxY !== null) {
        context.save(); context.strokeStyle = "rgba(99, 102, 241, 0.22)"; context.lineWidth = 2; context.setLineDash([4, 6]);
        context.beginPath(); context.moveTo(p.x + p.width/2, p.minY); context.lineTo(p.x + p.width/2, p.maxY); context.stroke(); context.restore();
      }
    });

    gravityPlatforms.forEach(p => {
      context.save();
      context.fillStyle = p.color; context.fillRect(p.x, p.y, p.width, p.height);
      context.strokeStyle = "white"; context.lineWidth = 1; context.strokeRect(p.x, p.y, p.width, p.height);
      context.restore();
    });

    pads.forEach(p => {
      context.save(); context.fillStyle = p.color; context.fillRect(p.x, p.y, p.width, p.height); context.restore();
    });

    buttons.forEach(b => {
      context.save(); context.fillStyle = b.pressed ? "#475569" : b.color; context.fillRect(b.x, b.y, b.w, b.h); context.restore();
    });

    fragileBlocks.forEach(b => {
      if (b.state === "broken") return;
      context.save();
      let shake = b.state === "stepping" ? (Math.random() * 4 - 2) : 0;
      context.fillStyle = b.color; context.fillRect(b.x + shake, b.y, b.width, b.height);
      context.restore();
    });

    platforms.forEach(p => {
      context.save();
      context.fillStyle = "#1e293b"; context.fillRect(p.x + 4, p.y + 4, p.width, p.height);
      context.fillStyle = p.color; context.fillRect(p.x, p.y, p.width, p.height);
      context.strokeStyle = "#6366f1"; context.lineWidth = 3; context.strokeRect(p.x, p.y, p.width, p.height);
      context.restore();
    });

    gates.forEach(g => {
      if (g.opened) return;
      context.save();
      context.fillStyle = g.color; context.fillRect(g.x, g.y, g.w, g.h);
      context.strokeStyle = "#60a5fa"; context.lineWidth = 2; context.strokeRect(g.x, g.y, g.w, g.h);
      context.restore();
    });

    spikes.forEach(s => {
      context.save(); context.translate(s.x + s.width / 2, s.y + s.height / 2); context.fillStyle = s.color;
      context.beginPath(); context.moveTo(0, -s.height / 2); context.lineTo(-s.width / 2, s.height / 2); context.lineTo(s.width / 2, s.height / 2);
      context.closePath(); context.fill(); context.restore();
    });

    stars.forEach(star => {
      if (star.pickedUp) return;
      let hoverY = Math.sin(starPulseTime) * 4;
      let auraScale = 1.0 + Math.abs(Math.sin(starPulseTime * 0.5)) * 0.6;
      context.save(); context.translate(star.x + star.width / 2, star.y + star.height / 2 + hoverY);
      context.globalAlpha = 0.25; context.fillStyle = star.color; context.beginPath(); context.arc(0, 0, (star.width / 2) * auraScale, 0, Math.PI * 2); context.fill();
      context.globalAlpha = 1.0; context.rotate(starPulseTime * 0.2); context.fillRect(-star.width / 2, -star.height / 2, star.width, star.height); context.restore();
    });

    // 🕶️ DRAW FOG SHEET (Covers up the level scene layout)
    drawFog();

    // 🔥 TORCH FLAMES (Rendered inside holes on top of the black mask layout)
    torches.forEach(t => {
      context.save(); context.fillStyle = "#fbbf24"; context.beginPath(); context.arc(t.x, t.y, 6, 0, Math.PI * 2); context.fill(); context.restore();
    });

    particles.forEach(p => {
      context.save(); context.globalAlpha = p.alpha; context.fillStyle = p.color; context.fillRect(p.x, p.y, p.size, p.size); context.restore();
    });

    // 🏃 PLAYER AVATAR AND TRAIL
    if (gameState !== "menu" && gameState !== "victory") {
      playerTrail.forEach(t => {
        if (t.alpha > 0) {
          context.save(); context.globalAlpha = t.alpha; context.fillStyle = "#22c55e"; context.fillRect(t.x, t.y, player.width, player.height); context.restore();
        }
      });
      context.save(); context.fillStyle = player.color; context.fillRect(player.x, player.y, player.width, player.height); context.restore();
      
      context.save(); context.fillStyle = player.color;
      if (player.x > GAME_X() + GAME_WIDTH() - player.width) { context.fillRect(player.x - GAME_WIDTH(), player.y, player.width, player.height); } 
      else if (player.x < GAME_X()) { context.fillRect(player.x + GAME_WIDTH(), player.y, player.width, player.height); }
      context.restore();
    }

    drawControlsBackground();
    if (gameState !== "menu" && gameState !== "victory") { drawDpad(); drawJumpButton(); drawRestartButton(); drawMuteButton(); }

    context.fillStyle = "white"; context.font = "bold 16px Arial"; context.textAlign = "center";
    context.fillText(`STAGE: ${currentLevelIndex + 1}`, LEFT_UI() / 2, 110);

    if (gameState === "play" || gameState === "memorize") {
      context.fillStyle = "#38bdf8"; context.fillText(`TIME: ${totalPlayTime.toFixed(2)}s`, LEFT_UI() / 2, 150);
    }

    if (gameState === "menu") {
      context.fillStyle = "#06b6d4"; context.font = "bold 36px Arial"; context.fillText("BLIND MEMORY", GAME_X() + GAME_WIDTH() / 2, canvas.height / 2 - 40); drawMenuButtons();
    } else if (gameState === "victory") {
      context.fillStyle = "#22c55e"; context.font = "bold 36px Arial"; context.fillText("VICTORY!", GAME_X() + GAME_WIDTH() / 2, canvas.height / 2 - 50);
      context.fillStyle = "white"; context.font = "bold 20px Arial"; context.fillText(`Final Time: ${totalPlayTime.toFixed(2)}s`, GAME_X() + GAME_WIDTH() / 2, canvas.height / 2 - 10); drawMenuButtons();
    } else if (gameState === "memorize") {
      context.fillStyle = "#fbbf24"; context.font = "bold 24px Arial"; context.fillText(`MEMORIZE MAP: ${Math.ceil(stateTimer)}s`, GAME_X() + GAME_WIDTH() / 2, 50);
    }
  }
});

gameState = "menu"; 
loop.start();
