// js/player.js
export function createPlayer(gameStateRef, touchRef, keyPressed, getGameBounds, kontra) {
    const player = kontra.Sprite({
        x: 0, 
        y: 0, 
        width: 32, 
        height: 32, 
        color: "lime", 
        dy: 0, 
        grounded: false,
        
        update() {
            if (gameStateRef.current !== "play") {
                this.dy = 0;
                return;
            }
            
            const leftPressed = keyPressed("left");
            const rightPressed = keyPressed("right");
            const spacePressed = keyPressed("space");
            
            // Debug - uncomment to see key presses
            // if (leftPressed || rightPressed || spacePressed) {
            //     console.log("Key pressed - Left:", leftPressed, "Right:", rightPressed, "Space:", spacePressed);
            // }
            
            // Movement
            if (leftPressed || touchRef.current.left) {
                this.x -= 4;
                console.log("Moving left"); // Temporary debug
            }
            if (rightPressed || touchRef.current.right) {
                this.x += 4;
                console.log("Moving right"); // Temporary debug
            }
            
            // Jump
            if ((spacePressed || touchRef.current.jump) && this.grounded) {
                this.dy = -11;
                this.grounded = false;
                console.log("Jump!"); // Temporary debug
            }
            
            // Gravity
            this.dy += 0.5;
            this.y += this.dy;
            
            // Boundaries
            const { gameX, gameWidth } = getGameBounds();
            if (this.x < gameX) this.x = gameX;
            if (this.x + this.width > gameX + gameWidth) {
                this.x = gameX + gameWidth - this.width;
            }
        },
        
        render() { 
            this.draw(); 
        }
    });
    
    return player;
}

// js/player.js
export function updatePlayerGround(player, canvas, groundHeight = 40) {
    const floor = canvas.height - groundHeight;
    const wasGrounded = player.grounded;
    
    if (player.y + player.height >= floor) {
        player.y = floor - player.height;
        player.dy = 0;
        player.grounded = true;
        if (!wasGrounded) {
            console.log("Landed on ground at Y:", floor);
        }
    } else {
        player.grounded = false;
    }
}
