import { stats } from "./main.js"
import { levels } from "./level.js"

function playerWallOverlap(
    playerX, playerY, playerSize,
    wallX, wallY, wallW, wallH
) {
    const pLeft = playerX;
    const pRight = playerX + playerSize;
    const pBottom = playerY;
    const pTop = playerY + playerSize;

    const wLeft = wallX;
    const wRight = wallX + wallW;
    const wBottom = wallY;
    const wTop = wallY + wallH;

    return !(pRight <= wLeft || pLeft >= wRight || pTop <= wBottom || pBottom >= wTop);
}

function playerSpikeOverlap(playerX, playerY, playerSize, spike) {
    const sX = spike.x + spike.w / 4;
    const sY = spike.y;
    const sW = spike.w / 2;
    const sH = spike.h / 1.5;
    return playerWallOverlap(playerX, playerY, playerSize, sX, sY, sW, sH);
}

function playerCheckpointOverlap(playerX, playerY, playerSize, checkpoint) {
    return playerWallOverlap(playerX, playerY, playerSize, checkpoint.x, checkpoint.y, 20, 60);
}

export const player = {
    x: 0,
    y: 0,
    xv: 0,
    yv: 0,
    grounded: false,
    size: 20,
    hasJumped: false,
    jumpKeyWasDown: false,
    sKeyWasDown: false,
    pounding: false,
    jumpHoldTime: 0,
    maxJumpHold: 30,
    minJumpVelocity: 2.0,
    jumpBoostPerFrame: 1.12,
    respawn: null,

    update: function () {
        const currentLevel = levels[stats.level - 1] || levels[0];
        const walls = currentLevel.walls || [];
        const spikes = currentLevel.spikes || [];
        const checkpoints = currentLevel.cp || [];
        const playerStart = currentLevel.playerStart || { x: 0, y: 0 };

        let prevX = this.x;
        let prevY = this.y;

        let newX = this.x + this.xv;
        let collidedX = false;
        for (let i = 0; i < walls.length; i++) {
            const w = walls[i];
            if (
                playerWallOverlap(
                    newX, this.y, this.size,
                    w.x, w.y, w.w, w.h
                )
            ) {
                if (this.xv > 0) {
                    newX = w.x - this.size;
                } else if (this.xv < 0) {
                    newX = w.x + w.w;
                } else {
                    newX = prevX;
                }
                this.xv = 0;
                collidedX = true;
                break;
            }
        }
        this.x = newX;

        let newY = this.y + this.yv;
        let collidedY = false;
        for (let i = 0; i < walls.length; i++) {
            const w = walls[i];
            if (
                playerWallOverlap(
                    this.x, newY, this.size,
                    w.x, w.y, w.w, w.h
                )
            ) {
                if (this.yv > 0) {
                    newY = w.y - this.size;
                    this.grounded = false;
                } else if (this.yv < 0) {
                    newY = w.y + w.h;
                    this.grounded = true;
                } else {
                    newY = prevY;
                }
                this.yv = 0;
                collidedY = true;
                break;
            }
        }
        this.y = newY;

        for (let i = 0; i < checkpoints.length; i++) {
            if (playerCheckpointOverlap(this.x, this.y, this.size, checkpoints[i])) {
                this.respawn = { x: checkpoints[i].x, y: checkpoints[i].y };
            }
        }

        for (let i = 0; i < spikes.length; i++) {
            if (playerSpikeOverlap(this.x, this.y, this.size, spikes[i])) {
                const respawnPoint = this.respawn || playerStart;
                this.x = respawnPoint.x;
                this.y = respawnPoint.y;
                this.xv = 0;
                this.yv = 0;
                this.grounded = false;
                this.hasJumped = false;
                this.pounding = false;
                this.jumpHoldTime = 0;
                return;
            }
        }

        if (this.grounded) {
            this.hasJumped = false;
            this.jumpHoldTime = 0;
        }
        if (!collidedY) {
            this.grounded = false;
        }

        if (this.grounded) {
            this.xv *= 0.97;
            this.xv *= 0.97;
        } else {
            this.xv *= 0.99;
        }
        this.yv -= 0.2;

        if (stats.keysPressed["a"] || stats.keysPressed["ArrowLeft"]) {
            this.xv -= 0.12;
            if (this.grounded) {
                this.xv -= 0.12;
            }
        }
        if (stats.keysPressed["d"] || stats.keysPressed["ArrowRight"]) {
            this.xv += 0.12;
            if (this.grounded) {
                this.xv += 0.12;
            }
        }

        let wKeyDown = !!stats.keysPressed["w"] || !!stats.keysPressed["ArrowUp"];
        if (wKeyDown && this.jumpHoldTime < this.maxJumpHold) {
            if (this.grounded) {
                this.yv = this.minJumpVelocity;
                this.hasJumped = true;
                this.jumpHoldTime = 1;
            } else {
                if (this.yv > 0) {
                   this.yv *= this.jumpBoostPerFrame;
                }
                this.jumpHoldTime++;
            }
        }

        if (!wKeyDown && this.grounded) {
            this.jumpHoldTime = 0;
        }

        this.sKeyWasDown = !!stats.keysPressed["s"] || !!stats.keysPressed["ArrowDown"];

        if (!!stats.keysPressed["e"]) {
            this.yv = 4;
        }

        this.jumpKeyWasDown = wKeyDown;

    }
}