import { canvas, ctx, stats } from "./main.js";
import { player } from "./player.js";
import { levels } from "./level.js";

export const camera = {
    x: 0,
    y: 0,
    z: 0
}

const playerImg = new Image();
playerImg.src = "../images/plinkkstatic.png"

function drawImageAtCamera(x, y, image, width, height) {
    ctx.drawImage(
        image,
        canvas.width / 2 + camera.x + x,
        canvas.height / 2 + camera.y - y,
        width,
        height
    );
}

function fillRectAtCamera(x, y, width, height, color = "#789") {
    ctx.fillStyle = color;
    let drawX = canvas.width / 2 + camera.x + x;
    let drawY = canvas.height / 2 + camera.y - y;
    ctx.fillRect(drawX, drawY, width, height);
}

function drawSpikeAtCamera(x, y, w, h, color = "#e31", flip = 0) {
    let baseX = canvas.width / 2 + camera.x + x;
    let baseY = canvas.height / 2 + camera.y - y;
    ctx.beginPath();
    if (flip === 1) {
        baseY -= 20
        ctx.moveTo(baseX, baseY);
        ctx.lineTo(baseX + w / 2, baseY + h);
        ctx.lineTo(baseX + w, baseY);
    } else {
        ctx.moveTo(baseX, baseY);
        ctx.lineTo(baseX + w / 2, baseY - h);
        ctx.lineTo(baseX + w, baseY);
    }
    ctx.closePath();
    ctx.fillStyle = color;
    ctx.fill();
}

let completion = 0;
let cpindex = 1;

function drawCheckpointAtCamera(cpX, cpY) {
    const flagHeight = 18;
    const flagWidth = 14;
    const poleHeight = 32;
    const poleWidth = 2;

    let poleBaseX = canvas.width / 2 + camera.x + cpX + 10;
    let poleBaseY = canvas.height / 2 + camera.y - cpY + 20;
    ctx.save();
    ctx.strokeStyle = "#fff";
    if (player.respawn !== null) {
        if (player.respawn.x == cpX && player.respawn.y == cpY) {
            ctx.strokeStyle = "#888"
            completion = cpindex;
        }
    }
    ctx.lineWidth = poleWidth;
    ctx.beginPath();
    ctx.moveTo(poleBaseX, poleBaseY);
    ctx.lineTo(poleBaseX, poleBaseY - poleHeight);
    ctx.stroke();
    ctx.restore();

    ctx.save();
    ctx.beginPath();
    ctx.moveTo(poleBaseX, poleBaseY - poleHeight);
    ctx.lineTo(poleBaseX + flagWidth, poleBaseY - poleHeight + flagHeight / 2);
    ctx.lineTo(poleBaseX, poleBaseY - poleHeight + flagHeight);
    ctx.closePath();
    ctx.fillStyle = "#0f0";
    ctx.fill();
    ctx.restore();
}

export function draw() {
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    camera.x = 0 - player.x;
    camera.y = player.y;

    const thisLevel = levels[stats.level - 1] || levels[0];
    if (thisLevel && thisLevel.walls) {
        for (let i = 0; i < thisLevel.walls.length; i++) {
            const wall = thisLevel.walls[i];
            fillRectAtCamera(
                wall.x,
                wall.y - player.size,
                wall.w,
                0 - wall.h,
                "#789"
            );
        }
    }

    if (thisLevel && thisLevel.spikes) {
        for (let i = 0; i < thisLevel.spikes.length; i++) {
            const spike = thisLevel.spikes[i];
            drawSpikeAtCamera(spike.x, spike.y - 20, spike.w, spike.h, "#e31", spike.f);
        }
    }

    cpindex = 0;
    if (thisLevel && thisLevel.cp) {
        for (let i = 0; i < thisLevel.cp.length; i++) {
            cpindex++;
            const cp = thisLevel.cp[i];
            drawCheckpointAtCamera(cp.x, cp.y);
        }
    }

    drawImageAtCamera(player.x, player.y, playerImg, player.size, player.size);

    ctx.fillStyle = "#fff";
    ctx.font = "10px monospace";
    ctx.fillText(
        `(${(player.x).toFixed(2)},${(player.y).toFixed(2)}) | Time: ${(stats.t).toFixed(2)} | Completion: ${(((completion - 1) * 100) / (thisLevel.cp.length - 1)).toFixed(2)}%`,
        0,
        10
    );

    requestAnimationFrame(draw);
}