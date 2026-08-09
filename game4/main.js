export const canvas = document.getElementById("gamecanvas");
export const ctx = canvas.getContext("2d");

import { levels } from "./level.js"

export const stats = {
    fps: 0,
    t: 0,
    keysPressed: [],
    mx: 0,
    my: 0,
    level: 1,
}

let fpsHist = [];
let fpsAv = 0;


function updateMousePosition(e) {
    const rect = canvas.getBoundingClientRect();
    stats.mx = canvas.width/-2 + ((e.clientX - rect.left) * (canvas.width / rect.width));
    stats.my = canvas.height/2 - ((e.clientY - rect.top) * (canvas.height / rect.height));

}

canvas.addEventListener('mousemove', updateMousePosition);

function resizeCanvas() {
  canvas.width = (window.innerWidth) - 25;
  canvas.height = (window.innerHeight) - 25;
}

resizeCanvas();
window.addEventListener("resize", resizeCanvas);

window.addEventListener("keydown", (e) => {

  stats.keysPressed[e.key.toLowerCase()] = true;

  if (e.key.startsWith("Arrow")) {
    stats.keysPressed[e.key] = true;
  }
});

window.addEventListener("keyup", (e) => {
  stats.keysPressed[e.key.toLowerCase()] = false;
  if (e.key.startsWith("Arrow")) {
    stats.keysPressed[e.key] = false;
  }
});

let lastTimestamp;
function sampleFPS() {
    const now = performance.now();
    const delta = now - lastTimestamp;

    if (delta > 0 && delta < 1000) {
        stats.fps = 1000 / delta;
    }
    fpsHist.unshift(stats.fps)
    fpsAv = 0;
    for (let i = 0; i<fpsHist.length; i++) {
        fpsAv+=fpsHist[i];
    }
    fpsAv/=fpsHist.length
    if (fpsHist[60]) {fpsHist.splice(60,1)}
    lastTimestamp = now;

    requestAnimationFrame(sampleFPS);
}

sampleFPS();

import {draw} from "./render.js"
import {player} from "./player.js"

draw()
player.x = levels[stats.level - 1].playerStart.x
player.y = levels[stats.level - 1].playerStart.y

let targetFPS = 60;
let frameInterval = 1000 / targetFPS;

// Use this variable to avoid dropping frames if we fall behind
let lastTickTime = performance.now();

function tickLoop(now = performance.now()) {
    // Main loop runs as fast as possible, but game logic steps at fixed intervals
    let shouldContinue = true;
    let processed = false;

    while (now - lastTickTime >= frameInterval) {
        if (stats.fps > 0) { stats.t += 1 / stats.fps; }
        player.update();

        const level = levels[stats.level - 1];
        const lastCp = level.cp[level.cp.length - 1];
        if (
            player.respawn &&
            player.respawn.x === lastCp.x &&
            player.respawn.y === lastCp.y
        ) {
            draw();
            alert("You Win, Poggies!");
            shouldContinue = false;
            break;
        }
        lastTickTime += frameInterval;
        processed = true;
    }
    if (shouldContinue) {
        requestAnimationFrame(tickLoop);
    }
}

requestAnimationFrame(tickLoop);
