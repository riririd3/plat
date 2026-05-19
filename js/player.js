const kontra = window.kontra;

export function createPlayer(gameStateRef, touchRef, keyPressed, getGameBounds) {
  const player = Sprite({
    x: 0, y: 0, width: 32, height: 32, color: "lime", dy: 0, grounded: false,
    
    update() {
      if (gameStateRef.current !== "play") {
        this.dy = 0;
        return;
      }
      
      // Movement
      if (keyPressed("left") || touchRef.current.left) this.x -= 4;
      if (keyPressed("right") || touchRef.current.right) this.x += 4;
      
      // Jump
      if ((keyPressed("space") || touchRef.current.jump) && this.grounded) {
        this.dy = -11;
        this.grounded = false;
      }
      
      // Gravity
      this.dy += 0.5;
      this.y += this.dy;
      
      // Boundaries
      const { gameX, gameWidth } = getGameBounds();
      if (this.x < gameX) this.x = gameX;
      if (this.x + this.width > gameX + gameWidth) 
        this.x = gameX + gameWidth - this.width;
    },
    
    render() { 
      this.draw(); 
    }
  });
  
  return player;
}

export function updatePlayerGround(player, canvas, groundHeight = 40) {
  const floor = canvas.height - groundHeight;
  if (player.y + player.height >= floor) {
    player.y = floor - player.height;
    player.dy = 0;
    player.grounded = true;
  }
}
