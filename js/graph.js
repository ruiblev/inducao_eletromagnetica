/**
 * graph.js – Real-time Φ(t) and ε(t) canvas chart
 */
'use strict';

const gCanvas = document.getElementById('graphCanvas');
const gCtx = gCanvas.getContext('2d');

const GRAPH_WINDOW = 8; // seconds to show

function setGraphSize() {
    const rect = gCanvas.parentElement.getBoundingClientRect();
    const w = Math.floor(rect.width - 40); // account for card padding
    gCanvas.width = Math.max(w, 200) * devicePixelRatio;
    gCanvas.height = 220 * devicePixelRatio;
    gCanvas.style.width = Math.max(w, 200) + 'px';
    gCanvas.style.height = '220px';
}

window.addEventListener('resize', () => { setGraphSize(); window.graphDraw(); });
setGraphSize();

window.graphDraw = function () {
    const history = window.simState.history;
    const gW = gCanvas.width / devicePixelRatio;
    const gH = gCanvas.height / devicePixelRatio;

    gCtx.scale(devicePixelRatio, devicePixelRatio);

    gCtx.clearRect(0, 0, gW, gH);

    // Background
    gCtx.fillStyle = '#0a0b14';
    gCtx.fillRect(0, 0, gW, gH);

    const PAD = { top: 20, right: 16, bottom: 28, left: 48 };
    const PW = gW - PAD.left - PAD.right;
    const PH = gH - PAD.top - PAD.bottom;

    // Grid
    gCtx.strokeStyle = 'rgba(255,255,255,0.05)';
    gCtx.lineWidth = 1;
    gCtx.setLineDash([3, 4]);
    const nHLines = 5;
    for (let i = 0; i <= nHLines; i++) {
        const y = PAD.top + (PH / nHLines) * i;
        gCtx.beginPath(); gCtx.moveTo(PAD.left, y); gCtx.lineTo(PAD.left + PW, y); gCtx.stroke();
    }
    const nVLines = 4;
    for (let i = 0; i <= nVLines; i++) {
        const x = PAD.left + (PW / nVLines) * i;
        gCtx.beginPath(); gCtx.moveTo(x, PAD.top); gCtx.lineTo(x, PAD.top + PH); gCtx.stroke();
    }
    gCtx.setLineDash([]);

    if (history.length < 2) {
        // placeholder message
        gCtx.fillStyle = 'rgba(160,160,192,0.4)';
        gCtx.font = '12px Outfit';
        gCtx.textAlign = 'center';
        gCtx.fillText('Sem dados — move o ângulo ou clica ▶', gW / 2, gH / 2);
        gCtx.scale(1 / devicePixelRatio, 1 / devicePixelRatio);
        return;
    }

    // Time window
    const tMax = history[history.length - 1].t;
    const tMin = Math.max(0, tMax - GRAPH_WINDOW);

    // Value ranges
    let phiMin = Infinity, phiMax = -Infinity;
    let emfMax = -Infinity;
    for (const pt of history) {
        if (pt.t < tMin) continue;
        phiMin = Math.min(phiMin, pt.phi);
        phiMax = Math.max(phiMax, pt.phi);
        emfMax = Math.max(emfMax, pt.emf);
    }
    const phiRange = phiMax - phiMin || 0.01;
    const emfRange = emfMax || 0.01;

    // Draw Φ trace
    drawTrace(history, tMin, tMax, PW, PH, PAD,
        pt => pt.phi, phiMin, phiMax, '#fbbf24', 2);

    // Draw ε trace (secondary axis, scaled separately)
    drawTrace(history, tMin, tMax, PW, PH, PAD,
        pt => pt.emf, 0, emfRange * 1.2, 'rgba(248,113,113,0.85)', 2);

    // Axes
    gCtx.strokeStyle = 'rgba(255,255,255,0.15)';
    gCtx.lineWidth = 1;
    gCtx.setLineDash([]);
    gCtx.beginPath();
    gCtx.moveTo(PAD.left, PAD.top); gCtx.lineTo(PAD.left, PAD.top + PH);
    gCtx.moveTo(PAD.left, PAD.top + PH); gCtx.lineTo(PAD.left + PW, PAD.top + PH);
    gCtx.stroke();

    // Zero line
    if (phiMin < 0 && phiMax > 0) {
        const zeroY = PAD.top + PH - ((0 - phiMin) / phiRange) * PH;
        gCtx.strokeStyle = 'rgba(255,255,255,0.12)';
        gCtx.setLineDash([4, 4]);
        gCtx.beginPath(); gCtx.moveTo(PAD.left, zeroY); gCtx.lineTo(PAD.left + PW, zeroY); gCtx.stroke();
        gCtx.setLineDash([]);
    }

    // Y-axis labels (Φ)
    gCtx.fillStyle = '#fbbf24';
    gCtx.font = '10px JetBrains Mono';
    gCtx.textAlign = 'right';
    for (let i = 0; i <= 4; i++) {
        const val = phiMin + (phiRange * i / 4);
        const y = PAD.top + PH - (PH * i / 4);
        gCtx.fillText(val.toFixed(3), PAD.left - 4, y + 4);
    }

    // Y-axis label
    gCtx.save();
    gCtx.fillStyle = '#a0a0c0';
    gCtx.font = '10px Outfit';
    gCtx.textAlign = 'center';
    gCtx.translate(10, PAD.top + PH / 2);
    gCtx.rotate(-Math.PI / 2);
    gCtx.fillText('Φ / ε', 0, 0);
    gCtx.restore();

    // X-axis tick labels
    gCtx.fillStyle = '#6b6b8a';
    gCtx.font = '10px JetBrains Mono';
    gCtx.textAlign = 'center';
    for (let i = 0; i <= nVLines; i++) {
        const t = tMin + (GRAPH_WINDOW * i / nVLines);
        const x = PAD.left + PW * (i / nVLines);
        gCtx.fillText(t.toFixed(1) + 's', x, PAD.top + PH + 18);
    }

    // Current Φ and ε readout
    const last = history[history.length - 1];
    const graphInfo = document.getElementById('graph-info');
    if (graphInfo) {
        graphInfo.textContent =
            `t = ${last.t.toFixed(2)} s  |  Φ = ${last.phi.toFixed(4)} Wb  |  |ε| = ${last.emf.toFixed(4)} V`;
    }

    gCtx.scale(1 / devicePixelRatio, 1 / devicePixelRatio);
};

function drawTrace(history, tMin, tMax, PW, PH, PAD, valFn, vMin, vMax, color, lw) {
    const tRange = tMax - tMin || 1;
    const vRange = vMax - vMin || 0.01;
    let first = true;

    gCtx.save();
    gCtx.strokeStyle = color;
    gCtx.lineWidth = lw;
    gCtx.shadowColor = color;
    gCtx.shadowBlur = 6;
    gCtx.setLineDash([]);
    gCtx.beginPath();

    for (const pt of history) {
        if (pt.t < tMin) continue;
        const x = PAD.left + ((pt.t - tMin) / tRange) * PW;
        const y = PAD.top + PH - ((valFn(pt) - vMin) / vRange) * PH;
        if (first) { gCtx.moveTo(x, y); first = false; }
        else { gCtx.lineTo(x, y); }
    }
    gCtx.stroke();
    gCtx.restore();
}

// Clear button
document.getElementById('btn-clear-graph').addEventListener('click', () => {
    window.simState.history = [];
    window.simState.t = 0;
    window.graphDraw();
});

window.graphDraw();
