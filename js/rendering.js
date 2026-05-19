export function setupRendering(canvas, context) {
  const LEFT_UI = () => 160;
  const RIGHT_UI = () => 160;
  
  return {
    drawGameArea(gameX, gameWidth, canvasHeight) {
      context.fillStyle = "#1e293b";
      context.fillRect(gameX, 0, gameWidth, canvasHeight);
    },
    
    drawGround(gameX, gameWidth, canvasHeight) {
      context.fillStyle = "#334155";
      context.fillRect(gameX, canvasHeight - 40, gameWidth, 40);
    },
    
    drawControlsBackground(leftUI, rightUI, canvasWidth, canvasHeight) {
      context.fillStyle = "#111";
      context.fillRect(0, 0, leftUI(), canvasHeight);
      context.fillRect(canvasWidth - rightUI(), 0, rightUI(), canvasHeight);
    },
    
    drawDpad(leftUI, canvasHeight, touch) {
      const centerX = leftUI() / 2;
      const centerY = canvasHeight - 140 - 10;
      context.save();
      context.globalAlpha = touch.left ? 0.8 : 0.4;
      context.fillStyle = "white";
      context.fillRect(centerX - 60, centerY, 50, 50);
      context.globalAlpha = touch.right ? 0.8 : 0.4;
      context.fillRect(centerX + 10, centerY, 50, 50);
      context.restore();
    },
    
    drawJumpButton(canvasWidth, rightUI, canvasHeight, touch) {
      const x = canvasWidth - rightUI() / 2;
      const y = canvasHeight - 140 - 10 + 25;
      context.save();
      context.globalAlpha = touch.jump ? 0.8 : 0.4;
      context.fillStyle = "#06b6d4";
      context.beginPath();
      context.arc(x, y, 25, 0, Math.PI * 2);
      context.fill();
      context.restore();
    },
    
    drawRestartButton(canvasWidth, rightUI) {
      const x = canvasWidth - rightUI() / 2;
      const y = 60;
      context.save();
      context.fillStyle = "#f59e0b";
      context.fillRect(x - 20, y - 20, 40, 40);
      context.fillStyle = "black";
      context.font = "bold 12px Arial";
      context.textAlign = "center";
      context.fillText("RST", x, y + 4);
      context.restore();
    },
    
    drawFog(gameX, gameWidth, canvasHeight, player) {
      if (!player) return;
      context.save();
      context.globalCompositeOperation = "destination-out";
      context.beginPath();
      context.rect(gameX, 0, gameWidth, canvasHeight);
      context.arc(player.x + player.width / 2, 
                  player.y + player.height / 2, 75, 0, Math.PI * 2);
      context.fill();
      context.restore();
    },
    
    drawMenuButtons(gameX, gameWidth, canvasHeight, gameState, onStartGame, onToggleFullscreen) {
      const midX = gameX + gameWidth / 2;
      const startY = canvasHeight / 2 - 20;
      
      // Start button
      context.fillStyle = "#10b981";
      context.fillRect(midX - 100, startY, 200, 50);
      context.fillStyle = "white";
      context.font = "bold 18px Arial";
      context.textAlign = "center";
      context.fillText(gameState === "victory" ? "PLAY AGAIN" : "START GAME", 
                      midX, startY + 31);
      
      // Fullscreen button
      context.fillStyle = "#3b82f6";
      context.fillRect(midX - 100, startY + 65, 200, 45);
      context.fillStyle = "white";
      context.font = "bold 16px Arial";
      context.fillText("TOGGLE FULLSCREEN", midX, startY + 93);
    },
    
    drawUI(leftUI, canvasHeight, currentLevelIndex, totalPlayTime, gameState, stateTimer, gameX, gameWidth) {
      context.fillStyle = "white";
      context.font = "bold 16px Arial";
      context.textAlign = "center";
      context.fillText(`STAGE: ${currentLevelIndex + 1}`, leftUI() / 2, 110);
      
      if (gameState === "play" || gameState === "memorize") {
        context.fillStyle = "#38bdf8";
        context.fillText(`TIME: ${totalPlayTime.toFixed(2)}s`, leftUI() / 2, 150);
      }
      
      if (gameState === "memorize") {
        context.fillStyle = "#fbbf24";
        context.font = "bold 24px Arial";
        context.fillText(`MEMORIZE MAP: ${Math.ceil(stateTimer)}s`, 
                        gameX + gameWidth / 2, 50);
      }
    },
    
    drawVictoryScreen(gameX, gameWidth, canvasHeight, totalPlayTime) {
      context.fillStyle = "#22c55e";
      context.font = "bold 36px Arial";
      context.fillText("VICTORY!", gameX + gameWidth / 2, canvasHeight / 2 - 50);
      context.fillStyle = "white";
      context.font = "bold 20px Arial";
      context.fillText(`Final Time: ${totalPlayTime.toFixed(2)}s`, 
                      gameX + gameWidth / 2, canvasHeight / 2 - 10);
    },
    
    drawMenuScreen(gameX, gameWidth, canvasHeight) {
      context.fillStyle = "#06b6d4";
      context.font = "bold 36px Arial";
      context.fillText("BLIND MEMORY", gameX + gameWidth / 2, canvasHeight / 2 - 40);
    }
  };
}
