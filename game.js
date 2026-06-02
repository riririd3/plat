// ============================================================================
// DEPENDENCIES & GLOBALS
// ============================================================================
const { init, GameLoop, Sprite, initKeys, keyPressed } = kontra;
let { canvas, context } = init("game");
initKeys();

// ----------------------------------------------------------------------------
// Constants (configuration)
// ----------------------------------------------------------------------------
const BASE_WIDTH = 960;
const BASE_HEIGHT = 540;
const LEFT_UI_WIDTH = 160;
const RIGHT_UI_WIDTH = 160;
const SAFE_AREA = 5;
const GRAVITY_NORMAL = 1;
const GRAVITY_REVERSED = -1;
const DEFAULT_GRAVITY = GRAVITY_NORMAL;
const PLAYER_SIZE = 32;
const GROUND_HEIGHT = 40;

// Timing & level
const MEMORIZE_DURATION = 3.0;        // seconds
const FRAGILE_STEP_DELAY = 0.4;
const FRAGILE_RESPAWN_DELAY = 1.0;
const FREEZE_FRAMES_ON_DEATH = 10;
const SPIKE_RESPAWN_DELAY = 200;      // ms

// Audio (zzfx sound arrays)
const SOUNDS = {
  jump:      [1,,458,.05,.03,.07,,3,,198,,,,,,,.04,.53,.03,,-1462],
  gravity:   [.7,,286,.01,.03,.38,2,.43,-8.1,-0.1,-50,-0.01,.02,.2,,,.01,1.09,.05,.01],
  spike:     [.7,,301,.04,,,,1.46,.1,.1,-110,.18,-0.01,-0.1,-2,-0.1,,.63,,.01],
  star:      [1,0,292,.1,.31,.8,1,.7,,,99,,.1,,,,.3,.99,,.02],
  button:    [.5,0,292,.1,,.5,2,.7,,,22,,,,5,,.3,.99],
  pad:       [1,,552,,.05,.2,1,1.5,,,-330,.04,,.1,,,.12,.7,.04],
  gate:      [1,,1232,,.08,.3,1,1.8,7,,,,,2,,,.1,.8,.05],
  portals:   [.7,,180,,.02,.15,,1.5,5,,200,.02,,.2,,.05,.2,.5,.01],
  fragile:   [.7,,180,,.02,.15,4,1.5,5,,200,.02,,.2,,.05,.2,.5,.01]
};

// ============================================================================
// MUSIC / SONG DATA
// ============================================================================
const song = [
  [ // Instruments
    [0.3, 0, 110, 0.05, 0.2, 0.4, 0, 0.2, 0, 0, 0, 0, 0, 0.05, 0, 0, 0.1, 0.6, 0.2],
    [0.2, 0, 880, 0.01, 0.1, 0.3, 0, 0.5, 0, 0, 0, 0, 0, 0, 0, 0, 0.2, 0.8, 0.1],
    [0.15, 0, 220, 0.1, 0.4, 0.6, 0, 0.1, 0, 0, 0, 0, 0, 0.1, 0, 0, 0.05, 0.9, 0.3]
  ],
  [ // Patterns
    [
      [0, 0, 13, 0, 0, 13, 14, 0, 0, 14, 15, 0, 0, 15, 16, 0, 0, 16],
      [1, 0.2, 0, 22, 0, 20, 0, 24, 0, 21, 0, 19, 0, 23, 0, 20, 0, 22],
      [2, 0, 0, 0, 17, 0, 0, 0, 19, 0, 0, 0, 17, 0, 0, 0, 15, 0]
    ],
    [
      [0, 0, 15, 0, 0, 15, 16, 0, 0, 16, 13, 0, 0, 13, 14, 0, 0, 14],
      [1, 0.15, 0, 24, 0, 22, 0, 20, 0, 23, 0, 21, 0, 19, 0, 24, 0, 20],
      [2, 0, 0, 0, 19, 0, 0, 0, 20, 0, 0, 0, 17, 0, 0, 0, 16, 0]
    ],
    [
      [0, 0, 12, 0, 0, 0, 0, 0, 14, 0, 0, 0, 0, 0, 12, 0, 0, 0],
      [1, 0.1, 0, 27, 0, 26, 0, 24, 0, 27, 0, 26, 0, 24, 0, 22, 0, 0],
      [2, 0, 0, 0, 17, 0, 0, 0, 15, 0, 0, 0, 17, 0, 0, 0, 14, 0]
    ]
  ],
  [0, 1, 0, 2, 0, 2, 0, 1, 1, 1, 2, 2],
  55,
  1
];

// ----------------------------------------------------------------------------
// Game state variables (new architecture)
// ----------------------------------------------------------------------------
let appState = "mainMenu";      // mainMenu, settings, levelSelect, game, pause, levelComplete
let gamePhase = "play";         // memorize, play, victory (only when appState === "game")
let stateTimer = MEMORIZE_DURATION;
let totalPlayTime = 0.0;        // overall play time (for victory screen)
let currentLevelIndex = 0;
let gravityDir = DEFAULT_GRAVITY;
let isMuted = false;
let freezeFrames = 0;

// Per-level timing
let currentLevelTime = 0;       // time spent on current level (seconds)
let levelTimes = [];            // best times per level (loaded from localStorage)
let levelCompleted = [];        // which levels have been completed at least once

// Entities
let player = null;
let platforms = [], spikes = [], stars = [], torches = [];
let buttons = [], gates = [], fragileBlocks = [], pads = [], gravityPlatforms = [];
let particles = [];
let playerTrail = [];
let portals = [];

// Visual effects
let starPulseTime = 0;
let audioCtx = null;

// Touch / mobile UI
let touch = { left: false, right: false, jump: false };
const dpadBtn = { size: 50 };
const jumpBtn = { size: 50 };
const pauseBtn = { size: 50 };
const startMenuBtn = { w: 200, h: 50 };
const centerFullBtn = { w: 200, h: 45 };

// Music player
let musicPlayer = null;

// Fog canvas
let fogCanvas = null, fogCtx = null;

// Helper: load/save progress
function loadProgress() {
  const storedTimes = localStorage.getItem("lime_levelTimes");
  if (storedTimes) levelTimes = JSON.parse(storedTimes);
  const storedCompleted = localStorage.getItem("lime_levelCompleted");
  if (storedCompleted) levelCompleted = JSON.parse(storedCompleted);
  else levelCompleted = new Array(LEVEL_MAPS.length).fill(false);
}
function saveProgress() {
  localStorage.setItem("lime_levelTimes", JSON.stringify(levelTimes));
  localStorage.setItem("lime_levelCompleted", JSON.stringify(levelCompleted));
}

// ============================================================================
// HELPER FUNCTIONS (unchanged except for progress)
// ============================================================================
function getGameX()      { return LEFT_UI_WIDTH; }
function getGameWidth()  { return canvas.width - LEFT_UI_WIDTH - RIGHT_UI_WIDTH; }

function playSound(type) {
  if (isMuted) return;
  try {
    if (!audioCtx) audioCtx = new (window.AudioContext || window.webkitAudioContext)();
    if (audioCtx.state === 'suspended') audioCtx.resume();
    if (SOUNDS[type]) zzfx(...SOUNDS[type]);
  } catch (err) { console.warn("Sound error:", err); }
}

function spawnExplosion(originX, originY, color, count = 20) {
  for (let i = 0; i < count; i++) {
    const angle = Math.random() * Math.PI * 2;
    const speed = 1 + Math.random() * 4;
    particles.push({
      x: originX, y: originY,
      vx: Math.cos(angle) * speed,
      vy: Math.sin(angle) * speed,
      size: 4 + Math.random() * 6,
      alpha: 1.0,
      decay: 0.02 + Math.random() * 0.02,
      color: color
    });
  }
}

function resetTouch() { touch.left = false; touch.right = false; touch.jump = false; }

async function toggleFullscreen() {
  try {
    if (!document.fullscreenElement) {
      await document.documentElement.requestFullscreen();
      if (screen.orientation?.lock) await screen.orientation.lock('landscape').catch(() => {});
    } else {
      await document.exitFullscreen();
      if (screen.orientation?.unlock) screen.orientation.unlock();
    }
  } catch (err) { console.log(`Fullscreen error: ${err.message}`); }
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

function overlap(ax, ay, aw, ah, bx, by, bw, bh) {
  return ax < bx + bw && ax + aw > bx && ay < by + bh && ay + ah > by;
}

// ============================================================================
// LEVEL LOADING (modified to reset currentLevelTime)
// ============================================================================
function loadLevel(index) {
  console.log(`Loading level ${index + 1}`);
  if (index >= LEVEL_MAPS.length) {
    // No more levels -> victory
    appState = "game";
    gamePhase = "victory";
    return;
  }

  appState = "game";
  gamePhase = "memorize";
  stateTimer = MEMORIZE_DURATION;
  currentLevelTime = 0;          // reset timer for this level
  resetTouch();

  platforms = []; spikes = []; stars = []; torches = [];
  buttons = []; gates = []; fragileBlocks = []; pads = [];
  gravityPlatforms = []; portals = []; playerTrail = [];
  gravityDir = DEFAULT_GRAVITY;

  const level = LEVEL_MAPS[index];
  const gameX = getGameX();

  if (level.gravityPlatforms) {
    level.gravityPlatforms.forEach(gp => {
      gravityPlatforms.push({
        x: gameX + gp.x, y: gp.y, width: gp.w, height: gp.h,
        type: gp.type,
        color: gp.type === "inverter" ? "#06b6d4" : "#f97316"
      });
    });
  }

  if (level.playerSpawn) {
    player.x = gameX + level.playerSpawn.x;
    player.y = level.playerSpawn.y;
  } else {
    player.x = gameX + 40;
    player.y = canvas.height - 120;
  }
  player.dy = 0;
  player.grounded = false;

  if (level.platforms) {
    level.platforms.forEach(p => {
      platforms.push(Sprite({
        x: gameX + p.x, y: p.y, width: p.w, height: p.h, color: "#334155",
        vx: p.vx || 0, vy: p.vy || 0,
        minX: p.minX ? gameX + p.minX : null, maxX: p.maxX ? gameX + p.maxX : null,
        minY: p.minY || null, maxY: p.maxY || null
      }));
    });
  }

  if (level.spikes) {
    level.spikes.forEach(s => {
      spikes.push(Sprite({
        x: gameX + s.x, y: s.y, width: s.w, height: s.h, color: "#ef4444",
        vx: s.vx || 0, vy: s.vy || 0,
        minX: s.minX ? gameX + s.minX : null, maxX: s.maxX ? gameX + s.maxX : null,
        minY: s.minY || null, maxY: s.maxY || null
      }));
    });
  }

  if (level.stars) {
    level.stars.forEach(s => {
      stars.push(Sprite({
        x: gameX + s.x, y: s.y, width: 20, height: 20, color: "gold", pickedUp: false
      }));
    });
  }

  if (level.torches) {
    level.torches.forEach(t => {
      torches.push({ x: gameX + t.x, y: t.y, radius: t.radius || 85 });
    });
  }

  if (level.buttons) {
    level.buttons.forEach(b => {
      buttons.push({
        x: gameX + b.x, y: b.y, w: b.w || 32, h: b.h || 10,
        pressed: false, color: "#eab308"
      });
    });
  }
  
  if (level.gates) {
    level.gates.forEach(g => {
      gates.push({
        x: gameX + g.x, y: g.y, w: g.w || 20, h: g.h || 80,
        opened: false, color: "#3b82f6"
      });
    });
  }

  if (level.fragileBlocks) {
    level.fragileBlocks.forEach(fb => {
      fragileBlocks.push({
        x: gameX + fb.x, y: fb.y, width: fb.w, height: fb.h,
        state: "solid", timer: 0, color: "#f43f5e"
      });
    });
  }

  if (level.pads) {
    level.pads.forEach(pd => {
      pads.push({
        x: gameX + pd.x, y: pd.y, width: pd.w || 32, height: pd.h || 12,
        type: pd.type || "jump",
        power: pd.power || -13,
        color: "#a855f7"
      });
    });
  }

  if (level.portals) {
    level.portals.forEach(p => {
        portals.push({
            x: gameX + p.x, y: p.y, w: p.w || 32, h: p.h || 32,
            targetX: gameX + p.targetX, targetY: p.targetY,
            color: p.color || "#a855f7"
        });
    });
  }
}

// ============================================================================
// PLAYER CREATION (unchanged)
// ============================================================================
function createPlayer() {
  return Sprite({
    x: 0, y: 0, width: PLAYER_SIZE, height: PLAYER_SIZE, color: "lime", dy: 0, grounded: false,
    update() {
      if (appState !== "game" || gamePhase !== "play") {
        this.dy = 0;
        return;
      }
      if (keyPressed("left") || touch.left) this.x -= 4;
      if (keyPressed("right") || touch.right) this.x += 4;
      if ((keyPressed("space") || touch.jump) && this.grounded) {
        playSound('jump');
        this.dy = gravityDir === GRAVITY_NORMAL ? -11 : 7;
        this.grounded = false;
      }
      this.dy += 0.5 * gravityDir;
      this.y += this.dy;
      const gameX = getGameX();
      const gameW = getGameWidth();
      if (this.x + this.width < gameX) this.x = gameX + gameW - 1;
      else if (this.x > gameX + gameW) this.x = gameX - this.width + 1;
    }
  });
}
player = createPlayer();

// ============================================================================
// RENDERING FUNCTIONS (draw calls - many unchanged)
// ============================================================================
function drawGameBackground() {
  const grad = context.createLinearGradient(getGameX(), 0, getGameX(), canvas.height);
  grad.addColorStop(0, "#0f172a");
  grad.addColorStop(1, "#1e1e38");
  context.fillStyle = grad;
  context.fillRect(getGameX(), 0, getGameWidth(), canvas.height);
  context.save();
  context.strokeStyle = "rgba(99, 102, 241, 0.08)";
  context.lineWidth = 1;
  const offsetX = (getGameX() - (player.x * 0.1)) % 40;
  for (let x = getGameX() + offsetX; x < getGameX() + getGameWidth(); x += 40) {
    context.beginPath();
    context.moveTo(x, 0);
    context.lineTo(x, canvas.height);
    context.stroke();
  }
  context.restore();
}

function drawGround() {
  context.fillStyle = "#334155";
  context.fillRect(getGameX(), canvas.height - GROUND_HEIGHT, getGameWidth(), GROUND_HEIGHT);
}

function drawUIBackground() {
  context.fillStyle = "#111";
  context.fillRect(0, 0, LEFT_UI_WIDTH, canvas.height);
  context.fillRect(canvas.width - RIGHT_UI_WIDTH, 0, RIGHT_UI_WIDTH, canvas.height);
}

function drawDpad() {
  const centerX = LEFT_UI_WIDTH / 2;
  const centerY = canvas.height - 140 - SAFE_AREA;
  context.save();
  context.globalAlpha = touch.left ? 0.8 : 0.4;
  context.fillStyle = "white";
  context.fillRect(centerX - dpadBtn.size - 10, centerY, dpadBtn.size, dpadBtn.size);
  context.globalAlpha = touch.right ? 0.8 : 0.4;
  context.fillRect(centerX + 10, centerY, dpadBtn.size, dpadBtn.size);
  context.restore();
}

function drawJumpButton() {
  const x = canvas.width - RIGHT_UI_WIDTH / 2;
  const y = canvas.height - 140 - SAFE_AREA + jumpBtn.size / 2;
  context.save();
  context.globalAlpha = touch.jump ? 0.8 : 0.4;
  context.fillStyle = "#06b6d4";
  context.beginPath();
  context.arc(x, y, jumpBtn.size / 2, 0, Math.PI * 2);
  context.fill();
  context.restore();
}

function drawPauseButton() {
  const x = canvas.width - RIGHT_UI_WIDTH / 2;
  const y = 60;
  context.fillStyle = "#f59e0b";
  context.fillRect(x - pauseBtn.size/2, y - pauseBtn.size/2, pauseBtn.size, pauseBtn.size);
  context.fillStyle = "black";
  context.font = "bold 12px Arial";
  context.textAlign = "center";
  context.fillText("PAUSE", x, y + 8);
}

// Generic button drawing helper
function drawButton(x, y, w, h, bgColor, text, onClick) {
  // Store click area for touch/mouse handling
  if (!window._buttons) window._buttons = [];
  window._buttons.push({ x, y, w, h, onClick });
  context.fillStyle = bgColor;
  context.fillRect(x, y, w, h);
  context.fillStyle = "white";
  context.font = "bold 16px Arial";
  context.textAlign = "center";
  context.textBaseline = "middle";
  context.fillText(text, x + w/2, y + h/2);
}

function drawFog() {
  if (!fogCanvas) {
    fogCanvas = document.createElement("canvas");
    fogCtx = fogCanvas.getContext("2d");
  }
  if (fogCanvas.width !== canvas.width || fogCanvas.height !== canvas.height) {
    fogCanvas.width = canvas.width;
    fogCanvas.height = canvas.height;
  }
  fogCtx.clearRect(0, 0, fogCanvas.width, fogCanvas.height);
  const fogAlpha = (gamePhase === "memorize")
    ? (1 - (stateTimer / MEMORIZE_DURATION)) * 0.98
    : 0.98;
  fogCtx.fillStyle = `rgba(0,0,0,${fogAlpha})`;
  fogCtx.fillRect(getGameX(), 0, getGameWidth(), canvas.height);
  fogCtx.globalCompositeOperation = "destination-out";
  let radius = 75 + (gamePhase === "memorize" ? (stateTimer * 250) : 0);
  const px = player.x + player.width/2;
  const py = player.y + player.height/2;
  fogCtx.beginPath();
  fogCtx.arc(px, py, radius, 0, Math.PI*2);
  fogCtx.fill();
  torches.forEach(t => {
    fogCtx.beginPath();
    fogCtx.arc(t.x, t.y, t.radius, 0, Math.PI*2);
    fogCtx.fill();
  });
  stars.forEach(s => {
    if (!s.pickedUp) {
      fogCtx.beginPath();
      fogCtx.arc(s.x + s.width/2, s.y + s.height/2, 30, 0, Math.PI*2);
      fogCtx.fill();
    }
  });
  fogCtx.globalCompositeOperation = "source-over";
  context.drawImage(fogCanvas, 0, 0);
}

function drawParticles() {
  for (let p of particles) {
    context.globalAlpha = p.alpha;
    context.fillStyle = p.color;
    context.fillRect(p.x, p.y, p.size, p.size);
  }
  context.globalAlpha = 1;
}

// ============================================================================
// GAME LOGIC UPDATE (collisions, state transitions)
// ============================================================================
function updateParticles() {
  for (let i = particles.length-1; i >= 0; i--) {
    const p = particles[i];
    p.x += p.vx;
    p.y += p.vy;
    p.vy += 0.1;
    p.alpha -= p.decay;
    if (p.alpha <= 0) particles.splice(i,1);
  }
}

function updateMovingEntities() {
  const updateMovable = (arr) => {
    for (let e of arr) {
      e.x += e.vx;
      e.y += e.vy;
      if (e.minX !== null && e.maxX !== null) {
        if (e.x <= e.minX || e.x + e.width >= e.maxX) e.vx *= -1;
      }
      if (e.minY !== null && e.maxY !== null) {
        if (e.y <= e.minY || e.y + e.height >= e.maxY) e.vy *= -1;
      }
    }
  };
  updateMovable(platforms);
  updateMovable(spikes);
}

function updateFragileBlocks(dt) {
  for (let b of fragileBlocks) {
    if (b.state === "stepping") {
      b.timer += dt;
      if (b.timer >= FRAGILE_STEP_DELAY) {
        b.state = "broken";
        b.timer = 0;
      }
    } else if (b.state === "broken") {
      b.timer += dt;
      if (b.timer >= FRAGILE_RESPAWN_DELAY) {
        b.state = "solid";
        b.timer = 0;
      }
    }
  }
}

function updatePlayerTrail() {
  if (appState === "game" && gamePhase === "play") {
    playerTrail.push({ x: player.x, y: player.y, alpha: 0.45 });
    if (playerTrail.length > 8) playerTrail.shift();
    for (let t of playerTrail) t.alpha -= 0.04;
  }
}

function handleCollisions() {
  const floorY = canvas.height - GROUND_HEIGHT;
  if (gravityDir === GRAVITY_NORMAL && player.y + player.height >= floorY) {
    player.y = floorY - player.height;
    player.dy = 0;
    player.grounded = true;
  } else if (gravityDir === GRAVITY_REVERSED && player.y <= 0) {
    player.y = 0;
    player.dy = 0;
    player.grounded = true;
  }

  const collideSolid = (obj, isFragileBlock = false) => {
    if (isFragileBlock && (obj.state === "broken")) return false;
    if (!overlap(player.x, player.y, player.width, player.height, obj.x, obj.y, obj.width, obj.height))
      return false;
    const overlapX = Math.min(player.x + player.width - obj.x, obj.x + obj.width - player.x);
    const overlapY = Math.min(player.y + player.height - obj.y, obj.y + obj.height - player.y);
    if (overlapX < overlapY) {
      if (player.x + player.width/2 < obj.x + obj.width/2) player.x -= overlapX;
      else player.x += overlapX;
    } else {
      if (gravityDir === GRAVITY_NORMAL) {
        if (player.y + player.height/2 < obj.y + obj.height/2) {
          player.y -= overlapY;
          player.dy = 0;
          player.grounded = true;
          if (isFragileBlock && obj.state === "solid") {
            obj.state = "stepping";
            playSound('fragile');
          }
          if (obj.vx || obj.vy) { player.x += obj.vx; player.y += obj.vy; }
        } else {
          player.y += overlapY;
          player.dy = 0;
        }
      } else {
        if (player.y + player.height/2 > obj.y + obj.height/2) {
          player.y += overlapY;
          player.dy = 0;
          player.grounded = true;
          if (isFragileBlock && obj.state === "solid") {
            obj.state = "stepping";
            playSound('fragile');
          }
          if (obj.vx || obj.vy) { player.x += obj.vx; player.y += obj.vy; }
        } else {
          player.y -= overlapY;
          player.dy = 0;
        }
      }
    }
    return true;
  };

  for (let p of platforms) collideSolid(p, false);
  for (let b of fragileBlocks) collideSolid(b, true);

  // Gates: solid when closed, no collision when opened
  for (let g of gates) {
    if (!g.opened) {
      if (overlap(player.x, player.y, player.width, player.height, g.x, g.y, g.w, g.h)) {
        const overlapX = Math.min(player.x + player.width - g.x, g.x + g.w - player.x);
        const overlapY = Math.min(player.y + player.height - g.y, g.y + g.h - player.y);
        if (overlapX < overlapY) {
          if (player.x + player.width/2 < g.x + g.w/2) player.x -= overlapX;
          else player.x += overlapX;
        } else {
          if (gravityDir === GRAVITY_NORMAL) {
            if (player.y + player.height/2 < g.y + g.h/2) {
              player.y -= overlapY;
              player.dy = 0;
              player.grounded = true;
            } else {
              player.y += overlapY;
              player.dy = 0;
            }
          } else {
            if (player.y + player.height/2 > g.y + g.h/2) {
              player.y += overlapY;
              player.dy = 0;
              player.grounded = true;
            } else {
              player.y -= overlapY;
              player.dy = 0;
            }
          }
        }
      }
    }
  }

  for (let b of buttons) {
    if (!b.pressed && overlap(player.x, player.y, player.width, player.height, b.x, b.y, b.w, b.h)) {
      b.pressed = true;
      playSound('button');
      spawnExplosion(b.x + b.w/2, b.y, "#eab308", 12);
      const allPressed = buttons.every(btn => btn.pressed);
      if (allPressed) {
        for (let g of gates) {
          if (!g.opened) {
            g.opened = true;
            playSound('gate');
            spawnExplosion(g.x + g.w/2, g.y + g.h/2, "#3b82f6", 15);
          }
        }
      }
    }
  }

  for (let gp of gravityPlatforms) {
    if (overlap(player.x, player.y, player.width, player.height, gp.x, gp.y, gp.width, gp.height)) {
      if (gp.type === "inverter" && gravityDir === GRAVITY_NORMAL) {
        playSound('gravity');
        gravityDir = GRAVITY_REVERSED;
        player.grounded = false;
        player.dy = 0;
        spawnExplosion(gp.x + gp.width/2, gp.y + gp.height/2, "#06b6d4", 15);
      } else if (gp.type === "restorer" && gravityDir === GRAVITY_REVERSED) {
        playSound('gravity');
        gravityDir = GRAVITY_NORMAL;
        player.grounded = false;
        player.dy = 0;
        spawnExplosion(gp.x + gp.width/2, gp.y + gp.height/2, "#f97316", 15);
      }
    }
  }

  for (let p of pads) {
    if (overlap(player.x, player.y, player.width, player.height, p.x, p.y, p.width, p.height)) {
      if (p.type === "jump") {
        player.dy = p.power;
        player.grounded = false;
        playSound('pad');
        spawnExplosion(p.x + p.width/2, p.y, "#a855f7", 10);
      } 
    }
  }

  for (let p of portals) {
    if (overlap(player.x, player.y, player.width, player.height, p.x, p.y, p.w, p.h)) {
        // Teleport player
        player.x = p.targetX;
        player.y = p.targetY;
        // Optional: play sound, spawn particles
        playSound('portal');
        spawnExplosion(p.x + p.w/2, p.y + p.h/2, p.color, 15);
        // Break to avoid multiple teleports in same frame
        break;
    }
  }

  for (let s of spikes) {
    if (overlap(player.x, player.y, player.width, player.height, s.x, s.y, s.width, s.height)) {
      playSound('spike');
      freezeFrames = FREEZE_FRAMES_ON_DEATH;
      spawnExplosion(player.x + player.width/2, player.y + player.height/2, "#ef4444", 25);
      setTimeout(() => loadLevel(currentLevelIndex), SPIKE_RESPAWN_DELAY);
      return;
    }
  }

  // Star collected -> level complete
  for (let i=0; i<stars.length; i++) {
    const s = stars[i];
    if (!s.pickedUp && overlap(player.x, player.y, player.width, player.height, s.x, s.y, s.width, s.height)) {
      s.pickedUp = true;
      playSound('star');
      spawnExplosion(s.x + s.width/2, s.y + s.height/2, "gold", 40);
      // Record completion and time
      if (!levelCompleted[currentLevelIndex]) {
        levelCompleted[currentLevelIndex] = true;
        levelTimes[currentLevelIndex] = currentLevelTime;
      } else {
        // Keep best time
        if (currentLevelTime < (levelTimes[currentLevelIndex] || Infinity))
          levelTimes[currentLevelIndex] = currentLevelTime;
      }
      saveProgress();
      // Go to level complete screen
      appState = "levelComplete";
      return;
    }
  }
}

function gameUpdate(dt = 1/60) {
  updateParticles();
  if (appState !== "game") return;

  totalPlayTime += dt;
  if (gamePhase === "play") currentLevelTime += dt;
  starPulseTime += 0.05;

  if (gamePhase === "memorize") {
    stateTimer -= dt;
    if (stateTimer <= 0) gamePhase = "play";
  }

  if (freezeFrames > 0) {
    freezeFrames--;
    return;
  }

  updateMovingEntities();
  updateFragileBlocks(dt);
  player.update();
  updatePlayerTrail();
  handleCollisions();
}

// ============================================================================
// RENDER FUNCTIONS FOR EACH APP STATE
// ============================================================================
function renderGameWorld() {
  drawGameBackground();
  drawGround();

  // Player aura
  const auraScale = 1 + Math.abs(Math.sin(starPulseTime * 0.5)) * 0.6;
  context.save();
  context.beginPath();
  context.arc(player.x + player.width/2, player.y + player.height/2, 15 * auraScale, 0, Math.PI*2);
  context.fillStyle = "rgba(0,255,0,0.25)";
  context.fill();
  context.restore();

  const drawMotionLine = (e, axis) => {
    context.save();
    context.strokeStyle = "rgba(99,102,241,0.5)";
    context.lineWidth = 7;
    context.setLineDash([4,6]);
    if (axis === 'x' && e.minX && e.maxX) {
      context.beginPath();
      context.moveTo(e.minX, e.y + e.height/2);
      context.lineTo(e.maxX, e.y + e.height/2);
      context.stroke();
    } else if (axis === 'y' && e.minY && e.maxY) {
      context.beginPath();
      context.moveTo(e.x + e.width/2, e.minY);
      context.lineTo(e.x + e.width/2, e.maxY);
      context.stroke();
    }
    context.restore();
  };
  [...platforms, ...spikes].forEach(e => {
    if (e.vx) drawMotionLine(e, 'x');
    if (e.vy) drawMotionLine(e, 'y');
  });

  for (let gp of gravityPlatforms) {
    context.fillStyle = gp.color;
    context.fillRect(gp.x, gp.y, gp.width, gp.height);
    context.strokeStyle = "white";
    context.strokeRect(gp.x, gp.y, gp.width, gp.height);
  }
  for (let p of pads) {
    context.fillStyle = p.color;
    context.fillRect(p.x, p.y, p.width, p.height);
  }
    for (let p of portals) {
    context.fillStyle = p.color;
    context.fillRect(p.x, p.y, p.w, p.h);
    context.strokeStyle = "white";
    context.lineWidth = 1;
    context.strokeRect(p.x, p.y, p.w, p.h);
  }
  for (let b of buttons) {
    context.fillStyle = b.pressed ? "#475569" : b.color;
    context.fillRect(b.x, b.y, b.w, b.h);
  }
  for (let b of fragileBlocks) {
    if (b.state === "broken") continue;
    const shake = (b.state === "stepping") ? (Math.random() * 4 - 2) : 0;
    context.fillStyle = "#1e293b";
    context.fillRect(b.x + shake + 4, b.y + 4, b.width, b.height);
    context.fillStyle = b.color;
    context.fillRect(b.x + shake, b.y, b.width, b.height);
    context.strokeStyle = "#6366f1";
    context.strokeRect(b.x + shake, b.y, b.width, b.height);
  }
  for (let p of platforms) {
    context.fillStyle = "#1e293b";
    context.fillRect(p.x + 4, p.y + 4, p.width, p.height);
    context.fillStyle = p.color;
    context.fillRect(p.x, p.y, p.width, p.height);
    context.strokeStyle = "#6366f1";
    context.strokeRect(p.x, p.y, p.width, p.height);
  }
  for (let g of gates) {
    if (!g.opened) {
      context.fillStyle = g.color;
      context.fillRect(g.x, g.y, g.w, g.h);
      context.strokeStyle = "#60a5fa";
      context.strokeRect(g.x, g.y, g.w, g.h);
    }
  }
  for (let s of spikes) {
    context.save();
    context.translate(s.x + s.width/2, s.y + s.height/2);
    context.fillStyle = s.color;
    context.beginPath();
    context.moveTo(0, -s.height/2);
    context.lineTo(-s.width/2, s.height/2);
    context.lineTo(s.width/2, s.height/2);
    context.fill();
    context.restore();
  }
  for (let s of stars) {
    if (s.pickedUp) continue;
    const hoverY = Math.sin(starPulseTime) * 4;
    const starScale = 1 + Math.abs(Math.sin(starPulseTime * 0.5)) * 0.6;
    context.save();
    context.translate(s.x + s.width/2, s.y + s.height/2 + hoverY);
    context.globalAlpha = 0.25;
    context.fillStyle = s.color;
    context.beginPath();
    context.arc(0, 0, (s.width/2) * starScale, 0, Math.PI*2);
    context.fill();
    context.globalAlpha = 1;
    context.rotate(starPulseTime * 0.2);
    context.fillRect(-s.width/2, -s.height/2, s.width, s.height);
    context.restore();
  }

  drawFog();
  for (let t of torches) {
    context.fillStyle = "#fbbf24";
    context.beginPath();
    context.arc(t.x, t.y, 6, 0, Math.PI*2);
    context.fill();
  }
  drawParticles();

  if (appState === "game") {
    for (let t of playerTrail) {
      if (t.alpha > 0) {
        context.globalAlpha = t.alpha;
        context.fillStyle = "#22c55e";
        context.fillRect(t.x, t.y, player.width, player.height);
      }
    }
    context.globalAlpha = 1;
    context.fillStyle = player.color;
    context.fillRect(player.x, player.y, player.width, player.height);
    if (player.x > getGameX() + getGameWidth() - player.width) {
      context.fillRect(player.x - getGameWidth(), player.y, player.width, player.height);
    } else if (player.x < getGameX()) {
      context.fillRect(player.x + getGameWidth(), player.y, player.width, player.height);
    }
  }

  drawUIBackground();
  if (appState === "game") {
    drawDpad();
    drawJumpButton();
    drawPauseButton();
  }

  if (appState === "game" && (gamePhase === "play" || gamePhase === "memorize")) {
    context.fillStyle = "white";
    context.font = "bold 16px Arial";
    context.textAlign = "center";
    context.fillText(`LEVEL: ${currentLevelIndex + 1}`, LEFT_UI_WIDTH/2, 110);
    context.fillStyle = "#38bdf8";
    context.fillText(`TIME: ${currentLevelTime.toFixed(2)}s`, LEFT_UI_WIDTH/2, 150);
  }

  if (appState === "game" && gamePhase === "victory") {
    context.fillStyle = "#22c55e";
    context.font = "bold 36px Arial";
    context.fillText("VICTORY!", getGameX() + getGameWidth()/2, canvas.height/2 - 100);
    context.fillStyle = "white";
    context.font = "bold 20px Arial";
    context.fillText(`Total Time: ${totalPlayTime.toFixed(2)}s`, getGameX() + getGameWidth()/2, canvas.height/2 - 60);
    drawButton(getGameX() + getGameWidth()/2 - 100, canvas.height/2 + 20, 200, 50, "#10b981", "MAIN MENU", () => {
      appState = "mainMenu";
    });
  }

  if (appState === "game" && gamePhase === "memorize") {
    context.fillStyle = "#fbbf24";
    context.font = "bold 20px Arial";
    context.fillText(`${Math.ceil(stateTimer)}s`, getGameX() + getGameWidth()/2, 50);
  }
}

function renderMainMenu() {
  drawGameBackground(); // optional background
  context.fillStyle = "#00ff00";
  context.font = "bold 36px Arial";
  context.textAlign = "center";
  context.fillText("Lime Adventure", getGameX() + getGameWidth()/2, canvas.height/2 - 80);
  drawButton(getGameX() + getGameWidth()/2 - 100, canvas.height/2 - 20, 200, 50, "#10b981", "START GAME", () => {
    currentLevelIndex = 0;
    totalPlayTime = 0;
    loadLevel(0);
  });
  drawButton(getGameX() + getGameWidth()/2 - 100, canvas.height/2 + 50, 200, 50, "#3b82f6", "SETTINGS", () => {
    appState = "settings";
  });
  drawButton(getGameX() + getGameWidth()/2 - 100, canvas.height/2 + 120, 200, 50, "#8b5cf6", "LEVEL SELECT", () => {
    appState = "levelSelect";
  });
  const isPortrait = () => window.innerHeight > window.innerWidth;
  if (isPortrait()) {
    const blink = Math.floor(Date.now() / 500) % 2 === 0;
    if (blink) {
      context.fillStyle = "#ff4757";
      context.font = "bold 20px Arial";
      context.fillText("Please rotate your phone to Landscape!", getGameX() + getGameWidth()/2, canvas.height - 50);
    }
  }
}

function renderSettings() {
  drawGameBackground();
  context.fillStyle = "white";
  context.font = "bold 28px Arial";
  context.fillText("Settings", getGameX() + getGameWidth()/2, 80);
  drawButton(getGameX() + getGameWidth()/2 - 100, 150, 200, 50, isMuted ? "#ef4444" : "#22c55e", isMuted ? "UNMUTE" : "MUTE", () => {
    isMuted = !isMuted;
    if (musicPlayer) {
      isMuted ? musicPlayer.disconnect() : musicPlayer.connect(zzfxX.destination);
    }
  });
  drawButton(getGameX() + getGameWidth()/2 - 100, 220, 200, 50, "#3b82f6", "FULLSCREEN", toggleFullscreen);
  drawButton(getGameX() + getGameWidth()/2 - 100, 360, 200, 50, "#f59e0b", "BACK", () => {
    appState = "mainMenu";
  });
  drawButton(getGameX() + getGameWidth()/2 - 100, 290, 200, 50, "#ef4444", "RESET PROGRESS", () => {
    if (confirm("Delete all saved progress? This cannot be undone.")) {
        localStorage.removeItem("lime_levelTimes");
        localStorage.removeItem("lime_levelCompleted");
        levelTimes = [];
        levelCompleted = new Array(LEVEL_MAPS.length).fill(false);
        currentLevelIndex = 0;
        totalPlayTime = 0;
        appState = "mainMenu";
    }
  });
}

function renderLevelSelect() {
  drawGameBackground();
  context.fillStyle = "white";
  context.font = "bold 28px Arial";
  context.fillText("Level Select", getGameX() + getGameWidth()/2, 80);
  const cols = 5;
  const startX = getGameX() + 60;
  const startY = 130;
  const w = 70, h = 70;
  for (let i = 0; i < LEVEL_MAPS.length; i++) {
    const x = startX + (i % cols) * (w + 15);
    const y = startY + Math.floor(i / cols) * (h + 15);
    const unlocked = levelCompleted[i] || i === 0; // first level always unlocked
    context.fillStyle = unlocked ? "#22c55e" : "#444";
    context.fillRect(x, y, w, h);
    context.fillStyle = "white";
    context.font = "bold 18px Arial";
    context.fillText(i+1, x + w/2, y + h/2);
    if (unlocked && levelTimes[i]) {
      context.font = "12px Arial";
      context.fillText(levelTimes[i].toFixed(1)+"s", x + w/2, y + h - 10);
    }
    // store click area for level selection
    if (!window._levelButtons) window._levelButtons = [];
    window._levelButtons.push({ x, y, w, h, index: i, unlocked });
  }
  drawButton(getGameX() + getGameWidth()/2 - 100, canvas.height - 80, 200, 50, "#f59e0b", "BACK", () => {
    appState = "mainMenu";
  });
}

function renderLevelComplete() {
  // Freeze the game world in background (we can redraw it once)
  renderGameWorld();
  context.globalAlpha = 0.7;
  context.fillStyle = "black";
  context.fillRect(0, 0, canvas.width, canvas.height);
  context.globalAlpha = 1;
  context.fillStyle = "#22c55e";
  context.font = "bold 36px Arial";
  context.fillText("LEVEL COMPLETE!", getGameX() + getGameWidth()/2, canvas.height/2 - 80);
  context.fillStyle = "white";
  context.font = "20px Arial";
  const bestTime = levelTimes[currentLevelIndex] ? levelTimes[currentLevelIndex].toFixed(2) : "--";
  context.fillText(`Your time: ${currentLevelTime.toFixed(2)}s  (Best: ${bestTime}s)`, getGameX() + getGameWidth()/2, canvas.height/2 - 20);
  const nextY = canvas.height/2 + 40;
  if (currentLevelIndex + 1 < LEVEL_MAPS.length) {
    drawButton(getGameX() + getGameWidth()/2 - 120, nextY, 100, 50, "#10b981", "NEXT", () => {
      currentLevelIndex++;
      loadLevel(currentLevelIndex);
    });
  } else {
    drawButton(getGameX() + getGameWidth()/2 - 120, nextY, 100, 50, "#10b981", "VICTORY", () => {
      appState = "game";
      gamePhase = "victory";
    });
  }
  drawButton(getGameX() + getGameWidth()/2 + 20, nextY, 100, 50, "#f59e0b", "RESTART", () => {
    loadLevel(currentLevelIndex);
  });
  drawButton(getGameX() + getGameWidth()/2 - 100, nextY + 70, 200, 50, "#3b82f6", "MAIN MENU", () => {
    appState = "mainMenu";
  });
}

function renderPause() {
  renderGameWorld();
  context.globalAlpha = 0.7;
  context.fillStyle = "black";
  context.fillRect(0, 0, canvas.width, canvas.height);
  context.globalAlpha = 1;
  context.fillStyle = "white";
  context.font = "bold 36px Arial";
  context.fillText("PAUSED", getGameX() + getGameWidth()/2, canvas.height/2 - 80);
  drawButton(getGameX() + getGameWidth()/2 - 100, canvas.height/2 - 10, 200, 50, "#10b981", "RESUME", () => {
    appState = "game";
  });
  drawButton(getGameX() + getGameWidth()/2 - 100, canvas.height/2 + 60, 200, 50, "#f59e0b", "RESTART", () => {
    loadLevel(currentLevelIndex);
  });
  drawButton(getGameX() + getGameWidth()/2 - 100, canvas.height/2 + 130, 200, 50, "#3b82f6", "MAIN MENU", () => {
    appState = "mainMenu";
  });
}

// Main render dispatcher
function gameRender() {
  // Clear button arrays for each frame
  window._buttons = [];
  window._levelButtons = [];
  if (appState === "game") renderGameWorld();
  else if (appState === "mainMenu") renderMainMenu();
  else if (appState === "settings") renderSettings();
  else if (appState === "levelSelect") renderLevelSelect();
  else if (appState === "levelComplete") renderLevelComplete();
  else if (appState === "pause") renderPause();
}

// ============================================================================
// TOUCH HANDLING (updated to handle UI buttons)
// ============================================================================
function handleTouchStartMove(e) {
  e.preventDefault();
  const rect = canvas.getBoundingClientRect();
  const scaleX = canvas.width / rect.width;
  const scaleY = canvas.height / rect.height;
  const activeTouches = e.type === "touchend" ? e.touches : e.targetTouches;

  // First, check mute/restart buttons only if in game
  if (appState === "game") {
    for (let t of activeTouches) {
      const x = (t.clientX - rect.left) * scaleX;
      const y = (t.clientY - rect.top) * scaleY;
      const pauseX = canvas.width - RIGHT_UI_WIDTH/2;
      const pauseY = 60;
      if (Math.hypot(x - pauseX, y - pauseY) < pauseBtn.size/2 && e.type === "touchstart") {
        appState = "pause";
        return;
      }
    }
  }

  // Now handle UI buttons from the current screen
  if (e.type === "touchstart") {
    for (let t of e.targetTouches) {
      const x = (t.clientX - rect.left) * scaleX;
      const y = (t.clientY - rect.top) * scaleY;
      // Check generic buttons
      if (window._buttons) {
        for (let btn of window._buttons) {
          if (x >= btn.x && x <= btn.x + btn.w && y >= btn.y && y <= btn.y + btn.h) {
            if (btn.onClick) btn.onClick();
            return;
          }
        }
      }
      // Check level select buttons
      if (appState === "levelSelect" && window._levelButtons) {
        for (let btn of window._levelButtons) {
          if (x >= btn.x && x <= btn.x + btn.w && y >= btn.y && y <= btn.y + btn.h) {
            if (btn.unlocked) {
              currentLevelIndex = btn.index;
              loadLevel(currentLevelIndex);
              return;
            }
          }
        }
      }
    }
  }

  // In‑game touch controls (only when game is active and not paused)
  if (appState === "game" && gamePhase !== "victory") {
    resetTouch();
    for (let t of activeTouches) {
      const x = (t.clientX - rect.left) * scaleX;
      const y = (t.clientY - rect.top) * scaleY;
      if (x < LEFT_UI_WIDTH) {
        const centerX = LEFT_UI_WIDTH / 2;
        if (x < centerX) touch.left = true;
        else touch.right = true;
      }
      if (x > canvas.width - RIGHT_UI_WIDTH) {
        const jx = canvas.width - RIGHT_UI_WIDTH/2;
        const jy = canvas.height - 140 - SAFE_AREA + jumpBtn.size/2;
        if (Math.hypot(x - jx, y - jy) < jumpBtn.size/2) touch.jump = true;
      }
    }
  }
}

// Keyboard support for pause (Escape)
window.addEventListener("keydown", (e) => {
  if (e.code === "Escape" && appState === "game" && gamePhase === "play") {
    appState = "pause";
    e.preventDefault();
  }
});

canvas.addEventListener("touchstart", handleTouchStartMove, { passive: false });
canvas.addEventListener("touchmove", handleTouchStartMove, { passive: false });
canvas.addEventListener("touchend", handleTouchStartMove, { passive: false });

// ============================================================================
// INITIALIZATION
// ============================================================================
resizeGame();
window.addEventListener("resize", resizeGame);
loadProgress();

// Start the game loop
const gameLoop = GameLoop({
  update: (dt) => gameUpdate(dt),
  render: () => gameRender()
});
appState = "mainMenu";
gameLoop.start();
