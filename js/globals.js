// js/globals.js
let kontraInstance = null;
let waitPromise = null;

export function setKontra(kontra) {
    kontraInstance = kontra;
}

export function getKontra() {
    if (!kontraInstance) {
        throw new Error('Kontra not initialized yet!');
    }
    return kontraInstance;
}

export function waitForKontra() {
    if (waitPromise) return waitPromise;
    
    waitPromise = new Promise((resolve) => {
        if (window.kontra) {
            kontraInstance = window.kontra;
            resolve(kontraInstance);
        } else {
            const checkInterval = setInterval(() => {
                if (window.kontra) {
                    clearInterval(checkInterval);
                    kontraInstance = window.kontra;
                    resolve(kontraInstance);
                }
            }, 50);
        }
    });
    return waitPromise;
}
