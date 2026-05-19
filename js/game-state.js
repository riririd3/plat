// js/game-state.js
import { LEVEL_MAPS } from './levels.js';

export function createGameState() {
    return {
        currentLevelIndex: 0,
        gameState: "menu",
        stateTimer: 3.0,
        totalPlayTime: 0.0,
        platforms: [],
        spikes: [],
        stars: []
    };
}

export function loadLevel(state, player, gameX, gameWidth, canvas, kontra) {
    console.log("Loading level:", state.currentLevelIndex);
    
    if (state.currentLevelIndex >= LEVEL_MAPS.length) {
        state.gameState = "victory";
        console.log("Victory! All levels complete");
        return;
    }
    
    state.gameState = "memorize";
    state.stateTimer = 3.0;
    state.platforms = [];
    state.spikes = [];
    state.stars = [];
    
    const currentLevel = LEVEL_MAPS[state.currentLevelIndex];
    console.log("Current level data:", currentLevel);
    
    // Set player position
    if (currentLevel.playerSpawn) {
        player.x = gameX + currentLevel.playerSpawn.x;
        player.y = currentLevel.playerSpawn.y;
    } else {
        player.x = gameX + 40;
        player.y = canvas.height - 120;
    }
    player.dy = 0;
    player.grounded = false;
    
    // Load platforms
    if (currentLevel.platforms) {
        currentLevel.platforms.forEach(p => {
            state.platforms.push(kontra.Sprite({
                x: gameX + p.x, 
                y: p.y, 
                width: p.w, 
                height: p.h, 
                color: "#64748b",
                render() { this.draw(); }
            }));
        });
        console.log("Loaded platforms:", state.platforms.length);
    }
    
    // Load spikes
    if (currentLevel.spikes) {
        currentLevel.spikes.forEach(s => {
            state.spikes.push(kontra.Sprite({
                x: gameX + s.x, 
                y: s.y, 
                width: s.w, 
                height: s.h, 
                color: "#ef4444",
                render() { this.draw(); }
            }));
        });
        console.log("Loaded spikes:", state.spikes.length);
    }
    
    // Load stars
    if (currentLevel.stars) {
        currentLevel.stars.forEach(s => {
            state.stars.push(kontra.Sprite({
                x: gameX + s.x, 
                y: s.y, 
                width: s.w || 20, 
                height: s.h || 20, 
                color: "gold", 
                pickedUp: false,
                render() { if (!this.pickedUp) this.draw(); }
            }));
        });
        console.log("Loaded stars:", state.stars.length);
    }
}

export function updateGameState(state, deltaTime, onLevelComplete, onDeath) {
    if (state.gameState === "memorize") {
        state.stateTimer -= deltaTime;
        if (state.stateTimer <= 0) {
            state.gameState = "play";
            console.log("Memorize phase ended, starting play phase");
        }
    }
    
    if (state.gameState === "play") {
        state.totalPlayTime += deltaTime;
    }
    
    // Check if all stars collected
    if (state.gameState === "play" && state.stars.length > 0) {
        const allStarsCollected = state.stars.every(star => star.pickedUp);
        if (allStarsCollected) {
            console.log("All stars collected! Advancing level");
            onLevelComplete();
        }
    }
}
