// js/collisions.js

// Platform collision resolution
export function handlePlatformCollision(player, platform) {
    // Check if collision is happening
    const colliding = (player.x < platform.x + platform.width && 
        player.x + player.width > platform.x &&
        player.y < platform.y + platform.height && 
        player.y + player.height > platform.y);
    
    if (colliding) {
        console.log("Collision detected with platform at:", platform.x, platform.y);
        
        let overlapX = Math.min(player.x + player.width - platform.x, 
                               platform.x + platform.width - player.x);
        let overlapY = Math.min(player.y + player.height - platform.y, 
                               platform.y + platform.height - player.y);
        
        if (overlapX < overlapY) {
            // Horizontal collision
            if (player.x + player.width / 2 < platform.x + platform.width / 2) {
                player.x -= overlapX;
            } else {
                player.x += overlapX;
            }
            console.log("Horizontal collision resolved");
        } else {
            // Vertical collision
            if (player.y + player.height / 2 < platform.y + platform.height / 2) {
                player.y -= overlapY;
                player.dy = 0;
                player.grounded = true;
                console.log("Landing on platform! Grounded = true");
            } else {
                player.y += overlapY;
                player.dy = 0;
                console.log("Hit head on platform");
            }
        }
    }
}

// Spike collision
export function checkSpikeCollision(player, spikes, onDeath) {
    for (let spike of spikes) {
        if (player.x < spike.x + spike.width && 
            player.x + player.width > spike.x &&
            player.y < spike.y + spike.height && 
            player.y + player.height > spike.y) {
            console.log("Spike collision! Dying...");
            onDeath();
            return true;
        }
    }
    return false;
}

// Star collection
export function checkStarCollection(stars, player, onCollect) {
    for (let star of stars) {
        if (!star.pickedUp && 
            player.x < star.x + star.width && 
            player.x + player.width > star.x &&
            player.y < star.y + star.height && 
            player.y + player.height > star.y) {
            console.log("Star collected!");
            star.pickedUp = true;
            onCollect();
            return true;
        }
    }
    return false;
}
