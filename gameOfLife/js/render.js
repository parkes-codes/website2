
import {
    webglSupported,
    rendered,
    gl,
    glProgram,
    glBuffer,
    glColorLoc,
    glResolutionLoc,
    glCamLoc,
    glZoomLoc,
    ctx,
    canvas,
    paused,
    camx,
    camy,
    camxin,
    camyin,
    tps,
    tpt,
    mouseX,
    mouseY,
    hoverX,
    hoverY,
    zoom,
    sparseEnabled,
    draggingSelection,
    selectedLivePixels,
    pixels,
    t2,
    selectionOriginal,
    dragOffset,
    pastePreviewActive,
    copiedPixels,
    shiftpressed,
    hiliteCorner1,
    hiliteCorner2,
    markers,
    getData,
    isLive,
    clickedFirst,
    mousedown,
    keysPressed,
    inputFocus,
    cmdPressed,
    display,
    display2,
    livePx,
    maxPx,
    tickn
} from "./main.js";

import { fps } from "./main.js";

// === EXPLANATION OF RENDERING FAILURE ===
//
// The main problem is that you're referencing and using the global variable `gl` everywhere to issue GL commands,
// but in your WebGL initialization you never assign a value to the top-level `gl` variable!
// 
// You assign to a **local** `_gl`, and then use that everywhere in the initialization code, but the rest of your actual
// rendering code (in draw() and so on) expects the global `gl` to be the current WebGL context.
// 
// That means `gl` is always null or undefined, resulting in nothing being rendered.
//
// --- Solution: ---
// After successful creation of a WebGL context, assign:  gl = _gl;
//
// Also: the other variables like glProgram, glBuffer, etc. should be designed to be global as well, but they are
// being set as globals here so that's probably fine.
//
// The secondary issue is that your drawPixelGL() is empty – but you actually use GL buffer logic everywhere,
// so that's not needed for the main pathway, just noting.
//
// === Here's the fixed code: ===

const glVertexShaderSource = `
attribute vec2 a_position;
uniform vec2 u_resolution;
uniform vec2 u_cam;
uniform float u_zoom;
void main() {
    float x = (a_position.x-u_cam.x)*u_zoom + u_resolution.x/2.0;
    float y = u_resolution.y/2.0 - (a_position.y-u_cam.y)*u_zoom;
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

// Try initializing WebGL if possible:
try {
    let _canvas = canvas || document.getElementById("gamecanvas");
    let _gl = _canvas.getContext("webgl") || _canvas.getContext("experimental-webgl");
    if (_gl) {
        // --- THIS IS THE CRUCIAL ASSIGNMENT! ---
        gl = _gl;
        webglSupported = true;
        // Compile shaders
        function compileShader(type, src) {
            let sh = _gl.createShader(type);
            _gl.shaderSource(sh, src);
            _gl.compileShader(sh);
            if (!_gl.getShaderParameter(sh, _gl.COMPILE_STATUS)) {
                throw "Shader error: " + _gl.getShaderInfoLog(sh);
            }
            return sh;
        }
        let vsh = compileShader(_gl.VERTEX_SHADER, glVertexShaderSource);
        let fsh = compileShader(_gl.FRAGMENT_SHADER, glFragmentShaderSource);

        glProgram = _gl.createProgram();
        _gl.attachShader(glProgram, vsh);
        _gl.attachShader(glProgram, fsh);
        _gl.linkProgram(glProgram);
        if (!_gl.getProgramParameter(glProgram, _gl.LINK_STATUS)) {
            throw "Program link error: " + _gl.getProgramInfoLog(glProgram);
        }
        _gl.useProgram(glProgram);

        glBuffer = _gl.createBuffer();
        _gl.bindBuffer(_gl.ARRAY_BUFFER, glBuffer);

        // Attributes
        let loc = _gl.getAttribLocation(glProgram, "a_position");
        _gl.enableVertexAttribArray(loc);
        _gl.vertexAttribPointer(loc, 2, _gl.FLOAT, false, 0, 0);

        // Uniforms
        glColorLoc = _gl.getUniformLocation(glProgram, "u_color");
        glResolutionLoc = _gl.getUniformLocation(glProgram, "u_resolution");
        glCamLoc = _gl.getUniformLocation(glProgram, "u_cam");
        glZoomLoc = _gl.getUniformLocation(glProgram, "u_zoom");
    }
} catch (e) {
    webglSupported = false;
    gl = null;
}


function drawPixelGL(x, y, color) {
    // (not used in current pipeline)
}

export function draw() {

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

    // Enforce minimum cell size of 0.4
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

    // Calculate sparsity factor for pixel drawing always
    let sparsity = Math.max(Math.ceil(0.5 / zoom), 1); // Less pixels for more zoomed out, optimises game by a lot
    if (!sparseEnabled) { sparsity = 1; }

    // Draw background/clear
    if (webglSupported && gl) { // gl must be defined here!
        // WebGL mode -- clear
        gl.viewport(0, 0, canvas.width, canvas.height);
        gl.clearColor(0, 0, 0, 0);
        gl.clear(gl.COLOR_BUFFER_BIT);

        ctx.clearRect(0, 0, canvas.width, canvas.height);
        ctx.strokeStyle = "#222";
        ctx.lineWidth = 1;
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

        // Always use sparsity for GL mode
        let mainVerts = [];
        let highlights = new Set(selectedLivePixels.map(p => p.x + "," + p.y));
        for (let i = 0; i < pixels.length; i++) {
            let p = pixels[i], key = p.x + "," + p.y;
            if (draggingSelection && highlights.has(key)) continue; // skip, will draw in drag
            if (((p.x + p.y) % sparsity) !== 0) continue;
            if (!isPixelOnScreen(p.x, p.y, cellSize)) continue;
            mainVerts.push(p.x, p.y);
            rendered++;
        }
        if (mainVerts.length > 0) {
            gl.bindBuffer(gl.ARRAY_BUFFER, glBuffer);
            gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(mainVerts), gl.STREAM_DRAW);
            gl.uniform2f(glResolutionLoc, canvas.width, canvas.height);
            gl.uniform2f(glCamLoc, camx, camy);
            gl.uniform1f(glZoomLoc, zoom);
            gl.uniform4f(glColorLoc, 1, 1, 1, 1);
            gl.drawArrays(gl.POINTS, 0, mainVerts.length / 2);
        }

        // Draw selection highlights (in green pulsating)
        if (selectedLivePixels.length > 0) {
            let selVerts = [];
            for (let i = 0; i < pixels.length; i++) {
                let p = pixels[i], key = p.x + "," + p.y;
                if (highlights.has(key)) {
                    if (((p.x + p.y) % sparsity) === 0 && isPixelOnScreen(p.x, p.y, cellSize)) {
                        selVerts.push(p.x, p.y);
                        rendered++;
                    }
                }
            }
            if (selVerts.length > 0 && zoom > 0) {
                gl.bindBuffer(gl.ARRAY_BUFFER, glBuffer);
                gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(selVerts), gl.STREAM_DRAW);
                gl.uniform2f(glResolutionLoc, canvas.width, canvas.height);
                gl.uniform2f(glCamLoc, camx, camy);
                gl.uniform1f(glZoomLoc, zoom);
                let s = (Math.sin(t2 / 10) + 1.2) * 0.25;
                gl.uniform4f(glColorLoc, 0.2, 0.7, 0.2 + s, 1);
                gl.drawArrays(gl.POINTS, 0, selVerts.length / 2);
            } else if (selVerts.length > 0) {
                let s = (Math.sin(t2 / 10) + 1.2) * 0.25;
                ctx.fillStyle = `rgba(44,181,44,${0.7 + s})`;
                for (let k = 0; k < selVerts.length; k += 2) {
                    let x = selVerts[k], y = selVerts[k + 1];
                    if (!isPixelOnScreen(x, y, cellSize)) continue;
                    ctx.fillRect(
                        (x - camx) * zoom + canvas.width / 2,
                        canvas.height / 2 - (y - camy) * zoom,
                        cellSize, cellSize
                    );
                }
            }
        }

        // Draw dragged preview and overlays using 2D context for flexibility
        if (draggingSelection && selectionOriginal.length > 0) {
            for (let i = 0; i < selectionOriginal.length; i++) {
                let nx = selectionOriginal[i].x + dragOffset.x, ny = selectionOriginal[i].y + dragOffset.y;
                if (!isPixelOnScreen(nx, ny, cellSize)) continue;
                ctx.fillStyle = "rgba(50,180,255,0.5)";
                ctx.fillRect(
                    (nx - camx) * zoom + canvas.width / 2,
                    canvas.height / 2 - (ny - camy) * zoom,
                    cellSize, cellSize
                );
            }
        }
        // Paste preview
        if (pastePreviewActive && copiedPixels.length > 0) {
            let pasteMinX = Math.min(...copiedPixels.map(p => p.x));
            let pasteMinY = Math.min(...copiedPixels.map(p => p.y));
            let offsetX = hoverX - pasteMinX,
                offsetY = hoverY - pasteMinY;
            let already = new Set(pixels.map(p => `${p.x},${p.y}`));
            for (let i = 0; i < copiedPixels.length; i++) {
                let nx = copiedPixels[i].x + offsetX,
                    ny = copiedPixels[i].y + offsetY;
                if (!isPixelOnScreen(nx, ny, cellSize)) continue;
                if (already.has(`${nx},${ny}`)) ctx.fillStyle = "rgba(240,40,40,0.4)";
                else ctx.fillStyle = "rgba(80,180,255,0.5)";
                ctx.fillRect(
                    (nx - camx) * zoom + canvas.width / 2,
                    canvas.height / 2 - (ny - camy) * zoom,
                    cellSize, cellSize
                );
            }
        }
        // Draw rectangle selection in outline
        if (shiftpressed) {
            ctx.globalAlpha = 0.15;
            ctx.fillStyle = "yellow";
            const minX = Math.min(hiliteCorner1.x, hiliteCorner2.x);
            const maxX = Math.max(hiliteCorner1.x, hiliteCorner2.x);
            const minY = Math.min(hiliteCorner1.y, hiliteCorner2.y);
            const maxY = Math.max(hiliteCorner1.y, hiliteCorner2.y);
            for (let hx = minX; hx <= maxX; hx++) {
                for (let hy = minY; hy <= maxY; hy++) {
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
        // Draw hovered cell
        if (isPixelOnScreen(hoverX, hoverY, cellSize)) {
            ctx.globalAlpha = 0.5; ctx.fillStyle = "#888";
            ctx.fillRect(
                (hoverX - camx) * zoom + canvas.width / 2,
                canvas.height / 2 - (hoverY - camy) * zoom,
                cellSize, cellSize
            );
            ctx.globalAlpha = 1;
        }

        // ---- Draw markers using ctx (2D context) ----
        if (typeof markers !== "undefined" && Array.isArray(markers)) {
            ctx.globalAlpha = 0.4;
            for (let i = 0; i < markers.length; i++) {
                let m = markers[i];
                if (!isPixelOnScreen(m.x, m.y, cellSize)) continue;
                ctx.fillStyle = m.color;
                ctx.fillRect(
                    (m.x - camx) * zoom + canvas.width / 2,
                    canvas.height / 2 - (m.y - camy) * zoom,
                    cellSize, cellSize
                );
            }
            ctx.globalAlpha = 1;
        }

    } else {

        ctx.clearRect(0, 0, canvas.width, canvas.height);
        // Draw grid
        ctx.strokeStyle = "#222";
        ctx.lineWidth = 1;
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

        // Draw main live pixels and highlight, always using sparsity
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

        // draw 0,0 cell whiter
        if (isPixelOnScreen(0, 0, cellSize)) {
            ctx.fillStyle = "#fff1";
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
            ctx.fillStyle = "#404040";
            const minX = Math.min(hiliteCorner1.x, hiliteCorner2.x);
            const maxX = Math.max(hiliteCorner1.x, hiliteCorner2.x);
            const minY = Math.min(hiliteCorner1.y, hiliteCorner2.y);
            const maxY = Math.max(hiliteCorner1.y, hiliteCorner2.y);
            for (let hx = minX; hx <= maxX; hx++) for (let hy = minY; hy <= maxY; hy++) {
                if (!isPixelOnScreen(hx, hy, cellSize)) continue;
                ctx.fillRect(
                    (hx - camx) * zoom + canvas.width / 2,
                    canvas.height / 2 - (hy - camy) * zoom,
                    cellSize, cellSize
                );
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

        // Draw markers at 60% opacity
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

    // UI text/logic
    if (shiftpressed) {
        hiliteCorner2 = { x: hoverX, y: hoverY };
    }

    // Fast draw/erase
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

    // Camera controls
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