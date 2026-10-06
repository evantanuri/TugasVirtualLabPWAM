/**
 * CONTROLS.JS — Interaksi UI & Native HTML5 Drag and Drop API
 *
 * Mengelola:
 * 1. Native HTML5 Drag and Drop amunisi ke moncong meriam (dragstart, dragover, dragleave, drop).
 * 2. Fallback interaksi ketuk (tap-to-load) untuk kenyamanan di perangkat layar sentuh / mobile.
 * 3. Enforced Ammunition Loading State: tembakan dicegah dengan peringatan visual jika meriam kosong.
 * 4. Pengaturan sudut elevasi (0-90°), kecepatan awal v0 (0-100 m/s), ketinggian y0 (0-50 m).
 * 5. Pilihan preset gravitasi (Bumi, Bulan, Mars, Jupiter, Kustom) dan sinkronisasi tampilan <output>.
 * 6. Kontrol posisi benteng sasaran (slider dan draggable target widget).
 * 7. Opsi aerodinamika hambatan fluida udara (Cd).
 * 8. Penanganan tombol aksi (Fire, Pause, Reset, Clear Trails, Ekspor CSV, Ekspor JSON).
 * 9. Manajemen modal dialog (Panduan Praktikum & Mode Tantangan Benteng).
 */

export class ControlsManager {
  /**
   * @param {Object} options
   * @param {Function} [options.onParameterChange] - Callback saat parameter fisika berubah
   * @param {Function} [options.onFire] - Callback saat tombol TEMBAK ditekan (hanya jika amunisi sudah dimuat)
   * @param {Function} [options.onPause] - Callback saat tombol Jeda ditekan
   * @param {Function} [options.onReset] - Callback saat tombol Reset ditekan
   * @param {Function} [options.onClearTrails] - Callback saat tombol Hapus Jejak ditekan
   * @param {Function} [options.onAmmoLoaded] - Callback saat amunisi berhasil dimuat ke meriam
   * @param {Function} [options.onTargetChange] - Callback saat posisi sasaran benteng berubah
   * @param {Function} [options.onExportCSV] - Callback saat tombol Ekspor CSV ditekan
   * @param {Function} [options.onExportJSON] - Callback saat tombol Ekspor JSON ditekan
   * @param {Function} [options.onClearTable] - Callback saat tombol Bersihkan Tabel ditekan
   */
  constructor(callbacks = {}) {
    this.callbacks = callbacks;
    this.ammoLoaded = false;
    this.currentAmmo = null;
    this.alertTimeout = null;

    // Database spesifikasi amunisi standar
    this.ammoPresets = {
      iron: { type: 'iron', name: 'Besi', mass: 10.0, cd: 0.47, radius: 0.15 },
      lead: { type: 'lead', name: 'Timbal', mass: 25.0, cd: 0.47, radius: 0.12 },
      light: { type: 'light', name: 'Ringan', mass: 2.0, cd: 0.47, radius: 0.18 },
    };

    this.initDOM();
    this.bindEvents();
    this.initDragAndDrop();
    this.initTargetDraggable();
    this.initModals();

    // Sinkronisasi nilai display awal
    this.syncOutputs();
  }

  /**
   * Inisialisasi referensi elemen DOM
   */
  initDOM() {
    // Slider & Input Parameter Balistik
    this.sliderAngle = document.getElementById('sliderAngle');
    this.sliderVelocity = document.getElementById('sliderVelocity');
    this.sliderHeight = document.getElementById('sliderHeight');
    this.selectGravity = document.getElementById('selectGravity');
    this.customGravityGroup = document.getElementById('customGravityGroup');
    this.sliderCustomGravity = document.getElementById('sliderCustomGravity');
    this.sliderTarget = document.getElementById('sliderTarget');

    // Aerodinamika & Hambatan Udara
    this.checkAirResistance = document.getElementById('checkAirResistance');
    this.dragCoeffGroup = document.getElementById('dragCoeffGroup');
    this.sliderDragCoeff = document.getElementById('sliderDragCoeff');

    // Output Displays
    this.valAngle = document.getElementById('valAngle');
    this.valVelocity = document.getElementById('valVelocity');
    this.valHeight = document.getElementById('valHeight');
    this.valGravityDisplay = document.getElementById('valGravityDisplay');
    this.valCustomGravity = document.getElementById('valCustomGravity');
    this.valTarget = document.getElementById('valTarget');
    this.valDragCoeff = document.getElementById('valDragCoeff');

    // Tombol Aksi Utama
    this.btnFire = document.getElementById('btnFire');
    this.btnPause = document.getElementById('btnPause');
    this.btnReset = document.getElementById('btnReset');
    this.btnClearTrails = document.getElementById('btnClearTrails');

    // Tombol Riwayat & Ekspor
    this.btnExportCSV = document.getElementById('btnExportCSV');
    this.btnExportJSON = document.getElementById('btnExportJSON');
    this.btnClearTable = document.getElementById('btnClearTable');
    this.trialsTableBody = document.getElementById('trialsTableBody');

    // Rak Amunisi & Drop Zone
    this.ammoShelf = document.getElementById('ammoShelf');
    this.ammoStatus = document.getElementById('ammoStatus');
    this.ammoStatusBadge = document.getElementById('ammoStatusBadge');
    this.ammoAlert = document.getElementById('ammoAlert');
    this.cannonDropZone = document.getElementById('cannonDropZone');

    // Target Draggable Widget & Canvas
    this.targetDraggable = document.getElementById('targetDraggable');
    this.targetWidgetLabel = document.getElementById('targetWidgetLabel');
    this.simCanvas = document.getElementById('simCanvas');

    // Modal Panduan & Tantangan
    this.btnHelp = document.getElementById('btnHelp');
    this.labModal = document.getElementById('labModal');
    this.modalClose = document.getElementById('modalClose');
    this.modalActionBtn = document.getElementById('modalActionBtn');

    this.btnChallenge = document.getElementById('btnChallenge');
    this.challengeModal = document.getElementById('challengeModal');
    this.challengeModalClose = document.getElementById('challengeModalClose');
    this.challengeStartBtn = document.getElementById('challengeStartBtn');
    this.challengeRandomizeBtn = document.getElementById('challengeRandomizeBtn');
    this.challengeTargetDist = document.getElementById('challengeTargetDist');
  }

  /**
   * Mengikat seluruh listener event kontrol parameter & tombol aksi
   */
  bindEvents() {
    // Listener Slider Perubahan Nilai Real-Time
    const handleSliderInput = () => {
      this.syncOutputs();
      this.notifyChange();
    };

    this.sliderAngle?.addEventListener('input', handleSliderInput);
    this.sliderVelocity?.addEventListener('input', handleSliderInput);
    this.sliderHeight?.addEventListener('input', handleSliderInput);
    this.sliderTarget?.addEventListener('input', () => {
      this.syncOutputs();
      if (this.callbacks.onTargetChange) {
        this.callbacks.onTargetChange(Number(this.sliderTarget.value));
      }
      this.notifyChange();
    });

    // Pilihan Lingkungan Gravitasi
    this.selectGravity?.addEventListener('change', () => {
      const isCustom = this.selectGravity.value === 'custom';
      if (this.customGravityGroup) {
        this.customGravityGroup.classList.toggle('hidden', !isCustom);
      }
      this.syncOutputs();
      this.notifyChange();
    });

    this.sliderCustomGravity?.addEventListener('input', handleSliderInput);

    // Opsi Aerodinamika Hambatan Udara
    this.checkAirResistance?.addEventListener('change', () => {
      const active = Boolean(this.checkAirResistance.checked);
      if (this.dragCoeffGroup) {
        this.dragCoeffGroup.classList.toggle('hidden', !active);
      }
      this.notifyChange();
    });

    this.sliderDragCoeff?.addEventListener('input', handleSliderInput);

    // Tombol Fire dengan Ammunition Requirement Enforcement
    this.btnFire?.addEventListener('click', () => {
      this.handleFireAttempt();
    });

    // Tombol Pause/Resume
    this.btnPause?.addEventListener('click', () => {
      if (this.callbacks.onPause) this.callbacks.onPause();
      window.dispatchEvent(new CustomEvent('virtual-lab:pause-toggle'));
    });

    // Tombol Reset
    this.btnReset?.addEventListener('click', () => {
      if (this.callbacks.onReset) this.callbacks.onReset();
      window.dispatchEvent(new CustomEvent('virtual-lab:reset'));
    });

    // Tombol Clear Trails
    this.btnClearTrails?.addEventListener('click', () => {
      if (this.callbacks.onClearTrails) this.callbacks.onClearTrails();
      window.dispatchEvent(new CustomEvent('virtual-lab:clear-trails'));
    });

    // Tombol Ekspor CSV
    this.btnExportCSV?.addEventListener('click', () => {
      if (this.callbacks.onExportCSV) this.callbacks.onExportCSV();
      window.dispatchEvent(new CustomEvent('virtual-lab:export-csv'));
    });

    // Tombol Ekspor JSON
    this.btnExportJSON?.addEventListener('click', () => {
      if (this.callbacks.onExportJSON) this.callbacks.onExportJSON();
      window.dispatchEvent(new CustomEvent('virtual-lab:export-json'));
    });

    // Tombol Bersihkan Tabel Riwayat
    this.btnClearTable?.addEventListener('click', () => {
      if (this.callbacks.onClearTable) {
        this.callbacks.onClearTable();
      } else {
        this.clearTrialsTable();
      }
      window.dispatchEvent(new CustomEvent('virtual-lab:clear-table'));
    });
  }

  /**
   * Memperbarui seluruh elemen <output> agar sinkron dengan nilai slider
   */
  syncOutputs() {
    if (this.valAngle && this.sliderAngle) {
      this.valAngle.textContent = `${this.sliderAngle.value}°`;
    }
    if (this.valVelocity && this.sliderVelocity) {
      this.valVelocity.textContent = `${this.sliderVelocity.value} m/s`;
    }
    if (this.valHeight && this.sliderHeight) {
      this.valHeight.textContent = `${this.sliderHeight.value} m`;
    }
    if (this.valTarget && this.sliderTarget) {
      this.valTarget.textContent = `${this.sliderTarget.value} m`;
      if (this.targetWidgetLabel) {
        this.targetWidgetLabel.textContent = `Benteng: ${this.sliderTarget.value}m`;
      }
      if (this.challengeTargetDist) {
        this.challengeTargetDist.textContent = `${Number(this.sliderTarget.value).toFixed(1)} m`;
      }
    }
    if (this.valDragCoeff && this.sliderDragCoeff) {
      this.valDragCoeff.textContent = Number(this.sliderDragCoeff.value).toFixed(2);
    }

    const g = this.getGravity();
    if (this.valGravityDisplay) {
      this.valGravityDisplay.textContent = `${g.toFixed(2)} m/s²`;
    }
    if (this.valCustomGravity && this.sliderCustomGravity) {
      this.valCustomGravity.textContent = `${Number(this.sliderCustomGravity.value).toFixed(2)} m/s²`;
    }
  }

  /**
   * Menghitung nilai percepatan gravitasi yang sedang aktif
   * @returns {number} Nilai g dalam m/s²
   */
  getGravity() {
    if (this.selectGravity?.value === 'custom') {
      return Number(this.sliderCustomGravity?.value || 9.81);
    }
    return Number(this.selectGravity?.value || 9.81);
  }

  /**
   * Mengirimkan parameter terkini ke callback pemanggil
   */
  notifyChange() {
    if (!this.callbacks.onParameterChange) return;

    const params = {
      angleDeg: Number(this.sliderAngle?.value || 45),
      v0: Number(this.sliderVelocity?.value || 45),
      y0: Number(this.sliderHeight?.value || 0),
      g: this.getGravity(),
      targetDistance: Number(this.sliderTarget?.value || 210),
      airResistance: Boolean(this.checkAirResistance?.checked),
      dragCoefficient: Number(this.sliderDragCoeff?.value || 0.47),
      ammo: this.currentAmmo,
    };

    this.callbacks.onParameterChange(params);
  }

  /**
   * Inisialisasi Native HTML5 Drag and Drop API untuk Pemuatan Amunisi
   */
  initDragAndDrop() {
    const ammoItems = document.querySelectorAll('.ammo-item');

    ammoItems.forEach((item) => {
      // 1. Dragstart: Simpan data payload amunisi ke dataTransfer
      item.addEventListener('dragstart', (e) => {
        const ammoType = item.getAttribute('data-type') || 'iron';
        const ammoData = this.ammoPresets[ammoType] || {
          type: ammoType,
          name: item.getAttribute('data-name') || 'Standar',
          mass: Number(item.getAttribute('data-mass') || 10),
          cd: Number(item.getAttribute('data-cd') || 0.47),
          radius: Number(item.getAttribute('data-radius') || 0.15),
        };

        e.dataTransfer.setData('text/plain', ammoType);
        e.dataTransfer.setData('application/json', JSON.stringify(ammoData));
        e.dataTransfer.effectAllowed = 'copy';

        item.classList.add('is-dragging');
      });

      // 2. Dragend: Bersihkan efek visual dragging
      item.addEventListener('dragend', () => {
        item.classList.remove('is-dragging');
      });

      // 3. Mobile / Touch Fallback: Tap langsung pada kartu amunisi untuk memuat
      item.addEventListener('click', () => {
        const ammoType = item.getAttribute('data-type') || 'iron';
        this.loadAmmo(ammoType);
      });

      // Keyboard accessibility (Enter atau Space untuk memilih amunisi)
      item.addEventListener('keydown', (e) => {
        if (e.key === 'Enter' || e.key === ' ') {
          e.preventDefault();
          const ammoType = item.getAttribute('data-type') || 'iron';
          this.loadAmmo(ammoType);
        }
      });
    });

    // Cannon Drop Zone Listeners
    if (this.cannonDropZone) {
      this.cannonDropZone.addEventListener('dragenter', (e) => {
        e.preventDefault();
        this.cannonDropZone.classList.add('drop-zone--active', 'drag-over');
      });

      this.cannonDropZone.addEventListener('dragover', (e) => {
        e.preventDefault();
        e.dataTransfer.dropEffect = 'copy';
        this.cannonDropZone.classList.add('drop-zone--active', 'drag-over');
      });

      this.cannonDropZone.addEventListener('dragleave', () => {
        this.cannonDropZone.classList.remove('drop-zone--active', 'drag-over');
      });

      this.cannonDropZone.addEventListener('drop', (e) => {
        e.preventDefault();
        this.cannonDropZone.classList.remove('drop-zone--active', 'drag-over');

        let ammoType = e.dataTransfer.getData('text/plain');
        const jsonPayload = e.dataTransfer.getData('application/json');

        if (jsonPayload) {
          try {
            const parsed = JSON.parse(jsonPayload);
            if (parsed.type) ammoType = parsed.type;
          } catch (_) {}
        }

        if (ammoType) {
          this.loadAmmo(ammoType);
        }
      });
    }
  }

  /**
   * Memuat amunisi ke dalam laras meriam dan memperbarui status visual
   * @param {string|Object} ammoIdentifier Jenis atau objek amunisi
   */
  loadAmmo(ammoIdentifier) {
    let ammoObj;
    if (typeof ammoIdentifier === 'string') {
      ammoObj = this.ammoPresets[ammoIdentifier] || {
        type: ammoIdentifier,
        name: ammoIdentifier.toUpperCase(),
        mass: 10.0,
        cd: 0.47,
        radius: 0.15,
      };
    } else if (ammoIdentifier && typeof ammoIdentifier === 'object') {
      ammoObj = ammoIdentifier;
    } else {
      ammoObj = this.ammoPresets.iron;
    }

    this.ammoLoaded = true;
    this.currentAmmo = ammoObj;

    // Perbarui badge status amunisi
    if (this.ammoStatusBadge) {
      this.ammoStatusBadge.textContent = `DIMUAT: ${ammoObj.name} (${ammoObj.mass} kg)`;
      this.ammoStatusBadge.className = 'status-badge status-badge--loaded';
    }

    // Bersihkan alert peringatan jika ada
    this.hideAmmoAlert();

    // Beri visual selection pada kartu amunisi di shelf
    const ammoItems = document.querySelectorAll('.ammo-item');
    ammoItems.forEach((el) => {
      const match = el.getAttribute('data-type') === ammoObj.type;
      el.classList.toggle('is-selected', match);
    });

    // Notifikasi callback
    if (this.callbacks.onAmmoLoaded) {
      this.callbacks.onAmmoLoaded(ammoObj.type, ammoObj);
    }

    // Dispatch global event untuk modul lain (Canvas, Audio, Engine)
    window.dispatchEvent(new CustomEvent('virtual-lab:ammo-loaded', { detail: ammoObj }));
    this.notifyChange();
  }

  /**
   * Mengonsumsi amunisi setelah tembakan diluncurkan
   */
  consumeAmmo() {
    this.ammoLoaded = false;
    if (this.ammoStatusBadge) {
      this.ammoStatusBadge.textContent = 'Kosong (Siap Diisi)';
      this.ammoStatusBadge.className = 'status-badge status-badge--empty';
    }
    const ammoItems = document.querySelectorAll('.ammo-item');
    ammoItems.forEach((el) => el.classList.remove('is-selected'));

    window.dispatchEvent(new CustomEvent('virtual-lab:ammo-consumed'));
  }

  /**
   * Memeriksa apakah amunisi sudah dimuat ke meriam
   * @returns {boolean}
   */
  isAmmoLoaded() {
    return this.ammoLoaded;
  }

  /**
   * Mendapatkan objek amunisi yang saat ini aktif
   * @returns {Object|null}
   */
  getLoadedAmmo() {
    return this.currentAmmo;
  }

  /**
   * Menangani upaya penekanan tombol tembak.
   * Menerapkan aturan integritas: jika amunisi belum dimuat, tembakan dibatalkan
   * dan sistem menampilkan peringatan visual yang jelas.
   */
  handleFireAttempt() {
    if (!this.ammoLoaded) {
      this.showAmmoAlert();
      return;
    }

    // Sembunyikan alert jika ada
    this.hideAmmoAlert();

    // Jalankan callback penembakan
    if (this.callbacks.onFire) {
      this.callbacks.onFire();
    }
    window.dispatchEvent(new CustomEvent('virtual-lab:fire', { detail: this.currentAmmo }));
  }

  /**
   * Menampilkan alert peringatan bahwa amunisi belum dimuat
   */
  showAmmoAlert() {
    if (this.ammoAlert) {
      this.ammoAlert.classList.remove('hidden');
      this.ammoAlert.classList.remove('alert-shake');
      // Trigger reflow untuk animasi shake
      void this.ammoAlert.offsetWidth;
      this.ammoAlert.classList.add('alert-shake');
    }

    if (this.ammoShelf) {
      this.ammoShelf.classList.remove('alert-shake');
      void this.ammoShelf.offsetWidth;
      this.ammoShelf.classList.add('alert-shake');
    }

    // Auto-hide alert setelah 4 detik
    if (this.alertTimeout) clearTimeout(this.alertTimeout);
    this.alertTimeout = setTimeout(() => {
      this.hideAmmoAlert();
    }, 4000);
  }

  /**
   * Menyembunyikan alert peringatan amunisi
   */
  hideAmmoAlert() {
    if (this.ammoAlert) {
      this.ammoAlert.classList.add('hidden');
      this.ammoAlert.classList.remove('alert-shake');
    }
    if (this.ammoShelf) {
      this.ammoShelf.classList.remove('alert-shake');
    }
    if (this.alertTimeout) {
      clearTimeout(this.alertTimeout);
      this.alertTimeout = null;
    }
  }

  /**
   * Inisialisasi Draggable Target Flag Widget & Canvas Drop Listener
   */
  initTargetDraggable() {
    if (!this.targetDraggable) return;

    // HTML5 Drag Event pada Bendera Target
    this.targetDraggable.addEventListener('dragstart', (e) => {
      e.dataTransfer.setData('text/plain', 'target-flag');
      e.dataTransfer.effectAllowed = 'move';
    });

    // Dukungan Drag & Drop langsung di area Canvas Battlefield
    if (this.simCanvas) {
      this.simCanvas.addEventListener('dragover', (e) => {
        e.preventDefault();
        e.dataTransfer.dropEffect = 'move';
      });

      this.simCanvas.addEventListener('drop', (e) => {
        e.preventDefault();
        const payload = e.dataTransfer.getData('text/plain');

        // Jika amunisi di-drop di canvas dekat moncong meriam, muat amunisi
        if (payload && this.ammoPresets[payload]) {
          this.loadAmmo(payload);
          return;
        }

        // Jika bendera sasaran di-drop pada canvas, hitung jarak baru berdasarkan posisi x
        const rect = this.simCanvas.getBoundingClientRect();
        const clickPixelX = (e.clientX - rect.left) * (this.simCanvas.width / rect.width);
        const originX = 80;
        const scale = 3.2; // 1 meter = 3.2 pixel

        let targetMeters = Math.round((clickPixelX - originX) / scale);
        targetMeters = Math.max(50, Math.min(250, targetMeters));

        if (this.sliderTarget) {
          this.sliderTarget.value = targetMeters;
          this.syncOutputs();
          if (this.callbacks.onTargetChange) {
            this.callbacks.onTargetChange(targetMeters);
          }
          this.notifyChange();
        }
      });
    }
  }

  /**
   * Inisialisasi Modal Komponen (WAI-ARIA & Standalone Resilient)
   */
  initModals() {
    // 1. Modal Panduan Praktikum (labModal)
    const openLabModal = () => this.labModal?.classList.remove('hidden');
    const closeLabModal = () => this.labModal?.classList.add('hidden');

    this.btnHelp?.addEventListener('click', openLabModal);
    this.modalClose?.addEventListener('click', closeLabModal);
    this.modalActionBtn?.addEventListener('click', closeLabModal);
    this.labModal?.addEventListener('click', (e) => {
      if (e.target === this.labModal) closeLabModal();
    });

    // 2. Modal Mode Tantangan Benteng (challengeModal)
    const openChallengeModal = () => {
      if (this.sliderTarget && this.challengeTargetDist) {
        this.challengeTargetDist.textContent = `${Number(this.sliderTarget.value).toFixed(1)} m`;
      }
      this.challengeModal?.classList.remove('hidden');
    };
    const closeChallengeModal = () => this.challengeModal?.classList.add('hidden');

    this.btnChallenge?.addEventListener('click', openChallengeModal);
    this.challengeModalClose?.addEventListener('click', closeChallengeModal);
    this.challengeStartBtn?.addEventListener('click', closeChallengeModal);
    this.challengeModal?.addEventListener('click', (e) => {
      if (e.target === this.challengeModal) closeChallengeModal();
    });

    // Tombol Acak Posisi Benteng pada Mode Tantangan
    this.challengeRandomizeBtn?.addEventListener('click', () => {
      // Jarak benteng acak antara 120m hingga 240m
      const randomDist = Math.floor(Math.random() * (240 - 120 + 1)) + 120;
      if (this.sliderTarget) {
        this.sliderTarget.value = randomDist;
        this.syncOutputs();
        if (this.callbacks.onTargetChange) {
          this.callbacks.onTargetChange(randomDist);
        }
        this.notifyChange();
      }
    });

    // Keyboard ESC untuk menutup modal aktif
    window.addEventListener('keydown', (e) => {
      if (e.key === 'Escape') {
        closeLabModal();
        closeChallengeModal();
      }
    });
  }

  /**
   * Mengosongkan baris tabel riwayat percobaan
   */
  clearTrialsTable() {
    if (!this.trialsTableBody) return;
    this.trialsTableBody.innerHTML = `
      <tr id="emptyTableRow">
        <td colspan="11" class="empty-table-cell">
          Belum ada data percobaan. Muat amunisi ke moncong meriam lalu tekan tombol "🚀 TEMBAK" untuk memulai eksperimen.
        </td>
      </tr>
    `;
  }
}
