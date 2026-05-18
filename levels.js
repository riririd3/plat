// levels.js
const LEVEL_MAPS = [
  {
    // Level 1: Quick platform step over a floor hazard spike pit
    playerSpawn: { x: 40, y: 300 }, 
    platforms: [
      { x: 150, y: 400, w: 120, h: 15 },
      { x: 350, y: 280, w: 160, h: 20 }
    ],
    spikes: [
      { x: 300, y: 460, w: 40, h: 40 } // Now perfectly visible sitting on the floor!
    ],
    stars: [
      { x: 420, y: 460 }
    ]
  },
  {
    // Level 2: Higher climbs
    playerSpawn: { x: 60, y: 400 }, 
    platforms: [
      { x: 80,  y: 380, w: 80,  h: 15 },
      { x: 220, y: 290, w: 80,  h: 15 },
      { x: 380, y: 200, w: 180, h: 20 }
    ],
    spikes: [
      { x: 240, y: 460, w: 40, h: 40 }
    ],
    stars: [
      { x: 470, y: 140 }
    ]
  }
];
