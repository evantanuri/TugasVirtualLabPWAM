/**
 * PHYSICS.JS — Engine Kinematika 2D (Client-side)
 * Menghitung gerak proyektil, vektor kecepatan, dan posisi koordinat real-time.
 */

export class PhysicsEngine {
  constructor() {
    this.g = 9.81; // m/s^2
    this.v0 = 45; // m/s
    this.angleDeg = 45; // derajat
    this.y0 = 0; // meter
    this.mass = 10; // kg
  }

  setParameters({ v0, angleDeg, y0, g, mass }) {
    if (v0 !== undefined) this.v0 = Number(v0);
    if (angleDeg !== undefined) this.angleDeg = Number(angleDeg);
    if (y0 !== undefined) this.y0 = Number(y0);
    if (g !== undefined) this.g = Number(g);
    if (mass !== undefined) this.mass = Number(mass);
  }

  /**
   * Mengembalikan posisi (x, y) dan kecepatan (vx, vy) pada waktu t
   */
  getStateAtTime(t) {
    const angleRad = (this.angleDeg * Math.PI) / 180;
    const v0x = this.v0 * Math.cos(angleRad);
    const v0y = this.v0 * Math.sin(angleRad);

    const x = v0x * t;
    const y = Math.max(0, this.y0 + v0y * t - 0.5 * this.g * t * t);
    const vx = v0x;
    const vy = v0y - this.g * t;
    const v = Math.sqrt(vx * vx + vy * vy);

    return { x, y, vx, vy, v };
  }

  /**
   * Menghitung nilai analitik ideal
   */
  getAnalyticalMetrics() {
    const angleRad = (this.angleDeg * Math.PI) / 180;
    const v0x = this.v0 * Math.cos(angleRad);
    const v0y = this.v0 * Math.sin(angleRad);

    const tPeak = v0y / this.g;
    const hMax = this.y0 + (v0y * v0y) / (2 * this.g);

    const discriminant = v0y * v0y + 2 * this.g * this.y0;
    const flightTime = (v0y + Math.sqrt(discriminant)) / this.g;
    const horizontalRange = v0x * flightTime;

    return { tPeak, hMax, flightTime, horizontalRange };
  }
}
