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

function drawUI() {
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