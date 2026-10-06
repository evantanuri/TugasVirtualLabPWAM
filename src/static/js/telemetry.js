/**
 * TELEMETRY.JS — Live HUD Dashboard & Eksperimen Logger
 * Menampilkan data telemetri real-time (t, x, y, v, h_max, R).
 */

export class TelemetryDashboard {
  constructor() {
    this.hudTime = document.getElementById('hudTime');
    this.hudPos = document.getElementById('hudPos');
    this.hudSpeed = document.getElementById('hudSpeed');
    this.hudHMax = document.getElementById('hudHMax');
    this.hudRange = document.getElementById('hudRange');
  }

  update({ t = 0, x = 0, y = 0, v = 0, hMax = 0, range = 0 }) {
    if (this.hudTime) this.hudTime.textContent = `${t.toFixed(2)} s`;
    if (this.hudPos) this.hudPos.textContent = `(${x.toFixed(1)}, ${y.toFixed(1)}) m`;
    if (this.hudSpeed) this.hudSpeed.textContent = `${v.toFixed(1)} m/s`;
    if (this.hudHMax) this.hudHMax.textContent = `${hMax.toFixed(1)} m`;
    if (this.hudRange) this.hudRange.textContent = `${range.toFixed(1)} m`;
  }

  reset() {
    this.update({ t: 0, x: 0, y: 0, v: 0, hMax: 0, range: 0 });
  }
}
