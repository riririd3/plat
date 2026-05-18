// Layout settings
const LEFT_UI = () => 160;
const RIGHT_UI = () => 160;
const GAME_X = () => LEFT_UI();
const GAME_WIDTH = () => canvas.width - LEFT_UI() - RIGHT_UI();
const SAFE = 10;

// UI Control Layout Dimensions
const dpad = { size: 50 };
const jumpBtn = { size: 50 };
const restartBtn = { size: 40 };

// Center Screen Menu Button Dimensions
const startMenuBtn = { w: 200, h: 50 };
const centerFullBtn = { w: 200, h: 45 };

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