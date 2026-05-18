// levels.js
const LEVEL_MAPS = [
  {
    // Level 1: Spawn near the bottom left
    playerSpawn: { x: 40, y: 300 }, 
    platforms: [
      { x: 0,   y: 500, w: 640, h: 40 },
      { x: 150, y: 380, w: 120, h: 15 },
      { x: 350, y: 80, w: 160, h: 20 }
    ],
    stars: [
      { x: 20, y: 20 }
    ]
  },
  {
    // Level 2: Spawn higher up or on the right side to mix it up!
    playerSpawn: { x: 450, y: 150 }, 
    platforms: [
      { x: 0,   y: 500, w: 640, h: 40 },
      { x: 80,  y: 400, w: 60,  h: 15 },
      { x: 220, y: 320, w: 60,  h: 15 },
      { x: 380, y: 240, w: 200, h: 20 }
    ],
    stars: [
      { x: 100, y: 320 }
    ]
  }
];
