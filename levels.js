const LEVEL_MAPS = [
  { //level 1
    playerSpawn: { x: 40, y: 468 },
    // Standard and moving platforms
    platforms: [
      { x: 100, y: 400, w: 100, h: 20 },
      { x: 300, y: 300, w: 100, h: 20, vx: 2, minX: 250, maxX: 450 }
    ],
    // Optional static torches to cut holes in the fog
    torches: [
      { x: 150, y: 350, radius: 90 }
    ],
    // Networks of buttons and blocks.
    buttons: [
    { x: 550, y: 490 },
    { x: 400, y: 250 }
    ],
    gates: [
    { x: 500, y: 420, w: 20, h: 80 } 
    ],
    // GRAVITY PLATFORMS: 
    gravityPlatforms: [
    { x: 200, y: 320, w: 80, h: 20, type: "inverter" },
    { x: 400, y: 50, w: 80, h: 20, type: "restorer" }
    ],
    // Fragile step blocks (break on touch, auto-respawn in 1 sec)
    fragileBlocks: [
      { x: 250, y: 420, w: 60, h: 15 }
    ],
    // Launch Pads: "jump" launches up, "dash" forces horizontal speed
    pads: [
      { x: 420, y: 488, type: "jump", power: -13 },
      { x: 50,  y: 488, type: "dash", power: 15 }
    ],
    spikes: [
      { x: 320, y: 460, w: 40, h: 40 }
    ],
    stars: [
      { x: 580, y: 250 }
    ]
  },
  { //level 2
    playerSpawn: { x: 580, y: 250 },
  platforms: [
    { x: 580, y: 282, w: 100, h: 20 }
    ],
    stars: [
    { x: 320, y: 460 }
    ]
  } 
];
