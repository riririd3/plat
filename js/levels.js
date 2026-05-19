// js/levels.js
export const LEVEL_MAPS = [
    {
        // Level 1
        playerSpawn: { x: 40, y: 460 },
        platforms: [
            { x: 0, y: 500, w: 200, h: 20 },
            { x: 250, y: 450, w: 100, h: 20 },
            { x: 400, y: 380, w: 100, h: 20 },
            { x: 550, y: 300, w: 100, h: 20 }
        ],
        spikes: [
            { x: 300, y: 490, w: 40, h: 10 }
        ],
        stars: [
            { x: 600, y: 270, w: 20, h: 20 }
        ]
    },
    {
        // Level 2
        playerSpawn: { x: 40, y: 460 },
        platforms: [
            { x: 0, y: 500, w: 150, h: 20 },
            { x: 200, y: 430, w: 80, h: 20 },
            { x: 330, y: 360, w: 80, h: 20 },
            { x: 460, y: 290, w: 80, h: 20 },
            { x: 590, y: 220, w: 120, h: 20 }
        ],
        spikes: [
            { x: 150, y: 490, w: 30, h: 10 },
            { x: 400, y: 280, w: 40, h: 10 }
        ],
        stars: [
            { x: 650, y: 190, w: 20, h: 20 }
        ]
    }
];
