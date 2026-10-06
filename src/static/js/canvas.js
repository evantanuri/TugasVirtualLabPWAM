/**
 * CANVAS.JS — Rendering Visual Canvas 2D
 * Merender lanskap bukit, meriam klasik beroda kayu, benteng sasaran teal,
 * lintasan parabola bertitik, dan partikel ledakan.
 */

export class CanvasRenderer {
  constructor(canvasElement) {
    this.canvas = canvasElement;
    this.ctx = canvasElement.getContext('2d');
    this.width = canvasElement.width;
    this.height = canvasElement.height;

    // Skala visual (meter ke pixel)
    this.scale = 3.2; // 1 meter = 3.2 pixel
    this.originX = 80; // Posisi horizontal pangkal meriam
    this.groundY = this.height - 80; // Garis tanah

    this.trailPoints = [];
    this.particles = [];
  }

  clear() {
    this.ctx.clearRect(0, 0, this.width, this.height);
  }

  /**
   * Menggambar latar belakang bukit & langit sesuai screenshot referensi
   */
  drawBackground() {
    const ctx = this.ctx;

    // Langit Gradien Lembut
    const skyGrad = ctx.createLinearGradient(0, 0, 0, this.groundY);
    skyGrad.addColorStop(0, '#e8eff5');
    skyGrad.addColorStop(1, '#d8e5ef');
    ctx.fillStyle = skyGrad;
    ctx.fillRect(0, 0, this.width, this.height);

    // Bukit Belakang
    ctx.fillStyle = '#a8c5bc';
    ctx.beginPath();
    ctx.ellipse(300, this.groundY + 120, 450, 180, 0, 0, Math.PI * 2);
    ctx.fill();

    // Bukit Depan
    ctx.fillStyle = '#7fa89b';
    ctx.beginPath();
    ctx.ellipse(650, this.groundY + 160, 500, 220, 0, 0, Math.PI * 2);
    ctx.fill();

    // Permukaan Tanah / Air Biru Muda di Bawah
    ctx.fillStyle = '#68b1bb';
    ctx.fillRect(0, this.groundY, this.width, this.height - this.groundY);

    // Rumput Tepian
    ctx.fillStyle = '#4c8779';
    ctx.fillRect(0, this.groundY - 8, this.width, 8);
  }

  /**
   * Menggambar Meriam Klasik dengan Roda Kayu & Laras Bersudut
   */
  drawCannon(angleDeg, initialHeightMeters = 0) {
    const ctx = this.ctx;
    const cannonBaseY = this.groundY - initialHeightMeters * this.scale;
    const cannonX = this.originX;

    ctx.save();
    ctx.translate(cannonX, cannonBaseY);

    // Gambar Laras Meriam (berotasi sesuai sudut theta)
    ctx.save();
    ctx.rotate((-angleDeg * Math.PI) / 180);
    ctx.fillStyle = '#526071';
    ctx.fillRect(-10, -12, 60, 24);
    // Cincin moncong
    ctx.fillStyle = '#3a4452';
    ctx.fillRect(45, -14, 8, 28);
    ctx.restore();

    // Roda Kayu Meriam
    ctx.beginPath();
    ctx.arc(0, 10, 26, 0, Math.PI * 2);
    ctx.fillStyle = '#8b5a2b';
    ctx.fill();
    ctx.lineWidth = 4;
    ctx.strokeStyle = '#5a3818';
    ctx.stroke();

    // Poros Roda
    ctx.beginPath();
    ctx.arc(0, 10, 7, 0, Math.PI * 2);
    ctx.fillStyle = '#2d1c0c';
    ctx.fill();

    ctx.restore();
  }

  /**
   * Menggambar Benteng Target Batu Teal di Sisi Kanan (Sesuai Screenshot)
   */
  drawCastle(targetXMeter = 220, targetHeightMeter = 45) {
    const ctx = this.ctx;
    const castlePixelX = this.originX + targetXMeter * this.scale;
    const castlePixelHeight = targetHeightMeter * this.scale;
    const castleWidth = 110;
    const castleY = this.groundY - castlePixelHeight;

    ctx.fillStyle = '#1d5f6f'; // Teal benteng
    ctx.fillRect(castlePixelX, castleY, castleWidth, castlePixelHeight);

    // Puncak Menara / Crenellations
    const merlonWidth = 18;
    const merlonHeight = 22;
    for (let x = castlePixelX; x < castlePixelX + castleWidth; x += merlonWidth * 2) {
      ctx.fillRect(x, castleY - merlonHeight, merlonWidth, merlonHeight);
    }
  }

  /**
   * Menggambar lintasan parabola putus-putus (*dashed line*)
   */
  drawTrajectoryTrail(points) {
    if (!points || points.length < 2) return;
    const ctx = this.ctx;
    ctx.save();
    ctx.strokeStyle = '#0284c7';
    ctx.lineWidth = 2.5;
    ctx.setLineDash([6, 6]);
    ctx.beginPath();

    points.forEach((p, index) => {
      const px = this.originX + p.x * this.scale;
      const py = this.groundY - p.y * this.scale;
      if (index === 0) ctx.moveTo(px, py);
      else ctx.lineTo(px, py);
    });

    ctx.stroke();
    ctx.restore();
  }
}
