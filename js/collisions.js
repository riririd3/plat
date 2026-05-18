function handlePlatformCollisions() {
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
        } else {
          player.y += overlapY; 
          player.dy = 0;
        }
      }
    }
  }
}

function handleSpikeCollisions() {
  for (let spike of spikes) {
    if (player.x < spike.x + spike.width && player.x + player.width > spike.x &&
        player.y < spike.y + spike.height && player.y + player.height > spike.y) {
      loadLevel(currentLevelIndex); 
    }
  }
}

function handleStarCollection() {
  for (let star of stars) {
    if (!star.pickedUp && player.x < star.x + star.width && player.x + player.width > star.x &&
        player.y < star.y + star.height && player.y + player.height > star.y) {
      star.pickedUp = true;
      currentLevelIndex++;
      loadLevel(currentLevelIndex);
    }
  }
}
