// utils.js
import { touch } from './input.js';

export const LEFT_UI = () => 160;
export const RIGHT_UI = () => 160;
export const GAME_X = () => LEFT_UI();
export const GAME_WIDTH = () => canvas.width - LEFT_UI() - RIGHT_UI();
export const SAFE = 10;

export const dpad = { size: 50 };
export const jumpBtn = { size: 50 };
export const restartBtn = { size: 40 };

export const startMenuBtn = { w: 200, h: 50 };
export const centerFullBtn = { w: 200, h: 45 };

export function resizeGame(BASE_WIDTH, BASE_HEIGHT, canvas) {
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

export function resetTouch() {
  touch.left = false; 
  touch.right = false; 
  touch.jump = false;
}

export async function toggleFullscreen() {
  if (!document.fullscreenElement) {
    await document.documentElement.requestFullscreen();
  } else {
    await document.exitFullscreen();
  }
}
