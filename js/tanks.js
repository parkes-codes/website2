class Basic extends Tank {
    constructor(x, y, size, dir, moveSpeed = 0.4, speedCap = 6, friction = 0.94) {
        super(x, y, size, dir, moveSpeed, speedCap, friction);

        this.barrels = [
            {
                dirOffset: 0,                        
                barrelLength: size * 0.88,
                barrelWidth: size * 0.93,
                outlineBarrelLength: size * 1.1*0.88,
                outlineBarrelWidth: size * 1.2*0.93,
                offset: size * 0.8,
                color: "#888",
                outlineColor: "#aaa",
                reload: 300,
                initialDelay: 0,
                recoil: 1.5,

                spawnX: size*1.25, 
                spawnY: 0,        
                timeSinceShot: 0,
                
                bulletRadius: size*0.5,
                bulletDmg: 10,
                bulletSpeed: size/(30/8),
                bulletSpeedDecay: 0.99,
                bulletDuration: 2
            },
        ];
    }

    draw() {
        super.draw();
    }
}

class Annihilator extends Tank {
    constructor(x, y, size, dir, moveSpeed = 0.4, speedCap = 6, friction = 0.94) {
        super(x, y, size, dir, moveSpeed, speedCap, friction);

        this.barrels = [
            {
                dirOffset: 0,                        
                barrelLength: size * 1.6,
                barrelWidth: size * 1.6,
                outlineBarrelLength: size * 1.06*1.6,
                outlineBarrelWidth: size * 1.2*1.6,
                offset: size * 0.3,
                reloaddIntensity: 80,
                color: "#888",
                outlineColor: "#aaa",
                reload: 1000,
                initialDelay: 0,
                recoil: 10,

                spawnX: size*1.6, 
                spawnY: 0,        
                timeSinceShot: 0,
                
                bulletRadius: size*0.9,
                bulletDmg: 10,
                bulletSpeed: size/(30/8),
                bulletSpeedDecay: 0.97,
                bulletDuration: 1.5
            },
        ];
    }

    draw() {
        super.draw();
    }
}


class Tri extends Tank {
    constructor(x, y, size, dir, moveSpeed = 0.4, speedCap = 6, friction = 0.94) {
        super(x, y, size, dir, moveSpeed, speedCap, friction);

        this.barrels = [
            {
                dirOffset: pi/6,                        
                barrelLength: size * 1,
                barrelWidth: size * 0.8,
                outlineBarrelLength: size * 1.1*1,
                outlineBarrelWidth: size * 1.2*0.8,
                offset: size * 0.8,
                color: "#888",
                outlineColor: "#aaa",
                reload: 300, 
                initialDelay: 150,
                recoil: 0.7,

                spawnX: size*0.4, 
                spawnY: size*0.8,        
                timeSinceShot: 0,
                
                bulletRadius: size*0.5,
                bulletDmg: 10,
                bulletSpeed: size/(30/8),
                bulletSpeedDecay: 0.99,
                bulletDuration: 2
            },
            {
                dirOffset: pi/-6,                        
                barrelLength: size * 1,
                barrelWidth: size * 0.8,
                outlineBarrelLength: size * 1.1*1,
                outlineBarrelWidth: size * 1.2*0.8,
                offset: size * 0.8,
                color: "#888",
                outlineColor: "#aaa",
                reload: 300, 
                initialDelay: 150,
                recoil: 0.7,

                spawnX: size*0.4, 
                spawnY: size*-0.8,        
                timeSinceShot: 0,
                
                bulletRadius: size*0.5,
                bulletDmg: 10,
                bulletSpeed: size/(30/8),
                bulletSpeedDecay: 0.99,
                bulletDuration: 2
            },
            {
                dirOffset: 0,                        
                barrelLength: size * 1.3,
                barrelWidth: size * 0.8,
                outlineBarrelLength: size * 1.1*1.27,
                outlineBarrelWidth: size * 1.2*0.8,
                offset: size * 0.8,
                color: "#888",
                outlineColor: "#aaa",
                reload: 300, 
                initialDelay: 0,
                recoil: 0.7,

                spawnX: size*1.4, 
                spawnY: 0,        
                timeSinceShot: 0,
                
                bulletRadius: size*0.5,
                bulletDmg: 10,
                bulletSpeed: size/(30/8),
                bulletSpeedDecay: 0.99,
                bulletDuration: 2
            }
        ];
    }

    draw() {
        super.draw();
    }
}

class Penta extends Tank {
    constructor(x, y, size, dir, moveSpeed = 0.4, speedCap = 6, friction = 0.94) {
        super(x, y, size, dir, moveSpeed, speedCap, friction);

        this.barrels = [
            {
                dirOffset: pi/3,                        
                barrelLength: size * 0.7,
                barrelWidth: size * 0.6,
                outlineBarrelLength: size * 1.1*0.7,
                outlineBarrelWidth: size * 1.2*0.6,
                offset: size * 0.8,
                color: "#888",
                outlineColor: "#aaa",
                reload: 300, 
                initialDelay: 200,
                recoil: 0.5,

                spawnX: size*-0.3, 
                spawnY: size*0.8,        
                timeSinceShot: 0,
                
                bulletRadius: size*0.4,
                bulletDmg: 10,
                bulletSpeed: size/(30/8),
                bulletSpeedDecay: 0.99,
                bulletDuration: 2
            },
            {
                dirOffset: pi/-3,                        
                barrelLength: size * 0.7,
                barrelWidth: size * 0.6,
                outlineBarrelLength: size * 1.1*0.7,
                outlineBarrelWidth: size * 1.2*0.6,
                offset: size * 0.8,
                color: "#888",
                outlineColor: "#aaa",
                reload: 300, 
                initialDelay: 200,
                recoil: 0.5,

                spawnX: size*-0.3, 
                spawnY: size*-0.8,        
                timeSinceShot: 0,
                
                bulletRadius: size*0.4,
                bulletDmg: 10,
                bulletSpeed: size/(30/8),
                bulletSpeedDecay: 0.99,
                bulletDuration: 2
            },
            {
                dirOffset: pi/6,                        
                barrelLength: size * 1,
                barrelWidth: size * 0.75,
                outlineBarrelLength: size * 1.1*1,
                outlineBarrelWidth: size * 1.2*0.75,
                offset: size * 0.8,
                color: "#888",
                outlineColor: "#aaa",
                reload: 300, 
                initialDelay: 100,
                recoil: 0.5,

                spawnX: size*0.4, 
                spawnY: size*0.8,        
                timeSinceShot: 0,
                
                bulletRadius: size*0.45,
                bulletDmg: 10,
                bulletSpeed: size/(30/8),
                bulletSpeedDecay: 0.99,
                bulletDuration: 2
            },
            {
                dirOffset: pi/-6,                        
                barrelLength: size * 1,
                barrelWidth: size * 0.75,
                outlineBarrelLength: size * 1.1*1,
                outlineBarrelWidth: size * 1.2*0.75,
                offset: size * 0.8,
                color: "#888",
                outlineColor: "#aaa",
                reload: 300, 
                initialDelay: 100,
                recoil: 0.5,

                spawnX: size*0.4, 
                spawnY: size*-0.8,        
                timeSinceShot: 0,
                
                bulletRadius: size*0.45,
                bulletDmg: 10,
                bulletSpeed: size/(30/8),
                bulletSpeedDecay: 0.99,
                bulletDuration: 2
            },
            {
                dirOffset: 0,                        
                barrelLength: size * 1.3,
                barrelWidth: size * 0.8,
                outlineBarrelLength: size * 1.1*1.27,
                outlineBarrelWidth: size * 1.2*0.8,
                offset: size * 0.8,
                color: "#888",
                outlineColor: "#aaa",
                reload: 300, 
                initialDelay: 0,
                recoil: 0.5,

                spawnX: size*1.4, 
                spawnY: 0,        
                timeSinceShot: 0,
                
                bulletRadius: size*0.5,
                bulletDmg: 10,
                bulletSpeed: size/(30/8),
                bulletSpeedDecay: 0.99,
                bulletDuration: 2
            }
        ];
    }

    draw() {
        super.draw();
    }
}


class Lorry extends Tank {
    constructor(x, y, size, dir, moveSpeed = 0.4, speedCap = 6, friction = 0.94) {
        super(x, y, size, dir, moveSpeed, speedCap, friction);

        this.barrels = [
            {
                dirOffset: 0,                        
                barrelLength: size * 3.5,
                barrelWidth: size * 2,
                outlineBarrelLength: size * 3.5+3,
                outlineBarrelWidth: size * 1.2*2,
                offset: size * -0.55,
                color: "#888",
                outlineColor: "#aaa",
                reload: 20,
                initialDelay: 0,
                recoil: 0.2,

                spawnX: size*2.7, 
                spawnY: 0,        
                timeSinceShot: 0,
                
                randStrength: 1.5,
                bulletRadius: size*0.5,
                bulletDmg: 10,
                bulletSpeed: size/3,
                bulletSpeedDecay: 0.99,
                bulletDuration: 1.5,
            },
        ];
    }

        draw() {
            for (let b of this.barrels) {
                let reloadDuration = b.reload / 1000;
                let shotTime = (typeof b.timeSinceShot !== "undefined") ? b.timeSinceShot : reloadDuration;
    
                let recoilPushback = Math.max(reloadDuration - shotTime, 0) * 30;
                let visualOffset = b.offset - recoilPushback*15;
    
                drawTriBarrel({
                    x: this.x,
                    y: this.y,
                    size: this.size,
                    dir: this.dir,
                    dirOffset: b.dirOffset,
                    barrelLength: b.barrelLength,
                    barrelWidth: b.barrelWidth,
                    outlineBarrelLength: b.outlineBarrelLength,
                    outlineBarrelWidth: b.outlineBarrelWidth,
                    offset: visualOffset,
                    color: b.color,
                    outlineColor: b.outlineColor,
                    reload: b.reload,
                    spawnX: b.spawnX,
                    spawnY: b.spawnY
                });


            }
            drawBody(this.x,this.y,this.size);
        }
    
}

class Octo extends Tank {
    constructor(x, y, size, dir, moveSpeed = 0.4, speedCap = 6, friction = 0.94) {
        super(x, y, size, dir, moveSpeed, speedCap, friction);

        const baseBarrel = {
            barrelLength: size * 1,
            barrelWidth: size * 0.8,
            outlineBarrelLength: size * 1 *1.1,
            outlineBarrelWidth: size * 0.8 * 1.2,
            offset: size * 0.8,
            color: "#888",
            outlineColor: "#aaa",
            reload: 300,
            initialDelay: 0,
            recoil: 0,
            timeSinceShot: 0,

            bulletRadius: size * 0.5,
            bulletDmg: 10,
            bulletSpeed: size / (30 / 8),
            bulletSpeedDecay: 0.99,
            bulletDuration: 2
        };


        this.barrels = [];
        const barrelDistance = size * 1;
        for (let i = 0; i < 8; i++) {
            const angle = i * (Math.PI / 4);
            this.barrels.push({
                ...baseBarrel,
                dirOffset: angle,
                initialDelay: (i % 2 === 1) ? 150 : baseBarrel.initialDelay,
                spawnX: Math.cos(angle*2) * barrelDistance,
                spawnY: Math.sin(angle*2) * barrelDistance,
            });
        }
    }

    draw() {
        super.draw();
    }
}


class QuadLorry extends Tank {
    constructor(x, y, size, dir, moveSpeed = 0.4, speedCap = 6, friction = 0.94) {
        super(x, y, size, dir, moveSpeed, speedCap, friction);

        // Create 4 identical barrels at dirOffset 0, 90, 180, 270 degrees (in radians)
        const baseBarrel = {
            barrelLength: size * 3.5,
            barrelWidth: size * 2,
            outlineBarrelLength: size * 3.5 + 3,
            outlineBarrelWidth: size * 1.2 * 2,
            offset: size * -0.55,
            color: "#888",
            outlineColor: "#aaa",
            reload: 20,
            initialDelay: 0,
            recoil: 0,
            spawnX: 0,
            spawnY: 0,
            timeSinceShot: 0,
            randStrength: 1.5,
            bulletRadius: size * 0.5,
            bulletDmg: 10,
            bulletSpeed: size / 3,
            bulletSpeedDecay: 0.99,
            bulletDuration: 1,
        };

        this.barrels = [];
        for (let i = 0; i < 4; i++) {
            const angle = i * (Math.PI / 2); // 0, pi/2, pi, 3pi/2
            this.barrels.push({
                ...baseBarrel,
                dirOffset: angle,
            });
        }

        //adjust posthaste
        this.barrels[0].spawnX = size*2.5;
        this.barrels[0].spawnY = 0;

        this.barrels[1].spawnX = -size*2.5;
        this.barrels[1].spawnY = 0;

        this.barrels[2].spawnX = size*2.5;
        this.barrels[2].spawnY = 0;

        this.barrels[3].spawnX = -size*2.5;
        this.barrels[3].spawnY = 0;
    }

    draw() {
        for (let b of this.barrels) {
            let reloadDuration = b.reload / 1000;
            let shotTime = (typeof b.timeSinceShot !== "undefined") ? b.timeSinceShot : reloadDuration;

            let recoilPushback = Math.max(reloadDuration - shotTime, 0) * 30;
            let visualOffset = b.offset - recoilPushback * 15;

            drawTriBarrel({
                x: this.x,
                y: this.y,
                size: this.size,
                dir: this.dir,
                dirOffset: b.dirOffset,
                barrelLength: b.barrelLength,
                barrelWidth: b.barrelWidth,
                outlineBarrelLength: b.outlineBarrelLength,
                outlineBarrelWidth: b.outlineBarrelWidth,
                offset: visualOffset,
                color: b.color,
                outlineColor: b.outlineColor,
                reload: b.reload,
                spawnX: b.spawnX,
                spawnY: b.spawnY
            });
        }
        drawBody(this.x, this.y, this.size);
    }
}



// for rendering
const tankTypes = {
    "Basic": Basic,
    "Annihilator": Annihilator,
    "Tri": Tri,
    "Penta": Penta, 
    "Octo": Octo,
    "Lorry": Lorry,
    // "QuadLorry": QuadLorry // ass tank XD
    "Overseer": Overseer,
    "Bigcheese": Bigcheese
};

const tanks = [
    new Basic(-200, 0, 50, 0),
];