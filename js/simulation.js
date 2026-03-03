/**
 * simulation.js – Canvas-based electromagnetic induction physics renderer
 * Handles: field lines, coil/bobina perspective, vectors (B, n̂, I), flux calculation
 */

'use strict';

// ── Shared simulation state (exported via window.simState) ──────────────────
window.simState = {
    fieldType: 'uniform',   // 'uniform' | 'magnet'
    coilType: 'espira',    // 'espira' | 'bobina'
    N: 5,           // number of turns (bobina)
    B: 1.0,         // T
    A: 0.1,         // m²
    angleDeg: 0,           // α in degrees (between B and n̂)
    animating: false,
    omega: 1.0,         // rad/s
    magnetX: 0.75,        // magnet position as fraction of canvas width (for magnet mode)
    t: 0,           // simulation time [s]
    lastTs: null,        // last animation frame timestamp

    // computed
    flux: 0,           // Φ per turn [Wb]
    fluxBobina: 0,           // Φ total [Wb]
    emf: 0,           // |ε| [V]
    dPhiDt: 0,           // dΦ/dt
    prevFlux: null,
    prevT: null,

    // history for graph
    history: [],          // [{t, phi, emf}] – up to 600 entries
};

// ── Canvas setup ────────────────────────────────────────────────────────────
const canvas = document.getElementById('simCanvas');
const ctx = canvas.getContext('2d');

let W, H, CX, CY;

function resize() {
    const rect = canvas.parentElement.getBoundingClientRect();
    canvas.width = rect.width * devicePixelRatio;
    canvas.height = rect.height * devicePixelRatio;
    W = canvas.width;
    H = canvas.height;
    CX = W / 2;
    CY = H / 2;
    ctx.scale(devicePixelRatio, devicePixelRatio);
    canvas.style.width = rect.width + 'px';
    canvas.style.height = rect.height + 'px';
}

window.addEventListener('resize', () => { resize(); draw(); });
resize();

// ── Physics ─────────────────────────────────────────────────────────────────
function computePhysics() {
    const s = window.simState;
    const alpha = (s.angleDeg * Math.PI) / 180;

    if (s.fieldType === 'magnet') {
        // For bar magnet: effective B decreases with distance from coil centre
        // magnetX 0=left, 1=right; coil is at 0.42 by default
        const coilFrac = 0.42;
        const dist = Math.abs(s.magnetX - coilFrac);          // 0..~0.8
        const Beff = s.B / (1 + 8 * dist * dist);            // dipole-like falloff
        s.flux = Beff * s.A * Math.cos(alpha);
    } else {
        s.flux = s.B * s.A * Math.cos(alpha);
    }

    const effectiveN = s.coilType === 'bobina' ? s.N : 1;
    s.fluxBobina = effectiveN * s.flux;

    // dΦ/dt numerical
    if (s.prevFlux !== null && s.prevT !== null && s.t !== s.prevT) {
        s.dPhiDt = (s.flux - s.prevFlux) / (s.t - s.prevT);
    } else {
        s.dPhiDt = 0;
    }
    s.emf = Math.abs(effectiveN * s.dPhiDt);

    s.prevFlux = s.flux;
    s.prevT = s.t;
}

// ── Animation Loop ───────────────────────────────────────────────────────────
function animate(ts) {
    const s = window.simState;
    if (!s.animating) return;

    if (s.lastTs !== null) {
        const dt = Math.min((ts - s.lastTs) / 1000, 0.05); // cap at 50ms
        s.t += dt;
        s.angleDeg = (s.angleDeg + s.omega * dt * (180 / Math.PI)) % 360;

        // sync slider
        const slAngle = document.getElementById('sl-angle');
        if (slAngle) slAngle.value = s.angleDeg;
    }
    s.lastTs = ts;

    computePhysics();
    updateUI();
    draw();

    // record history (max 600 pts, ~10s at 60fps)
    if (s.history.length === 0 || s.t - s.history[s.history.length - 1].t > 0.04) {
        s.history.push({ t: +s.t.toFixed(3), phi: +s.flux.toFixed(5), emf: +s.emf.toFixed(4) });
        if (s.history.length > 600) s.history.shift();
    }

    window.graphDraw && window.graphDraw();
    s.animFrameId = requestAnimationFrame(animate);
}

window.startAnimation = function () {
    const s = window.simState;
    s.animating = true;
    s.lastTs = null;
    requestAnimationFrame(animate);
};

window.stopAnimation = function () {
    window.simState.animating = false;
    window.simState.lastTs = null;
};

// ── Called externally when slider moves ─────────────────────────────────────
window.updateSim = function () {
    computePhysics();
    // record a history point even when not animating (magnet drag or slider)
    const s = window.simState;
    const last = s.history[s.history.length - 1];
    if (!last || Math.abs(s.flux - last.phi) > 1e-6) {
        s.t += 0.05;
        s.history.push({ t: +s.t.toFixed(3), phi: +s.flux.toFixed(5), emf: +s.emf.toFixed(4) });
        if (s.history.length > 600) s.history.shift();
    }
    updateUI();
    draw();
    window.graphDraw && window.graphDraw();
};

// ── UI readouts ──────────────────────────────────────────────────────────────
function updateUI() {
    const s = window.simState;
    const deg = s.angleDeg.toFixed(1);
    const rad = ((s.angleDeg * Math.PI) / 180);

    setEl('lbl-angle', deg + '°');
    setEl('lbl-B', s.B.toFixed(1) + ' T');
    setEl('lbl-A', s.A.toFixed(2) + ' m²');
    setEl('lbl-flux', s.fluxBobina.toFixed(4) + ' Wb');
    setEl('lbl-emf', s.emf.toFixed(4) + ' V');
    setEl('formula-flux',
        `Φ = B·A·cos α = ${s.B.toFixed(1)} × ${s.A.toFixed(2)} × cos(${deg}°) = ${s.flux.toFixed(4)} Wb`
        + (s.coilType === 'bobina' ? `  →  Φ_bobina = ${s.N} × ${s.flux.toFixed(4)} = ${s.fluxBobina.toFixed(4)} Wb` : ''));
    const effectiveN = s.coilType === 'bobina' ? s.N : 1;
    setEl('formula-emf',
        `|ε| = N · |ΔΦ/Δt| = ${effectiveN} × ${Math.abs(s.dPhiDt).toFixed(4)} = ${s.emf.toFixed(4)} V`);

    // Induced current label with Lenz direction
    const dPhi = s.dPhiDt;
    let currLabel = '—';
    if (Math.abs(dPhi) > 1e-6) {
        currLabel = dPhi > 0
            ? '↺ Sentido negativo (Lenz)'
            : '↻ Sentido positivo (Lenz)';
        document.getElementById('lbl-current').style.color = dPhi > 0 ? '#f472b6' : '#34d399';
    } else {
        document.getElementById('lbl-current').style.color = '#a0a0c0';
    }
    setEl('lbl-current', currLabel);

    // Slider angle label sync
    updateSliderPct('sl-angle', s.angleDeg, 0, 360);
    updateSliderPct('sl-B', s.B, 0.1, 5);
    updateSliderPct('sl-A', s.A, 0.01, 1);
    updateSliderPct('sl-speed', s.omega, 0.1, 5);
    updateSliderPct('sl-turns', s.N, 1, 20);
}

function setEl(id, text) {
    const el = document.getElementById(id);
    if (el) el.textContent = text;
}

function updateSliderPct(id, val, min, max) {
    const el = document.getElementById(id);
    if (!el) return;
    const pct = ((val - min) / (max - min)) * 100;
    el.style.setProperty('--pct', pct.toFixed(1) + '%');
}

// ── Drawing helpers ──────────────────────────────────────────────────────────
const dpr = () => devicePixelRatio;

function cx(frac) { return frac * (W / dpr()); }  // fraction → logical px
function cy(frac) { return frac * (H / dpr()); }

function drawArrow(x1, y1, x2, y2, color, width = 2, label = '', headSize = 10) {
    const lw = W / dpr();
    const lh = H / dpr();
    ctx.save();
    ctx.strokeStyle = color;
    ctx.fillStyle = color;
    ctx.lineWidth = width;
    ctx.shadowColor = color;
    ctx.shadowBlur = 8;
    ctx.beginPath();
    ctx.moveTo(x1, y1);
    ctx.lineTo(x2, y2);
    ctx.stroke();

    // Arrowhead
    const angle = Math.atan2(y2 - y1, x2 - x1);
    ctx.beginPath();
    ctx.moveTo(x2, y2);
    ctx.lineTo(x2 - headSize * Math.cos(angle - 0.4), y2 - headSize * Math.sin(angle - 0.4));
    ctx.lineTo(x2 - headSize * Math.cos(angle + 0.4), y2 - headSize * Math.sin(angle + 0.4));
    ctx.closePath();
    ctx.fill();

    if (label) {
        ctx.shadowBlur = 12;
        ctx.font = `bold ${Math.round(13 * lw / 600)}px Outfit`;
        ctx.fillText(label, x2 + 8, y2 + 5);
    }
    ctx.restore();
}

// ── Field line rendering ─────────────────────────────────────────────────────
function drawUniformField(B_intensity) {
    const lw = W / dpr(), lh = H / dpr();
    const nLines = 9;
    const alpha = Math.min(0.15 + B_intensity * 0.1, 0.55);
    const lineColor = `rgba(96, 165, 250, ${alpha})`;

    ctx.save();
    ctx.strokeStyle = lineColor;
    ctx.lineWidth = Math.max(1, 1.2 + B_intensity * 0.2);
    ctx.shadowColor = '#60a5fa';
    ctx.shadowBlur = 4;
    ctx.setLineDash([]);

    for (let i = 0; i < nLines; i++) {
        const y = lh * 0.15 + (lh * 0.70) * (i / (nLines - 1));
        ctx.beginPath();
        ctx.moveTo(0, y);
        ctx.lineTo(lw, y);
        ctx.stroke();

        // Arrow indicator every 2 lines
        if (i % 2 === 0) {
            const ax = lw * 0.12;
            drawArrow(ax, y, ax + 22, y, lineColor, 1.5, '', 7);
        }
    }
    ctx.restore();
}

function drawMagnetField(magnetX_frac) {
    const lw = W / dpr(), lh = H / dpr();
    const mx = magnetX_frac * lw;  // magnet X in logical px
    const my = lh / 2;
    const poleSep = lw * 0.07;    // half-distance between poles

    // Draw field lines (dipole approximation)
    ctx.save();
    ctx.strokeStyle = 'rgba(96,165,250,0.45)';
    ctx.lineWidth = 1.2;
    ctx.shadowColor = '#60a5fa';
    ctx.shadowBlur = 4;

    const nLines = 8;
    for (let i = 0; i < nLines; i++) {
        const angle0 = (i / nLines) * Math.PI * 2;
        drawDipoleLine(ctx, mx, my, poleSep, angle0, lw, lh);
    }
    ctx.restore();

    // Draw bar magnet
    const mw = lw * 0.13, mh = lh * 0.18;
    const mx0 = mx - mw / 2, my0 = my - mh / 2;

    // N pole (red)
    ctx.save();
    ctx.fillStyle = '#ef4444';
    ctx.shadowColor = '#ef4444'; ctx.shadowBlur = 10;
    ctx.beginPath();
    ctx.roundRect(mx0, my0, mw / 2, mh, [6, 0, 0, 6]);
    ctx.fill();
    ctx.fillStyle = '#fff'; ctx.shadowBlur = 0;
    ctx.font = `bold ${Math.round(14 * lw / 600)}px Outfit`;
    ctx.textAlign = 'center';
    ctx.fillText('N', mx - mw / 4, my + 5);

    // S pole (blue)
    ctx.fillStyle = '#3b82f6';
    ctx.shadowColor = '#3b82f6'; ctx.shadowBlur = 10;
    ctx.beginPath();
    ctx.roundRect(mx, my0, mw / 2, mh, [0, 6, 6, 0]);
    ctx.fill();
    ctx.fillStyle = '#fff'; ctx.shadowBlur = 0;
    ctx.fillText('S', mx + mw / 4, my + 5);
    ctx.restore();
}

function drawDipoleLine(ctx, mx, my, r, angle0, lw, lh) {
    ctx.beginPath();
    // Parametric dipole field line sampling
    let x = mx + r * Math.cos(angle0);
    let y = my + r * Math.sin(angle0);
    ctx.moveTo(x, y);

    for (let step = 0; step < 300; step++) {
        const dx = x - mx, dy = y - my;
        const dist2 = dx * dx + dy * dy;
        const dist = Math.sqrt(dist2) || 0.01;
        const dist3 = dist * dist * dist;
        // Dipole field direction (unit vector)
        const r_hat_x = dx / dist, r_hat_y = dy / dist;
        const cos_t = r_hat_x; // along x-axis
        const Bx = (3 * cos_t * r_hat_x - 1) / dist3;
        const By = (3 * cos_t * r_hat_y) / dist3;
        const Bmag = Math.sqrt(Bx * Bx + By * By) || 0.01;
        const stepLen = Math.min(8, 200 / (dist3 * 0.01 + 1));
        x += (Bx / Bmag) * stepLen;
        y += (By / Bmag) * stepLen;

        if (x < -lw * 0.5 || x > lw * 1.5 || y < -lh * 0.5 || y > lh * 1.5) break;
        if (dist < r * 0.4) break;
        ctx.lineTo(x, y);
    }
    ctx.stroke();
}

// ── Coil rendering (2D Side View with slight perspective) ──────────────────
function drawCoil(angleDeg) {
    const s = window.simState;
    const lw = W / dpr(), lh = H / dpr();
    const N = s.coilType === 'bobina' ? s.N : 1;

    // Coil centre at ~42% from left, vertically centred
    const coilX = lw * 0.42;
    const coilY = lh / 2;

    const alpha = (angleDeg % 360) * Math.PI / 180;
    const coilLen = lh * 0.56;

    // Perspective properties
    const rx = 12; // Small fixed width to show "curvilinear" geometry
    const ry = coilLen / 2;
    const coilThick = N > 1 ? Math.min(40, N * 4) : 4;

    // Segment endpoints for reference (the axis of the coil)
    const x1 = coilX - ry * Math.sin(alpha);
    const y1 = coilY - ry * Math.cos(alpha);
    const x2 = coilX + ry * Math.sin(alpha);
    const y2 = coilY + ry * Math.cos(alpha);

    ctx.save();
    ctx.translate(coilX, coilY);
    ctx.rotate(-alpha); // Rotate coordinate system so coil is vertical in local space

    ctx.lineCap = 'round';
    ctx.lineJoin = 'round';

    // Draw the coil
    if (N > 1) {
        // Stack of loops
        const stackStep = coilThick / N;
        for (let i = 0; i < N; i++) {
            const hOff = (i - (N - 1) / 2) * stackStep;
            const cAlpha = 0.4 + 0.6 * (1 - i / N);

            ctx.save();
            ctx.shadowColor = '#a78bfa';
            ctx.shadowBlur = 8;
            ctx.strokeStyle = `rgba(167,139,250,${cAlpha})`;
            ctx.lineWidth = 3;
            ctx.beginPath();
            ctx.ellipse(hOff, 0, rx, ry, 0, 0, Math.PI * 2);
            ctx.stroke();
            ctx.restore();
        }
    } else {
        // Single espira: more glow and detail
        ctx.strokeStyle = '#a78bfa';
        ctx.lineWidth = 5;
        ctx.shadowColor = '#a78bfa';
        ctx.shadowBlur = 15;
        ctx.beginPath();
        ctx.ellipse(0, 0, rx, ry, 0, 0, Math.PI * 2);
        ctx.stroke();

        // Highlight on the edge
        ctx.strokeStyle = 'rgba(255,255,255,0.3)';
        ctx.lineWidth = 1.5;
        ctx.shadowBlur = 0;
        ctx.beginPath();
        ctx.ellipse(0, 0, rx, ry, 0, -Math.PI / 2, Math.PI / 2);
        ctx.stroke();
    }
    ctx.restore();

    // ── Normal vector n̂ ──────────────────────────────────────────────────────
    // Still perpendicular to the main plane
    const nLen = lh * 0.22;
    const nxEnd = coilX + nLen * Math.cos(alpha);
    const nyEnd = coilY - nLen * Math.sin(alpha);
    drawArrow(coilX, coilY, nxEnd, nyEnd, '#f472b6', 2.5, 'n̂', 10);

    // ── Induced current indicators (Dot/Cross) ───────────────────────────────
    if (Math.abs(s.dPhiDt) > 1e-5) {
        const dPhi = s.dPhiDt;
        const topOut = dPhi > 0;

        // Position indicators at the tips of the loop geometry
        drawCurrentIndicator(x1, y1, topOut);
        drawCurrentIndicator(x2, y2, !topOut);

        ctx.save();
        ctx.font = 'bold 12px Outfit';
        ctx.fillStyle = '#34d399';
        ctx.fillText('I', x1 - 25, y1 - 25);
        ctx.restore();
    }

    return { coilX, coilY, x1, y1, x2, y2 };
}

function drawCurrentIndicator(x, y, isDot) {
    const size = 12;
    ctx.save();
    ctx.strokeStyle = '#34d399';
    ctx.fillStyle = '#34d399';
    ctx.lineWidth = 2;
    ctx.shadowColor = '#34d399';
    ctx.shadowBlur = 8;

    // Circle
    ctx.beginPath();
    ctx.arc(x, y, size, 0, Math.PI * 2);
    ctx.stroke();

    if (isDot) {
        // Dot (current out of page)
        ctx.beginPath();
        ctx.arc(x, y, 3, 0, Math.PI * 2);
        ctx.fill();
    } else {
        // Cross (current into page)
        const s = size * 0.5;
        ctx.beginPath();
        ctx.moveTo(x - s, y - s); ctx.lineTo(x + s, y + s);
        ctx.moveTo(x + s, y - s); ctx.lineTo(x - s, y + s);
        ctx.stroke();
    }
    ctx.restore();
}

// ── Alpha angle arc display ──────────────────────────────────────────────────
function drawAngleArc(coilX, coilY, angleDeg) {
    if (angleDeg < 1) return;
    const lw = W / dpr();
    const arcR = lw * 0.055;
    const alphaRad = (angleDeg * Math.PI) / 180;

    ctx.save();
    ctx.strokeStyle = 'rgba(251,191,36,0.7)';
    ctx.lineWidth = 1.5;
    ctx.setLineDash([3, 3]);

    // Draw arc from horizontal (B field direction) to the normal n̂
    // B is at 0 rad. n̂ is at -alphaRad.
    ctx.beginPath();
    ctx.arc(coilX, coilY, arcR, -alphaRad, 0);
    ctx.stroke();

    ctx.setLineDash([]);
    ctx.fillStyle = 'rgba(251,191,36,0.9)';
    ctx.font = `${Math.round(11 * lw / 600)}px Outfit`;
    ctx.textAlign = 'left';
    ctx.fillText('α = ' + angleDeg.toFixed(0) + '°', coilX + arcR + 10, coilY - 10);
    ctx.restore();
}

// ── Flux fill (2D Segment Glow) ──────────────────────────────────────────────
function drawFluxFill(coilX, coilY, x1, y1, x2, y2, fluxNorm) {
    const absFlux = Math.abs(fluxNorm);
    if (absFlux < 0.01) return;

    const alpha = absFlux * 0.4;
    const color = fluxNorm >= 0 ? '#fbbf24' : '#f87171';

    ctx.save();
    ctx.strokeStyle = color;
    ctx.globalAlpha = alpha;
    ctx.lineWidth = 20; // Thick glow
    ctx.lineCap = 'round';
    ctx.shadowColor = color;
    ctx.shadowBlur = 20;
    ctx.beginPath();
    ctx.moveTo(x1, y1);
    ctx.lineTo(x2, y2);
    ctx.stroke();
    ctx.restore();
}

// ── B field vector ──────────────────────────────────────────────────────────
function drawBVector(coilX, coilY) {
    const lw = W / dpr(), lh = H / dpr();
    const bLen = lw * 0.18;
    const bx = coilX - bLen / 2;
    const by = coilY;
    drawArrow(bx, by, bx + bLen, by, '#60a5fa', 3, 'B', 12);
}

// ── Main draw ────────────────────────────────────────────────────────────────
function draw() {
    const s = window.simState;
    const lw = W / dpr(), lh = H / dpr();

    ctx.clearRect(0, 0, lw, lh);

    // Grid subtle
    ctx.save();
    ctx.strokeStyle = 'rgba(255,255,255,0.02)';
    ctx.lineWidth = 1;
    const step = lw / 12;
    for (let x = 0; x < lw; x += step) { ctx.beginPath(); ctx.moveTo(x, 0); ctx.lineTo(x, lh); ctx.stroke(); }
    for (let y = 0; y < lh; y += step) { ctx.beginPath(); ctx.moveTo(0, y); ctx.lineTo(lw, y); ctx.stroke(); }
    ctx.restore();

    // Field lines behind coil
    if (s.fieldType === 'uniform') {
        drawUniformField(s.B);
    } else {
        drawMagnetField(s.magnetX);
    }

    // Coil
    const { coilX, coilY, x1, y1, x2, y2 } = drawCoil(s.angleDeg);

    // Flux fill (Glow)
    const fluxNorm = s.flux / (s.B * s.A + 0.001);
    drawFluxFill(coilX, coilY, x1, y1, x2, y2, fluxNorm);

    // B vector
    if (s.fieldType === 'uniform') {
        drawBVector(coilX, coilY);
    }

    // Angle arc
    drawAngleArc(coilX, coilY, s.angleDeg % 360);

    // Flux value overlay
    ctx.save();
    ctx.font = `bold ${Math.round(13 * lw / 600)}px JetBrains Mono`;
    ctx.fillStyle = '#fbbf24';
    ctx.shadowColor = '#fbbf24'; ctx.shadowBlur = 8;
    ctx.fillText(`Φ = ${s.fluxBobina.toFixed(4)} Wb`, lw * 0.02, lh * 0.07);
    if (s.emf > 0.0001) {
        ctx.fillStyle = '#f87171'; ctx.shadowColor = '#f87171';
        ctx.fillText(`|ε| = ${s.emf.toFixed(4)} V`, lw * 0.02, lh * 0.13);
    }
    ctx.restore();
}

// ── Magnet drag interaction ──────────────────────────────────────────────────
let dragging = false;
let dragStartX = 0;
let dragStartMag = 0;

canvas.addEventListener('mousedown', e => {
    if (window.simState.fieldType !== 'magnet') return;
    const rect = canvas.getBoundingClientRect();
    const lx = (e.clientX - rect.left) / rect.width;
    const lw = W / dpr();
    // Check if click near magnet
    const mFrac = window.simState.magnetX;
    if (Math.abs(lx - mFrac) < 0.12) {
        dragging = true;
        dragStartX = e.clientX;
        dragStartMag = mFrac;
        canvas.style.cursor = 'grabbing';
    }
});

canvas.addEventListener('mousemove', e => {
    if (!dragging) return;
    const rect = canvas.getBoundingClientRect();
    const dx = (e.clientX - dragStartX) / rect.width;
    window.simState.magnetX = Math.max(0.05, Math.min(0.95, dragStartMag + dx));
    window.updateSim();
});

canvas.addEventListener('mouseup', () => { dragging = false; canvas.style.cursor = ''; });
canvas.addEventListener('mouseleave', () => { dragging = false; canvas.style.cursor = ''; });

// Touch events for magnet drag
canvas.addEventListener('touchstart', e => {
    if (window.simState.fieldType !== 'magnet') return;
    const touch = e.touches[0];
    const rect = canvas.getBoundingClientRect();
    const lx = (touch.clientX - rect.left) / rect.width;
    const mFrac = window.simState.magnetX;
    if (Math.abs(lx - mFrac) < 0.15) {
        dragging = true;
        dragStartX = touch.clientX;
        dragStartMag = mFrac;
    }
}, { passive: true });

canvas.addEventListener('touchmove', e => {
    if (!dragging) return;
    const touch = e.touches[0];
    const rect = canvas.getBoundingClientRect();
    const dx = (touch.clientX - dragStartX) / rect.width;
    window.simState.magnetX = Math.max(0.05, Math.min(0.95, dragStartMag + dx));
    window.updateSim();
}, { passive: true });

canvas.addEventListener('touchend', () => { dragging = false; });

// Initial draw
computePhysics();
updateUI();
draw();
