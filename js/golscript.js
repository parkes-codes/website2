console.clear();
const FPS_BUFFER_SIZE = 120; // 2 seconds at 60 FPS
let frameTimestamps = new Array(FPS_BUFFER_SIZE);
let frameIndex = 0;
let numSamples = 0;
let fps = 0;
let lastDisplayUpdate = 0;
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


let webglSupported = false;
let rendered = 0;
let gl = null;
let glProgram = null;
let glBuffer = null;
let glColorLoc = null;
let glResolutionLoc = null;
let glCamLoc = null;
let glZoomLoc = null;

let ctx = document.getElementById("gamecanvas").getContext("2d");


// Shaders designed for colored rectangles (pixels), one per cell
const glVertexShaderSource = `
attribute vec2 a_position;
uniform vec2 u_resolution;
uniform vec2 u_cam;
uniform float u_zoom;
void main() {
    // Place in model space: center camera, apply zoom, flip Y axis for Life
    float x = (a_position.x-u_cam.x)*u_zoom + u_resolution.x/2.0;
    float y = u_resolution.y/2.0 - (a_position.y-u_cam.y)*u_zoom;
    // Rectangle per cell (see gl.POINTS/buffer below)
    gl_Position = vec4(
        2.0*(x/u_resolution.x - 0.5),
        2.0*(y/u_resolution.y - 0.5),
        0, 1
    );
    gl_PointSize = u_zoom;
}
`;

const glFragmentShaderSource = `
precision mediump float;
uniform vec4 u_color;
void main() {
    gl_FragColor = u_color;
}
`;

let canvas = document.getElementById("gamecanvas");
try {
    gl = canvas.getContext("webgl") || canvas.getContext("experimental-webgl");
    if (gl) {
        webglSupported = true;
        function compileShader(type, src) {
            let sh = gl.createShader(type);
            gl.shaderSource(sh, src);
            gl.compileShader(sh);
            if (!gl.getShaderParameter(sh, gl.COMPILE_STATUS)) {
                throw "Shader error: " + gl.getShaderInfoLog(sh);
            }
            return sh;
        }
        let vsh = compileShader(gl.VERTEX_SHADER, glVertexShaderSource);
        let fsh = compileShader(gl.FRAGMENT_SHADER, glFragmentShaderSource);

        glProgram = gl.createProgram();
        gl.attachShader(glProgram, vsh);
        gl.attachShader(glProgram, fsh);
        gl.linkProgram(glProgram);
        if (!gl.getProgramParameter(glProgram, gl.LINK_STATUS)) {
            throw "Program link error: " + gl.getProgramInfoLog(glProgram);
        }
        gl.useProgram(glProgram);

        glBuffer = gl.createBuffer();
        gl.bindBuffer(gl.ARRAY_BUFFER, glBuffer);

        let loc = gl.getAttribLocation(glProgram, "a_position");
        gl.enableVertexAttribArray(loc);
        gl.vertexAttribPointer(loc, 2, gl.FLOAT, false, 0, 0);

        glColorLoc = gl.getUniformLocation(glProgram, "u_color");
        glResolutionLoc = gl.getUniformLocation(glProgram, "u_resolution");
        glCamLoc = gl.getUniformLocation(glProgram, "u_cam");
        glZoomLoc = gl.getUniformLocation(glProgram, "u_zoom");
    }
} catch (e) {
    webglSupported = false;
    gl = null;
}

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

const display = document.getElementById("display");
const display2 = document.getElementById("display2")
const importbtn = document.getElementById("import");
const import2btn = document.getElementById("import2")
const alertMsg = document.getElementById("alerttext");
const exportbtn = document.getElementById("export");
const tpsInput = document.getElementById("tpsInput");
const tptInput = document.getElementById("tptInput");
const camxin = document.getElementById("camxin");
const camyin = document.getElementById("camyin");



let lexloaded = true;

setTimeout(function() {
    if (typeof patterns === "undefined") {
        lexloaded = false;
        console.log("job had one bro");
    }
}, 2000);

let startingArray = [];
let pixels = [];
let markers = [];
let camx = 0;
let camy = 0;
let zoom = 10;
let keysPressed = [];
let paused = true;
let sparseEnabled = true;
let mouseX = 0;
let mouseY = 0;
let mousedown = 0;
let clickedFirst = 0;
let hoverX = 0;
let hoverY = 0;
let tickn = 0;
let livePx = 0;
let maxPx = 0;
let cmdPressed = false;
let shiftpressed = false;
let hiliteCorner1 = {x: -1, y: 1};
let hiliteCorner2 = {x: 1, y: -1};
let t2 = 0;
let tpt = 0;
let tps = 0

let livePxHist = [];
let maxPxLen = 100;

let markerColors = [
    "faa",
    "afa",
    "aaf",
    "ffa",
    "aff",
    "faf"
]

let colorIndex = 0;

let selectedLivePixels = [];
let copiedPixels = [];
let pastePreviewActive = false;
let pastePreviewOffset = {x:0, y:0};
let draggingSelection = false;
let dragStart = null;
let dragOffset = {x:0, y:0};
let selectionOriginal = [];
let mouseButtonDown = null;
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
        maxPx = livePx;
    }
    else {
        alert("Unknown pattern: " + id);
    }
}

setTimeout(function(){loadLexi('blank')},200);

function isLive(pixel) {
    return pixels.some(p => p.x === pixel.x && p.y === pixel.y);
}

function settingsPrompt() {
    maxPxLen = prompt("Length of max pixel's history?");
    document.getElementById("settingsbtn").blur();
    if (!maxPxLen) { maxPxLen = 100; }
}

let camChangeX = 0;
let camChangeY = 0;

let prevStateHashes = new Set();
let prevTickHashes = [];
const MAX_STATE_HISTORY = 100; // Adjust for memory/perf balance

function hashPixArr(arr) {
    let hash = 5381;
    for (let i = 0; i < arr.length; ++i) {
        let p = arr[i];
        let k = ((p.x & 0xFFFF) << 16) | (p.y & 0xFFFF);
        hash = ((hash << 5) + hash) ^ k;
    }
    return hash >>> 0;
}

function arraysEqualUnordered(a, b) {
    if (a.length !== b.length) return false;
    let setA = new Set(a.map(p=>((p.x&0xFFFF)<<16)|(p.y&0xFFFF)));
    let setB = new Set(b.map(p=>((p.x&0xFFFF)<<16)|(p.y&0xFFFF)));
    if (setA.size !== setB.size) return false;
    for (let val of setA) if (!setB.has(val)) return false;
    return true;
}

function detectCycleOrStable(newPixels) {
    const hash = hashPixArr(newPixels);
    for (let i = 0; i < prevTickHashes.length; ++i) {
        if (prevTickHashes[i].hash === hash) {
            if (arraysEqualUnordered(prevTickHashes[i].arr, newPixels)) {
                return { period: i+1, at: prevTickHashes[i] };
            }
        }
    }
    return null;
}

function getData() {
    livePx = pixels.length;
}

function tick() {
    if (draggingSelection) return;

    const N = pixels.length;

    livePxHist.unshift(livePx);
    if (livePxHist.length > maxPxLen) livePxHist.length = maxPxLen;
    maxPx = livePxHist.length ? Math.max(...livePxHist) : 0;

    const liveSet = new Set();
    for (let i = 0; i < N; ++i) {
        const x = pixels[i].x | 0, y = pixels[i].y | 0;
        const key = ((x & 0xFFFF) << 16) | (y & 0xFFFF);
        liveSet.add(key);
    }

    const dx = [0, 1, 1, 1, 0, -1, -1, -1];
    const dy = [1, 1, 0, -1, -1, -1, 0, 1];

    const neighborInfo = new Map();

    for (let i = 0; i < N; ++i) {
        const px = pixels[i].x | 0, py = pixels[i].y | 0;
        let selfKey = ((px & 0xFFFF) << 16) | (py & 0xFFFF);

        let info = neighborInfo.get(selfKey);
        if (!info) {
            neighborInfo.set(selfKey, { count: 0, isLive: true });
        } else {
            info.isLive = true;
        }

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

    neighborInfo.forEach((val, key) => {
        const count = val.count;
        const isAlive = !!val.isLive;
        if (isAlive) {
            if (count === 2 || count === 3) {
                let x = (key >> 16); if (x & 0x8000) x |= 0xFFFF0000;
                let y = (key & 0xFFFF); if (y & 0x8000) y |= 0xFFFF0000;
                survivors.push({ x, y });
            }
        } else {
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

function drawPixelGL(x, y, color) {

}

function draw() {

    rendered = 0;
    getData();

    if (!paused) {
        camx += (Number(camxin.value) * tps) * tpt * 0.005
        camy += (Number(camyin.value) * tps) * tpt * 0.005
    }

    {
        const rect = canvas.getBoundingClientRect();
        let mx = canvas.width / -2 + ((mouseX - rect.left) * (canvas.width / rect.width));
        let my = canvas.height / 2 - ((mouseY - rect.top) * (canvas.height / rect.height));
        hoverX = Math.floor((mx / zoom + camx));
        hoverY = 1 + Math.floor((my / zoom + camy));
    }

    let cellSize = Math.max(zoom, 0.4);

    function isPixelOnScreen(px, py, size = 1) {
        const sx = (px - camx) * zoom + canvas.width / 2;
        const sy = canvas.height / 2 - (py - camy) * zoom;
        return (
            sx + cellSize > 0 &&
            sx - cellSize < canvas.width &&
            sy + cellSize > 0 &&
            sy - cellSize < canvas.height
        );
    }

    let sparsity = Math.max(Math.ceil(0.5 / zoom), 1);
    if (!sparseEnabled) {sparsity = 1;}

    function getShiftRectInfo() {
        const minX = Math.min(hiliteCorner1.x, hiliteCorner2.x);
        const maxX = Math.max(hiliteCorner1.x, hiliteCorner2.x);
        const minY = Math.min(hiliteCorner1.y, hiliteCorner2.y);
        const maxY = Math.max(hiliteCorner1.y, hiliteCorner2.y);
        const area = (maxX - minX + 1) * (maxY - minY + 1);
        return {minX, maxX, minY, maxY, area};
    }


    ctx.fillStyle = "#202525"; // Or "black" or other preferred color
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    if (false) {
        
    } else {
        // Checkerboard/grid rendering only if zoom >=2
        if (zoom >= 2) {
            ctx.strokeStyle = "#667373";
            ctx.lineWidth = zoom/20;
            let cols = Math.ceil(canvas.width / zoom) + 2;
            let rows = Math.ceil(canvas.height / zoom) + 2;
            let x0 = Math.floor(camx - canvas.width / (2 * zoom));
            let y0 = Math.floor(camy - canvas.height / (2 * zoom));
            for (let xx = 0; xx <= cols; xx++) {
                ctx.beginPath();
                let xCell = x0 + xx, xPixel = (xCell - camx) * zoom + canvas.width / 2;
                ctx.moveTo(xPixel, 0); ctx.lineTo(xPixel, canvas.height); ctx.stroke();
            }
            for (let yy = 0; yy <= rows; yy++) {
                ctx.beginPath();
                let yCell = y0 + yy, yPixel = canvas.height / 2 - (yCell - camy) * zoom;
                ctx.moveTo(0, yPixel); ctx.lineTo(canvas.width, yPixel); ctx.stroke();
            }
        }

        let highlights = new Set(selectedLivePixels.map(p => p.x + "," + p.y));
        for (let i = 0; i < pixels.length; i++) {
            let p = pixels[i], key = p.x + "," + p.y;
            if (draggingSelection && highlights.has(key)) continue;
            if (((p.x + p.y) % sparsity) !== 0) continue;
            if (!isPixelOnScreen(p.x, p.y, cellSize)) continue;
            if (highlights.has(key)) {
                ctx.fillStyle = `hsla(120,${(Math.sin(t2 / 10) + 1.2) * 25}%,80%,1)`;
            } else {
                ctx.fillStyle = "white";
            }
            ctx.fillRect(
                (p.x - camx) * zoom + canvas.width / 2,
                canvas.height / 2 - (p.y - camy) * zoom,
                cellSize, cellSize
            );
            rendered++;
        }

        if (isPixelOnScreen(0, 0, cellSize)) {
            ctx.fillStyle = "#fff2";
            if (zoom >= 4) {
                ctx.fillRect(
                    (0 - camx) * zoom + canvas.width / 2,
                    canvas.height / 2 - (0 - camy) * zoom,
                    cellSize, cellSize
                );
            } else {
                const diameter = Math.max(Math.min(canvas.width, canvas.height) * 0.01, zoom);
                ctx.beginPath();
                ctx.arc(
                    (0 - camx) * zoom + canvas.width / 2,
                    canvas.height / 2 - (0 - camy) * zoom,
                    diameter / 2, 0, 2 * Math.PI
                );
                ctx.fill();
            }
        }

        if (draggingSelection && selectionOriginal.length > 0) {
            for (let i = 0; i < selectionOriginal.length; i++) {
                let nx = selectionOriginal[i].x + dragOffset.x,
                    ny = selectionOriginal[i].y + dragOffset.y;
                if (!isPixelOnScreen(nx, ny, cellSize)) continue;
                ctx.fillStyle = "rgba(60,180,250,0.5)";
                ctx.fillRect(
                    (nx - camx) * zoom + canvas.width / 2,
                    canvas.height / 2 - (ny - camy) * zoom,
                    cellSize, cellSize
                );
            }
        }
        if (pastePreviewActive && copiedPixels.length > 0) {
            let pasteMinX = Math.min(...copiedPixels.map(p => p.x));
            let pasteMinY = Math.min(...copiedPixels.map(p => p.y));
            let offsetX = hoverX - pasteMinX, offsetY = hoverY - pasteMinY;
            let already = new Set(pixels.map(p => `${p.x},${p.y}`));
            for (let i = 0; i < copiedPixels.length; i++) {
                let nx = copiedPixels[i].x + offsetX, ny = copiedPixels[i].y + offsetY;
                if (!isPixelOnScreen(nx, ny, cellSize)) continue;
                if (already.has(`${nx},${ny}`)) ctx.fillStyle = "hsla(0,100%,60%,0.4)";
                else ctx.fillStyle = "hsla(210,100%,60%,0.5)";
                ctx.fillRect(
                    (nx - camx) * zoom + canvas.width / 2,
                    canvas.height / 2 - (ny - camy) * zoom,
                    cellSize, cellSize
                );
            }
        }
        if (shiftpressed) {
            ctx.globalAlpha = 0.15;
            let {minX, maxX, minY, maxY, area} = getShiftRectInfo();
            if (area > 50000) {
                ctx.globalAlpha = 1;
                ctx.save();
                ctx.fillStyle = "#ccc";
                ctx.lineWidth = 10;
                ctx.beginPath();
                for (let hx = minX; hx <= maxX; hx++) {
                    if (isPixelOnScreen(hx, minY, cellSize)) {
                        ctx.fillRect(
                            (hx - camx) * zoom + canvas.width / 2,
                            canvas.height / 2 - (minY - camy) * zoom,
                            cellSize, cellSize
                        );
                    }
                }
                if (maxY !== minY) {
                    for (let hx = minX; hx <= maxX; hx++) {
                        if (isPixelOnScreen(hx, maxY, cellSize)) {
                            ctx.fillRect(
                                (hx - camx) * zoom + canvas.width / 2,
                                canvas.height / 2 - (maxY - camy) * zoom,
                                cellSize, cellSize
                            );
                        }
                    }
                }
                for (let hy = minY + 1; hy < maxY; hy++) {
                    if (isPixelOnScreen(minX, hy, cellSize)) {
                        ctx.fillRect(
                            (minX - camx) * zoom + canvas.width / 2,
                            canvas.height / 2 - (hy - camy) * zoom,
                            cellSize, cellSize
                        );
                    }
                }
                if (maxX !== minX) {
                    for (let hy = minY + 1; hy < maxY; hy++) {
                        if (isPixelOnScreen(maxX, hy, cellSize)) {
                            ctx.fillRect(
                                (maxX - camx) * zoom + canvas.width / 2,
                                canvas.height / 2 - (hy - camy) * zoom,
                                cellSize, cellSize
                            );
                        }
                    }
                }
                ctx.stroke();
                ctx.restore();
            } else {
                ctx.fillStyle = "#aaa";
                for (let hx = minX; hx <= maxX; hx++) for (let hy = minY; hy <= maxY; hy++) {
                    if (!isPixelOnScreen(hx, hy, cellSize)) continue;
                    ctx.fillRect(
                        (hx - camx) * zoom + canvas.width / 2,
                        canvas.height / 2 - (hy - camy) * zoom,
                        cellSize, cellSize
                    );
                }
            }
            ctx.globalAlpha = 1;
        }
        if (isPixelOnScreen(hoverX, hoverY, cellSize)) {
            ctx.globalAlpha = 0.5; ctx.fillStyle = "#888";
            ctx.fillRect(
                (hoverX - camx) * zoom + canvas.width / 2,
                canvas.height / 2 - (hoverY - camy) * zoom,
                cellSize, cellSize
            );
        }
        ctx.globalAlpha = 1;

        if (Array.isArray(markers)) {
            ctx.save();
            ctx.globalAlpha = 0.6;
            for (let i = 0; i < markers.length; i++) {
                let m = markers[i];
                if (!isPixelOnScreen(m.x, m.y, cellSize)) continue;
                ctx.fillStyle = m.color || "#0ff";
                ctx.fillRect(
                    (m.x - camx) * zoom + canvas.width / 2,
                    canvas.height / 2 - (m.y - camy) * zoom,
                    cellSize, cellSize
                );
            }
            ctx.restore();
        }
    }

    if (shiftpressed) {
        hiliteCorner2 = { x: hoverX, y: hoverY };
    }

    if (mousedown && !draggingSelection) {
        if (isLive({ x: hoverX, y: hoverY }) && (clickedFirst == 0)) {
            let inHighlight = selectedLivePixels.find(p => p.x === hoverX && p.y === hoverY);
            if (!inHighlight) {
                const idx = pixels.findIndex(p => p.x === hoverX && p.y === hoverY);
                if (idx !== -1) pixels.splice(idx, 1);
            }
        } else if (clickedFirst == 1 && !pixels.some(p => p.x === hoverX && p.y === hoverY)) {
            pixels.push({ x: hoverX, y: hoverY })
        }
    }

    if (keysPressed["="] || keysPressed["+"]) {
        let xBefore = ((mouseX - canvas.width / 2) / zoom) + camx;
        let yBefore = (-(mouseY - canvas.height / 2) / zoom) + camy;
        zoom *= 1.05;
        let xAfter = ((mouseX - canvas.width / 2) / zoom) + camx;
        let yAfter = (-(mouseY - canvas.height / 2) / zoom) + camy;
        camx += (xBefore - xAfter); camy += (yBefore - yAfter);
    } else if (keysPressed["-"]) {
        let xBefore = ((mouseX - canvas.width / 2) / zoom) + camx;
        let yBefore = (-(mouseY - canvas.height / 2) / zoom) + camy;
        zoom /= 1.05;
        let xAfter = ((mouseX - canvas.width / 2) / zoom) + camx;
        let yAfter = (-(mouseY - canvas.height / 2) / zoom) + camy;
        camx += (xBefore - xAfter); camy += (yBefore - yAfter);
    }

    if (keysPressed["a"] || (keysPressed["arrowleft"] && !inputFocus)) camx -= (1 / Math.abs(Math.log(zoom + 1.5))) * 1;
    if ((keysPressed["d"] && !cmdPressed) || (keysPressed["arrowright"] && !inputFocus)) camx += (1 / Math.abs(Math.log(zoom + 1.5))) * 1;
    if (keysPressed["w"] || (keysPressed["arrowup"] && !inputFocus)) camy += (1 / Math.abs(Math.log(zoom + 1.5))) * 1;
    if ((keysPressed["s"] && !cmdPressed) || (keysPressed["arrowdown"] && !inputFocus)) camy -= (1 / Math.abs(Math.log(zoom + 1.5))) * 1;

    display.textContent = `cam: (${camx.toFixed(2)},${camy.toFixed(2)}) hover: (${hoverX},${hoverY}) zoom: ${zoom.toFixed(3)}`;
    display2.textContent = `livepx: ${livePx} maxpx: ${maxPx} rendered: ${rendered} tick: ${tickn} fps: ${Math.ceil(fps)}`;

    requestAnimationFrame(draw);
}

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

    let beforeX = ((mx - canvas.width / 2) / zoom) + camx;
    let beforeY = (-(my - canvas.height / 2) / zoom) + camy;

    let op = (e.deltaY < 0) ? 1 : -1;
    let steps = 10;
    
    let interval = 1000 / fps / steps;

    let zoomStep = isTrackpad ? 1.005 : 1.02;

    let performStep = function(step) {
        if (step > steps) return;

        let worldXBefore = ((mx - canvas.width / 2) / zoom) + camx;
        let worldYBefore = (-(my - canvas.height / 2) / zoom) + camy;

        if (op > 0) {
            zoom *= zoomStep;
        } else {
            zoom /= zoomStep;
        }

        let worldXAfter = ((mx - canvas.width / 2) / zoom) + camx;
        let worldYAfter = (-(my - canvas.height / 2) / zoom) + camy;
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
    let minX = Infinity, minY = Infinity, maxX = -Infinity, maxY = -Infinity;
    for (const p of pixels) {
        if (p.x < minX) minX = p.x;
        if (p.x > maxX) maxX = p.x;
        if (p.y < minY) minY = p.y;
        if (p.y > maxY) maxY = p.y;
    }
    let width = maxX - minX + 1;
    let height = maxY - minY + 1;
    let grid = [];
    for (let y = 0; y < height; y++) {
        grid[y] = [];
        for (let x = 0; x < width; x++) {
            grid[y][x] = "b";
        }
    }
    for (const p of pixels) {
        let relX = p.x - minX;
        let relY = (maxY - p.y);
        if (relY < 0 || relY >= height) continue;
        if (relX < 0 || relX >= width) continue;
        grid[relY][relX] = "o";
    }
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
    let body = rleRows.join("$") + "!";
    let header = `x = ${width}, y = ${height}, rule = B3/S23\n`;
    let rleString = header + body;

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
        i++;
    } else {
        i = 0;
    }

    let xCenter = width ? Math.floor(width / 2) : 0;
    let yCenter = height ? Math.floor(height / 2) : 0;

    let rleBody = lines.slice(i).filter(l => !l.trim().startsWith("#")).join("");
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
    } else if (e.key === "/" || e.key === "\\") {
        camxin.value = 0;
    }
});

camyin.addEventListener("keydown", (e) => {
    if (e.key === "Enter") {
        camyin.blur();
        inputFocus = false;
    } else if (e.key === "/" || e.key === "\\") {
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
        rotateSelection(1);
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

    if (cmdPressed && e.key.toLowerCase() === ",") {
        flipX();
        e.preventDefault(); return;
    }
    if (cmdPressed && e.key.toLowerCase() === ".") {
       flipY();
        e.preventDefault(); return;
    }
    if (e.key === "Shift" || e.key === "ShiftRight" || e.key === "ShiftLeft" || e.shiftKey) {
        shiftpressed = true;
        if (!hiliteCorner1 || hiliteCorner1.x === -1) hiliteCorner1 = { x: hoverX, y: hoverY };
        hiliteCorner2 = { x: hoverX, y: hoverY };
    }
    if (e.key == " ") { paused = !paused; }
    else if (e.key == "r") {
        e.preventDefault();
        if (cmdPressed) { loadLexi("blank");  camx = 0; camy = 0; zoom = 10;}
        else {resetState(); camx = 0; camy = 0;};
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
    if (cmdPressed) {keysPressed = []}
    cmdPressed = e.metaKey || e.ctrlKey;

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

    if (draggingSelection) {
        if (e.button === 0) {
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

    if (draggingSelection) {
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
            draggingSelection = false;
            dragStart = null;
            dragOffset = {x:0, y:0};
            selectionOriginal = [];
        }
    }
});

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

const headers = document.getElementsByClassName("header3");

for (let i = 0; i<headers.length; i++) {
    let thisheader = headers[i];
    thisheader.style.color = `hsl(${170+Math.sin(i/2)*30},50%,50%)`;
} 

window.addEventListener('beforeunload', function (event) {
    event.preventDefault();
    event.returnValue = 'You have unsaved changes. Are you sure you want to leave?';
});
