let touch = { left: false, right: false, jump: false };

function handleTouch(e) {
  e.preventDefault();
  
  const rect = canvas.getBoundingClientRect();
  const scaleX = canvas.width / rect.width;
  const scaleY = canvas.height / rect.height;

  let activeTouches = e.type === "touchend" ? e.touches : e.targetTouches;

  // Check restart button
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

  // Menu buttons
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

  // Gameplay controls
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