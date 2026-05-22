// levels.js
const LEVEL_MAPS = [
  {
    // Level 1: Quick platform step over a floor hazard spike pit
    playerSpawn: { x: 40, y: 300 }, 
    platforms: [
      { x: 150, y: 400, w: 120, h: 15 },
      { x: 350, y: 280, w: 160, h: 20 },
      // Fixed: Moved down into jumping range (moves up and down between Y: 180 and Y: 320)
      { x: 200, y: 300, w: 80, h: 20, vx: 2, minX: 201, maxX: 320 }
    ],
    spikes: [
      { x: 400, y: 460, w: 40, h: 40 } // Perfectly scaled sitting on the bottom floor
    ],
    stars: [
      { x: 420, y: 220 } // Placed safely on top of the high platform
    ]
  },
  {
    // Level 2: Higher climbs with a moving elevator platform
    playerSpawn: { x: 60, y: 400 }, 
    platforms: [
      { x: 80,  y: 380, w: 80,  h: 15 },
      { x: 220, y: 290, w: 80,  h: 15 },
      // Fixed: Removed the stray comma before 450, and fixed boundaries to match spawn Y: 200
      { x: 450, y: 200, w: 140, h: 20, vy: 1.5, minY: 150, maxY: 350 }
    ],
    spikes: [
      { x: 240, y: 460, w: 40, h: 40 }
    ],
    stars: [
      { x: 500, y: 100 }
    ]
  }
];
