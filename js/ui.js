function drawUI() {
  context.fillStyle = "white";
  context.font = "bold 16px Arial";
  context.textAlign = "center";
  
  context.fillText(`STAGE: ${window.currentLevelIndex + 1}`, LEFT_UI() / 2, 110);

  if (window.gameState === "play" || window.gameState === "memorize") {
    context.fillStyle = "#38bdf8";
    context.fillText(`TIME: ${window.totalPlayTime.toFixed(2)}s`, LEFT_UI() / 2, 150);
  }

  if (window.gameState === "menu") {
    context.fillStyle = "#06b6d4";
    context.font = "bold 36px Arial";
    context.fillText("BLIND MEMORY", GAME_X() + GAME_WIDTH() / 2, canvas.height / 2 - 40);
    drawMenuButtons();
  } else if (window.gameState === "victory") {
    context.fillStyle = "#22c55e";
    context.font = "bold 36px Arial";
    context.fillText("VICTORY!", GAME_X() + GAME_WIDTH() / 2, canvas.height / 2 - 50);
    
    context.fillStyle = "white";
    context.font = "bold 20px Arial";
    context.fillText(`Final Time: ${window.totalPlayTime.toFixed(2)}s`, GAME_X() + GAME_WIDTH() / 2, canvas.height / 2 - 10);
    drawMenuButtons();
  } else if (window.gameState === "memorize") {
    context.fillStyle = "#fbbf24";
    context.font = "bold 24px Arial";
    context.fillText(`MEMORIZE MAP: ${Math.ceil(window.stateTimer)}s`, GAME_X() + GAME_WIDTH() / 2, 50);
  }
}
