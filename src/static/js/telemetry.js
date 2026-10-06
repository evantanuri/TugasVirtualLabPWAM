/**
 * TELEMETRY.JS — Live HUD Dashboard, Session Tracker & Lab Report Exporter
 * Menampilkan telemetri real-time (t, x, y, vx, vy, v, h_max, R, status Hit/Miss),
 * mencatat riwayat percobaan ke localStorage sesuai skema LabExperimentSession (AGENTS.md §5.4),
 * dan mengekspor data ke format CSV (dengan UTF-8 BOM) & JSON dengan auto-fallback lokal.
 */

export class TelemetryManager {
  constructor() {
    this.initDOM();
    this.session = this.loadOrCreateSession();
    this.renderHistoryTable();
    this.bindExportButtons();
  }

  initDOM() {
    this.hudTime = document.getElementById('hudTime');
    this.hudPos = document.getElementById('hudPos');
    this.hudSpeed = document.getElementById('hudSpeed');
    this.hudHMax = document.getElementById('hudHMax');
    this.hudRange = document.getElementById('hudRange');
    this.telemetryHUD = document.getElementById('telemetryHUD');
    this.hudStatus = document.getElementById('hudStatus');
    this.hudStatusBadge = document.getElementById('hudStatusBadge');

    // Pastikan ada elemen status di HUD bar jika belum ada di template
    if (!this.hudStatus && this.telemetryHUD) {
      const statusItem = document.createElement('div');
      statusItem.className = 'telemetry-item';
      statusItem.id = 'telemetryStatusItem';
      statusItem.innerHTML = `
        <span class="telemetry-label">Status:</span>
        <span class="telemetry-val" id="hudStatus">
          <span class="status-badge status-badge--ready" id="hudStatusBadge">SIAP</span>
        </span>
      `;
      this.telemetryHUD.appendChild(statusItem);
      this.hudStatus = document.getElementById('hudStatus');
      this.hudStatusBadge = document.getElementById('hudStatusBadge');
    }
  }

  /**
   * Perbarui tampilan HUD secara real-time per-frame
   */
  updateHUD({
    t = 0,
    x = 0,
    y = 0,
    vx = 0,
    vy = 0,
    v = 0,
    hMax = 0,
    range = 0,
    status = null,
  }) {
    if (this.hudTime) this.hudTime.textContent = `${t.toFixed(2)} s`;
    if (this.hudPos) this.hudPos.textContent = `(${x.toFixed(1)}, ${y.toFixed(1)}) m`;

    if (this.hudSpeed) {
      if (vx !== 0 || vy !== 0) {
        this.hudSpeed.textContent = `${v.toFixed(1)} m/s`;
        this.hudSpeed.title = `vx: ${vx.toFixed(1)} m/s | vy: ${vy.toFixed(1)} m/s`;
      } else {
        this.hudSpeed.textContent = `${v.toFixed(1)} m/s`;
      }
    }

    if (this.hudHMax) this.hudHMax.textContent = `${hMax.toFixed(1)} m`;
    if (this.hudRange) this.hudRange.textContent = `${range.toFixed(1)} m`;

    if (status) {
      this.setStatus(status);
    }
  }

  /**
   * Set status dan warna indikator status HUD
   */
  setStatus(statusText, type = 'info') {
    const targetBadge = this.hudStatusBadge || this.hudStatus;
    if (!targetBadge) return;

    targetBadge.textContent = statusText;

    if (type === 'hit' || statusText.includes('HIT')) {
      targetBadge.className = 'status-badge status-badge--hit';
      targetBadge.style.color = '#10b981';
    } else if (type === 'miss' || statusText.includes('MISS')) {
      targetBadge.className = 'status-badge status-badge--miss';
      targetBadge.style.color = '#ef4444';
    } else if (type === 'warn' || statusText.includes('JEDA')) {
      targetBadge.className = 'status-badge status-badge--paused';
      targetBadge.style.color = '#f59e0b';
    } else if (statusText.includes('MELUNCUR')) {
      targetBadge.className = 'status-badge status-badge--flying';
      targetBadge.style.color = '#0284c7';
    } else {
      targetBadge.className = 'status-badge status-badge--ready';
      targetBadge.style.color = '#0284c7';
    }
  }

  /**
   * Reset seluruh nilai HUD ke titik awal
   */
  reset() {
    this.updateHUD({
      t: 0,
      x: 0,
      y: 0,
      vx: 0,
      vy: 0,
      v: 0,
      hMax: 0,
      range: 0,
      status: 'SIAP',
    });
  }

  // Alias kompatibilitas
  update(data) {
    this.updateHUD(data);
  }

  /**
   * Muat atau buat sesi praktikum baru sesuai LabExperimentSession (AGENTS.md §5.4)
   */
  loadOrCreateSession() {
    try {
      const stored = localStorage.getItem('tpb_lab_session');
      if (stored) {
        const parsed = JSON.parse(stored);
        if (parsed.session_id && Array.isArray(parsed.trials)) {
          return parsed;
        }
      }
    } catch {
      // Abaikan error localStorage jika dibatasi
    }

    const newSession = {
      session_id: 'lab-session-' + Date.now().toString(36) + '-' + Math.random().toString(36).substr(2, 5),
      student_name: 'Mahasiswa TPB ITB',
      experiment_timestamp: new Date().toISOString(),
      trials: [],
    };
    this.saveSession(newSession);
    return newSession;
  }

  saveSession(sessionData) {
    this.session = sessionData;
    try {
      localStorage.setItem('tpb_lab_session', JSON.stringify(sessionData));
    } catch {
      // Storage quota exceeded or disabled
    }
  }

  /**
   * Catat satu data percobaan tembakan baru ke sesi praktikum
   * @param {Object} trialData
   */
  recordTrial({
    v0 = 45.0,
    angle = 45.0,
    y0 = 0.0,
    g = 9.81,
    simulatedRange = 0.0,
    theoreticalRange = 0.0,
    hMax = 0.0,
    status = 'VALID',
    ammoType = 'iron',
  }) {
    const trialNumber = this.session.trials.length + 1;
    const simR = Number(simulatedRange.toFixed(2));
    const theoR = Number(theoreticalRange.toFixed(2));
    const hMaxVal = Number(hMax.toFixed(2));

    // Hitung error relatif persentase
    let relError = 0.0;
    if (theoR > 0) {
      relError = Number(((Math.abs(simR - theoR) / theoR) * 100).toFixed(2));
    }

    const trialRecord = {
      trial_number: trialNumber,
      v0: Number(v0.toFixed(1)),
      angle: Number(angle.toFixed(1)),
      y0: Number(y0.toFixed(1)),
      g: Number(g.toFixed(2)),
      ammo_type: ammoType,
      simulated_range: simR,
      theoretical_range: theoR,
      relative_error_percentage: relError,
      h_max: hMaxVal,
      status: status,
      timestamp: new Date().toISOString(),
    };

    this.session.trials.push(trialRecord);
    this.saveSession(this.session);
    this.renderHistoryTable();

    return trialRecord;
  }

  /**
   * Render riwayat percobaan pada tabel DOM (11 Kolom)
   */
  renderHistoryTable() {
    const tableBody =
      document.getElementById('trialsTableBody') ||
      document.querySelector('#trialsTable tbody') ||
      document.querySelector('#experimentTable tbody') ||
      document.querySelector('.experiment-table tbody');

    if (!tableBody) return;

    if (this.session.trials.length === 0) {
      tableBody.innerHTML = `
        <tr id="emptyTableRow">
          <td colspan="11" class="empty-table-cell" style="text-align:center; padding:1.25rem; color:#94a3b8;">
            Belum ada data percobaan. Muat amunisi ke moncong meriam lalu tekan tombol "🚀 TEMBAK" untuk memulai eksperimen.
          </td>
        </tr>
      `;
      return;
    }

    tableBody.innerHTML = this.session.trials
      .map((t) => {
        const isHit = t.status.includes('HIT');
        const isMiss = t.status.includes('MISS');
        const badgeClass = isHit
          ? 'status-badge--hit'
          : isMiss
          ? 'status-badge--miss'
          : 'status-badge--ready';

        return `
          <tr>
            <td><strong>#${t.trial_number}</strong></td>
            <td>${t.v0}</td>
            <td>${t.angle}°</td>
            <td>${t.y0}</td>
            <td>${t.g}</td>
            <td><span class="ammo-tag">${t.ammo_type || 'Besi'}</span></td>
            <td><strong>${t.simulated_range}</strong></td>
            <td>${t.theoretical_range}</td>
            <td>${t.relative_error_percentage}%</td>
            <td>${t.h_max !== undefined ? t.h_max : '-'}</td>
            <td><span class="status-badge ${badgeClass}">${t.status}</span></td>
          </tr>
        `;
      })
      .join('');
  }

  /**
   * Menghasilkan konten CSV yang sesuai standar RFC 4180 dengan UTF-8 BOM
   */
  generateCSVContent() {
    const bom = '\uFEFF';
    const headers = [
      'trial_number',
      'v0',
      'angle',
      'y0',
      'g',
      'ammo_type',
      'simulated_range',
      'theoretical_range',
      'relative_error_percentage',
      'h_max',
      'status',
      'timestamp',
    ];

    const rows = this.session.trials.map((t) => [
      t.trial_number,
      t.v0,
      t.angle,
      t.y0,
      t.g,
      `"${t.ammo_type || 'standard'}"`,
      t.simulated_range,
      t.theoretical_range,
      t.relative_error_percentage,
      t.h_max !== undefined ? t.h_max : 0,
      `"${t.status}"`,
      `"${t.timestamp || ''}"`,
    ]);

    const csvBody = [headers.join(','), ...rows.map((r) => r.join(','))].join('\r\n');
    return bom + csvBody;
  }

  /**
   * Unduh data langsung di sisi klien via Blob API
   */
  downloadBlob(content, filename, mimeType) {
    const blob = new Blob([content], { type: mimeType });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = filename;
    document.body.appendChild(a);
    a.click();
    setTimeout(() => {
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
    }, 100);
  }

  /**
   * Ekspor data praktikum ke CSV dengan prioritas POST /api/export dan auto-fallback client
   */
  async exportCSV() {
    if (this.session.trials.length === 0) {
      alert('Belum ada data percobaan yang tercatat untuk diekspor!');
      return;
    }

    const filename = `Laporan_Praktikum_TPB_${Date.now()}.csv`;

    // Coba ekspor via backend REST API
    try {
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 1500);

      const res = await fetch('/api/export', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          format: 'csv',
          session: this.session,
          trials: this.session.trials,
        }),
        signal: controller.signal,
      });
      clearTimeout(timeoutId);

      if (res.ok) {
        const text = await res.text();
        this.downloadBlob(text, filename, 'text/csv;charset=utf-8;');
        return;
      }
    } catch {
      // Graceful local fallback saat server offline
    }

    // Client-side fallback instan
    const csvContent = this.generateCSVContent();
    this.downloadBlob(csvContent, filename, 'text/csv;charset=utf-8;');
  }

  /**
   * Ekspor data praktikum ke JSON sesuai skema LabExperimentSession (AGENTS.md §5.4)
   */
  async exportJSON() {
    if (this.session.trials.length === 0) {
      alert('Belum ada data percobaan yang tercatat untuk diekspor!');
      return;
    }

    const filename = `Laporan_Praktikum_TPB_${Date.now()}.json`;
    const jsonString = JSON.stringify(this.session, null, 2);

    // Coba ekspor via backend REST API
    try {
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 1500);

      const res = await fetch('/api/export', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          format: 'json',
          session: this.session,
          trials: this.session.trials,
        }),
        signal: controller.signal,
      });
      clearTimeout(timeoutId);

      if (res.ok) {
        const data = await res.json();
        const exportContent = typeof data === 'string' ? data : JSON.stringify(data, null, 2);
        this.downloadBlob(exportContent, filename, 'application/json;charset=utf-8;');
        return;
      }
    } catch {
      // Graceful local fallback saat server offline
    }

    // Client-side fallback instan
    this.downloadBlob(jsonString, filename, 'application/json;charset=utf-8;');
  }

  /**
   * Bind tombol export jika elemen ada di DOM
   */
  bindExportButtons() {
    const btnExportCSV =
      document.getElementById('btnExportCSV') || document.querySelector('[data-export="csv"]');
    const btnExportJSON =
      document.getElementById('btnExportJSON') || document.querySelector('[data-export="json"]');
    const btnClearTable =
      document.getElementById('btnClearTable') || document.getElementById('btnClearHistory');

    btnExportCSV?.addEventListener('click', () => this.exportCSV());
    btnExportJSON?.addEventListener('click', () => this.exportJSON());

    btnClearTable?.addEventListener('click', () => {
      this.clearHistory();
    });

    // Dengarkan juga CustomEvent dari ControlsManager
    window.addEventListener('virtual-lab:export-csv', () => this.exportCSV());
    window.addEventListener('virtual-lab:export-json', () => this.exportJSON());
    window.addEventListener('virtual-lab:clear-table', () => this.clearHistory());
  }

  /**
   * Bersihkan semua riwayat percobaan
   */
  clearHistory() {
    this.session.trials = [];
    this.saveSession(this.session);
    this.renderHistoryTable();
  }
}

// Ekspor keduanya untuk kompatibilitas import
export { TelemetryManager as TelemetryDashboard };
