/**
 * PHYSICS.JS — Engine Kinematika 2D & Balistik (Client-Side)
 * Menyediakan perhitungan analitik ideal, integrasi numerik per-frame (60 FPS),
 * opsi hambatan udara aerodinamika, deteksi tumbukan tanah & benteng sasaran,
 * serta mode tantangan target benteng dengan verifikasi lokal mandiri.
 */

export class PhysicsEngine {
  constructor(initialParams = {}) {
    this.g = initialParams.g ?? 9.81; // m/s^2
    this.v0 = initialParams.v0 ?? 45.0; // m/s
    this.angleDeg = initialParams.angleDeg ?? 45.0; // derajat
    this.y0 = initialParams.y0 ?? 0.0; // meter
    this.mass = initialParams.mass ?? 10.0; // kg (Besi: 10kg, Timbal: 25kg, Ringan: 2kg)
    this.airResistance = initialParams.airResistance ?? false;
    this.dragCoefficient = initialParams.dragCoefficient ?? 0.47; // Koefisien bola halus
    this.projectileRadius = initialParams.projectileRadius ?? 0.15; // meter
    this.airDensity = initialParams.airDensity ?? 1.225; // kg/m^3 (udara standar muka laut)
  }

  /**
   * Perbarui parameter simulasi dengan validasi nilai
   */
  setParameters(params = {}) {
    if (params.v0 !== undefined) this.v0 = Math.max(0, Math.min(150, Number(params.v0)));
    if (params.initial_velocity !== undefined) this.v0 = Math.max(0, Math.min(150, Number(params.initial_velocity)));

    if (params.angleDeg !== undefined) this.angleDeg = Math.max(0, Math.min(90, Number(params.angleDeg)));
    if (params.launch_angle !== undefined) this.angleDeg = Math.max(0, Math.min(90, Number(params.launch_angle)));

    if (params.y0 !== undefined) this.y0 = Math.max(0, Math.min(100, Number(params.y0)));
    if (params.initial_height !== undefined) this.y0 = Math.max(0, Math.min(100, Number(params.initial_height)));

    if (params.g !== undefined) this.g = Math.max(0.1, Math.min(30, Number(params.g)));
    if (params.gravity !== undefined) this.g = Math.max(0.1, Math.min(30, Number(params.gravity)));

    if (params.mass !== undefined) this.mass = Math.max(0.1, Math.min(100, Number(params.mass)));
    if (params.projectile_mass !== undefined) this.mass = Math.max(0.1, Math.min(100, Number(params.projectile_mass)));

    if (params.airResistance !== undefined) this.airResistance = Boolean(params.airResistance);
    if (params.air_resistance !== undefined) this.airResistance = Boolean(params.air_resistance);

    if (params.dragCoefficient !== undefined) this.dragCoefficient = Number(params.dragCoefficient);
    if (params.drag_coefficient !== undefined) this.dragCoefficient = Number(params.drag_coefficient);

    if (params.projectileRadius !== undefined) this.projectileRadius = Number(params.projectileRadius);
    if (params.projectile_radius !== undefined) this.projectileRadius = Number(params.projectile_radius);
  }

  /**
   * Mengembalikan posisi (x, y) dan kecepatan (vx, vy) pada waktu t (gerak analitik ideal)
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
   * Menghitung nilai analitik ideal dan format respon resmi AGENTS.md §5.2
   * Benchmark: v0=45, angle=45°, y0=0, g=9.81 -> R≈206.42m, h_max≈51.61m
   */
  calculateAnalytical(customParams = null) {
    const v0 = customParams?.v0 ?? customParams?.initial_velocity ?? this.v0;
    const angleDeg = customParams?.angleDeg ?? customParams?.launch_angle ?? this.angleDeg;
    const y0 = customParams?.y0 ?? customParams?.initial_height ?? this.y0;
    const g = customParams?.g ?? customParams?.gravity ?? this.g;

    const angleRad = (angleDeg * Math.PI) / 180;
    const v0x = v0 * Math.cos(angleRad);
    const v0y = v0 * Math.sin(angleRad);

    // Waktu puncak dan tinggi maksimum
    const tPeak = v0y > 0 ? v0y / g : 0.0;
    const hMax = v0y > 0 ? y0 + (v0y * v0y) / (2 * g) : y0;

    // Waktu terbang total hingga menyentuh y = 0
    // Persamaan kuadrat: 0 = y0 + v0y*t - 0.5*g*t^2  => 0.5*g*t^2 - v0y*t - y0 = 0
    const discriminant = v0y * v0y + 2 * g * y0;
    const flightTime = discriminant >= 0 ? (v0y + Math.sqrt(discriminant)) / g : 0.0;
    const horizontalRange = v0x * flightTime;

    // Kecepatan dan sudut tumbukan saat menyentuh permukaan tanah
    const vyFinal = v0y - g * flightTime;
    const impactVelocity = Math.sqrt(v0x * v0x + vyFinal * vyFinal);
    const impactAngleDeg = (Math.atan2(vyFinal, v0x) * 180) / Math.PI;

    // Titik-titik sampel referensi untuk visualisasi kurva
    const sampledPoints = [];
    const numSamples = 60;
    for (let i = 0; i <= numSamples; i++) {
      const sampleT = (flightTime * i) / numSamples;
      const sampleX = v0x * sampleT;
      const sampleY = Math.max(0, y0 + v0y * sampleT - 0.5 * g * sampleT * sampleT);
      const sampleVx = v0x;
      const sampleVy = v0y - g * sampleT;
      sampledPoints.push({
        t: Number(sampleT.toFixed(3)),
        x: Number(sampleX.toFixed(2)),
        y: Number(sampleY.toFixed(2)),
        vx: Number(sampleVx.toFixed(2)),
        vy: Number(sampleVy.toFixed(2)),
      });
    }

    return {
      // Skema standar AGENTS.md §5.2
      flight_time: Number(flightTime.toFixed(3)),
      max_height: Number(hMax.toFixed(3)),
      time_to_max_height: Number(tPeak.toFixed(3)),
      horizontal_range: Number(horizontalRange.toFixed(3)),
      impact_velocity: Number(impactVelocity.toFixed(3)),
      impact_angle: Number(impactAngleDeg.toFixed(2)),
      sampled_points: sampledPoints,

      // Alias kompatibilitas
      flightTime: Number(flightTime.toFixed(3)),
      hMax: Number(hMax.toFixed(3)),
      tPeak: Number(tPeak.toFixed(3)),
      horizontalRange: Number(horizontalRange.toFixed(3)),
      theoreticalRange: Number(horizontalRange.toFixed(3)),
    };
  }

  /**
   * Alias kompatibilitas untuk getAnalyticalMetrics
   */
  getAnalyticalMetrics() {
    return this.calculateAnalytical();
  }

  /**
   * Langkah integrasi numerik per-frame (60 FPS)
   * Mendukung gerak proyektil ideal maupun hambatan fluida kuadratik
   */
  stepKinematics(currentPos, currentVel, dt, options = {}) {
    const g = options.g ?? this.g;
    const airResistance = options.airResistance ?? this.airResistance;
    const mass = options.mass ?? this.mass;
    const dragCd = options.dragCoefficient ?? this.dragCoefficient;
    const radius = options.projectileRadius ?? this.projectileRadius;
    const rho = options.airDensity ?? this.airDensity;

    // Batasi delta-time untuk stabilitas integrasi
    const clampedDt = Math.min(Math.max(dt, 0.001), 0.05);

    if (!airResistance) {
      // Integrasi gerak ideal tanpa hambatan udara (bebas akumulasi error)
      const nextVx = currentVel.vx;
      const nextVy = currentVel.vy - g * clampedDt;
      const nextX = currentPos.x + currentVel.vx * clampedDt;
      const nextY = currentPos.y + currentVel.vy * clampedDt - 0.5 * g * clampedDt * clampedDt;
      const nextV = Math.sqrt(nextVx * nextVx + nextVy * nextVy);

      return {
        pos: { x: nextX, y: nextY },
        vel: { vx: nextVx, vy: nextVy, v: nextV },
      };
    }

    // Model Hambatan Udara Kuadratik (Newtonian Drag)
    // F_d = 0.5 * rho * Cd * A * v^2
    const area = Math.PI * radius * radius;
    const dragFactor = (0.5 * rho * dragCd * area) / mass;

    // Sub-stepping untuk akurasi numerik tingkat tinggi
    const subSteps = 4;
    const subDt = clampedDt / subSteps;
    let px = currentPos.x;
    let py = currentPos.y;
    let pvx = currentVel.vx;
    let pvy = currentVel.vy;

    for (let step = 0; step < subSteps; step++) {
      const speed = Math.sqrt(pvx * pvx + pvy * pvy);
      const ax = -dragFactor * speed * pvx;
      const ay = -g - dragFactor * speed * pvy;

      // Semi-implicit Euler / Velocity Verlet step
      pvx += ax * subDt;
      pvy += ay * subDt;
      px += pvx * subDt;
      py += pvy * subDt;
    }

    const currentSpeed = Math.sqrt(pvx * pvx + pvy * pvy);
    return {
      pos: { x: px, y: py },
      vel: { vx: pvx, vy: pvy, v: currentSpeed },
    };
  }

  /**
   * Deteksi tumbukan proyektil terhadap permukaan tanah dan AABB benteng sasaran
   * @param {Object} pos { x, y } dalam satuan meter
   * @param {Object} castleBounds { x, y, width, height, toleranceRadius }
   * @param {number} groundY level tanah (default 0 m)
   */
  checkCollision(pos, castleBounds = null, groundY = 0) {
    // 1. Tumbukan Benteng Sasaran (Castle AABB / Hitbox)
    if (castleBounds) {
      const castleX = castleBounds.x ?? 220;
      const castleWidth = castleBounds.width ?? 34.4; // ~110px pada skala 3.2
      const castleHeight = castleBounds.height ?? 45; // tinggi benteng
      const tolerance = castleBounds.toleranceRadius ?? 5.0;

      // Cek AABB: proyektil berada di dalam rentang benteng
      const inXRange = pos.x >= castleX - 1.0 && pos.x <= castleX + castleWidth + 1.0;
      const inYRange = pos.y >= 0 && pos.y <= castleHeight + 2.0;

      if (inXRange && inYRange) {
        const targetCenterY = castleHeight * 0.7; // Titik pusat bidikan benteng
        const distFromCenter = Math.abs(pos.y - targetCenterY);
        return {
          hit: true,
          target: 'castle',
          point: { x: pos.x, y: pos.y },
          distanceFromCenter: distFromCenter,
          isToleranceHit: distFromCenter <= tolerance,
        };
      }
    }

    // 2. Tumbukan Permukaan Tanah (Ground Collision)
    if (pos.y <= groundY) {
      return {
        hit: true,
        target: 'ground',
        point: { x: pos.x, y: groundY },
        distanceFromCenter: null,
        isToleranceHit: false,
      };
    }

    return { hit: false, target: null, point: null };
  }

  /**
   * Verifikasi tantangan benteng secara analitik lokal (sesuai backend POST /api/challenge/verify)
   * Menyediakan evaluasi instan saat offline atau Vercel static
   */
  verifyTargetHit(targetX = 180.0, targetElevation = 20.0, toleranceRadius = 5.0, params = null) {
    const v0 = params?.v0 ?? params?.initial_velocity ?? this.v0;
    const angleDeg = params?.angleDeg ?? params?.launch_angle ?? this.angleDeg;
    const y0 = params?.y0 ?? params?.initial_height ?? this.y0;
    const g = params?.g ?? params?.gravity ?? this.g;

    const angleRad = (angleDeg * Math.PI) / 180;
    const v0x = v0 * Math.cos(angleRad);
    const v0y = v0 * Math.sin(angleRad);

    if (v0x <= 0) {
      return {
        is_hit: false,
        impact_point: { x: targetX, y: 0 },
        distance_from_center: targetElevation,
        score: 0,
        feedback_message: 'Kecepatan horizontal nol atau negatif. Meriam tidak mengarah ke depan.',
      };
    }

    const tAtTarget = targetX / v0x;
    const yAtTarget = y0 + v0y * tAtTarget - 0.5 * g * tAtTarget * tAtTarget;

    const verticalDistance = Math.abs(yAtTarget - targetElevation);
    const isHit = verticalDistance <= toleranceRadius && yAtTarget >= 0;

    // Kalkulasi skor: 100 poin jika pas di pusat toleransi, berkurang linear ke batas toleransi
    const score = isHit
      ? Math.max(0, Math.min(100, Math.round(100 - (verticalDistance / toleranceRadius) * 50)))
      : 0;

    const feedbackMessage = isHit
      ? 'Tepat mengenai sasaran benteng!'
      : yAtTarget < 0
      ? 'Peluru jatuh ke tanah sebelum mencapai benteng.'
      : 'Tembakan meleset di atas/bawah target benteng sasaran.';

    return {
      is_hit: isHit,
      impact_point: {
        x: Number(targetX.toFixed(1)),
        y: Number(Math.max(0, yAtTarget).toFixed(2)),
      },
      distance_from_center: Number(verticalDistance.toFixed(2)),
      score: score,
      feedback_message: feedbackMessage,
    };
  }
}
