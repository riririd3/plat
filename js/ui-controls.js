// js/ui-controls.js
export function setupTouchControls(canvas, getGameBounds, onRestart, onStartGame, onToggleFullscreen, gameStateRef) {
    const touch = { left: false, right: false, jump: false };
    
    function resetTouch() {
        touch.left = false;
        touch.right = false;
        touch.jump = false;
    }
    
    // Mouse controls for testing (add this section)
    function handleMouse(e) {
        e.preventDefault();
        
        const rect = canvas.getBoundingClientRect();
        const scaleX = canvas.width / rect.width;
        const scaleY = canvas.height / rect.height;
        const x = (e.clientX - rect.left) * scaleX;
        const y = (e.clientY - rect.top) * scaleY;
        const { leftUI, rightUI, gameX, gameWidth } = getGameBounds();
        
        // Menu buttons
        if (gameStateRef.current === "menu" || gameStateRef.current === "victory") {
            const midX = gameX + gameWidth / 2;
            
            // Start button
            if (x > midX - 100 && x < midX + 100 && 
                y > canvas.height / 2 - 20 && y < canvas.height / 2 + 30) {
                onStartGame();
                return;
            }
            
            // Fullscreen button
            if (x > midX - 100 && x < midX + 100 && 
                y > canvas.height / 2 + 45 && y < canvas.height / 2 + 90) {
                onToggleFullscreen();
                return;
            }
            return;
        }
        
        // Gameplay controls - only in play mode
        if (gameStateRef.current === "play") {
            resetTouch();
            
            // D-pad area
            if (x < leftUI()) {
                const centerX = leftUI() / 2;
                if (x < centerX) {
                    touch.left = true;
                    console.log("Mouse: Left pressed");
                } else {
                    touch.right = true;
                    console.log("Mouse: Right pressed");
                }
            }
            
            // Jump button area
            if (x > canvas.width - rightUI()) {
                const jumpX = canvas.width - rightUI() / 2;
                const jumpY = canvas.height - 140 - 10 + 25;
                if (Math.hypot(x - jumpX, y - jumpY) < 25) {
                    touch.jump = true;
                    console.log("Mouse: Jump pressed");
                }
            }
        }
    }
    
    function handleMouseUp(e) {
        if (gameStateRef.current === "play") {
            resetTouch();
            console.log("Mouse: Controls reset");
        }
    }
    
    // Touch handlers (original)
    function handleTouch(e) {
        e.preventDefault();
        
        const rect = canvas.getBoundingClientRect();
        const scaleX = canvas.width / rect.width;
        const scaleY = canvas.height / rect.height;
        const activeTouches = e.type === "touchend" ? e.touches : e.targetTouches;
        const { leftUI, rightUI, gameX, gameWidth } = getGameBounds();
        
        // Check restart button
        for (let t of activeTouches) {
            const x = (t.clientX - rect.left) * scaleX;
            const y = (t.clientY - rect.top) * scaleY;
            
            if (x > canvas.width - rightUI()) {
                const rstX = canvas.width - rightUI() / 2;
                const rstY = 60;
                if (Math.hypot(x - rstX, y - rstY) < 20 && e.type === "touchstart") {
                    onRestart();
                    return;
                }
            }
        }
        
        // Menu buttons
        if (gameStateRef.current === "menu" || gameStateRef.current === "victory") {
            if (e.type === "touchstart") {
                for (let t of e.targetTouches) {
                    const x = (t.clientX - rect.left) * scaleX;
                    const y = (t.clientY - rect.top) * scaleY;
                    const midX = gameX + gameWidth / 2;
                    
                    if (x > midX - 100 && x < midX + 100 && 
                        y > canvas.height / 2 - 20 && y < canvas.height / 2 + 30) {
                        onStartGame();
                        return;
                    }
                    
                    if (x > midX - 100 && x < midX + 100 && 
                        y > canvas.height / 2 + 45 && y < canvas.height / 2 + 90) {
                        onToggleFullscreen();
                        return;
                    }
                }
            }
            return;
        }
        
        // Gameplay controls
        resetTouch();
        for (let t of activeTouches) {
            const x = (t.clientX - rect.left) * scaleX;
            const y = (t.clientY - rect.top) * scaleY;
            
            if (x < leftUI()) {
                const centerX = leftUI() / 2;
                if (x < centerX) touch.left = true;
                else touch.right = true;
            }
            
            if (x > canvas.width - rightUI()) {
                const jumpX = canvas.width - rightUI() / 2;
                const jumpY = canvas.height - 140 - 10 + 25;
                if (Math.hypot(x - jumpX, y - jumpY) < 25) {
                    touch.jump = true;
                }
            }
        }
    }
    
    // Add mouse event listeners for testing
    canvas.addEventListener("mousedown", handleMouse);
    canvas.addEventListener("mouseup", handleMouseUp);
    canvas.addEventListener("mouseleave", handleMouseUp);
    
    // Touch events
    canvas.addEventListener("touchstart", handleTouch, { passive: false });
    canvas.addEventListener("touchmove", handleTouch, { passive: false });
    canvas.addEventListener("touchend", handleTouch, { passive: false });
    
    return { touch, resetTouch };
}
