import { subtractMoney } from "./main.js";

// Ball spawn multiplier global state
let ballSpawnMultipliers = [1, 10, 100];
let ballSpawnMultiplierIndex = 0;

// Inject minimal CSS for tooltips (unchanged) and #ball-multiplier width
let tooltipCssInjected = false;
function injectTooltipCss() {
    if (tooltipCssInjected) return;
    tooltipCssInjected = true;
    const style = document.createElement('style');
    style.innerHTML = `
    .ui-tooltip {
        pointer-events: none;
        position: absolute;
        z-index: 1000;
        opacity: 0;
        transition: opacity 0.22s cubic-bezier(.35,.87 ,.71,.15);
        background: #222a;
        color: #fff;
        padding: 5px 11px;
        border-radius: 6px;
        font-size: 13px;
        white-space: pre-line;
        box-shadow: 0 3px 12px #0004;
        max-width: 260px;
        user-select: none;
        font-family: 'Lucida Sans', 'Lucida Sans Regular', 'Lucida Grande', 'Lucida Sans Unicode', Geneva, Verdana, sans-serif;
    }
    .ui-tooltip-visible {
        opacity: 1 !important;
    }
    #ball-multiplier {
        width: 60px !important;
        height: 20px !important;
        min-width: 0 !important;
        max-width: 70px;
        padding-left: 0;
        padding-right: 0;
        text-align: center;
        box-sizing: border-box;
    }
    `;
    document.head.appendChild(style);
}

function displayCount(current, next) {
    return `${current}=>${next}`;
}
function displayPrice(price) {
    return "$" + Math.floor(price);
}

// Ball types that get a "ball+" button
const ballBuyEntries = [
    ["basic",    "buy-basic-ball",    "basic"],
    ["sniper",   "buy-sniper-ball",   "sniper"],
    ["splash",   "buy-splash-ball",   "splash"],
    ["scatter",  "buy-scatter-ball",  "scatter"],
    ["cannon",   "buy-cannon-ball",   "cannon"],
    ["pierce",   "buy-pierce-ball",   "pierce"]
];

// Top row UI config
const row1 = [
    {
        id: "ball-multiplier",
        text: "1x",
        title: "Purchase Count",
        javascript: ({elements}) => {
            elements["ball-multiplier"].addEventListener("click", () => {
                ballSpawnMultiplierIndex = (ballSpawnMultiplierIndex + 1) % ballSpawnMultipliers.length;
                elements["ball-multiplier"].textContent = ballSpawnMultipliers[ballSpawnMultiplierIndex] + "x";
            });
            // Set width immediately in case CSS is not fast enough:
            if (elements["ball-multiplier"]) {
                elements["ball-multiplier"].style.width = "20px";
                elements["ball-multiplier"].style.minWidth = "0";
                elements["ball-multiplier"].style.maxWidth = "40px";
                elements["ball-multiplier"].style.textAlign = "center";
                elements["ball-multiplier"].style.paddingLeft = "0";
                elements["ball-multiplier"].style.paddingRight = "0";
                elements["ball-multiplier"].style.boxSizing = "border-box";
            }
        }
    }
    // Buy buttons added below
];

// All button updaters, for uiLoop force update
const upgradeButtonUpdaters = {};

// Move definition above all code!
var globalUiState = {
    balls: [],
    rectangles2D: [],
    currency: {
        level: 1,
        money: 0,
        ballCount: 0,
        rectCount: 0,
        healthSum: 0
    },
    upgrades: null,
};

// BUY BALL BUTTONS (no nonsense, just like speed+)
for (let i = 0; i < ballBuyEntries.length; ++i) {
    const [type, id, label] = ballBuyEntries[i];
    row1.push({
        id,
        title: `Permanently adds a ${label} ball.`,
        javascript: ({elements, createBall}) => {
            const btn = elements[id];
            if (!btn) return;

            function getBallTypeCount() {
                const balls = globalUiState.balls;
                if (Array.isArray(balls)) {
                    return balls.filter(ball => ball.type === type).length;
                }
                return 0;
            }

            function update() {
                const upgrades = globalUiState.upgrades;
                let count = getBallTypeCount();
                let price = upgrades ? upgrades[`${type}NewPrice`] : "?";
                let purchaseCount = ballSpawnMultipliers[ballSpawnMultiplierIndex] || 1;
                let nextCount = (typeof count === "number" && Number.isFinite(count)) ? (count + purchaseCount) : purchaseCount;
                let effectivePrice = (typeof price === "number" && isFinite(price)) ? price * purchaseCount : price;
                btn.innerHTML = `
                    ${type}<br>
                    (${displayCount(count, nextCount)})<br>
                    ${displayPrice(effectivePrice)}<br>
                    <span style="letter-spacing:-0.4ch;margin-left:-3px;color:${(typeof price === "number" && globalUiState.currency.money >= (price * purchaseCount)) ? "#afa" : "#fff"}">${progBar(globalUiState.currency.money, (typeof price === "number" ? price * purchaseCount : price))}</span>
                `;
            }
            upgradeButtonUpdaters[id] = update;
            update();

            btn.addEventListener("click", () => {
                const upgrades = globalUiState.upgrades;        
                if (!upgrades) return;
                const currency = globalUiState.currency;
                let price = upgrades[`${type}NewPrice`];
                let count = 0;
                let purchaseCount = ballSpawnMultipliers[ballSpawnMultiplierIndex] || 1;
                if (Array.isArray(globalUiState.balls)) {
                    count = globalUiState.balls.filter(ball => ball.type === type).length;
                }
                if (!(typeof price === "number" && isFinite(price) && price > 0)) return;
                let totalPrice = price * purchaseCount;
                if (currency.money >= totalPrice) {
                    subtractMoney(totalPrice);
                    upgrades[`${type}NewPrice`] = price * Math.pow(2, purchaseCount);
                    for (let j = 0; j < purchaseCount; ++j) {
                        createBall(type);
                    }
                }
            });
        }
    });
}

function progBar(value, target) {
    const CHAR_COUNT = 14;
    const FULL = 0x28FF;
    if (typeof target !== "number" || isNaN(target) || target <= 0) return String.fromCharCode(...Array(CHAR_COUNT).fill(0x2800));
    if (value >= target) return String.fromCharCode(...Array(CHAR_COUNT).fill(FULL));
    if (value <= 0) return String.fromCharCode(...Array(CHAR_COUNT).fill(0x2800));
    let progress = Math.max(0, Math.min(1, value / target));
    let totalDots = progress * CHAR_COUNT * 8;
    let chars = [];
    for (let i = 0; i < CHAR_COUNT; ++i) {
        let dotsThis = Math.min(8, Math.max(0, totalDots - i * 8));
        let dotMask = 0;
        for (let d = 0; d < dotsThis; ++d) {
            dotMask |= (1 << d);
        }
        chars.push(String.fromCharCode(0x2800 + dotMask));
    }
    return chars.join('');
}

// Second row (upgrades)
const row2 = [
    // Basic speed+
    {
        id: "upgrade-basic-speed",
        text: "speed",
        title: "",
        javascript: ({elements}) => {
            const btn = elements["upgrade-basic-speed"];
            if (!btn) return;

            function update() {
                const hasBall = Array.isArray(globalUiState.balls) && globalUiState.balls.some(b => b.type === "basic");
                if (!hasBall) {
                    btn.style.display = "none";
                    return;
                }
                btn.style.display = ""; // Revert to CSS default

                const upgrades = globalUiState.upgrades;
                let speed = upgrades ? upgrades.basicSpeed : 1;
                let price = upgrades ? upgrades.basicSpeedPrice : "?";
                let purchaseCount = ballSpawnMultipliers[ballSpawnMultiplierIndex] || 1;
                let nextSpeed = (typeof speed === "number" && Number.isFinite(speed)) ? (speed + purchaseCount) : purchaseCount;
                let effectivePrice = (typeof price === "number" && isFinite(price)) ? price * purchaseCount : price;
                btn.innerHTML = `
                    speed+<br>
                    (${displayCount(speed, nextSpeed)})<br>
                    ${displayPrice(effectivePrice)}<br>
                    <span style="letter-spacing:-0.4ch;margin-left:-3px;color:${(typeof price === "number" && globalUiState.currency.money >= (price * purchaseCount)) ? "#afa" : "#fff"}">${progBar(globalUiState.currency.money, (typeof price === "number" ? price * purchaseCount : price))}</span>
                `;
            }
            upgradeButtonUpdaters["upgrade-basic-speed"] = update;
            update();

            btn.addEventListener("click", () => {
                const upgrades = globalUiState.upgrades;
                if (!upgrades) return;
                const currency = globalUiState.currency;
                let price = upgrades.basicSpeedPrice;
                let speed = upgrades.basicSpeed;
                let purchaseCount = ballSpawnMultipliers[ballSpawnMultiplierIndex] || 1;
                if (!(typeof price === "number" && isFinite(price) && price > 0)) return;
                let totalPrice = price * purchaseCount;
                if (currency.money >= totalPrice) {
                    subtractMoney(totalPrice);
                    upgrades.basicSpeedPrice = price * Math.pow(2, purchaseCount);
                    upgrades.basicSpeed = (typeof speed === "number" && Number.isFinite(speed)) ? (speed + purchaseCount) : purchaseCount;
                }
            });
        }
    },

    // Sniper speed+
    {
        id: "upgrade-sniper-speed",
        text: "",
        title: "",
        javascript: ({elements}) => {
            const btn = elements["upgrade-sniper-speed"];
            if (!btn) return;

            function update() {
                const hasBall = Array.isArray(globalUiState.balls) && globalUiState.balls.some(b => b.type === "sniper");
                if (!hasBall) {
                    btn.style.display = "none";
                    return;
                }
                btn.style.display = "";

                const upgrades = globalUiState.upgrades;
                let speed = upgrades ? upgrades.sniperSpeed : 1;
                let price = upgrades ? upgrades.sniperSpeedPrice : "?";
                let purchaseCount = ballSpawnMultipliers[ballSpawnMultiplierIndex] || 1;
                let nextSpeed = (typeof speed === "number" && Number.isFinite(speed)) ? (speed + purchaseCount) : purchaseCount;
                let effectivePrice = (typeof price === "number" && isFinite(price)) ? price * purchaseCount : price;
                btn.innerHTML = `
                    speed+<br>
                    (${displayCount(speed, nextSpeed)})<br>
                    ${displayPrice(effectivePrice)}<br>
                    <span style="letter-spacing:-0.4ch;margin-left:-3px;color:${(typeof price === "number" && globalUiState.currency.money >= (price * purchaseCount)) ? "#afa" : "#fff"}">${progBar(globalUiState.currency.money, (typeof price === "number" ? price * purchaseCount : price))}</span>
                `;
            }
            upgradeButtonUpdaters["upgrade-sniper-speed"] = update;
            update();

            btn.addEventListener("click", () => {
                const upgrades = globalUiState.upgrades;
                if (!upgrades) return;
                const currency = globalUiState.currency;
                let price = upgrades.sniperSpeedPrice;
                let speed = upgrades.sniperSpeed;
                let purchaseCount = ballSpawnMultipliers[ballSpawnMultiplierIndex] || 1;
                if (!(typeof price === "number" && isFinite(price) && price > 0)) return;
                let totalPrice = price * purchaseCount;
                if (currency.money >= totalPrice) {
                    subtractMoney(totalPrice);
                    upgrades.sniperSpeedPrice = price * Math.pow(2, purchaseCount);
                    upgrades.sniperSpeed = (typeof speed === "number" && Number.isFinite(speed)) ? (speed + purchaseCount) : purchaseCount;
                }
            });
        }
    },

    // Splash radius+
    {
        id: "upgrade-splash-radius",
        text: "",
        title: "",
        javascript: ({elements}) => {
            const btn = elements["upgrade-splash-radius"];
            if (!btn) return;

            function update() {
                const hasBall = Array.isArray(globalUiState.balls) && globalUiState.balls.some(b => b.type === "splash");
                if (!hasBall) {
                    btn.style.display = "none";
                    return;
                }
                btn.style.display = "";

                const upgrades = globalUiState.upgrades;
                let radius = upgrades ? upgrades.splashRadius : 1;
                let price = upgrades ? upgrades.splashRadiusPrice : "?";
                let purchaseCount = ballSpawnMultipliers[ballSpawnMultiplierIndex] || 1;
                let nextRadius = (typeof radius === "number" && Number.isFinite(radius)) ? (radius + purchaseCount) : purchaseCount;
                let effectivePrice = (typeof price === "number" && isFinite(price)) ? price * purchaseCount : price;
                btn.innerHTML = `
                    radius+<br>
                    (${displayCount(radius, nextRadius)})<br>
                    ${displayPrice(effectivePrice)}<br>
                    <span style="letter-spacing:-0.4ch;margin-left:-3px;color:${(typeof price === "number" && globalUiState.currency.money >= (price * purchaseCount)) ? "#afa" : "#fff"}">${progBar(globalUiState.currency.money, (typeof price === "number" ? price * purchaseCount : price))}</span>
                `;
            }
            upgradeButtonUpdaters["upgrade-splash-radius"] = update;
            update();

            btn.addEventListener("click", () => {
                const upgrades = globalUiState.upgrades;
                if (!upgrades) return;
                const currency = globalUiState.currency;
                let price = upgrades.splashRadiusPrice;
                let radius = upgrades.splashRadius;
                let purchaseCount = ballSpawnMultipliers[ballSpawnMultiplierIndex] || 1;
                if (!(typeof price === "number" && isFinite(price) && price > 0)) return;
                let totalPrice = price * purchaseCount;
                if (currency.money >= totalPrice) {
                    subtractMoney(totalPrice);
                    upgrades.splashRadiusPrice = price * Math.pow(2, purchaseCount);
                    upgrades.splashRadius = (typeof radius === "number" && Number.isFinite(radius)) ? (radius + purchaseCount) : purchaseCount;
                }
            });
        }
    },

    // Scatter balls per+ ('scattersPer')
    {
        id: "upgrade-scatter-scatters-per",
        text: "",
        title: "",
        javascript: ({elements}) => {
            const btn = elements["upgrade-scatter-scatters-per"];
            if (!btn) return;

            function update() {
                const hasBall = Array.isArray(globalUiState.balls) && globalUiState.balls.some(b => b.type === "scatter");
                if (!hasBall) {
                    btn.style.display = "none";
                    return;
                }
                btn.style.display = "";

                const upgrades = globalUiState.upgrades;
                let per = upgrades ? upgrades.scattersPer : 1;
                let price = upgrades ? upgrades.scattersPerPrice : "?";
                let purchaseCount = ballSpawnMultipliers[ballSpawnMultiplierIndex] || 1;
                let nextPer = (typeof per === "number" && Number.isFinite(per)) ? (per + purchaseCount) : purchaseCount;
                let effectivePrice = (typeof price === "number" && isFinite(price)) ? price * purchaseCount : price;
                btn.innerHTML = `
                    scatters+<br>
                    (${displayCount(per, nextPer)})<br>
                    ${displayPrice(effectivePrice)}<br>
                    <span style="letter-spacing:-0.4ch;margin-left:-3px;color:${(typeof price === "number" && globalUiState.currency.money >= (price * purchaseCount)) ? "#afa" : "#fff"}">${progBar(globalUiState.currency.money, (typeof price === "number" ? price * purchaseCount : price))}</span>
                `;
            }
            upgradeButtonUpdaters["upgrade-scatter-scatters-per"] = update;
            update();

            btn.addEventListener("click", () => {
                const upgrades = globalUiState.upgrades;
                if (!upgrades) return;
                const currency = globalUiState.currency;
                let price = upgrades.scattersPerPrice;
                let per = upgrades.scattersPer;
                let purchaseCount = ballSpawnMultipliers[ballSpawnMultiplierIndex] || 1;
                if (!(typeof price === "number" && isFinite(price) && price > 0)) return;
                let totalPrice = price * purchaseCount;
                if (currency.money >= totalPrice) {
                    subtractMoney(totalPrice);
                    upgrades.scattersPerPrice = price * Math.pow(2, purchaseCount);
                    upgrades.scattersPer = (typeof per === "number" && Number.isFinite(per)) ? (per + purchaseCount) : purchaseCount;
                }
            });
        }
    },

    // Cannon speed+ ('cannonSpeed')
    {
        id: "upgrade-cannon-speed",
        text: "",
        title: "",
        javascript: ({elements}) => {
            const btn = elements["upgrade-cannon-speed"];
            if (!btn) return;

            function update() {
                const hasBall = Array.isArray(globalUiState.balls) && globalUiState.balls.some(b => b.type === "cannon");
                if (!hasBall) {
                    btn.style.display = "none";
                    return;
                }
                btn.style.display = "";

                const upgrades = globalUiState.upgrades;
                let spd = upgrades ? upgrades.cannonSpeed : 1;
                let price = upgrades ? upgrades.cannonSpeedPrice : "?";
                let purchaseCount = ballSpawnMultipliers[ballSpawnMultiplierIndex] || 1;
                let nextSpd = (typeof spd === "number" && Number.isFinite(spd)) ? (spd + purchaseCount) : purchaseCount;
                let effectivePrice = (typeof price === "number" && isFinite(price)) ? price * purchaseCount : price;
                btn.innerHTML = `
                    speed+<br>
                    (${displayCount(spd, nextSpd)})<br>
                    ${displayPrice(effectivePrice)}<br>
                    <span style="letter-spacing:-0.4ch;margin-left:-3px;color:${(typeof price === "number" && globalUiState.currency.money >= (price * purchaseCount)) ? "#afa" : "#fff"}">${progBar(globalUiState.currency.money, (typeof price === "number" ? price * purchaseCount : price))}</span>
                `;
            }
            upgradeButtonUpdaters["upgrade-cannon-speed"] = update;
            update();

            btn.addEventListener("click", () => {
                const upgrades = globalUiState.upgrades;
                if (!upgrades) return;
                const currency = globalUiState.currency;
                let price = upgrades.cannonSpeedPrice;
                let spd = upgrades.cannonSpeed;
                let purchaseCount = ballSpawnMultipliers[ballSpawnMultiplierIndex] || 1;
                if (!(typeof price === "number" && isFinite(price) && price > 0)) return;
                let totalPrice = price * purchaseCount;
                if (currency.money >= totalPrice) {
                    subtractMoney(totalPrice);
                    upgrades.cannonSpeedPrice = price * Math.pow(2, purchaseCount);
                    upgrades.cannonSpeed = (typeof spd === "number" && Number.isFinite(spd)) ? (spd + purchaseCount) : purchaseCount;
                }
            });
        }
    },

    // Pierce speed+ ('pierceSpeed')
    {
        id: "upgrade-pierce-speed",
        text: "",
        title: "",
        javascript: ({elements}) => {
            const btn = elements["upgrade-pierce-speed"];
            if (!btn) return;

            function update() {
                const hasBall = Array.isArray(globalUiState.balls) && globalUiState.balls.some(b => b.type === "pierce");
                if (!hasBall) {
                    btn.style.display = "none";
                    return;
                }
                btn.style.display = "";

                const upgrades = globalUiState.upgrades;
                let spd = upgrades ? upgrades.pierceSpeed : 1;
                let price = upgrades ? upgrades.pierceSpeedPrice : "?";
                let purchaseCount = ballSpawnMultipliers[ballSpawnMultiplierIndex] || 1;
                let nextSpd = (typeof spd === "number" && Number.isFinite(spd)) ? (spd + purchaseCount) : purchaseCount;
                let effectivePrice = (typeof price === "number" && isFinite(price)) ? price * purchaseCount : price;
                btn.innerHTML = `
                    speed+<br>
                    (${displayCount(spd, nextSpd)})<br>
                    ${displayPrice(effectivePrice)}<br>
                    <span style="letter-spacing:-0.4ch;margin-left:-3px;color:${(typeof price === "number" && globalUiState.currency.money >= (price * purchaseCount)) ? "#afa" : "#fff"}">${progBar(globalUiState.currency.money, (typeof price === "number" ? price * purchaseCount : price))}</span>
                `;
            }
            upgradeButtonUpdaters["upgrade-pierce-speed"] = update;
            update();

            btn.addEventListener("click", () => {
                const upgrades = globalUiState.upgrades;
                if (!upgrades) return;
                const currency = globalUiState.currency;
                let price = upgrades.pierceSpeedPrice;
                let spd = upgrades.pierceSpeed;
                let purchaseCount = ballSpawnMultipliers[ballSpawnMultiplierIndex] || 1;
                if (!(typeof price === "number" && isFinite(price) && price > 0)) return;
                let totalPrice = price * purchaseCount;
                if (currency.money >= totalPrice) {
                    subtractMoney(totalPrice);
                    upgrades.pierceSpeedPrice = price * Math.pow(2, purchaseCount);
                    upgrades.pierceSpeed = (typeof spd === "number" && Number.isFinite(spd)) ? (spd + purchaseCount) : purchaseCount;
                }
            });
        }
    }
];

const row3 = [
    {
        id: "upgrade-basic-damage", 
        text: "damage",
        title: "",
        javascript: ({elements}) => {
            const btn = elements["upgrade-basic-damage"];
            if (!btn) return;

            function update() {
                const hasBall = Array.isArray(globalUiState.balls) && globalUiState.balls.some(b => b.type === "basic");
                if (!hasBall) {
                    btn.style.display = "none";
                    return;
                }
                btn.style.display = "";

                const upgrades = globalUiState.upgrades;
                let damage = upgrades ? upgrades.basicDamage : 1;
                let price = upgrades ? upgrades.basicDamagePrice : "?";
                let purchaseCount = ballSpawnMultipliers[ballSpawnMultiplierIndex] || 1;
                let nextDamage = (typeof damage === "number" && Number.isFinite(damage)) ? (damage + purchaseCount) : purchaseCount;
                let effectivePrice = (typeof price === "number" && isFinite(price)) ? price * purchaseCount : price;
                btn.innerHTML = `
                    damage+<br>
                    (${displayCount(damage, nextDamage)})<br>
                    ${displayPrice(effectivePrice)}<br>
                    <span style="letter-spacing:-0.4ch;margin-left:-3px;color:${(typeof price === "number" && globalUiState.currency.money >= (price * purchaseCount)) ? "#afa" : "#fff"}">${progBar(globalUiState.currency.money, (typeof price === "number" ? price * purchaseCount : price))}</span>
                `;
            }
            upgradeButtonUpdaters["upgrade-basic-damage"] = update;
            update();

            btn.addEventListener("click", () => {
                const upgrades = globalUiState.upgrades;
                if (!upgrades) return;
                const currency = globalUiState.currency;
                let price = upgrades.basicDamagePrice;
                let damage = upgrades.basicDamage;
                let purchaseCount = ballSpawnMultipliers[ballSpawnMultiplierIndex] || 1;
                if (!(typeof price === "number" && isFinite(price) && price > 0)) return;
                let totalPrice = price * purchaseCount;
                if (currency.money >= totalPrice) {
                    subtractMoney(totalPrice);
                    upgrades.basicDamagePrice = price * Math.pow(2, purchaseCount);
                    upgrades.basicDamage = (typeof damage === "number" && Number.isFinite(damage)) ? (damage + purchaseCount) : purchaseCount;
                    
                    // Update damage for all currently existing basic balls
                    if (Array.isArray(globalUiState.balls)) {
                        for (let i = 0; i < globalUiState.balls.length; i++) {
                            if (globalUiState.balls[i].type === "basic") {
                                globalUiState.balls[i].damage = upgrades.basicDamage;
                            }
                        }
                    }
                }
            });
        }
    },
    {
        id: "upgrade-sniper-damage", 
        text: "damage",
        title: "",
        javascript: ({elements}) => {
            const btn = elements["upgrade-sniper-damage"];
            if (!btn) return;

            function update() {
                const hasBall = Array.isArray(globalUiState.balls) && globalUiState.balls.some(b => b.type === "sniper");
                if (!hasBall) {
                    btn.style.display = "none";
                    return;
                }
                btn.style.display = "";

                const upgrades = globalUiState.upgrades;
                let damage = upgrades ? upgrades.sniperDamage : 1;
                let price = upgrades ? upgrades.sniperDamagePrice : "?";
                let purchaseCount = ballSpawnMultipliers[ballSpawnMultiplierIndex] || 1;
                let nextDamage = (typeof damage === "number" && Number.isFinite(damage)) ? (damage + purchaseCount*5) : purchaseCount*5;
                let effectivePrice = (typeof price === "number" && isFinite(price)) ? price * purchaseCount : price;
                btn.innerHTML = `
                    damage+<br>
                    (${displayCount(damage, nextDamage)})<br>
                    ${displayPrice(effectivePrice)}<br>
                    <span style="letter-spacing:-0.4ch;margin-left:-3px;color:${(typeof price === "number" && globalUiState.currency.money >= (price * purchaseCount)) ? "#afa" : "#fff"}">${progBar(globalUiState.currency.money, (typeof price === "number" ? price * purchaseCount : price))}</span>
                `;
            }
            upgradeButtonUpdaters["upgrade-sniper-damage"] = update;
            update();

            btn.addEventListener("click", () => {
                const upgrades = globalUiState.upgrades;
                if (!upgrades) return;
                const currency = globalUiState.currency;
                let price = upgrades.sniperDamagePrice;
                let damage = upgrades.sniperDamage;
                let purchaseCount = ballSpawnMultipliers[ballSpawnMultiplierIndex] || 1;
                if (!(typeof price === "number" && isFinite(price) && price > 0)) return;
                let totalPrice = price * purchaseCount;
                if (currency.money >= totalPrice) {
                    subtractMoney(totalPrice);
                    upgrades.sniperDamagePrice = price * Math.pow(2, purchaseCount);
                    upgrades.sniperDamage = (typeof damage === "number" && Number.isFinite(damage)) ? (damage + purchaseCount*3) : purchaseCount*5;
                    
                    // Update damage for all currently existing sniper balls
                    if (Array.isArray(globalUiState.balls)) {
                        for (let i = 0; i < globalUiState.balls.length; i++) {
                            if (globalUiState.balls[i].type === "sniper") {
                                globalUiState.balls[i].damage = upgrades.sniperDamage;
                            }
                        }
                    }
                }
            });
        }
    },
    {
        id: "upgrade-splash-damage", 
        text: "damage",
        title: "",
        javascript: ({elements}) => {
            const btn = elements["upgrade-splash-damage"];
            if (!btn) return;

            function update() {
                const hasBall = Array.isArray(globalUiState.balls) && globalUiState.balls.some(b => b.type === "splash");
                if (!hasBall) {
                    btn.style.display = "none";
                    return;
                }
                btn.style.display = "";

                const upgrades = globalUiState.upgrades;
                let damage = upgrades ? upgrades.splashDamage : 1;
                let price = upgrades ? upgrades.splashDamagePrice : "?";
                let purchaseCount = ballSpawnMultipliers[ballSpawnMultiplierIndex] || 1;
                let nextDamage = (typeof damage === "number" && Number.isFinite(damage)) ? (damage + purchaseCount*3) : purchaseCount*3;
                let effectivePrice = (typeof price === "number" && isFinite(price)) ? price * purchaseCount : price;
                btn.innerHTML = `
                    damage+<br>
                    (${displayCount(damage, nextDamage)})<br>
                    ${displayPrice(effectivePrice)}<br>
                    <span style="letter-spacing:-0.4ch;margin-left:-3px;color:${(typeof price === "number" && globalUiState.currency.money >= (price * purchaseCount)) ? "#afa" : "#fff"}">${progBar(globalUiState.currency.money, (typeof price === "number" ? price * purchaseCount : price))}</span>
                `;
            }
            upgradeButtonUpdaters["upgrade-splash-damage"] = update;
            update();

            btn.addEventListener("click", () => {
                const upgrades = globalUiState.upgrades;
                if (!upgrades) return;
                const currency = globalUiState.currency;
                let price = upgrades.splashDamagePrice;
                let damage = upgrades.splashDamage;
                let purchaseCount = ballSpawnMultipliers[ballSpawnMultiplierIndex] || 1;
                if (!(typeof price === "number" && isFinite(price) && price > 0)) return;
                let totalPrice = price * purchaseCount;
                if (currency.money >= totalPrice) {
                    subtractMoney(totalPrice);
                    upgrades.splashDamagePrice = price * Math.pow(2, purchaseCount);
                    upgrades.splashDamage = (typeof damage === "number" && Number.isFinite(damage)) ? (damage + purchaseCount*3) : purchaseCount*3;
                    
                    // Update damage for all currently existing splash balls
                    if (Array.isArray(globalUiState.balls)) {
                        for (let i = 0; i < globalUiState.balls.length; i++) {
                            if (globalUiState.balls[i].type === "splash") {
                                globalUiState.balls[i].damage = upgrades.splashDamage;
                            }
                        }
                    }
                }
            });
        }
    },
    {
        id: "upgrade-scatter-damage", 
        text: "damage",
        title: "",
        javascript: ({elements}) => {
            const btn = elements["upgrade-scatter-damage"];
            if (!btn) return;

            function update() {
                const hasBall = Array.isArray(globalUiState.balls) && globalUiState.balls.some(b => b.type === "scatter");
                if (!hasBall) {
                    btn.style.display = "none";
                    return;
                }
                btn.style.display = "";

                const upgrades = globalUiState.upgrades;
                let damage = upgrades ? upgrades.scatterDamage : 1;
                let price = upgrades ? upgrades.scatterDamagePrice : "?";
                let purchaseCount = ballSpawnMultipliers[ballSpawnMultiplierIndex] || 1;
                let nextDamage = (typeof damage === "number" && Number.isFinite(damage)) ? (damage + purchaseCount*10) : purchaseCount*10;
                let effectivePrice = (typeof price === "number" && isFinite(price)) ? price * purchaseCount : price;
                btn.innerHTML = `
                    damage+<br>
                    (${displayCount(damage, nextDamage)})<br>
                    ${displayPrice(effectivePrice)}<br>
                    <span style="letter-spacing:-0.4ch;margin-left:-3px;color:${(typeof price === "number" && globalUiState.currency.money >= (price * purchaseCount)) ? "#afa" : "#fff"}">${progBar(globalUiState.currency.money, (typeof price === "number" ? price * purchaseCount : price))}</span>
                `;
            }
            upgradeButtonUpdaters["upgrade-scatter-damage"] = update;
            update();

            btn.addEventListener("click", () => {
                const upgrades = globalUiState.upgrades;
                if (!upgrades) return;
                const currency = globalUiState.currency;
                let price = upgrades.scatterDamagePrice;
                let damage = upgrades.scatterDamage;
                let purchaseCount = ballSpawnMultipliers[ballSpawnMultiplierIndex] || 1;
                if (!(typeof price === "number" && isFinite(price) && price > 0)) return;
                let totalPrice = price * purchaseCount;
                if (currency.money >= totalPrice) {
                    subtractMoney(totalPrice);
                    upgrades.scatterDamagePrice = price * Math.pow(2, purchaseCount);
                    upgrades.scatterDamage = (typeof damage === "number" && Number.isFinite(damage)) ? (damage + purchaseCount*10) : purchaseCount*10;
                    
                    // Update damage for all currently existing scatter balls
                    if (Array.isArray(globalUiState.balls)) {
                        for (let i = 0; i < globalUiState.balls.length; i++) {
                            if (globalUiState.balls[i].type === "scatter") {
                                globalUiState.balls[i].damage = upgrades.scatterDamage;
                            }
                        }
                    }
                }
            });
        }
    },
    {
        id: "upgrade-cannon-damage", 
        text: "damage",
        title: "",
        javascript: ({elements}) => {
            const btn = elements["upgrade-cannon-damage"];
            if (!btn) return;

            function update() {
                const hasBall = Array.isArray(globalUiState.balls) && globalUiState.balls.some(b => b.type === "cannon");
                if (!hasBall) {
                    btn.style.display = "none";
                    return;
                }
                btn.style.display = "";

                const upgrades = globalUiState.upgrades;
                let damage = upgrades ? upgrades.cannonDamage : 1;
                let price = upgrades ? upgrades.cannonDamagePrice : "?";
                let purchaseCount = ballSpawnMultipliers[ballSpawnMultiplierIndex] || 1;
                let nextDamage = (typeof damage === "number" && Number.isFinite(damage)) ? (damage + purchaseCount*25) : purchaseCount*25;
                let effectivePrice = (typeof price === "number" && isFinite(price)) ? price * purchaseCount : price;
                btn.innerHTML = `
                    damage+<br>
                    (${displayCount(damage, nextDamage)})<br>
                    ${displayPrice(effectivePrice)}<br>
                    <span style="letter-spacing:-0.4ch;margin-left:-3px;color:${(typeof price === "number" && globalUiState.currency.money >= (price * purchaseCount)) ? "#afa" : "#fff"}">${progBar(globalUiState.currency.money, (typeof price === "number" ? price * purchaseCount : price))}</span>
                `;
            }
            upgradeButtonUpdaters["upgrade-cannon-damage"] = update;
            update();

            btn.addEventListener("click", () => {
                const upgrades = globalUiState.upgrades;
                if (!upgrades) return;
                const currency = globalUiState.currency;
                let price = upgrades.cannonDamagePrice;
                let damage = upgrades.cannonDamage;
                let purchaseCount = ballSpawnMultipliers[ballSpawnMultiplierIndex] || 1;
                if (!(typeof price === "number" && isFinite(price) && price > 0)) return;
                let totalPrice = price * purchaseCount;
                if (currency.money >= totalPrice) {
                    subtractMoney(totalPrice);
                    upgrades.cannonDamagePrice = price * Math.pow(2, purchaseCount);
                    upgrades.cannonDamage = (typeof damage === "number" && Number.isFinite(damage)) ? (damage + purchaseCount*25) : purchaseCount*25;
                    
                    // Update damage for all currently existing cannon balls
                    if (Array.isArray(globalUiState.balls)) {
                        for (let i = 0; i < globalUiState.balls.length; i++) {
                            if (globalUiState.balls[i].type === "cannon") {
                                globalUiState.balls[i].damage = upgrades.cannonDamage;
                            }
                        }
                    }
                }
            });
        }
    },
    {
        id: "upgrade-pierce-damage",
        text: "damage",
        title: "",
        javascript: ({elements}) => {
            const btn = elements["upgrade-pierce-damage"];
            if (!btn) return;

            function update() {
                const hasBall = Array.isArray(globalUiState.balls) && globalUiState.balls.some(b => b.type === "pierce");
                if (!hasBall) {
                    btn.style.display = "none";
                    return;
                }
                btn.style.display = "";

                const upgrades = globalUiState.upgrades;
                let damage = upgrades ? upgrades.pierceDamage : 1;
                let price = upgrades ? upgrades.pierceDamagePrice : "?";
                let purchaseCount = ballSpawnMultipliers[ballSpawnMultiplierIndex] || 1;
                let nextDamage = (typeof damage === "number" && Number.isFinite(damage)) ? (damage + purchaseCount*1) : purchaseCount*1;
                let effectivePrice = (typeof price === "number" && isFinite(price)) ? price * purchaseCount : price;
                btn.innerHTML = `
                    damage+<br>
                    (${displayCount(Math.ceil(damage*3), Math.ceil(nextDamage*3))})<br>
                    ${displayPrice(effectivePrice)}<br>
                    <span style="letter-spacing:-0.4ch;margin-left:-3px;color:${(typeof price === "number" && globalUiState.currency.money >= (price * purchaseCount)) ? "#afa" : "#fff"}">${progBar(globalUiState.currency.money, (typeof price === "number" ? price * purchaseCount : price))}</span>
                `;
            }
            upgradeButtonUpdaters["upgrade-pierce-damage"] = update;
            update();

            btn.addEventListener("click", () => {
                const upgrades = globalUiState.upgrades;
                if (!upgrades) return;
                const currency = globalUiState.currency;
                let price = upgrades.pierceDamagePrice;
                let damage = upgrades.pierceDamage;
                let purchaseCount = ballSpawnMultipliers[ballSpawnMultiplierIndex] || 1;
                if (!(typeof price === "number" && isFinite(price) && price > 0)) return;
                let totalPrice = price * purchaseCount;
                if (currency.money >= totalPrice) {
                    subtractMoney(totalPrice);
                    upgrades.pierceDamagePrice = price * Math.pow(2, purchaseCount);
                    upgrades.pierceDamage = (typeof damage === "number" && Number.isFinite(damage)) ? (damage + purchaseCount*1) : purchaseCount*1;
                    
                    // Update damage for all currently existing pierce balls
                    if (Array.isArray(globalUiState.balls)) {
                        for (let i = 0; i < globalUiState.balls.length; i++) {
                            if (globalUiState.balls[i].type === "pierce") {
                                globalUiState.balls[i].damage = upgrades.pierceDamage;
                            }
                        }
                    }
                }
            });
        }
    },
]

function ensureUIButtons() {
    injectTooltipCss();

    const buttonsContainer = document.getElementById('buttons-container');
    if (!buttonsContainer) return;
    const rowone = document.createElement('div');
    const rowtwo = document.createElement('div');
    const rowthree = document.createElement('div');
    rowone.className = 'row'; rowtwo.className = 'row'; rowthree.className = 'row';
    rowtwo.style.marginLeft = "45px";
    rowthree.style.marginLeft = "45px";
    buttonsContainer.appendChild(rowone);
    buttonsContainer.appendChild(rowtwo);
    buttonsContainer.appendChild(rowthree);

    // Top row
    for (const btnConf of row1) {
        const btn = document.createElement('button');
        btn.id = btnConf.id;
        btn.className = 'buttons';
        btn.textContent = btnConf.text;
        if (btn.hasAttribute('title')) btn.removeAttribute('title');
        rowone.appendChild(btn);

        if (btnConf.title) attachTooltip(btn, btnConf.title);
    }

    // Bottom row
    for (const btnConf of row2) {
        const btn = document.createElement('button');
        btn.id = btnConf.id;
        btn.className = 'buttons';
        btn.textContent = btnConf.text;
        if (btn.hasAttribute('title')) btn.removeAttribute('title');
        rowtwo.appendChild(btn);

        if (btnConf.title) attachTooltip(btn, btnConf.title);
    }

    // row3
    for (const btnConf of row3) {
        const btn = document.createElement('button');
        btn.id = btnConf.id;
        btn.className = 'buttons';
        btn.textContent = btnConf.text;
        if (btn.hasAttribute('title')) btn.removeAttribute('title');
        rowthree.appendChild(btn);

        if (btnConf.title) attachTooltip(btn, btnConf.title);
    }
}

// Tooltip helpers unchanged
function attachTooltip(btn, tipText) {
    if (!tipText) return;
    const tooltip = document.createElement('div');
    tooltip.className = 'ui-tooltip';
    tooltip.textContent = tipText;
    document.body.appendChild(tooltip);

    let hideTimeout = null;

    function showTooltip(e) {
        clearTimeout(hideTimeout);
        tooltip.classList.add('ui-tooltip-visible');
        tooltip.style.opacity = 1;

        const rect = btn.getBoundingClientRect();
        const tipRect = tooltip.getBoundingClientRect();
        let top = rect.top - tipRect.height - 8;
        let left = rect.left + rect.width / 2 - tipRect.width / 2;
        left = Math.max(10, Math.min(left, window.innerWidth - tipRect.width - 10));
        if (top < 0) top = rect.bottom + 6;
        tooltip.style.left = left + "px";
        tooltip.style.top = top + "px";
    }

    function hideTooltip() {
        tooltip.classList.remove('ui-tooltip-visible');
        tooltip.style.opacity = 0;
        hideTimeout = setTimeout(() => {
            tooltip.style.left = '-9999px';
            tooltip.style.top = '-9999px';
        }, 250);
    }

    btn.addEventListener('mouseenter', showTooltip);
    btn.addEventListener('mouseleave', hideTooltip);
    btn.addEventListener('focus', showTooltip);
    btn.addEventListener('blur', hideTooltip);
    window.addEventListener('scroll', hideTooltip);
    window.addEventListener('resize', hideTooltip);

    btn.setAttribute('tabindex', '0');
}

export function getUIElements() {
    const elements = {};
    for (const btnConf of row1) {
        elements[btnConf.id] = document.getElementById(btnConf.id);
    }
    for (const btnConf of row2) {
        elements[btnConf.id] = document.getElementById(btnConf.id);
    }
    for (const btnConf of row3) {
        elements[btnConf.id] = document.getElementById(btnConf.id);
    }
    elements["display"] = document.getElementById("display");
    return elements;
}

/**
 * @typedef {Object} UIOpts
 * @property {Array<Array>} rectangles2D
 * @property {Array} balls
 * @property {Array} upgrades
 * @property {Function} createBall
 * @property {Function} [nextLevel]
 * @param {UIOpts} opts
 */
export function setupUIListeners({ rectangles2D, balls, createBall, nextLevel, upgrades }) {
    const elements = getUIElements();

    // Upgrades is a pointer to the actual upgrades object, always use reference!
    if (upgrades && typeof upgrades === "object") {
        globalUiState.upgrades = upgrades;
    }

    for (const btnConf of row1) {
        if (typeof btnConf.javascript === 'function') {
            // Pass createBall into each row1 button handler
            btnConf.javascript({elements, balls, rectangles2D, createBall, nextLevel});
        }
    }
    for (const btnConf of row2) {
        if (typeof btnConf.javascript === 'function') {
            btnConf.javascript({elements});
        }
    }
    for (const btnConf of row3) {
        if (typeof btnConf.javascript === 'function') {
            btnConf.javascript({elements});
        }
    }
}

export function setUIState({ balls, rectangles2D, currency, upgrades }) {
    // Ensure globalUiState is defined before usage!
    if (typeof globalUiState === "undefined") {
        // Should not occur, but fallback guard if globalUiState is missing
        window.globalUiState = {
            balls: [],
            rectangles2D: [],
            currency: {
                level: 1,
                money: 0,
                ballCount: 0,
                rectCount: 0,
                healthSum: 0
            },
            upgrades: null,
        };
        globalUiState = window.globalUiState;
    }
    globalUiState.balls = balls;
    globalUiState.rectangles2D = rectangles2D;
    if (currency) {
        globalUiState.currency = { ...currency };
    }
    if (upgrades && typeof upgrades === "object") {
        globalUiState.upgrades = upgrades;
    }
    if (
        !window.initializedButtons &&
        document.querySelector('canvas')
    ) {
        ensureUIButtons();
        window.initializedButtons = true;
    }
}

const fmt = s => new Date(s * 1000).toISOString().slice(11, 19);

export function uiLoop() {
    const elements = getUIElements();
    const { balls, rectangles2D, currency} = globalUiState;
    const lvl = currency.level || 1;
    const ballCount = currency.ballCount ?? (balls ? balls.length : 0);
    const rectCount = currency.rectCount ?? 0;
    const healthSum = currency.healthSum ?? 0;
    const money = currency.money ?? 0;

    if (elements["display"]) {
        elements["display"].textContent =
            `Level ${lvl} | $${money.toFixed(0)} | ${ballCount}${window.miniballs ? `(+${window.miniballs})` : ""} balls` +
            ` | ${rectCount} blocks | health: ${healthSum.toFixed(0)} | ` +
            `${fmt(Number(Number(performance.now()/1000).toFixed(3)))}s in session`;
    }
    currency.money = globalUiState.currency.money;

    // Call button updaters (which always use the correct, fresh upgrades)
    for (const updaterKey in upgradeButtonUpdaters) {
        if (typeof upgradeButtonUpdaters[updaterKey] === "function") {
            upgradeButtonUpdaters[updaterKey]();
        }
    }
}