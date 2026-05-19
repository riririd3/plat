// Platform collision resolution
export function handlePlatformCollision(player, platform) {
  if (player.x < platform.x + platform.width && 
      player.x + player.width > platform.x &&
      player.y < platform.y + platform.height && 
      player.y + player.height > platform.y) {
    
    let overlapX = Math.min(player.x + player.width - platform.x, 
                           platform.x + platform.width - player.x);
    let overlapY = Math.min(player.y + player.height - platform.y, 
                           platform.y + platform.height - player.y);
    
    if (overlapX < overlapY) {
      // Horizontal collision
      if (player.x + player.width / 2 < platform.x + platform.width / 2) 
        player.x -= overlapX;
      else 
        player.x += overlapX;
    } else {
      // Vertical collision
      if (player.y + player.height / 2 < platform.y + platform.height / 2) {
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

// Spike collision (instant death)
export function checkSpikeCollision(player, spikes, onDeath) {
  for (let spike of spikes) {
    if (player.x < spike.x + spike.width && 
        player.x + player.width > spike.x &&
        player.y < spike.y + spike.height && 
        player.y + player.height > spike.y) {
      onDeath();
      return true;
    }
  }
  return false;
}

// Star collection (advance level)
export function checkStarCollection(stars, player, onCollect) {
  for (let star of stars) {
    if (!star.pickedUp && 
        player.x < star.x + star.width && 
        player.x + player.width > star.x &&
        player.y < star.y + star.height && 
        player.y + player.height > star.y) {
      star.pickedUp = true;
      onCollect();
      return true;
    }
  }
  return false;
}
