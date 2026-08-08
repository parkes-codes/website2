console.clear();

// ------------- EXPORTS (sync with render.js 1-38) ------------------
export let frameTimestamps;
export let frameIndex;
export let numSamples;
export let fps = 0;
export let lastDisplayUpdate;
export let paused = true;
export let camx = 0;
export let camy = 0;
export let zoom = 10;
export let mouseX = 0;
export let mouseY = 0;
export let mousedown = 0;
export let clickedFirst = 0;
export let hoverX = 0;
export let hoverY = 0;
export let tickn = 0;
export let livePx = 0;
export let maxPx = 0;
export let markers;
export let colorIndex = 0;
export let dragStart = null;
export let dragOffset;
export let pastePreviewActive = false;
export let pastePreviewOffset;
export let draggingSelection = false;
export let selectedLivePixels;
export let copiedPixels;
export let pastePreviewOffsetX;
export let pastePreviewOffsetY;
export let mouseButtonDown = null;
export let shiftpressed = false;
export let cmdPressed = false;
export let sparseEnabled = true;
export let keysPressed;
export let startingArray; // Only declare for export, initialization moved below
export let pixels;
export let tps = 0;
export let tpt = 0;
export let livePxHist;
export let maxPxLen = 50;
export let markerColors;
export let hiliteCorner1;
export let hiliteCorner2;

// --- Added exports for camxin and camyin per prompt ---
export let camxin;
export let camyin;
// ---------------------------------------------------------------------

export const canvas = document.getElementById("gamecanvas")

const FPS_BUFFER_SIZE = 120; // 2 seconds at 60 FPS
frameTimestamps = new Array(FPS_BUFFER_SIZE);
frameIndex = 0;
numSamples = 0;
lastDisplayUpdate = 0;
const DISPLAY_UPDATE_INTERVAL = 120; // ms, update FPS/UI at most ~8 times/sec

function sampleFPS(now = performance.now()) {
    frameTimestamps[frameIndex] = now;
    frameIndex = (frameIndex + 1) % FPS_BUFFER_SIZE;
    if (numSamples < FPS_BUFFER_SIZE) numSamples++;
    
    // Only update FPS/UI at DISPLAY_UPDATE_INTERVAL
    if (now - lastDisplayUpdate > DISPLAY_UPDATE_INTERVAL) {
        // Find oldest timestamp still in the buffer within the last 1 sec
        let validFrames = 0;
        const oneSecAgo = now - 1000;
        for (let i = 0; i < numSamples; ++i) {
            const idx = (frameIndex - 1 - i + FPS_BUFFER_SIZE) % FPS_BUFFER_SIZE;
            if (frameTimestamps[idx] > oneSecAgo) validFrames++;
            else break;
        }
        fps = validFrames/2;
        lastDisplayUpdate = now;
    }
    requestAnimationFrame(sampleFPS);
}

// Start the update loop
requestAnimationFrame(sampleFPS);

// ========== END WebGL INIT ==========

document.getElementById('lex').addEventListener('click', function() {
    document.getElementById('lexicon').style.display = 'block';
    document.body.style.overflow = 'hidden';
});



document.getElementById('lexicon').addEventListener('click', function() {
    document.getElementById('lexicon').style.display = 'none';
    document.body.style.overflow = '';
});

document.getElementById('controls').addEventListener('click', function() {
    document.getElementById('controlsMenu').style.display = 'block';
    document.body.style.overflow = 'hidden';
});



document.getElementById('controlsMenu').addEventListener('click', function() {
    document.getElementById('controlsMenu').style.display = 'none';
    document.body.style.overflow = '';
});

// --- everything else unchanged below ---

export const display = document.getElementById("display");
export const display2 = document.getElementById("display2")
const importbtn = document.getElementById("import");
const import2btn = document.getElementById("import2")
const alertMsg = document.getElementById("alerttext");
const exportbtn = document.getElementById("export");
const tpsInput = document.getElementById("tpsInput");
const tptInput = document.getElementById("tptInput");

// Export the references to camxin/camyin, not just local variable!
camxin = document.getElementById("camxin");
camyin = document.getElementById("camyin");
export { camxin, camyin };

let lexloaded = true;

import { patterns } from "./lexiconData.js";

setTimeout(function() {
    if (typeof patterns === "undefined") {
        lexloaded = false;
        console.log("job had one bro");
        alertMsg.textContent = "Lexicon Load Failed";
        alertOpac = 100; animateAlert();
    }
}, 2000);

// Moved all initializations here instead of redeclaration:
startingArray = [];
pixels = [];
markers = [];
camx = 0;
camy = 0;
zoom = 10;
keysPressed = [];
sparseEnabled = true;
mouseX = 0;
mouseY = 0;
mousedown = 0;
clickedFirst = 0;
hoverX = 0;
hoverY = 0;
tickn = 0;
livePx = 0;
maxPx = 0;
cmdPressed = false;
shiftpressed = false;
hiliteCorner1 = {x: -1, y: 1};
hiliteCorner2 = {x: 1, y: -1};
let t2 = 0;
tpt = 0;
tps = 0

livePxHist = [];
maxPxLen = 50;

markerColors = [
    "faa",
    "afa",
    "aaf",
    "ffa",
    "aff",
    "faf"
]

colorIndex = 0;

// Array to hold selected/highlighted live pixels after shift released
selectedLivePixels = [];
// Clipboard for copy/paste of selections
copiedPixels = [];
pastePreviewActive = false;
pastePreviewOffset = {x:0, y:0};
draggingSelection = false;
dragStart = null;
dragOffset = {x:0, y:0};
let selectionOriginal = [];
mouseButtonDown = null;
const RIGHT_MOUSE_BUTTON = 2;

function resetState() {
    pixels = startingArray.map(p => ({x: p.x, y: p.y}));
    tickn = 0;
    paused = true;
    selectedLivePixels = [];
    draggingSelection = false;
    dragStart = null;
    selectionOriginal = [];
    pastePreviewActive = false;
    livePxHist = []
}

let confOpac = 0;
function saveCurrent() {
    startingArray = pixels.map(p => ({x: p.x, y: p.y}));
    alertMsg.textContent = "Saved"
    alertOpac = 100; animateAlert();
}

let alertOpac = 100;
function animateAlert() {
    alertMsg.style.opacity = `${alertOpac}%`
    if (alertOpac > 0) {
        alertOpac--;
        requestAnimationFrame(animateAlert)
    }
}

function loadLexi(id) {

    if (!lexloaded) {
        alert("Lexicon file not found");
        return;
    }

    let offsett = (id === "sword") ? -50 : 0;

    if (id.includes("rand")) {
        let dimensions = Number(id[4] + id[5] + id[6])
        pixels = [];
        for (let y = dimensions/-2; y<dimensions/2; y++) {
            for (let x = dimensions/-2; x<dimensions/2; x++) {
                if (Math.random() < 1/4) {pixels.push({x: x, y: y})}
            }
        }
        saveCurrent();
        paused = true;
        document.getElementById('lexicon').style.display = 'none';
        document.body.style.overflow = '';
        camx = 0; camy = 0;
        alertMsg.textContent = `Generated ${dimensions}x${dimensions} Board`;
        alertOpac = 100;
        animateAlert();
        getData();
        return
    }

    if (Object.prototype.hasOwnProperty.call(patterns, id)) {
        let patternData = patterns[id];

        // Detect if it's RLE: a string containing header + RLE data
        if (typeof patternData === "string") {
            let rleString = patternData;
            let lines = rleString.split(/\r?\n/);
            let header = "";
            let i = 0;
            for (; i < lines.length; i++) {
                let line = lines[i].trim();
                if (line.startsWith("#") || line === "") continue;
                header = line;
                break;
            }

            let xOff = 0, yOff = 0;
            let match = header.match(/x\s*=\s*(\d+)\s*,\s*y\s*=\s*(\d+)/i);
            if (match) {
                i++; // Move to RLE body
            } else {
                i = 0;
            }

            let rleBody = lines.slice(i).filter(l => !l.trim().startsWith("#")).join("");
            let exclIdx = rleBody.indexOf("!");
            if (exclIdx !== -1) rleBody = rleBody.slice(0, exclIdx + 1);

            let width = 0, height = 0;
            let headerMatch = header.match(/x\s*=\s*(\d+)\s*,\s*y\s*=\s*(\d+)/i);
            if (headerMatch) {
                width = parseInt(headerMatch[1], 10);
                height = parseInt(headerMatch[2], 10);
            }

            let pixelsList = [];
            let x = 0, y = 0;
            let numBuffer = '';
            for (let idx = 0; idx < rleBody.length; idx++) {
                let ch = rleBody[idx];
                if (/\d/.test(ch)) {
                    numBuffer += ch;
                } else if (ch === "b" || ch === "o") {
                    let count = numBuffer ? parseInt(numBuffer, 10) : 1;
                    for (let n = 0; n < count; n++) {
                        if (ch === "o") {
                            let centeredX = x - Math.floor(width / 2);
                            let centeredY = (0 - y + offsett) + Math.floor(height / 2);
                            pixelsList.push({ x: centeredX, y: centeredY });
                        }
                        x++;
                    }
                    numBuffer = '';
                } else if (ch === "$") {
                    let count = numBuffer ? parseInt(numBuffer, 10) : 1;
                    y += count;
                    x = 0;
                    numBuffer = '';
                } else if (ch === "!") {
                    break;
                }
                // ignore whitespace, commas
            }

            if (pixelsList.length === 0) {
                alert("No live cells found in RLE or invalid format.");
                return;
            }
            startingArray = pixelsList.slice();
        } else if (Array.isArray(patternData)) {
            startingArray = patternData.map(p => ({x: p.x, y: p.y + offsett}));
            livePxHist = [];
        } else {
            alert("Pattern format not recognized.");
            return;
        }

        resetState();
        saveCurrent();
        document.getElementById('lexicon').style.display = 'none';
        document.body.style.overflow = '';
        camx = 0; camy = 0;
        alertMsg.textContent = `Loaded ${id}`;
        alertOpac = 100;
        animateAlert();
        getData();
    }
    else {
        alert("Unknown pattern: " + id);
    }
}

window.loadLexi = loadLexi

setTimeout(function(){loadLexi('blank')},200);

function isLive(pixel) {
    return pixels.some(p => p.x === pixel.x && p.y === pixel.y);
}

function settingsPrompt() {
    maxPxLen = prompt("Length of max pixel's history?");
    document.getElementById("settingsbtn").blur();
    if (!maxPxLen) { maxPxLen = 50; }
}

let camChangeX = 0;
let camChangeY = 0;


// --- Persistent State for Optimized Tick ---
let prevStateHashes = new Set();
let prevTickHashes = [];
const MAX_STATE_HISTORY = 100; // Adjust for memory/perf balance

// Simple hash for cell array, order-invariant and quick
function hashPixArr(arr) {
    // Use a rolling hash
    let hash = 5381;
    for (let i = 0; i < arr.length; ++i) {
        // Simple combine on packed x/y
        let p = arr[i];
        let k = ((p.x & 0xFFFF) << 16) | (p.y & 0xFFFF);
        hash = ((hash << 5) + hash) ^ k;
    }
    return hash >>> 0; // unsigned
}

function arraysEqualUnordered(a, b) {
    if (a.length !== b.length) return false;
    // Pack to string and compare sets for quick test (slow only for large arrays)
    let setA = new Set(a.map(p=>((p.x&0xFFFF)<<16)|(p.y&0xFFFF)));
    let setB = new Set(b.map(p=>((p.x&0xFFFF)<<16)|(p.y&0xFFFF)));
    if (setA.size !== setB.size) return false;
    for (let val of setA) if (!setB.has(val)) return false;
    return true;
}

function detectCycleOrStable(newPixels) {
    // Only if prev hashes recorded
    const hash = hashPixArr(newPixels);
    for (let i = 0; i < prevTickHashes.length; ++i) {
        if (prevTickHashes[i].hash === hash) {
            // Quick further test: compare full arrays
            if (arraysEqualUnordered(prevTickHashes[i].arr, newPixels)) {
                return { period: i+1, at: prevTickHashes[i] };
            }
        }
    }
    return null;
}

/*
 * Ultra-optimized Game of Life tick -- X/Y packed into 32-bit ints, raw bit-math everywhere.
 * Main data: pixels: {x, y}[]
 * Algorithm: NO string objects. Use number keys, avoid object allocs, minimize JS engine overhead.
 * Now with state memory for early exit on repetition (periodicity or stability).
 */

function getData() {
    livePx = pixels.length;
}



function tick() {
    if (draggingSelection) return;

    const N = pixels.length;

    // update maxpx per tick
    livePxHist.unshift(livePx);
    if (livePxHist.length > maxPxLen) livePxHist.length = maxPxLen;
    maxPx = livePxHist.length ? Math.max(...livePxHist) : 0;

    // Bit-packed liveSet for fast lookup
    const liveSet = new Set();
    for (let i = 0; i < N; ++i) {
        const x = pixels[i].x | 0, y = pixels[i].y | 0;
        const key = ((x & 0xFFFF) << 16) | (y & 0xFFFF);
        liveSet.add(key);
    }

    // Flat neighbor deltas
    const dx = [0, 1, 1, 1, 0, -1, -1, -1];
    const dy = [1, 1, 0, -1, -1, -1, 0, 1];

    // Use Map<number, {count, isLive}> to store neighbor state
    const neighborInfo = new Map();

    // Single pass over all live cells and their neighborhoods
    for (let i = 0; i < N; ++i) {
        const px = pixels[i].x | 0, py = pixels[i].y | 0;
        let selfKey = ((px & 0xFFFF) << 16) | (py & 0xFFFF);

        // Mark this cell as live in neighborInfo if not already present
        let info = neighborInfo.get(selfKey);
        if (!info) {
            neighborInfo.set(selfKey, { count: 0, isLive: true });
        } else {
            info.isLive = true;
        }

        // For each neighbor, increment count (includes dead and live)
        for (let d = 0; d < 8; ++d) {
            const nx = px + dx[d], ny = py + dy[d];
            const nkey = ((nx & 0xFFFF) << 16) | (ny & 0xFFFF);
            let ninfo = neighborInfo.get(nkey);
            if (!ninfo) {
                neighborInfo.set(nkey, { count: 1, isLive: false });
            } else {
                ninfo.count += 1;
            }
        }
    }

    const survivors = [];
    const births = [];

    // Now process every entry in neighborInfo just once
    neighborInfo.forEach((val, key) => {
        const count = val.count;
        const isAlive = !!val.isLive;
        if (isAlive) {
            // Cell survives if 2 or 3 neighbors
            if (count === 2 || count === 3) {
                // Unpack x/y
                let x = (key >> 16); if (x & 0x8000) x |= 0xFFFF0000;
                let y = (key & 0xFFFF); if (y & 0x8000) y |= 0xFFFF0000;
                survivors.push({ x, y });
            }
        } else {
            // Dead cell births if exactly 3 neighbors
            if (count === 3) {
                let x = (key >> 16); if (x & 0x8000) x |= 0xFFFF0000;
                let y = (key & 0xFFFF); if (y & 0x8000) y |= 0xFFFF0000;
                births.push({ x, y });
            }
        }
    });

    const newPixels = survivors.concat(births);

    if (newPixels.length < 4096) { 
        const stateHash = hashPixArr(newPixels);
        let result = detectCycleOrStable(newPixels);
        if (result) {
            if (result.period === 1) {
                tickn++;
                pixels = newPixels;
                return; 
            } else {
                tickn++;
                pixels = newPixels;
                return;
            }
        }
        prevTickHashes.unshift({ hash: stateHash, arr: newPixels });
        if (prevTickHashes.length > MAX_STATE_HISTORY) prevTickHashes.length = MAX_STATE_HISTORY;
    } else {
        prevTickHashes.length = 0;
    }

    if (births.length > 0 || survivors.length !== pixels.length) tickn++;
    pixels = newPixels;
}


import {draw} from "./render.js"

function sleep(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
}

async function waitUntil(condition) {
    while (!condition()) {
        await sleep(10);
    }
}

async function tickLoop() {
    tps = tpsInput.value ? tpsInput.value : 60;
    tpt = (tptInput.value ? tptInput.value : 1);
    if (tps < fps) { await sleep(600 / (tps)) }
    if (paused) { await waitUntil(() => !paused); }
    for (let i = 0; i < (tpt); i++) {
        tick();
    }
    requestAnimationFrame(tickLoop);
}

draw();
tickLoop();
sampleFPS();

function seleToMarkers() {
    // For every selected pixel, add a marker (if not already exists at that (x, y))
    selectedLivePixels.forEach(sel => {
        if (!markers.some(m => m.x === sel.x && m.y === sel.y)) {
            markers.push({
                x: sel.x,
                y: sel.y,
                color: `#${markerColors[colorIndex]}`
            });
        }
    });
    alertMsg.textContent = `Added ${selectedLivePixels.length} markers from selection`;
    alertOpac = 100;
    animateAlert();
}



function handleWheelZoom(e) {
    let rect = canvas.getBoundingClientRect();
    let mx = e.clientX - rect.left, my = e.clientY - rect.top;
    if (isNaN(mx)) mx = mouseX;
    if (isNaN(my)) my = mouseY;

    const isTrackpad = Math.abs(e.deltaY) < 8;

    // Compute world coordinates before zoom
    let beforeX = ((mx - canvas.width / 2) / zoom) + camx;
    let beforeY = (-(my - canvas.height / 2) / zoom) + camy;

    let op = (e.deltaY < 0) ? 1 : -1; // 1=zoom in, -1=zoom out
    let steps = 10;
    
    // Use fps value instead of deltatime
    // Each step should last about 1/fps seconds (so ms: 1000/fps)
    let interval = 1000 / fps / steps;
    // (split zoom event evenly over steps in one frame if fps is low)

    // Make zoom less aggressive on trackpads
    let zoomStep = isTrackpad ? 1.005 : 1.02;

    let performStep = function(step) {
        if (step > steps) return;

        // Camera world pos before this zoom step
        let worldXBefore = ((mx - canvas.width / 2) / zoom) + camx;
        let worldYBefore = (-(my - canvas.height / 2) / zoom) + camy;

        if (op > 0) {
            zoom *= zoomStep;
        } else {
            zoom /= zoomStep;
        }

        // Camera world pos after this zoom step
        let worldXAfter = ((mx - canvas.width / 2) / zoom) + camx;
        let worldYAfter = (-(my - canvas.height / 2) / zoom) + camy;
        // Adjust camx/camy to keep point under cursor stationary
        camx += (worldXBefore - worldXAfter);
        camy += (worldYBefore - worldYAfter);

        if (step < steps) {
            setTimeout(function() {
                performStep(step + 1);
            }, interval);
        }
    };

    performStep(1);

    e.preventDefault();
}

canvas.addEventListener('wheel', handleWheelZoom, {passive: false});


function resizeCanvas() {
    canvas.width = (window.innerWidth) - 25;
    canvas.height = (window.innerHeight) - 25;
}
resizeCanvas();
window.addEventListener("resize", resizeCanvas);

function exportRLE() {
    const export2 = document.getElementById("export2");
    if (export2) export2.blur();
    if (!pixels || pixels.length === 0) {
        alert("No live cells to export.");
        return;
    }
    // Find bounds
    let minX = Infinity, minY = Infinity, maxX = -Infinity, maxY = -Infinity;
    for (const p of pixels) {
        if (p.x < minX) minX = p.x;
        if (p.x > maxX) maxX = p.x;
        if (p.y < minY) minY = p.y;
        if (p.y > maxY) maxY = p.y;
    }
    // Build 2D array of size width x height
    let width = maxX - minX + 1;
    let height = maxY - minY + 1;
    // Because many implementations flip Y, and input format uses Y increasing down,
    // we will use y = 0 as the top, +y down
    let grid = [];
    for (let y = 0; y < height; y++) {
        grid[y] = [];
        for (let x = 0; x < width; x++) {
            grid[y][x] = "b";
        }
    }
    for (const p of pixels) {
        // Flip Y to match RLE convention (Y=0 is top, increases down)
        let relX = p.x - minX;
        let relY = (maxY - p.y); // Invert: highest y (top on screen) -> y=0 in RLE
        if (relY < 0 || relY >= height) continue;
        if (relX < 0 || relX >= width) continue;
        grid[relY][relX] = "o";
    }
    // Build RLE
    let rleRows = [];
    for (let y = 0; y < height; y++) {
        let row = grid[y];
        let res = "";
        let cnt = 1;
        for (let x = 0; x < width; x++) {
            let curr = row[x];
            let next = (x + 1 < width) ? row[x + 1] : null;
            if (next && next === curr) {
                cnt++;
            } else {
                if (cnt > 1) res += cnt + curr;
                else res += curr;
                cnt = 1;
            }
        }
        rleRows.push(res);
    }
    // Combine rows with "$" (end-of-row), add "!" at end
    let body = rleRows.join("$") + "!";
    // Prepend header
    let header = `x = ${width}, y = ${height}, rule = B3/S23\n`;
    let rleString = header + body;

    // Copy to clipboard
    // Try navigator clipboard, fallback to textarea
    function copyToClipboard(txt) {
        if (navigator.clipboard && window.isSecureContext) {
            navigator.clipboard.writeText(txt).then(function() {
                alertMsg.textContent = "RLE Copied"
                alertOpac = 100; animateAlert();
            }, function() {
                fallbackCopy(txt);
            });
        } else {
            fallbackCopy(txt);
        }
        function fallbackCopy(txt) {
            let textarea = document.createElement("textarea");
            textarea.value = txt;
            document.body.appendChild(textarea);
            textarea.select();
            try {
                document.execCommand("copy");
                alert("RLE copied to clipboard!");
            } catch (e) {
                alert("Could not copy RLE.");
            }
            document.body.removeChild(textarea);
        }
    }
    copyToClipboard(rleString);
}


function importRLE() {
    paused = true;
    let rleString = prompt(
        'Enter the RLE string to import.\nExample:\nx = 3, y = 3, rule = B3/S23\nbo$2bo$3o!'
    );

    if (!rleString || rleString.trim() === "") {
        import2btn.blur();
        return;
    }

    // Parse header for width/height (x/y)
    let lines = rleString.split(/\r?\n/);
    let header = "";
    let i = 0;
    for (; i < lines.length; i++) {
        let line = lines[i].trim();
        if (line.startsWith("#") || line == "") continue;
        header = line;
        break;
    }

    let width = 0, height = 0;
    let match = header.match(/x\s*=\s*(\d+)\s*,\s*y\s*=\s*(\d+)/i);
    if (match) {
        width = parseInt(match[1], 10);
        height = parseInt(match[2], 10);
        i++; // Move to RLE body
    } else {
        i = 0; // No header
    }

    // Centering offsets
    let xCenter = width ? Math.floor(width / 2) : 0;
    let yCenter = height ? Math.floor(height / 2) : 0;

    // Read RLE data (all non-comment, non-header lines, concatenated)
    let rleBody = lines.slice(i).filter(l => !l.trim().startsWith("#")).join("");
    // Strip off anything after "!" (and include up to "!")
    let exclIdx = rleBody.indexOf("!");
    if (exclIdx !== -1) rleBody = rleBody.slice(0, exclIdx + 1);

    let pixelsList = [];
    let x = 0, y = 0;
    let numBuffer = '';
    for (let idx = 0; idx < rleBody.length; idx++) {
        let ch = rleBody[idx];
        if (/\d/.test(ch)) {
            numBuffer += ch;
        } else if (ch === "b" || ch === "o") {
            let count = numBuffer ? parseInt(numBuffer, 10) : 1;
            for (let n = 0; n < count; n++) {
                if (ch === "o") {
                    // Center the pattern so that it is at (0,0)
                    pixelsList.push({
                        x: x,
                        y: 0 - (y)
                    });
                }
                x++;
            }
            numBuffer = '';
        } else if (ch === "$") {
            let count = numBuffer ? parseInt(numBuffer, 10) : 1;
            y += count;
            x = 0;
            numBuffer = '';
        } else if (ch === "!") {
            break;
        }
        // ignore whitespace and commas
    }

    if (pixelsList.length === 0) {
        alert('No live cells found in RLE or invalid format.');
        import2btn.blur();
        return;
    }

    startingArray = pixelsList.map(p => ({
        x: p.x - xCenter,
        y: p.y + yCenter
    }));



    import2btn.blur();
    resetState();
}



function importlist() {
    paused = true;
    let pixelListStr = prompt(
        'Enter a list of pixels to import. Format: [{x:0,y:0},{x:1,y:1},...]'
    ); 
    if (pixelListStr === null || pixelListStr.trim() === "") {
        importbtn.blur()
        return;
    }
    try {
        let fixed = pixelListStr.replace(/([{,]\s*)"(x|y)"\s*:/g, '$1$2:');
        let imported = eval(fixed);
        if (
            Array.isArray(imported) &&
            imported.every(
                p => p && typeof p === "object" && Number.isFinite(p.x) && Number.isFinite(p.y)
            )
        ) {
            startingArray = imported.map(p => ({x: p.x, y: p.y}));
        } else {
            alert('Invalid format. Please use: [{x:0,y:0},{x:1,y:1},...]');
        }
    } catch (e) {
        alert(
            'Invalid input. Please enter: [{x:0,y:0}] or [{x:0,y:0},{x:1,y:1}].\n(JSON with quoted keys is NOT accepted.)'
        );
    }
    importbtn.blur();
    resetState();
}

function exportlist() {
    exportbtn.blur();
    if (pixels.length == 0) {
        alert("No live pixels to export.")
        return
    }
    if (pixels.length < Infinity) {
     const str = '[' + pixels.map(p => `{x:${p.x},y:${p.y}}`).join(',') + ']';

    if (navigator.clipboard && window.isSecureContext) {

        navigator.clipboard.writeText(str).then(function() {

        }, function(err) {
            // Fallback if writeText fails
            let textarea = document.createElement("textarea");
            textarea.value = str;
            textarea.style.position = "fixed";  
            textarea.style.opacity = 0;
            document.body.appendChild(textarea);
            textarea.focus();
            textarea.select();
            try {
                document.execCommand('copy');
            } catch (err) {}
            document.body.removeChild(textarea);
        });
    } else {
        // Fallback for older browsers
        let textarea = document.createElement("textarea");
        textarea.value = str;
        textarea.style.position = "fixed";  
        textarea.style.opacity = 0;
        document.body.appendChild(textarea);
        textarea.focus();
        textarea.select();
        try {
            document.execCommand('copy');
        } catch (err) {}
        document.body.removeChild(textarea);
    }
    alertMsg.textContent = "Copied Pixels to Clipboard";
    alertOpac=100; animateAlert();
} else {
    alert("Too many pixels! Use this console command instead. copy('[' + pixels.map(p => `{x:${p.x},y:${p.y}}`).join(',') + ']')")
}
}



let inputFocus = false;

tptInput.addEventListener("focus", () => {
    inputFocus = true;
});
tpsInput.addEventListener("focus", () => {
    inputFocus = true;
});
camxin.addEventListener("focus", () => {
    inputFocus = true;
});
camyin.addEventListener("focus", () => {
    inputFocus = true;
});
tptInput.addEventListener("blur", () => {
    inputFocus = false;
});
tpsInput.addEventListener("blur", () => {
    inputFocus = false;
});
camxin.addEventListener("blur", () => {
    inputFocus = false;
});
camyin.addEventListener("blur", () => {
    inputFocus = false;
});

tpsInput.addEventListener("keydown", (e) => {
    if (e.key === "Enter") {
        tpsInput.blur();
        inputFocus = false;
    }
});


camxin.addEventListener("keydown", (e) => {
    if (e.key === "Enter") {
        camxin.blur();
        inputFocus = false;
    } else if (e.key === "/") {
        camxin.value = 0;
    }
});

camyin.addEventListener("keydown", (e) => {
    if (e.key === "Enter") {
        camyin.blur();
        inputFocus = false;
    } else if (e.key === "/") {
        camyin.value = 0;
    }
});



tptInput.addEventListener("keydown", (e) => {
    if (e.key === "Enter") {
        tptInput.blur();
    } else if (e.key === "ArrowUp") {
        tptInput.value++
        e.preventDefault();
    } else if (e.key === "ArrowDown") {
        tptInput.value=Math.max(1,Number(tptInput.value)-1);
        e.preventDefault();
    }
});


window.addEventListener("keydown", (e) => {
    cmdPressed = e.metaKey || e.ctrlKey;
    keysPressed[e.key.toLowerCase()] = true;

    const stuff = [
        "rand010",
        "rand025",
        "rand050",
        "rand100",
        "rand250",
        "rand500",
    ]

    if (Number(e.key) > 0 && Number(e.key) < 7 && !inputFocus) {
        loadLexi(stuff[Number(e.key)-1])
    }

    if (e.key === "f") {
        const markerIndex = markers.findIndex(m => m.x === hoverX && m.y === hoverY);
        if (markerIndex !== -1) {
            markers.splice(markerIndex, 1);
        } else {
            markers.push({x:hoverX, y:hoverY, color: `#${markerColors[colorIndex]}`});
        }
    }

    if (e.key == "o") {
        sparseEnabled = !sparseEnabled;
        alertMsg.textContent = `Render Optimise ${sparseEnabled}`;
        alertOpac = 100; animateAlert();
    }

    if (e.key === "n") {
        colorIndex = (colorIndex+1)%markerColors.length;
    }

    if (e.key === "j") {
        if (selectedLivePixels.length > 0) {seleToMarkers()};
    }


    if (cmdPressed && e.key.toLowerCase() === "g") {
        e.preventDefault();
        markers = [];
        alertMsg.textContent = "All markers cleared";
        alertOpac = 100; animateAlert();
    }

    if (cmdPressed && e.key.toLowerCase() === "c") {
        if (selectedLivePixels.length > 0) {
            let minX = Math.min(...selectedLivePixels.map(p => p.x));
            let minY = Math.min(...selectedLivePixels.map(p => p.y));
            copiedPixels = selectedLivePixels.map(p => ({
                x: p.x - minX,
                y: p.y - minY
            }));
            alertMsg.textContent = `Selection copied`;
            alertOpac = 100; animateAlert();
        } else {
            copiedPixels = [];
        }
        e.preventDefault();
        return;
    }
    if (cmdPressed && e.key.toLowerCase() === "v") {
        if (copiedPixels.length > 0) {
            if (!pastePreviewActive) {
                pastePreviewActive = true;
                alertMsg.textContent = `Release V to paste`;
                alertOpac = 100; animateAlert();
            }
        }
        e.preventDefault();
        return;
    }

    if (cmdPressed && e.key.toLowerCase() === "d") {
        rotateSelection90CW();
        e.preventDefault();
        return;
    }

    function flipX() {
        if (selectedLivePixels.length > 0 && !draggingSelection) {
            let minX = Math.min(...selectedLivePixels.map(p => p.x));
            let maxX = Math.max(...selectedLivePixels.map(p => p.x));
            let centerX = minX + (maxX - minX) / 2;
            const selSet = new Set(selectedLivePixels.map(p => `${p.x},${p.y}`));
            selectedLivePixels = selectedLivePixels.map(p => ({x: Math.round(2 * centerX - p.x), y: p.y}));
            pixels = pixels.filter(p => !selSet.has(`${p.x},${p.y}`)).concat(selectedLivePixels);
            alertMsg.textContent = `Flipped selection X axis`;
            alertOpac = 100; animateAlert();
        }
    }

    function flipY() {
        if (selectedLivePixels.length > 0 && !draggingSelection) {
            let minY = Math.min(...selectedLivePixels.map(p => p.y));
            let maxY = Math.max(...selectedLivePixels.map(p => p.y));
            let centerY = minY + (maxY - minY) / 2;
            const selSet = new Set(selectedLivePixels.map(p => `${p.x},${p.y}`));
            selectedLivePixels = selectedLivePixels.map(p => ({x: p.x, y: Math.round(2 * centerY - p.y)}));
            pixels = pixels.filter(p => !selSet.has(`${p.x},${p.y}`)).concat(selectedLivePixels);
            alertMsg.textContent = `Flipped selection Y axis`;
            alertOpac = 100; animateAlert();
        }
    }

    // Flips (as before)
    if (cmdPressed && e.key.toLowerCase() === ",") {
        flipX();
        e.preventDefault(); return;
    }
    if (cmdPressed && e.key.toLowerCase() === ".") {
       flipY();
        e.preventDefault(); return;
    }
    // Shift selection logic
    if (e.key === "Shift" || e.key === "ShiftRight" || e.key === "ShiftLeft" || e.shiftKey) {
        shiftpressed = true;
        if (!hiliteCorner1 || hiliteCorner1.x === -1) hiliteCorner1 = { x: hoverX, y: hoverY };
        hiliteCorner2 = { x: hoverX, y: hoverY };
    }
    if (e.key == " ") { paused = !paused; }
    else if (e.key == "r") {
        e.preventDefault();
        if (cmdPressed) { loadLexi("blank");  camx = 0; camy = 0; zoom = 10;}
        else resetState();
    } else if (e.key.toLowerCase() === "s" && cmdPressed ) {
        e.preventDefault(); saveCurrent();
    } else if (e.key === "t" && paused) {
        tick()
    } else if (e.key === "y" && paused) {
        for ( let i = 0; i<tptInput.value; i++) {
            tick();
        }
    } 
});

window.addEventListener("keyup", (e) => {
    keysPressed[e.key.toLowerCase()] = false;
    if (cmdPressed) {keysPressed = []} // prevents keys being stuck down if pressed alongside cmd
    cmdPressed = e.metaKey || e.ctrlKey;

    // Paste on V up
    if (e.key.toLowerCase() === "v" && pastePreviewActive) {
        if (copiedPixels.length > 0) {
            let pasteMinX = Math.min(...copiedPixels.map(p => p.x));
            let pasteMinY = Math.min(...copiedPixels.map(p => p.y));
            let pasteX = hoverX - pasteMinX, pasteY = hoverY - pasteMinY;
            let already = new Set(pixels.map(p => `${p.x},${p.y}`));
            let newPaste = [];
            for (let i=0; i<copiedPixels.length; i++) {
                let nx = copiedPixels[i].x + pasteX, ny = copiedPixels[i].y + pasteY;
                if (!already.has(`${nx},${ny}`)) {
                    pixels.push({x: nx, y: ny});
                    newPaste.push({x:nx, y:ny}); already.add(`${nx},${ny}`);
                }
            }
            selectedLivePixels = newPaste;
            alertMsg.textContent = `Pasted ${newPaste.length} cells`;
            alertOpac = 100; animateAlert();
        }
        pastePreviewActive = false;
        e.preventDefault();
        return;
    }
    if (e.key === "Shift" || e.key === "ShiftRight" || e.key === "ShiftLeft") {
        shiftpressed = false;
        const minX = Math.min(hiliteCorner1.x, hiliteCorner2.x);
        const maxX = Math.max(hiliteCorner1.x, hiliteCorner2.x);
        const minY = Math.min(hiliteCorner1.y, hiliteCorner2.y);
        const maxY = Math.max(hiliteCorner1.y, hiliteCorner2.y);
        selectedLivePixels = pixels.filter(p =>
            p.x >= minX && p.x <= maxX && p.y >= minY && p.y <= maxY
        );
        hiliteCorner1 = {x: -1, y: 1};
        hiliteCorner2 = {x: 1, y: -1};
    }
    if (e.key.toLowerCase() === "i") {
        let xplus = prompt("X+ (right from mouse):", "0");
        let yplus = prompt("Y+ (up from mouse):", "0");
        if (xplus !== null && yplus !== null) {
            let dx = parseInt(xplus, 10);
            let dy = parseInt(yplus, 10);
            if (!isNaN(dx) && !isNaN(dy)) {
                let nx = hoverX + dx, ny = hoverY + dy;
                if (!pixels.some(p => p.x === nx && p.y === ny)) {
                    pixels.push({x: nx, y: ny});
                    alertMsg.textContent = `Placed 1 cell at (${nx},${ny})`;
                    alertOpac = 100; animateAlert();
                } else {
                    alertMsg.textContent = "Cell already exists at destination";
                    alertOpac = 100; animateAlert();
                }
            }
        }
        e.preventDefault();
        return;
    }
    if (e.key === "Delete" || e.key === "Backspace" && cmdPressed && !inputFocus) {
        if (selectedLivePixels.length > 0) {
            pixels = pixels.filter(
                p => !selectedLivePixels.some(sel => sel.x === p.x && sel.y === p.y)
            );
            alertMsg.textContent = `Deleted ${selectedLivePixels.length} selected cell(s)`;
            alertOpac = 100; animateAlert();
            selectedLivePixels = [];
        } else {
            alertMsg.textContent = "No cells selected to delete";
            alertOpac = 100; animateAlert();
        }
        e.preventDefault();
        return;
    }
});
window.addEventListener("mousemove", (e) => {
    mouseX = e.clientX;
    mouseY = e.clientY;
    if (shiftpressed && (hiliteCorner1 && hiliteCorner1.x !== -1))
        hiliteCorner2 = { x: hoverX, y: hoverY };
    if (draggingSelection && dragStart != null) {
        let curDragPos = { x: hoverX, y: hoverY };
        dragOffset.x = curDragPos.x - dragStart.x;
        dragOffset.y = curDragPos.y - dragStart.y;
    }
});
canvas.addEventListener("mousedown", (e) => {
    mouseButtonDown = e.button;
    mousedown = true;

    // Prevent left click from interfering with drag-selection logic
    if (draggingSelection) {
        if (e.button === 0) {
            // If left click during drag, cancel drag and reset state, do NOT allow stuck mode
            draggingSelection = false;
            dragStart = null;
            dragOffset = {x:0, y:0};
            selectionOriginal = [];
            e.preventDefault();
            return;
        }
    }

    if (e.button === RIGHT_MOUSE_BUTTON) {
        e.preventDefault();
        let isOnSelected = selectedLivePixels.some(p => p.x === hoverX && p.y === hoverY);
        if (isOnSelected && selectedLivePixels.length > 0) {
            draggingSelection = true;
            dragStart = {x: hoverX, y: hoverY};
            dragOffset = {x:0, y:0};
            selectionOriginal = selectedLivePixels.map(p => ({x: p.x, y: p.y}));
            e.preventDefault(); return;
        } 
    } else {
        selectedLivePixels = [];
    }
    if (e.button === 0) {
        if (isLive({x: hoverX, y: hoverY})) clickedFirst = 0;
        else clickedFirst = 1;
    }
});
canvas.addEventListener("contextmenu", e => {
   e.preventDefault();
});
canvas.addEventListener("mouseup", (e) => {
    mousedown = false; mouseButtonDown = null;

    // Cancel any drag-selection in progress if mouseup occurs, even with left button,
    // unless it's a normal right-button drag complete
    if (draggingSelection) {
        // If it's a right mouseup and normal drag end logic,
        // do as before:
        if (e.button === RIGHT_MOUSE_BUTTON) {
            if (selectedLivePixels.length > 0 && dragStart) {
                pixels = pixels.filter(p =>
                    !selectedLivePixels.some(sel => sel.x === p.x && sel.y === p.y)
                );
                let alreadyPresent = new Set(pixels.map(p => `${p.x},${p.y}`));
                let newSel = [];
                for (let i = 0; i < selectionOriginal.length; i++) {
                    let nx = selectionOriginal[i].x + dragOffset.x, ny = selectionOriginal[i].y + dragOffset.y;
                    if (!alreadyPresent.has(`${nx},${ny}`)) {
                        pixels.push({x: nx, y: ny});
                        newSel.push({x: nx, y: ny});
                    }
                }
                selectedLivePixels = newSel;
                draggingSelection = false; dragStart = null; dragOffset = {x:0, y:0}; selectionOriginal = [];
            }
        } else {
            // For left or other mouseup, just cancel drag-selection cleanly
            draggingSelection = false;
            dragStart = null;
            dragOffset = {x:0, y:0};
            selectionOriginal = [];
        }
    }
});

// ==== ROTATE LOGIC (unchanged) ====
function rotatePoint(px, py, ox, oy, dir) {
    let dx = px-ox, dy = py-oy, rx, ry;
    if(dir===1){rx=oy-dy;ry=ox+dx;}
    else if(dir===2){rx=ox-dx;ry=oy-dy;}
    else if(dir===3){rx=oy+dy;ry=ox-dx;}
    else{rx=px;ry=py;}
    return {x:Math.round(rx),y:Math.round(ry)};
}
function getIntegerBBoxCenter(points){
    let minX=Math.min(...points.map(p=>p.x)),minY=Math.min(...points.map(p=>p.y));
    let maxX=Math.max(...points.map(p=>p.x)),maxY=Math.max(...points.map(p=>p.y));
    let cx=(minX+maxX)/2,cy=(minY+maxY)/2;
    if((maxX-minX+1)%2===0)cx=Math.floor(cx)+0.5;else cx=Math.round(cx);
    if((maxY-minY+1)%2===0)cy=Math.floor(cy)+0.5;else cy=Math.round(cy);
    return{cx,cy}
}
function rotateSelection(direction){
    if(selectedLivePixels.length===0||draggingSelection)return;
    let{cx,cy}=getIntegerBBoxCenter(selectedLivePixels);
    let rotated=selectedLivePixels.map(p=>rotatePoint(p.x,p.y,cx,cy,direction));
    let selSet=new Set(selectedLivePixels.map(p=>`${p.x},${p.y}`));
    pixels=pixels.filter(p=>!selSet.has(`${p.x},${p.y}`));
    let pixelSet=new Set(pixels.map(p=>`${p.x},${p.y}`));
    let actuallyPlaced=[];
    for(let i=0;i<rotated.length;i++){
        let key=`${rotated[i].x},${rotated[i].y}`;
        if(!pixelSet.has(key)){
            pixels.push({x:rotated[i].x,y:rotated[i].y});
            actuallyPlaced.push({x:rotated[i].x,y:rotated[i].y});
            pixelSet.add(key);
        }
    }
    selectedLivePixels=actuallyPlaced;
    alertMsg.textContent = `Rotated ${actuallyPlaced.length} cells`;
    alertOpac=100; animateAlert();
}


function rotateSelection90CW(){rotateSelection(1);}
function rotateSelection180(){rotateSelection(2);}
function rotateSelection90CCW(){rotateSelection(3);}



window.addEventListener('beforeunload', function (event) {
    event.preventDefault(); // Standard for most browsers
    event.returnValue = 'You have unsaved changes. Are you sure you want to leave?'; // For older browsers
});

