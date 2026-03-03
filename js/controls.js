/**
 * controls.js – Binds all UI controls to simulation state
 */
'use strict';

const s = window.simState;

// ── Field type selector ──────────────────────────────────────────────────────
const selField = document.getElementById('sel-field');
selField.addEventListener('change', () => {
    s.fieldType = selField.value;
    const hint = document.getElementById('magnet-hint');
    if (s.fieldType === 'magnet') {
        hint.style.display = 'block';
        // Disable angle slider (magnet mode uses drag)
        document.getElementById('sl-angle').disabled = false;
    } else {
        hint.style.display = 'none';
    }
    window.updateSim();
});

// ── Coil type selector ───────────────────────────────────────────────────────
const selCoil = document.getElementById('sel-coil');
const nTurnsGrp = document.getElementById('n-turns-group');
selCoil.addEventListener('change', () => {
    s.coilType = selCoil.value;
    nTurnsGrp.style.display = s.coilType === 'bobina' ? 'flex' : 'none';
    window.updateSim();
});

// ── N turns slider ───────────────────────────────────────────────────────────
const slTurns = document.getElementById('sl-turns');
slTurns.addEventListener('input', () => {
    s.N = parseInt(slTurns.value);
    document.getElementById('lbl-turns').textContent = s.N;
    updateSliderFill(slTurns, 1, 20);
    window.updateSim();
});

// ── Angle slider ─────────────────────────────────────────────────────────────
const slAngle = document.getElementById('sl-angle');
slAngle.addEventListener('input', () => {
    if (s.animating) return; // slider driven by animation
    s.angleDeg = parseFloat(slAngle.value);
    // advance time slightly for dΦ/dt computation
    s.t += 0.05;
    updateSliderFill(slAngle, 0, 360);
    window.updateSim();
});

// ── B intensity slider ───────────────────────────────────────────────────────
const slB = document.getElementById('sl-B');
slB.addEventListener('input', () => {
    s.B = parseFloat(slB.value);
    updateSliderFill(slB, 0.1, 5);
    window.updateSim();
});
updateSliderFill(slB, 0.1, 5);

// ── Area slider ──────────────────────────────────────────────────────────────
const slA = document.getElementById('sl-A');
slA.addEventListener('input', () => {
    s.A = parseFloat(slA.value);
    updateSliderFill(slA, 0.01, 1);
    window.updateSim();
});
updateSliderFill(slA, 0.01, 1);

// ── Rotation speed slider ────────────────────────────────────────────────────
const slSpeed = document.getElementById('sl-speed');
slSpeed.addEventListener('input', () => {
    s.omega = parseFloat(slSpeed.value);
    document.getElementById('lbl-speed').textContent = s.omega.toFixed(1);
    updateSliderFill(slSpeed, 0.1, 5);
});
updateSliderFill(slSpeed, 0.1, 5);

// ── Play / Pause button ──────────────────────────────────────────────────────
const btnPlay = document.getElementById('btn-play');
const icoPlay = document.getElementById('ico-play');
const icoPause = document.getElementById('ico-pause');

btnPlay.addEventListener('click', () => {
    if (s.animating) {
        window.stopAnimation();
        btnPlay.classList.remove('playing');
        icoPlay.style.display = '';
        icoPause.style.display = 'none';
    } else {
        window.startAnimation();
        btnPlay.classList.add('playing');
        icoPlay.style.display = 'none';
        icoPause.style.display = '';
    }
});

// ── Reset button ─────────────────────────────────────────────────────────────
document.getElementById('btn-reset').addEventListener('click', () => {
    window.stopAnimation();
    btnPlay.classList.remove('playing');
    icoPlay.style.display = '';
    icoPause.style.display = 'none';

    s.angleDeg = 0;
    s.t = 0;
    s.prevFlux = null;
    s.prevT = null;
    s.dPhiDt = 0;
    s.emf = 0;
    s.history = [];
    slAngle.value = 0;
    updateSliderFill(slAngle, 0, 360);

    window.updateSim();
    window.graphDraw();
});

// ── Slider fill helper ───────────────────────────────────────────────────────
function updateSliderFill(el, min, max) {
    const pct = ((parseFloat(el.value) - min) / (max - min)) * 100;
    el.style.setProperty('--pct', pct.toFixed(1) + '%');
}

// ── Keyboard shortcuts ───────────────────────────────────────────────────────
document.addEventListener('keydown', e => {
    if (e.target.tagName === 'INPUT') return;
    switch (e.key) {
        case ' ':
            e.preventDefault();
            btnPlay.click();
            break;
        case 'ArrowRight':
            e.preventDefault();
            if (!s.animating) {
                s.angleDeg = (s.angleDeg + 5) % 360;
                slAngle.value = s.angleDeg;
                s.t += 0.05;
                updateSliderFill(slAngle, 0, 360);
                window.updateSim();
            }
            break;
        case 'ArrowLeft':
            e.preventDefault();
            if (!s.animating) {
                s.angleDeg = (s.angleDeg - 5 + 360) % 360;
                slAngle.value = s.angleDeg;
                s.t += 0.05;
                updateSliderFill(slAngle, 0, 360);
                window.updateSim();
            }
            break;
        case 'r':
        case 'R':
            document.getElementById('btn-reset').click();
            break;
    }
});

// ── Initial slider fills ─────────────────────────────────────────────────────
updateSliderFill(slAngle, 0, 360);
updateSliderFill(slTurns, 1, 20);

// ── Tooltip: show keyboard shortcuts ──────────────────────────────────────
const shortcutHint = document.createElement('div');
shortcutHint.style.cssText = `
  position:fixed; bottom:14px; right:18px;
  background:rgba(15,16,33,0.85); backdrop-filter:blur(8px);
  border:1px solid rgba(124,111,247,0.2); border-radius:8px;
  padding:8px 14px; font-size:0.7rem; color:#6b6b8a;
  font-family:'Outfit',sans-serif; pointer-events:none;
  line-height:1.7;
`;
shortcutHint.innerHTML =
    '⌨ <strong style="color:#a0a0c0">Atalhos:</strong> &nbsp;Space = ▶/⏸ &nbsp;· &nbsp;← → = rotação manual &nbsp;· &nbsp;R = reiniciar';
document.body.appendChild(shortcutHint);
