/**
 * CANVAS.JS — Rendering Visual Canvas 2D
 * Virtual Lab Fisika TPB ITB: Gerak Parabola & Tembakan Meriam
 *
 * Mengimplementasikan:
 * 1. Hi-DPI (devicePixelRatio) scaling adaptif untuk layar Retina & mobile.
 * 2. Background lanskap prosedural: langit gradien lembut, awan berarak,
 *    bukit berlapis hijau/teal, dan padang rumput bergrid jarak meter.
 * 3. Meriam klasik: roda kayu beruji 8 jari-jari, poros baut kuningan,
 *    laras perunggu/metal berotasi dinamis (sudut theta), cincin moncong,
 *    dan tombol cascabel.
 * 4. Benteng batu teal: menara bertingkat bertekstur bata, merlon/crenel,
 *    celah panah lancet, bendera berkibar, dan target bullseye interaktif.
 * 5. Jejak lintasan parabola persisten putus-putus (*dashed line*) dengan
 *    penanda titik puncak (h_max) dan dukungan clearTrails().
 * 6. Sistem partikel ganda: kepulan asap moncong mengembang ke atas dan
 *    ledakan tumbukan mekar (sparks, serpihan batu/tanah, asap, screen shake).
 */

export class CanvasRenderer {
  /**
   * @param {HTMLCanvasElement} canvasElement
   */
  constructor(canvasElement) {
    if (!canvasElement) {
      throw new Error('CanvasRenderer memerlukan elemen HTMLCanvasElement yang valid.');
    }

    this.canvas = canvasElement;
    this.ctx = canvasElement.getContext('2d');

    // Dimensi dasar logis (CSS pixels)
    this.logicalWidth = canvasElement.width || 960;
    this.logicalHeight = canvasElement.height || 540;
    this.width = this.logicalWidth;
    this.height = this.logicalHeight;

    // Skala visual (meter ke pixel)
    this.scale = 3.2; // 1 meter = 3.2 pixel
    this.originX = 85; // Posisi horizontal sumbu rotasi meriam
    this.groundY = this.height - 80; // Garis tanah (baseline)

    // Riwayat jejak lintasan
    this.trailHistory = [];
    this.trailPoints = [];

    // Sistem partikel
    this.particles = [];

    // Efek guncangan layar (screen shake)
    this.shakeDuration = 0;
    this.shakeIntensity = 0;

    // Parameter visual animasi prosedural (awan berarak)
    this.cloudOffset = 0;

    // Status terakhir meriam & target
    this.lastAngleDeg = 45;
    this.lastHeightMeters = 0;
    this.lastMuzzlePos = { x: this.originX + 50, y: this.groundY - 50, angleRad: Math.PI / 4 };

    // Inisialisasi resolusi Hi-DPI
    this.dpr = typeof window !== 'undefined' ? (window.devicePixelRatio || 1) : 1;
    this.setupHiDPI();
  }

  /**
   * Menyesuaikan ukuran buffer canvas terhadap devicePixelRatio agar tajam di layar Retina.
   */
  setupHiDPI() {
    const dpr = typeof window !== 'undefined' ? (window.devicePixelRatio || 1) : 1;
    this.dpr = dpr;

    let displayWidth = this.logicalWidth;
    let displayHeight = this.logicalHeight;

    if (this.canvas && typeof this.canvas.getBoundingClientRect === 'function') {
      const rect = this.canvas.getBoundingClientRect();
      if (rect.width > 0 && rect.height > 0) {
        displayWidth = rect.width;
        displayHeight = rect.height;
      }
    }

    this.width = displayWidth;
    this.height = displayHeight;
    this.groundY = this.height - 80;

    // Set buffer fisik
    this.canvas.width = Math.round(displayWidth * dpr);
    this.canvas.height = Math.round(displayHeight * dpr);

    // Kunci ukuran CSS di DOM
    if (this.canvas.style) {
      this.canvas.style.width = `${displayWidth}px`;
      this.canvas.style.height = `${displayHeight}px`;
    }

    // Reset transformasi dan terapkan DPR scaling
    this.ctx.setTransform(1, 0, 0, 1, 0, 0);
    this.ctx.scale(dpr, dpr);
  }

  /**
   * Mengatur nilai DPR secara eksplisit
   * @param {number} dpr
   */
  setDPR(dpr) {
    if (!dpr || dpr <= 0) return;
    this.dpr = dpr;
    const displayWidth = this.width;
    const displayHeight = this.height;

    this.canvas.width = Math.round(displayWidth * dpr);
    this.canvas.height = Math.round(displayHeight * dpr);
    this.ctx.setTransform(1, 0, 0, 1, 0, 0);
    this.ctx.scale(dpr, dpr);
  }

  /**
   * Membersihkan area gambar canvas secara aman tanpa merusak transform Hi-DPI
   */
  clear() {
    this.ctx.save();
    this.ctx.setTransform(1, 0, 0, 1, 0, 0);
    this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);
    this.ctx.restore();
  }

  /**
   * Menggambar pemandangan lengkap (langit, awan, bukit, benteng, lintasan, meriam, proyektil, partikel)
   * Mendukung skema state loop game 60 FPS
   * @param {Object} state
   */
  drawScene(state = {}) {
    this.clear();

    this.ctx.save();

    // Terapkan guncangan layar jika sedang terjadi benturan
    if (this.shakeDuration > 0) {
      const factor = this.shakeDuration / 12;
      const dx = (Math.random() - 0.5) * this.shakeIntensity * factor * 2;
      const dy = (Math.random() - 0.5) * this.shakeIntensity * factor * 2;
      this.ctx.translate(dx, dy);
      this.shakeDuration--;
    }

    // 1. Latar belakang
    this.drawBackground();

    // 2. Benteng sasaran
    const targetDist = state.targetDistance ?? state.targetX ?? 210;
    const targetElev = state.targetElevation ?? state.targetHeight ?? 40;
    this.drawCastle(targetDist, targetElev);

    // 3. Jejak lintasan (riwayat & aktif)
    this.drawTrajectoryHistory(state.trailHistory || this.trailHistory);
    if (state.trajectoryPoints && state.trajectoryPoints.length >= 2) {
      this.drawCurrentTrajectory(state.trajectoryPoints);
    }

    // 4. Meriam klasik
    const angleDeg = state.angleDeg ?? state.angle ?? 45;
    const y0 = state.y0 ?? state.initialHeight ?? 0;
    this.drawCannon(angleDeg, y0);

    // 5. Bola meriam proyektil
    if (state.projectile && typeof state.projectile.x === 'number') {
      const radius = state.projectile.radius || 6.5;
      this.drawProjectile(state.projectile.x, state.projectile.y, radius, true);
    }

    // 6. Sistem partikel
    this.drawParticles();

    this.ctx.restore();
  }

  /**
   * Menggambar latar belakang lanskap bukit, langit, dan padang rumput
   */
  drawBackground() {
    const ctx = this.ctx;

    // 1. Langit Gradien Lembut (Soft Light Blue/Gray)
    const skyGrad = ctx.createLinearGradient(0, 0, 0, this.groundY);
    skyGrad.addColorStop(0, '#e8eff5');
    skyGrad.addColorStop(0.65, '#dbe6f0');
    skyGrad.addColorStop(1, '#cddce9');
    ctx.fillStyle = skyGrad;
    ctx.fillRect(0, 0, this.width, this.height);

    // 2. Awan Prosedural Berarak
    this.drawProceduralClouds();

    // 3. Bukit Belakang (Distant Hills, sage/teal atmosferik)
    ctx.fillStyle = '#a8c5bc';
    ctx.beginPath();
    ctx.ellipse(260, this.groundY + 110, 390, 160, 0, 0, Math.PI * 2);
    ctx.fill();

    ctx.beginPath();
    ctx.ellipse(780, this.groundY + 130, 440, 180, 0, 0, Math.PI * 2);
    ctx.fill();

    // 4. Bukit Depan (Midground Hills, kontras hangat menyatu horizon)
    ctx.fillStyle = '#7fa89b';
    ctx.beginPath();
    ctx.ellipse(110, this.groundY + 140, 320, 170, 0, 0, Math.PI * 2);
    ctx.fill();

    ctx.beginPath();
    ctx.ellipse(540, this.groundY + 150, 430, 180, 0, 0, Math.PI * 2);
    ctx.fill();

    // 5. Permukaan Tanah & Padang Rumput (Meadow Turf)
    const groundGrad = ctx.createLinearGradient(0, this.groundY, 0, this.height);
    groundGrad.addColorStop(0, '#4c8779');
    groundGrad.addColorStop(1, '#34665b');
    ctx.fillStyle = groundGrad;
    ctx.fillRect(0, this.groundY, this.width, this.height - this.groundY);

    // Garis rumput hijau cerah di atas baseline
    ctx.fillStyle = '#5ba896';
    ctx.fillRect(0, this.groundY - 5, this.width, 6);

    // Garis kisi pengukuran jarak meter
    this.drawGroundGrid();
  }

  /**
   * Menggambar awan prosedural semi-transparan dengan animasi hanyut lembut
   */
  drawProceduralClouds() {
    const ctx = this.ctx;
    ctx.save();
    ctx.fillStyle = 'rgba(255, 255, 255, 0.72)';

    const cloudConfigs = [
      { baseX: 100, y: 65, scale: 0.9 },
      { baseX: 430, y: 95, scale: 1.15 },
      { baseX: 760, y: 55, scale: 0.8 },
    ];

    for (const c of cloudConfigs) {
      const cx = ((c.baseX + this.cloudOffset) % (this.width + 240)) - 100;
      const cy = c.y;
      const s = c.scale;

      ctx.beginPath();
      ctx.arc(cx, cy, 20 * s, 0, Math.PI * 2);
      ctx.arc(cx + 18 * s, cy - 10 * s, 25 * s, 0, Math.PI * 2);
      ctx.arc(cx + 42 * s, cy - 8 * s, 21 * s, 0, Math.PI * 2);
      ctx.arc(cx + 58 * s, cy, 16 * s, 0, Math.PI * 2);
      ctx.arc(cx + 28 * s, cy + 5 * s, 18 * s, 0, Math.PI * 2);
      ctx.fill();
    }

    ctx.restore();
  }

  /**
   * Menggambar penggaris penanda jarak horizontal (meter grid ticks)
   */
  drawGroundGrid() {
    const ctx = this.ctx;
    ctx.save();
    ctx.font = '11px sans-serif';
    ctx.fillStyle = 'rgba(255, 255, 255, 0.8)';
    ctx.strokeStyle = 'rgba(255, 255, 255, 0.45)';
    ctx.lineWidth = 1;

    for (let m = 50; m <= 250; m += 50) {
      const px = this.originX + m * this.scale;
      if (px > this.width - 25) break;

      // Garis tick kecil
      ctx.beginPath();
      ctx.moveTo(px, this.groundY);
      ctx.lineTo(px, this.groundY + 8);
      ctx.stroke();

      // Label teks jarak
      ctx.textAlign = 'center';
      ctx.fillText(`${m}m`, px, this.groundY + 22);
    }

    ctx.restore();
  }

  /**
   * Menggambar Meriam Klasik:
   * Dudukan/menara elevasi (jika y0 > 0), roda kayu 8 jari-jari, dan laras berotasi dinamis.
   * Mendukung overload: drawCannon(angleDeg, y0) atau drawCannon(x, y, angleRad, barrelLength)
   */
  drawCannon(arg1 = 45, arg2 = 0, arg3, arg4) {
    let cannonX, cannonBaseY, angleDeg, barrelLength;

    if (arg3 !== undefined) {
      // Signature: drawCannon(x, y, angleRad, barrelLength)
      cannonX = arg1;
      cannonBaseY = arg2;
      angleDeg = (arg3 * 180) / Math.PI;
      barrelLength = arg4 || 64;
    } else {
      // Signature: drawCannon(angleDeg, initialHeightMeters)
      angleDeg = Number(arg1) || 0;
      const initialHeightMeters = Number(arg2) || 0;
      cannonX = this.originX;
      cannonBaseY = this.groundY - initialHeightMeters * this.scale;
      barrelLength = 64;
      this.lastHeightMeters = initialHeightMeters;
    }
    this.lastAngleDeg = angleDeg;

    const ctx = this.ctx;
    ctx.save();

    // 1. Menara Dudukan Elevasi Batu jika y0 > 0
    if (cannonBaseY < this.groundY - 1) {
      const platWidth = 72;
      const platHeight = this.groundY - cannonBaseY;
      const platX = cannonX - platWidth / 2;

      // Badan batu dudukan
      const platGrad = ctx.createLinearGradient(platX, cannonBaseY, platX + platWidth, cannonBaseY);
      platGrad.addColorStop(0, '#435467');
      platGrad.addColorStop(0.8, '#324050');
      platGrad.addColorStop(1, '#232d38');
      ctx.fillStyle = platGrad;
      ctx.fillRect(platX, cannonBaseY, platWidth, platHeight);

      // Garis nat bata batu
      ctx.strokeStyle = 'rgba(25, 34, 43, 0.6)';
      ctx.lineWidth = 1.2;
      for (let py = cannonBaseY + 14; py < this.groundY; py += 14) {
        ctx.beginPath();
        ctx.moveTo(platX, py);
        ctx.lineTo(platX + platWidth, py);
        ctx.stroke();
      }

      // Lempeng penutup batu atas (coping stone)
      ctx.fillStyle = '#55697d';
      ctx.fillRect(platX - 3, cannonBaseY, platWidth + 6, 6);
    }

    // 2. Rangka Kayu Dudukan Meriam (Chassis & Carriage Trail)
    ctx.save();
    ctx.translate(cannonX, cannonBaseY);

    // Lengan rangka kayu mengarah ke belakang
    ctx.beginPath();
    ctx.moveTo(-16, 2);
    ctx.lineTo(-44, 24);
    ctx.lineTo(-32, 28);
    ctx.lineTo(-4, 10);
    ctx.closePath();
    ctx.fillStyle = '#5a3818';
    ctx.fill();
    ctx.strokeStyle = '#38210c';
    ctx.lineWidth = 1.5;
    ctx.stroke();

    // Pelat klem engsel laras (trunnion bracket)
    ctx.fillStyle = '#422810';
    ctx.fillRect(-12, -4, 22, 14);

    // 3. Laras Meriam Logam (Berotasi sesuai sudut elevasi theta)
    ctx.save();
    const angleRad = (angleDeg * Math.PI) / 180;
    ctx.rotate(-angleRad); // Negatif karena rotasi canvas searah jarum jam

    // Tombol Cascabel Belakang (breach button)
    ctx.beginPath();
    ctx.arc(-14, 0, 7, 0, Math.PI * 2);
    ctx.fillStyle = '#26313d';
    ctx.fill();
    ctx.strokeStyle = '#182029';
    ctx.lineWidth = 1.5;
    ctx.stroke();

    // Cincin pangkal belakang laras
    ctx.fillStyle = '#3a4655';
    ctx.fillRect(-9, -13, 6, 26);

    // Badan tabung meriam silindris meruncing (tapered barrel)
    ctx.beginPath();
    ctx.moveTo(-3, -12);
    ctx.lineTo(barrelLength - 8, -9);
    ctx.lineTo(barrelLength - 8, 9);
    ctx.lineTo(-3, 12);
    ctx.closePath();

    const barrelGrad = ctx.createLinearGradient(0, -12, 0, 12);
    barrelGrad.addColorStop(0, '#8395a7'); // Pantulan cahaya atas
    barrelGrad.addColorStop(0.35, '#576574'); // Abu-abu metalik laras
    barrelGrad.addColorStop(0.8, '#3b4754'); // Bayangan logam gelap
    barrelGrad.addColorStop(1, '#222f3e'); // Bagian bawah laras
    ctx.fillStyle = barrelGrad;
    ctx.fill();

    // Sabuk penguat laras (astragals / reinforcing bands)
    ctx.fillStyle = '#2f3b47';
    ctx.fillRect(18, -11, 4, 22);
    ctx.fillRect(36, -10, 4, 20);

    // Cincin Moncong Tebal (reinforced muzzle ring)
    ctx.fillStyle = '#475569';
    ctx.fillRect(barrelLength - 8, -11, 9, 22);
    ctx.strokeStyle = '#1e293b';
    ctx.lineWidth = 1;
    ctx.strokeRect(barrelLength - 8, -11, 9, 22);

    // Lubang Moncong Laras (bore opening)
    ctx.beginPath();
    ctx.ellipse(barrelLength + 1, 0, 2.5, 8.5, 0, 0, Math.PI * 2);
    ctx.fillStyle = '#0f172a';
    ctx.fill();

    ctx.restore(); // Selesai rotasi laras

    // 4. Roda Kayu Meriam Beruji 8 Jari-Jari (Wooden Wheel)
    const wheelRadius = 26;
    const wheelCenterY = 8;

    // Bingkai besi rim luar (iron tyre)
    ctx.beginPath();
    ctx.arc(0, wheelCenterY, wheelRadius, 0, Math.PI * 2);
    ctx.strokeStyle = '#3e2714';
    ctx.lineWidth = 5;
    ctx.stroke();

    // Lingkaran kayu rim (wooden felloe)
    ctx.beginPath();
    ctx.arc(0, wheelCenterY, wheelRadius - 2, 0, Math.PI * 2);
    ctx.strokeStyle = '#8b5a2b';
    ctx.lineWidth = 4;
    ctx.stroke();

    // 8 Jari-Jari Kayu (8 Wooden Spokes, bersudut 45 derajat)
    ctx.strokeStyle = '#6d421e';
    ctx.lineWidth = 3;
    for (let i = 0; i < 8; i++) {
      const spokeAngle = (i * Math.PI) / 4;
      const cosA = Math.cos(spokeAngle);
      const sinA = Math.sin(spokeAngle);
      ctx.beginPath();
      ctx.moveTo(cosA * 7, wheelCenterY + sinA * 7);
      ctx.lineTo(cosA * 21, wheelCenterY + sinA * 21);
      ctx.stroke();
    }

    // Poros Roda (Hub)
    ctx.beginPath();
    ctx.arc(0, wheelCenterY, 8, 0, Math.PI * 2);
    ctx.fillStyle = '#2b1d0c';
    ctx.fill();

    // Penutup poros kayu dalam & Baut Kuningan Tengah (Brass rivet)
    ctx.beginPath();
    ctx.arc(0, wheelCenterY, 5, 0, Math.PI * 2);
    ctx.fillStyle = '#422b17';
    ctx.fill();

    ctx.beginPath();
    ctx.arc(0, wheelCenterY, 2.5, 0, Math.PI * 2);
    ctx.fillStyle = '#d97706';
    ctx.fill();

    ctx.restore(); // Selesai translasi carriage
    ctx.restore(); // Selesai save utama

    // Perbarui koordinat titik lepas moncong untuk partikel & proyektil
    const exitAngleRad = (angleDeg * Math.PI) / 180;
    this.lastMuzzlePos = {
      x: cannonX + Math.cos(exitAngleRad) * barrelLength,
      y: cannonBaseY - Math.sin(exitAngleRad) * barrelLength,
      angleRad: exitAngleRad,
    };
  }

  /**
   * Menggambar Benteng Target Batu Teal Bertingkat di Sisi Kanan:
   * Tekstur nat bata, merlon/crenel, celah panah lancet, bendera berkibar, dan target bullseye.
   * Mendukung overload: drawCastle(targetXMeter, targetHeightMeter) atau drawCastle(x, y, width, height)
   */
  drawCastle(arg1 = 210, arg2 = 40, arg3, arg4) {
    let castlePixelX, castleY, castleWidth, castlePixelHeight;

    if (arg3 !== undefined && arg4 !== undefined) {
      // Signature: drawCastle(x, y, width, height)
      castlePixelX = arg1;
      castleY = arg2;
      castleWidth = arg3;
      castlePixelHeight = arg4;
    } else {
      // Signature: drawCastle(targetXMeter, targetHeightMeter)
      const targetXMeter = typeof arg1 === 'number' ? arg1 : 210;
      const targetHeightMeter = typeof arg2 === 'number' ? arg2 : 40;
      castlePixelX = this.originX + targetXMeter * this.scale;
      castlePixelHeight = targetHeightMeter * this.scale;
      castleWidth = 110;
      castleY = this.groundY - castlePixelHeight;
    }

    const ctx = this.ctx;
    ctx.save();

    // 1. Dinding Menara Benteng (Gradien Teal Klasik)
    const castleGrad = ctx.createLinearGradient(castlePixelX, castleY, castlePixelX + castleWidth, castleY);
    castleGrad.addColorStop(0, '#246e81'); // Sisi kiri terang
    castleGrad.addColorStop(0.7, '#1d5f6f'); // Warna badan teal
    castleGrad.addColorStop(1, '#134653'); // Sisi kanan bayangan
    ctx.fillStyle = castleGrad;
    ctx.fillRect(castlePixelX, castleY, castleWidth, castlePixelHeight);

    // 2. Garis Tekstur Nat Bata Batu (Masonry Brick Lines)
    ctx.strokeStyle = 'rgba(19, 70, 83, 0.55)';
    ctx.lineWidth = 1.5;
    const rowHeight = 16;
    const brickWidth = 24;
    let rowIndex = 0;

    for (let y = castleY + rowHeight; y < castleY + castlePixelHeight - 2; y += rowHeight) {
      ctx.beginPath();
      ctx.moveTo(castlePixelX, y);
      ctx.lineTo(castlePixelX + castleWidth, y);
      ctx.stroke();

      // Sambungan vertikal selang-seling
      const xOffset = (rowIndex % 2) * (brickWidth / 2);
      for (let x = castlePixelX + xOffset; x < castlePixelX + castleWidth; x += brickWidth) {
        ctx.beginPath();
        ctx.moveTo(x, y - rowHeight);
        ctx.lineTo(x, y);
        ctx.stroke();
      }
      rowIndex++;
    }

    // 3. Lis Tonjolan Penyangga Parapet Atas (Corbel / Parapet Molding)
    ctx.fillStyle = '#28798e';
    ctx.fillRect(castlePixelX - 4, castleY, castleWidth + 8, 5);
    ctx.fillStyle = '#103943';
    ctx.fillRect(castlePixelX - 4, castleY + 5, castleWidth + 8, 2);

    // 4. Puncak Pertahanan Merlon & Crenel (Battlements)
    const merlonWidth = 18;
    const merlonHeight = 22;
    const gap = 12;
    const totalStep = merlonWidth + gap;

    for (let mx = castlePixelX; mx < castlePixelX + castleWidth; mx += totalStep) {
      const curWidth = Math.min(merlonWidth, castlePixelX + castleWidth - mx);
      if (curWidth <= 4) break;

      // Balok merlon
      ctx.fillStyle = '#216b7d';
      ctx.fillRect(mx, castleY - merlonHeight, curWidth, merlonHeight);

      // Batu pelindung atas merlon
      ctx.fillStyle = '#2f8ba1';
      ctx.fillRect(mx - 1, castleY - merlonHeight - 3, curWidth + 2, 3);
    }

    // 5. Celah Panah Pertahanan (Lancet Arrow Slits)
    const slitWidth = 7;
    const slitHeight = 22;
    const slit1X = castlePixelX + 26;
    const slit2X = castlePixelX + castleWidth - 33;
    const slitY = castleY + castlePixelHeight * 0.32;

    [slit1X, slit2X].forEach((sx) => {
      ctx.fillStyle = '#0b262d';
      if (typeof ctx.roundRect === 'function') {
        ctx.beginPath();
        ctx.roundRect(sx, slitY, slitWidth, slitHeight, [3, 3, 1, 1]);
        ctx.fill();
      } else {
        ctx.fillRect(sx, slitY, slitWidth, slitHeight);
      }

      // Celah silang horizontal panah
      ctx.fillRect(sx - 3, slitY + 7, slitWidth + 6, 3);
    });

    // 6. Tiang & Bendera Merah Berkibar di Puncak Menara
    const flagPoleX = castlePixelX + Math.round(castleWidth * 0.5);
    const flagPoleY = castleY - merlonHeight - 30;

    // Tiang bendera
    ctx.fillStyle = '#475569';
    ctx.fillRect(flagPoleX - 1.5, flagPoleY, 3, 32);

    // Bola emas ujung tiang
    ctx.beginPath();
    ctx.arc(flagPoleX, flagPoleY, 3.5, 0, Math.PI * 2);
    ctx.fillStyle = '#f59e0b';
    ctx.fill();

    // Kain bendera berkibar dinamis
    const flagTime = Date.now() * 0.005;
    const wave = Math.sin(flagTime) * 3;
    ctx.beginPath();
    ctx.moveTo(flagPoleX + 1.5, flagPoleY + 2);
    ctx.lineTo(flagPoleX + 26, flagPoleY + 8 + wave);
    ctx.lineTo(flagPoleX + 18, flagPoleY + 16);
    ctx.lineTo(flagPoleX + 26, flagPoleY + 24 + wave * 0.6);
    ctx.lineTo(flagPoleX + 1.5, flagPoleY + 18);
    ctx.closePath();
    ctx.fillStyle = '#dc2626';
    ctx.fill();

    // Garis aksen emas bendera
    ctx.strokeStyle = '#f59e0b';
    ctx.lineWidth = 1.5;
    ctx.stroke();

    // 7. Target Bullseye Sasaran di Muka Benteng
    const bullseyeX = castlePixelX + Math.round(castleWidth * 0.5);
    const bullseyeY = castleY + castlePixelHeight * 0.65;

    // Lingkaran luar merah
    ctx.beginPath();
    ctx.arc(bullseyeX, bullseyeY, 17, 0, Math.PI * 2);
    ctx.fillStyle = '#ef4444';
    ctx.fill();
    ctx.strokeStyle = '#b91c1c';
    ctx.lineWidth = 1.5;
    ctx.stroke();

    // Lingkaran putih tengah
    ctx.beginPath();
    ctx.arc(bullseyeX, bullseyeY, 12, 0, Math.PI * 2);
    ctx.fillStyle = '#ffffff';
    ctx.fill();

    // Lingkaran merah dalam
    ctx.beginPath();
    ctx.arc(bullseyeX, bullseyeY, 7, 0, Math.PI * 2);
    ctx.fillStyle = '#ef4444';
    ctx.fill();

    // Titik pusat emas
    ctx.beginPath();
    ctx.arc(bullseyeX, bullseyeY, 3, 0, Math.PI * 2);
    ctx.fillStyle = '#fbbf24';
    ctx.fill();

    // Crosshair target halus
    ctx.strokeStyle = 'rgba(255, 255, 255, 0.75)';
    ctx.lineWidth = 1;
    ctx.beginPath();
    ctx.moveTo(bullseyeX - 19, bullseyeY);
    ctx.lineTo(bullseyeX + 19, bullseyeY);
    ctx.moveTo(bullseyeX, bullseyeY - 19);
    ctx.lineTo(bullseyeX, bullseyeY + 19);
    ctx.stroke();

    ctx.restore();
  }

  /**
   * Menggambar riwayat lintasan parabola sebelumnya (persisten)
   * @param {Array<Array<{x: number, y: number}>>} trailArray
   */
  drawTrajectoryHistory(trailArray = this.trailHistory) {
    if (!trailArray || trailArray.length === 0) return;
    const ctx = this.ctx;

    ctx.save();
    ctx.lineWidth = 2;
    ctx.setLineDash([5, 5]);

    trailArray.forEach((trail, idx) => {
      if (!trail || trail.length < 2) return;

      const isLatest = idx === trailArray.length - 1;
      ctx.strokeStyle = isLatest ? 'rgba(2, 132, 199, 0.65)' : 'rgba(2, 132, 199, 0.4)';

      ctx.beginPath();
      let maxPt = trail[0];

      trail.forEach((p, i) => {
        const px = this.originX + p.x * this.scale;
        const py = this.groundY - p.y * this.scale;
        if (i === 0) ctx.moveTo(px, py);
        else ctx.lineTo(px, py);

        if (p.y > maxPt.y) maxPt = p;
      });
      ctx.stroke();

      // Penanda titik puncak riwayat
      if (maxPt && maxPt.y > 1) {
        const peakX = this.originX + maxPt.x * this.scale;
        const peakY = this.groundY - maxPt.y * this.scale;
        ctx.save();
        ctx.setLineDash([]);
        ctx.beginPath();
        ctx.arc(peakX, peakY, 3, 0, Math.PI * 2);
        ctx.fillStyle = 'rgba(2, 132, 199, 0.6)';
        ctx.fill();
        ctx.restore();
      }
    });

    ctx.restore();
  }

  /**
   * Menggambar lintasan parabola aktif yang sedang berlangsung
   * @param {Array<{x: number, y: number}>} points
   */
  drawCurrentTrajectory(points) {
    if (!points || points.length < 2) return;
    const ctx = this.ctx;

    ctx.save();
    ctx.strokeStyle = '#0284c7';
    ctx.lineWidth = 2.5;
    ctx.setLineDash([6, 6]);
    ctx.beginPath();

    let maxPt = points[0];

    points.forEach((p, index) => {
      const px = this.originX + p.x * this.scale;
      const py = this.groundY - p.y * this.scale;
      if (index === 0) ctx.moveTo(px, py);
      else ctx.lineTo(px, py);

      if (p.y > maxPt.y) maxPt = p;
    });

    ctx.stroke();

    // Penanda puncak aktif (h_max) bercahaya
    if (maxPt && maxPt.y > 1) {
      const peakX = this.originX + maxPt.x * this.scale;
      const peakY = this.groundY - maxPt.y * this.scale;

      ctx.setLineDash([]);
      // Halo luar
      ctx.beginPath();
      ctx.arc(peakX, peakY, 6, 0, Math.PI * 2);
      ctx.fillStyle = 'rgba(56, 189, 248, 0.35)';
      ctx.fill();

      // Inti bercahaya
      ctx.beginPath();
      ctx.arc(peakX, peakY, 3.5, 0, Math.PI * 2);
      ctx.fillStyle = '#38bdf8';
      ctx.fill();

      // Label teks ketinggian puncak
      ctx.font = '10px sans-serif';
      ctx.fillStyle = '#0284c7';
      ctx.fillText(`${maxPt.y.toFixed(1)}m`, peakX + 7, peakY - 4);
    }

    ctx.restore();
  }

  /**
   * Menggambar jejak lintasan (kompatibilitas backward):
   * Menggambar riwayat lintasan persisten + lintasan aktif saat ini
   * @param {Array<{x: number, y: number}>} points
   */
  drawTrajectoryTrail(points) {
    this.drawTrajectoryHistory(this.trailHistory);
    if (points && points.length >= 2) {
      this.drawCurrentTrajectory(points);
    }
  }

  /**
   * Menyimpan tembakan yang selesai ke dalam riwayat jejak persisten
   * @param {Array<{x: number, y: number}>} points
   */
  addCompletedTrail(points) {
    if (points && points.length >= 2) {
      this.trailHistory.push([...points]);
    }
  }

  /**
   * Mengosongkan riwayat jejak lintasan
   */
  clearTrails() {
    this.trailHistory = [];
    this.trailPoints = [];
  }

  /**
   * Menggambar bola meriam proyektil dengan gradien sferis 3D
   * @param {number} x Koordinat horizontal
   * @param {number} y Koordinat vertikal
   * @param {number} [radius=6.5] Radius bola meriam
   * @param {boolean} [isMeters=null] Apakah x, y dalam satuan meter
   */
  drawProjectile(x, y, radius = 6.5, isMeters = null) {
    if (x === undefined || y === undefined) return;
    const ctx = this.ctx;

    let px = x;
    let py = y;
    if (isMeters === true || (isMeters === null && x <= 260 && y <= 150)) {
      px = this.originX + x * this.scale;
      py = this.groundY - y * this.scale;
    }

    ctx.save();

    // Bayangan jatuh sferis
    ctx.shadowColor = 'rgba(15, 23, 42, 0.4)';
    ctx.shadowBlur = 4;
    ctx.shadowOffsetY = 2;

    // Bola besi sferis 3D
    ctx.beginPath();
    ctx.arc(px, py, radius, 0, Math.PI * 2);
    const grad = ctx.createRadialGradient(
      px - radius * 0.35,
      py - radius * 0.35,
      radius * 0.1,
      px,
      py,
      radius
    );
    grad.addColorStop(0, '#94a3b8'); // Kilauan specular
    grad.addColorStop(0.3, '#475569'); // Logam abu-abu
    grad.addColorStop(0.85, '#1e293b'); // Badan besi gelap
    grad.addColorStop(1, '#090d16'); // Bayangan tepi sferis
    ctx.fillStyle = grad;
    ctx.fill();

    ctx.restore();
  }

  /**
   * Memicu pancaran partikel kepulan asap putih di moncong meriam saat tembakan
   * @param {number} [x] Koordinat X moncong
   * @param {number} [y] Koordinat Y moncong
   * @param {number} [angleRad] Sudut tembak dalam radian
   */
  emitMuzzleSmoke(x, y, angleRad) {
    if (x === undefined || y === undefined || angleRad === undefined) {
      const muzzle = this.getMuzzlePosition();
      x = muzzle.x;
      y = muzzle.y;
      angleRad = muzzle.angleRad;
    }

    const count = 24;
    for (let i = 0; i < count; i++) {
      const spread = (Math.random() - 0.5) * 0.55; // +/- 15 derajat
      const pAngle = angleRad + spread;
      const speed = 1.8 + Math.random() * 3.4;

      this.particles.push({
        type: 'smoke',
        x: x + (Math.random() - 0.5) * 6,
        y: y + (Math.random() - 0.5) * 6,
        vx: Math.cos(pAngle) * speed + (Math.random() - 0.5) * 0.6,
        vy: -Math.sin(pAngle) * speed - (0.4 + Math.random() * 0.8),
        radius: 7 + Math.random() * 6,
        growth: 0.45 + Math.random() * 0.45,
        alpha: 0.85,
        decay: 0.02 + Math.random() * 0.015,
        color: Math.random() > 0.4 ? 'rgba(240, 245, 250,' : 'rgba(215, 225, 235,',
      });
    }
  }

  /**
   * Memicu ledakan partikel tumbukan mekar (sparks, serpihan batu/tanah, asap, screen shake)
   * @param {number} x Koordinat impak
   * @param {number} y Koordinat impak
   * @param {boolean} [isCastleHit=false] Apakah mengenai benteng (Hit) atau tanah (Miss)
   */
  emitExplosion(x, y, isCastleHit = false) {
    let px = x;
    let py = y;
    if (x <= 260 && y <= 150) {
      px = this.originX + x * this.scale;
      py = this.groundY - y * this.scale;
    }

    // Aktifkan getaran kamera
    this.shakeIntensity = isCastleHit ? 7 : 4;
    this.shakeDuration = 12;

    // 1. Gelombang kejut (shockwave ring)
    this.particles.push({
      type: 'shockwave',
      x: px,
      y: py,
      radius: 4,
      maxRadius: isCastleHit ? 48 : 28,
      growth: isCastleHit ? 4.0 : 2.5,
      alpha: 0.95,
      color: isCastleHit ? '#fde047' : '#94a3b8',
    });

    // 2. Percikan api & kilatan mekar (sparks)
    const sparkColors = ['#fde047', '#f97316', '#ef4444', '#ffffff'];
    const sparkCount = isCastleHit ? 35 : 22;
    for (let i = 0; i < sparkCount; i++) {
      const angle = Math.random() * Math.PI * 2;
      const speed = 1.5 + Math.random() * 5.5;
      this.particles.push({
        type: 'spark',
        x: px,
        y: py,
        vx: Math.cos(angle) * speed,
        vy: Math.sin(angle) * speed - 1.5,
        radius: 2 + Math.random() * 2.5,
        color: sparkColors[Math.floor(Math.random() * sparkColors.length)],
        alpha: 1.0,
        decay: 0.025 + Math.random() * 0.02,
      });
    }

    // 3. Serpihan benturan (debris batu teal jika benteng, tanah jika ground)
    const debrisCount = isCastleHit ? 18 : 12;
    for (let i = 0; i < debrisCount; i++) {
      const angle = Math.random() * Math.PI - Math.PI; // Menyembur ke atas
      const speed = 2.0 + Math.random() * 4.5;
      this.particles.push({
        type: 'debris',
        x: px,
        y: py,
        vx: Math.cos(angle) * speed,
        vy: Math.sin(angle) * speed,
        size: 3 + Math.random() * 4,
        rotation: Math.random() * Math.PI * 2,
        rotSpeed: (Math.random() - 0.5) * 0.3,
        color: isCastleHit
          ? (Math.random() > 0.5 ? '#1d5f6f' : '#246e81')
          : (Math.random() > 0.5 ? '#4c8779' : '#8b5a2b'),
        alpha: 1.0,
        decay: 0.015 + Math.random() * 0.01,
      });
    }

    // 4. Kepulan asap abu-abu mekar dari titik benturan
    const smokeCount = 12;
    for (let i = 0; i < smokeCount; i++) {
      const angle = Math.random() * Math.PI * 2;
      const speed = 0.5 + Math.random() * 1.8;
      this.particles.push({
        type: 'smoke',
        x: px + (Math.random() - 0.5) * 8,
        y: py + (Math.random() - 0.5) * 8,
        vx: Math.cos(angle) * speed,
        vy: Math.sin(angle) * speed - (0.5 + Math.random() * 0.8),
        radius: 8 + Math.random() * 8,
        growth: 0.4 + Math.random() * 0.4,
        alpha: 0.8,
        decay: 0.018 + Math.random() * 0.012,
        color: 'rgba(200, 210, 220,',
      });
    }
  }

  /**
   * Memperbarui status fisika semua partikel aktif
   * @param {number} [dt=0.016] Selang waktu dalam detik
   */
  updateParticles(dt = 0.016) {
    const timeScale = Math.min(dt, 0.05) * 60;

    for (let i = this.particles.length - 1; i >= 0; i--) {
      const p = this.particles[i];
      p.x += p.vx * timeScale;
      p.y += p.vy * timeScale;

      if (p.type === 'smoke') {
        p.vy -= 0.02 * timeScale; // Apungan termal ke atas
        p.radius += p.growth * timeScale;
        p.alpha -= p.decay * timeScale;
      } else if (p.type === 'spark') {
        p.vy += 0.16 * timeScale; // Gravitasi percikan api
        p.alpha -= p.decay * timeScale;
      } else if (p.type === 'debris') {
        p.vy += 0.22 * timeScale; // Gravitasi serpihan batu
        p.rotation += p.rotSpeed * timeScale;
        p.alpha -= p.decay * timeScale;
      } else if (p.type === 'shockwave') {
        p.radius += p.growth * timeScale;
        p.alpha = Math.max(0, 1 - (p.radius / p.maxRadius));
      }

      if (p.alpha <= 0 || (p.type === 'shockwave' && p.radius >= p.maxRadius)) {
        this.particles.splice(i, 1);
      }
    }

    // Awan berarak perlahan
    this.cloudOffset = (this.cloudOffset + 0.12 * timeScale) % (this.width + 300);
  }

  /**
   * Merender semua partikel aktif ke canvas
   */
  drawParticles() {
    const ctx = this.ctx;
    if (!this.particles || this.particles.length === 0) return;

    ctx.save();
    for (const p of this.particles) {
      if (p.alpha <= 0) continue;

      if (p.type === 'shockwave') {
        ctx.beginPath();
        ctx.arc(p.x, p.y, p.radius, 0, Math.PI * 2);
        ctx.strokeStyle = p.color;
        ctx.globalAlpha = p.alpha;
        ctx.lineWidth = 3;
        ctx.stroke();
      } else if (p.type === 'spark') {
        ctx.beginPath();
        ctx.arc(p.x, p.y, p.radius, 0, Math.PI * 2);
        ctx.fillStyle = p.color;
        ctx.globalAlpha = p.alpha;
        ctx.fill();
      } else if (p.type === 'debris') {
        ctx.save();
        ctx.translate(p.x, p.y);
        ctx.rotate(p.rotation);
        ctx.fillStyle = p.color;
        ctx.globalAlpha = p.alpha;
        ctx.fillRect(-p.size / 2, -p.size / 2, p.size, p.size);
        ctx.restore();
      } else if (p.type === 'smoke') {
        ctx.beginPath();
        ctx.arc(p.x, p.y, p.radius, 0, Math.PI * 2);
        ctx.fillStyle = `${p.color}${Math.max(0, p.alpha)})`;
        ctx.fill();
      }
    }
    ctx.restore();
  }

  /**
   * Mengembalikan posisi koordinat pixel moncong laras meriam
   * @param {number} [angleDeg] Sudut elevasi (derajat)
   * @param {number} [initialHeightMeters] Ketinggian awal (meter)
   * @returns {{x: number, y: number, angleRad: number}}
   */
  getMuzzlePosition(angleDeg = this.lastAngleDeg || 45, initialHeightMeters = this.lastHeightMeters || 0) {
    const cannonX = this.originX;
    const cannonBaseY = this.groundY - initialHeightMeters * this.scale;
    const angleRad = (angleDeg * Math.PI) / 180;
    const barrelLength = 64;
    return {
      x: cannonX + Math.cos(angleRad) * barrelLength,
      y: cannonBaseY - Math.sin(angleRad) * barrelLength,
      angleRad: angleRad,
    };
  }

  /**
   * Konversi koordinat fisika (meter) ke koordinat pixel canvas
   * @param {number} xMeter
   * @param {number} yMeter
   * @returns {{x: number, y: number}}
   */
  toCanvasCoords(xMeter, yMeter) {
    return {
      x: this.originX + xMeter * this.scale,
      y: this.groundY - yMeter * this.scale,
    };
  }

  /**
   * Konversi koordinat pixel canvas ke koordinat fisika (meter)
   * @param {number} pixelX
   * @param {number} pixelY
   * @returns {{x: number, y: number}}
   */
  toMeterCoords(pixelX, pixelY) {
    return {
      x: (pixelX - this.originX) / this.scale,
      y: (this.groundY - pixelY) / this.scale,
    };
  }
}
