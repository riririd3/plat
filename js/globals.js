// js/globals.js
// This file waits for kontra to be available

let kontraReady = false;
let kontraInstance = null;

export function getKontra() {
    return kontraInstance;
}

export function waitForKontra() {
    return new Promise((resolve) => {
        if (window.kontra) {
            kontraInstance = window.kontra;
            kontraReady = true;
            resolve(kontraInstance);
        } else {
            const checkInterval = setInterval(() => {
                if (window.kontra) {
                    clearInterval(checkInterval);
                    kontraInstance = window.kontra;
                    kontraReady = true;
                    resolve(kontraInstance);
                }
            }, 50);
        }
    });
}
