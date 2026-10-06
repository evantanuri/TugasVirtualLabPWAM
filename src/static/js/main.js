/**
 * MAIN.JS — Inisialisasi dan Orkestrasi Virtual Lab Fisika TPB ITB
 */

import { PhysicsEngine } from './physics.js';
import { CanvasRenderer } from './canvas.js';
import { ControlsManager } from './controls.js';
import { TelemetryDashboard } from './telemetry.js';

document.addEventListener('DOMContentLoaded', () => {
  const canvasElement = document.getElementById('simCanvas');
  const renderer = new CanvasRenderer(canvasElement);
  const physics = new PhysicsEngine();
  const telemetry = new TelemetryDashboard();

  let state = {
    angleDeg: 45,
    v0: 45,
    y0: 0,
    g: 9.81,
    isFiring: false,
    isPaused: false,
    currentTime: 0,
    trajectoryPoints: [],
  };

  // Initial render
  function renderScene() {
    renderer.clear();
    renderer.drawBackground();
    renderer.drawCastle(210, 40);
    renderer.drawTrajectoryTrail(state.trajectoryPoints);
    renderer.drawCannon(state.angleDeg, state.y0);
  }

  // Setup controls listener
  new ControlsManager({
    onParameterChange: (params) => {
      state = { ...state, ...params };
      physics.setParameters(params);
      renderScene();
    },
    onFire: () => {
      state.isFiring = true;
      state.currentTime = 0;
      state.trajectoryPoints = [];
    },
    onPause: () => {
      state.isPaused = !state.isPaused;
    },
    onReset: () => {
      state.isFiring = false;
      state.currentTime = 0;
      state.trajectoryPoints = [];
      telemetry.reset();
      renderScene();
    },
    onAmmoLoaded: (ammoType) => {
      console.log(`Amunisi dimuat: ${ammoType}`);
    },
  });

  // Modal event bindings
  const btnHelp = document.getElementById('btnHelp');
  const labModal = document.getElementById('labModal');
  const modalClose = document.getElementById('modalClose');
  const modalActionBtn = document.getElementById('modalActionBtn');

  btnHelp?.addEventListener('click', () => labModal?.classList.remove('hidden'));
  modalClose?.addEventListener('click', () => labModal?.classList.add('hidden'));
  modalActionBtn?.addEventListener('click', () => labModal?.classList.add('hidden'));

  // First draw
  renderScene();
});
