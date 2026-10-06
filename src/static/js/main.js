/**
 * MAIN.JS — Inisialisasi, Orkestrasi Loop 60 FPS & Audio Prosedural Virtual Lab TPB ITB
 * Mengintegrasikan ControlsManager, CanvasRenderer, PhysicsEngine, dan TelemetryManager.
 * Dilengkapi Web Audio API prosedural (bebas aset eksternal) dan offline auto-fallback transparan.
 */

import { PhysicsEngine } from './physics.js';
import { CanvasRenderer } from './canvas.js';
import { ControlsManager } from './controls.js';
import { TelemetryManager } from './telemetry.js';

/**
 * Sintesis Audio Prosedural Web Audio API
 * Menghasilkan efek suara tembakan meriam & ledakan tumbukan tanpa file eksternal
 */
class ProceduralAudio {
  constructor() {
    this.audioCtx = null;
    this.muted = false;
  }

  ensureContext() {
    if (!this.audioCtx) {
      const AudioCtxClass = window.AudioContext || window.webkitAudioContext;
      if (AudioCtxClass) {
        this.audioCtx = new AudioCtxClass();
      }
    }
    if (this.audioCtx && this.audioCtx.state === 'suspended') {
      this.audioCtx.resume();
    }
  }

  /**
   * Suara tembakan meriam: low-pass bass thud + ledakan white noise moncong
   */
  playCannonFire() {
    if (this.muted) return;
    try {
      this.ensureContext();
      if (!this.audioCtx) return;

      const t = this.audioCtx.currentTime;

      // 1. Osilator Bass Dentuman (Triangle wave sweeping down)
      const osc = this.audioCtx.createOscillator();
      const oscGain = this.audioCtx.createGain();
      osc.type = 'triangle';
      osc.frequency.setValueAtTime(150, t);
      osc.frequency.exponentialRampToValueAtTime(32, t + 0.32);

      oscGain.gain.setValueAtTime(0.85, t);
      oscGain.gain.exponentialRampToValueAtTime(0.001, t + 0.32);

      osc.connect(oscGain);
      oscGain.connect(this.audioCtx.destination);
      osc.start(t);
      osc.stop(t + 0.32);

      // 2. Kepulan Muzzle Blast (White Noise terfilter)
      const bufferSize = Math.floor(this.audioCtx.sampleRate * 0.22);
      const buffer = this.audioCtx.createBuffer(1, bufferSize, this.audioCtx.sampleRate);
      const data = buffer.getChannelData(0);
      for (let i = 0; i < bufferSize; i++) {
        data[i] = Math.random() * 2 - 1;
      }

      const noise = this.audioCtx.createBufferSource();
      noise.buffer = buffer;

      const filter = this.audioCtx.createBiquadFilter();
      filter.type = 'lowpass';
      filter.frequency.setValueAtTime(800, t);
      filter.frequency.exponentialRampToValueAtTime(100, t + 0.22);

      const noiseGain = this.audioCtx.createGain();
      noiseGain.gain.setValueAtTime(0.65, t);
      noiseGain.gain.exponentialRampToValueAtTime(0.001, t + 0.22);

      noise.connect(filter);
      filter.connect(noiseGain);
      noiseGain.connect(this.audioCtx.destination);
      noise.start(t);
      noise.stop(t + 0.22);
    } catch {
      // Audio fallback diam tanpa error console
    }
  }

  /**
   * Suara ledakan tumbukan benteng (resonan tebal) atau tanah (dull thud)
   */
  playExplosion(isCastleHit = true) {
    if (this.muted) return;
    try {
      this.ensureContext();
      if (!this.audioCtx) return;

      const t = this.audioCtx.currentTime;
      const duration = isCastleHit ? 0.75 : 0.45;

      // Noise generator untuk derau ledakan batu/tanah
      const bufferSize = Math.floor(this.audioCtx.sampleRate * duration);
      const buffer = this.audioCtx.createBuffer(1, bufferSize, this.audioCtx.sampleRate);
      const data = buffer.getChannelData(0);
      for (let i = 0; i < bufferSize; i++) {
        data[i] = Math.random() * 2 - 1;
      }

      const noise = this.audioCtx.createBufferSource();
      noise.buffer = buffer;

      const filter = this.audioCtx.createBiquadFilter();
      filter.type = 'lowpass';
      filter.frequency.setValueAtTime(isCastleHit ? 650 : 380, t);
      filter.frequency.exponentialRampToValueAtTime(50, t + duration);

      const gain = this.audioCtx.createGain();
      gain.gain.setValueAtTime(isCastleHit ? 0.95 : 0.55, t);
      gain.gain.exponentialRampToValueAtTime(0.001, t + duration);

      noise.connect(filter);
      filter.connect(gain);
      gain.connect(this.audioCtx.destination);
      noise.start(t);
      noise.stop(t + duration);

      // Sub-bass resonance rumble
      const sub = this.audioCtx.createOscillator();
      const subGain = this.audioCtx.createGain();
      sub.type = 'sine';
      sub.frequency.setValueAtTime(isCastleHit ? 95 : 65, t);
      sub.frequency.exponentialRampToValueAtTime(25, t + duration);

      subGain.gain.setValueAtTime(isCastleHit ? 0.7 : 0.4, t);
      subGain.gain.exponentialRampToValueAtTime(0.001, t + duration);

      sub.connect(subGain);
      subGain.connect(this.audioCtx.destination);
      sub.start(t);
      sub.stop(t + duration);
    } catch {
      // Audio fallback diam tanpa error console
    }
  }
}

/**
 * Inisialisasi Aplikasi Utama Virtual Lab TPB ITB
 */
document.addEventListener('DOMContentLoaded', () => {
  const canvasElement = document.getElementById('simCanvas');
  const renderer = new CanvasRenderer(canvasElement);
  const physics = new PhysicsEngine();
  const telemetry = new TelemetryManager();
  const audio = new ProceduralAudio();

  // Massa amunisi berdasarkan jenis
  const AMMO_MASS_MAP = {
    iron: 10.0,
    lead: 25.0,
    light: 2.0,
  };

  // State terpusat aplikasi
  const state = {
    // Parameter fisika
    angleDeg: 45,
    v0: 45,
    y0: 0,
    g: 9.81,
    mass: 10.0,
    currentAmmo: 'iron',
    airResistance: false,
    dragCoefficient: 0.47,

    // Sasaran benteng
    targetDistance: 210, // meter
    targetHeight: 40, // meter
    targetTolerance: 5.0, // meter

    // State simulasi gerak
    isFiring: false,
    isPaused: false,
    projectile: {
      x: 0,
      y: 0,
      vx: 0,
      vy: 0,
      v: 0,
      time: 0,
      hMax: 0,
    },

    // Riwayat lintasan
    currentTrajectory: [],
    trailHistory: [],

    // Partikel internal cadangan (jika renderer tidak memilikinya)
    particles: [],
    shakeFrames: 0,

    // Data analitik saat ini
    analyticalMetrics: null,
  };

  // Hitung metrik analitik awal
  state.analyticalMetrics = physics.calculateAnalytical({
    v0: state.v0,
    angleDeg: state.angleDeg,
    y0: state.y0,
    g: state.g,
  });

  /**
   * Render seluruh scene kanvas 2D
   */
  function renderScene() {
    if (typeof renderer.drawScene === 'function') {
      renderer.drawScene({
        targetDistance: state.targetDistance,
        targetElevation: state.targetHeight,
        trailHistory: state.trailHistory,
        trajectoryPoints: state.currentTrajectory,
        angleDeg: state.angleDeg,
        y0: state.y0,
        projectile: state.isFiring && state.projectile.y >= 0 ? state.projectile : null,
      });
      return;
    }

    // Fallback rendering manual jika drawScene tidak ada
    const ctx = renderer.ctx;
    renderer.clear();
    renderer.drawBackground();
    renderer.drawCastle(state.targetDistance, state.targetHeight);

    if (typeof renderer.drawTrajectoryHistory === 'function') {
      renderer.drawTrajectoryHistory(state.trailHistory);
    } else {
      state.trailHistory.forEach((trail) => {
        renderer.drawTrajectoryTrail(trail);
      });
    }

    renderer.drawTrajectoryTrail(state.currentTrajectory);
    renderer.drawCannon(state.angleDeg, state.y0);

    if (state.isFiring && state.projectile.y >= 0) {
      if (typeof renderer.drawProjectile === 'function') {
        renderer.drawProjectile(state.projectile.x, state.projectile.y, 7, true);
      } else {
        const projPixelX = renderer.originX + state.projectile.x * renderer.scale;
        const projPixelY = renderer.groundY - state.projectile.y * renderer.scale;
        ctx.save();
        ctx.beginPath();
        ctx.arc(projPixelX, projPixelY, 7, 0, Math.PI * 2);
        ctx.fillStyle = '#1e293b';
        ctx.fill();
        ctx.lineWidth = 1.5;
        ctx.strokeStyle = '#94a3b8';
        ctx.stroke();
        ctx.restore();
      }
    }

    if (typeof renderer.drawParticles === 'function') {
      renderer.drawParticles();
    }
  }

  /**
   * Fallback kalkulasi analitik dengan prioritas API Flask
   * Jika server offline, langsung beralih ke PhysicsEngine lokal tanpa error
   */
  async function fetchOrCalculateAnalytical() {
    try {
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 1200);

      const res = await fetch('/api/calculate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          v0: state.v0,
          angle: state.angleDeg,
          y0: state.y0,
          g: state.g,
          initial_velocity: state.v0,
          launch_angle: state.angleDeg,
          initial_height: state.y0,
          gravity: state.g,
          projectile_mass: state.mass,
          air_resistance: state.airResistance,
          drag_coefficient: state.dragCoefficient,
        }),
        signal: controller.signal,
      });
      clearTimeout(timeoutId);

      if (res.ok) {
        const json = await res.json();
        return json.data || json;
      }
    } catch {
      // Graceful offline fallback
    }

    return physics.calculateAnalytical({
      v0: state.v0,
      angleDeg: state.angleDeg,
      y0: state.y0,
      g: state.g,
    });
  }

  /**
   * Verifikasi tantangan benteng dengan prioritas API dan auto-fallback lokal
   */
  async function verifyChallengeHit() {
    try {
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 1200);

      const res = await fetch('/api/challenge/verify', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          target_distance: state.targetDistance,
          target_elevation: state.targetHeight,
          target_tolerance_radius: state.targetTolerance,
          target_x: state.targetDistance,
          target_y: state.targetHeight * 0.7,
          tolerance: state.targetTolerance,
          v0: state.v0,
          angle: state.angleDeg,
          y0: state.y0,
          g: state.g,
        }),
        signal: controller.signal,
      });
      clearTimeout(timeoutId);

      if (res.ok) {
        const json = await res.json();
        return json.data || json;
      }
    } catch {
      // Graceful offline fallback
    }

    return physics.verifyTargetHit(
      state.targetDistance,
      state.targetHeight * 0.7,
      state.targetTolerance,
      {
        v0: state.v0,
        angleDeg: state.angleDeg,
        y0: state.y0,
        g: state.g,
      }
    );
  }

  /**
   * Siklus Tembakan Meriam (Fire Lifecycle)
   */
  async function handleFire() {
    // 1. Validasi amunisi: Tolak tembakan jika amunisi belum dimuat
    if (!controls.isAmmoLoaded()) {
      controls.showAmmoAlert();
      telemetry.setStatus('AMUNISI BELUM DIMUAT!', 'warn');
      return;
    }

    // Ambil data analitik teoritis (dari API atau lokal)
    state.analyticalMetrics = await fetchOrCalculateAnalytical();

    // 2. Mainkan suara tembakan & ledakan asap moncong
    audio.playCannonFire();

    if (typeof renderer.emitMuzzleSmoke === 'function') {
      const muzzle = typeof renderer.getMuzzlePosition === 'function'
        ? renderer.getMuzzlePosition(state.angleDeg, state.y0)
        : null;
      if (muzzle) {
        renderer.emitMuzzleSmoke(muzzle.x, muzzle.y, muzzle.angleRad);
      } else {
        renderer.emitMuzzleSmoke();
      }
    }

    // 3. Inisialisasi proyektil
    const angleRad = (state.angleDeg * Math.PI) / 180;
    state.projectile = {
      x: 0,
      y: state.y0,
      vx: state.v0 * Math.cos(angleRad),
      vy: state.v0 * Math.sin(angleRad),
      v: state.v0,
      time: 0,
      hMax: state.y0,
    };

    state.currentTrajectory = [{ x: 0, y: state.y0 }];
    state.isFiring = true;
    state.isPaused = false;
    telemetry.setStatus('MELUNCUR', 'info');
  }

  /**
   * Selesaikan tembakan saat proyektil menabrak benteng atau tanah
   */
  async function handleImpact(collision) {
    state.isFiring = false;
    const finalX = state.projectile.x;

    let hitStatus = 'MISS';
    if (collision.target === 'castle') {
      hitStatus = 'HIT';
      audio.playExplosion(true);
      if (typeof renderer.emitExplosion === 'function') {
        renderer.emitExplosion(finalX, state.projectile.y, true);
      }
      telemetry.setStatus('HIT! BENTENG HANCUR', 'hit');

      // Evaluasi skor tantangan
      const challengeResult = await verifyChallengeHit();
      if (challengeResult && challengeResult.score !== undefined) {
        telemetry.setStatus(`HIT! SKOR: ${challengeResult.score}`, 'hit');
      }
    } else {
      hitStatus = 'MISS';
      audio.playExplosion(false);
      if (typeof renderer.emitExplosion === 'function') {
        renderer.emitExplosion(finalX, 0, false);
      }
      telemetry.setStatus('MISS: MENYENTUH TANAH', 'miss');
    }

    // Simpan lintasan saat ini ke riwayat persisten
    if (state.currentTrajectory.length > 0) {
      state.trailHistory.push([...state.currentTrajectory]);
      if (typeof renderer.addCompletedTrail === 'function') {
        renderer.addCompletedTrail(state.currentTrajectory);
      }
    }

    // Catat percobaan ke LabExperimentSession
    const theoRange =
      state.analyticalMetrics?.horizontal_range ??
      state.analyticalMetrics?.horizontalRange ??
      0;

    telemetry.recordTrial({
      v0: state.v0,
      angle: state.angleDeg,
      y0: state.y0,
      g: state.g,
      simulatedRange: finalX,
      theoreticalRange: theoRange,
      hMax: state.projectile.hMax,
      status: hitStatus,
      ammoType: state.currentAmmo,
    });

    // Konsumsi amunisi setelah ditembakkan
    controls.consumeAmmo();
  }

  // Setup interaksi ControlsManager
  const controls = new ControlsManager({
    onParameterChange: (params) => {
      Object.assign(state, params);
      physics.setParameters(params);
      state.analyticalMetrics = physics.calculateAnalytical({
        v0: state.v0,
        angleDeg: state.angleDeg,
        y0: state.y0,
        g: state.g,
      });
      renderScene();
    },
    onFire: () => handleFire(),
    onPause: () => {
      state.isPaused = !state.isPaused;
      if (state.isPaused) {
        telemetry.setStatus('JEDA', 'warn');
      } else if (state.isFiring) {
        telemetry.setStatus('MELUNCUR', 'info');
      }
    },
    onReset: () => {
      state.isFiring = false;
      state.isPaused = false;
      state.currentTrajectory = [];
      state.projectile = { x: 0, y: state.y0, vx: 0, vy: 0, v: 0, time: 0, hMax: state.y0 };
      telemetry.reset();
      renderScene();
    },
    onClearTrails: () => {
      state.trailHistory = [];
      state.currentTrajectory = [];
      if (typeof renderer.clearTrails === 'function') {
        renderer.clearTrails();
      }
      renderScene();
    },
    onAmmoLoaded: (ammoType, ammoObj) => {
      state.currentAmmo = ammoType;
      state.mass = ammoObj?.mass || AMMO_MASS_MAP[ammoType] || 10.0;
      physics.setParameters({ mass: state.mass });
      telemetry.setStatus(`AMUNISI SIAP (${ammoType.toUpperCase()})`, 'info');
    },
    onTargetChange: (newTargetDist) => {
      state.targetDistance = newTargetDist;
      renderScene();
    },
    onClearTable: () => {
      telemetry.clearHistory();
    },
  });

  // Dengarkan window events
  window.addEventListener('virtual-lab:clear-trails', () => {
    state.trailHistory = [];
    state.currentTrajectory = [];
    if (typeof renderer.clearTrails === 'function') {
      renderer.clearTrails();
    }
    renderScene();
  });

  window.addEventListener('virtual-lab:reset', () => {
    state.isFiring = false;
    state.isPaused = false;
    state.currentTrajectory = [];
    state.projectile = { x: 0, y: state.y0, vx: 0, vy: 0, v: 0, time: 0, hMax: state.y0 };
    telemetry.reset();
    renderScene();
  });

  // Game Loop 60 FPS menggunakan requestAnimationFrame
  let lastTimestamp = performance.now();

  function gameLoop(timestamp) {
    const rawDt = (timestamp - lastTimestamp) / 1000;
    lastTimestamp = timestamp;

    // Batasi delta time untuk mencegah tunneling saat tab background
    const dt = Math.min(Math.max(rawDt, 0.001), 0.033);

    if (state.isFiring && !state.isPaused) {
      state.projectile.time += dt;

      // Integrasi numerik langkah fisika
      const nextStep = physics.stepKinematics(
        { x: state.projectile.x, y: state.projectile.y },
        { vx: state.projectile.vx, vy: state.projectile.vy },
        dt,
        {
          g: state.g,
          airResistance: state.airResistance,
          mass: state.mass,
          dragCoefficient: state.dragCoefficient,
        }
      );

      state.projectile.x = nextStep.pos.x;
      state.projectile.y = Math.max(0, nextStep.pos.y);
      state.projectile.vx = nextStep.vel.vx;
      state.projectile.vy = nextStep.vel.vy;
      state.projectile.v = nextStep.vel.v;
      state.projectile.hMax = Math.max(state.projectile.hMax, state.projectile.y);

      // Catat titik lintasan aktif
      state.currentTrajectory.push({
        x: state.projectile.x,
        y: state.projectile.y,
      });

      // Perbarui tampilan HUD telemetri per-frame
      telemetry.updateHUD({
        t: state.projectile.time,
        x: state.projectile.x,
        y: state.projectile.y,
        vx: state.projectile.vx,
        vy: state.projectile.vy,
        v: state.projectile.v,
        hMax: state.projectile.hMax,
        range: state.projectile.x,
        status: 'MELUNCUR',
      });

      // Deteksi Tumbukan Benteng & Permukaan Tanah
      const castleBounds = {
        x: state.targetDistance,
        y: 0,
        width: 34.4,
        height: state.targetHeight,
        toleranceRadius: state.targetTolerance,
      };

      const collision = physics.checkCollision(
        { x: state.projectile.x, y: state.projectile.y },
        castleBounds,
        0
      );

      if (collision.hit) {
        handleImpact(collision);
      }
    }

    // Perbarui partikel di renderer
    if (typeof renderer.updateParticles === 'function') {
      renderer.updateParticles(dt);
    }

    // Render ulang tampilan kanvas
    renderScene();

    requestAnimationFrame(gameLoop);
  }

  // Mulai game loop dan render frame pertama
  renderScene();
  requestAnimationFrame(gameLoop);
});
