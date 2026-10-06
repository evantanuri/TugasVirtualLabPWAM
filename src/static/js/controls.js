/**
 * CONTROLS.JS — Interaksi UI & HTML5 Drag and Drop API
 * Menangani slider sudut/kecepatan, tombol tembak, dan drag-and-drop amunisi ke meriam.
 */

export class ControlsManager {
  constructor({ onParameterChange, onFire, onPause, onReset, onAmmoLoaded }) {
    this.callbacks = { onParameterChange, onFire, onPause, onReset, onAmmoLoaded };
    this.ammoLoaded = false;
    this.currentAmmo = null;
    this.initDOM();
    this.bindEvents();
    this.initDragAndDrop();
  }

  initDOM() {
    this.sliderAngle = document.getElementById('sliderAngle');
    this.sliderVelocity = document.getElementById('sliderVelocity');
    this.sliderHeight = document.getElementById('sliderHeight');
    this.selectGravity = document.getElementById('selectGravity');

    this.valAngle = document.getElementById('valAngle');
    this.valVelocity = document.getElementById('valVelocity');
    this.valHeight = document.getElementById('valHeight');

    this.btnFire = document.getElementById('btnFire');
    this.btnPause = document.getElementById('btnPause');
    this.btnReset = document.getElementById('btnReset');
    this.ammoStatus = document.getElementById('ammoStatus');
    this.cannonDropZone = document.getElementById('cannonDropZone');
  }

  bindEvents() {
    const notifyChange = () => {
      this.valAngle.textContent = `${this.sliderAngle.value}°`;
      this.valVelocity.textContent = `${this.sliderVelocity.value} m/s`;
      this.valHeight.textContent = `${this.sliderHeight.value} m`;

      if (this.callbacks.onParameterChange) {
        this.callbacks.onParameterChange({
          angleDeg: Number(this.sliderAngle.value),
          v0: Number(this.sliderVelocity.value),
          y0: Number(this.sliderHeight.value),
          g: Number(this.selectGravity.value),
        });
      }
    };

    this.sliderAngle?.addEventListener('input', notifyChange);
    this.sliderVelocity?.addEventListener('input', notifyChange);
    this.sliderHeight?.addEventListener('input', notifyChange);
    this.selectGravity?.addEventListener('change', notifyChange);

    this.btnFire?.addEventListener('click', () => this.callbacks.onFire && this.callbacks.onFire());
    this.btnPause?.addEventListener('click', () => this.callbacks.onPause && this.callbacks.onPause());
    this.btnReset?.addEventListener('click', () => this.callbacks.onReset && this.callbacks.onReset());
  }

  initDragAndDrop() {
    const ammoItems = document.querySelectorAll('.ammo-item');

    ammoItems.forEach((item) => {
      item.addEventListener('dragstart', (e) => {
        const ammoType = item.getAttribute('data-type');
        e.dataTransfer.setData('text/plain', ammoType);
        e.dataTransfer.effectAllowed = 'copy';
      });
    });

    if (this.cannonDropZone) {
      this.cannonDropZone.addEventListener('dragover', (e) => {
        e.preventDefault();
        e.dataTransfer.dropEffect = 'copy';
        this.cannonDropZone.classList.add('drag-over');
      });

      this.cannonDropZone.addEventListener('dragleave', () => {
        this.cannonDropZone.classList.remove('drag-over');
      });

      this.cannonDropZone.addEventListener('drop', (e) => {
        e.preventDefault();
        this.cannonDropZone.classList.remove('drag-over');
        const ammoType = e.dataTransfer.getData('text/plain');
        this.loadAmmo(ammoType);
      });
    }
  }

  loadAmmo(ammoType) {
    this.ammoLoaded = true;
    this.currentAmmo = ammoType;
    if (this.ammoStatus) {
      this.ammoStatus.innerHTML = `Status: <span class="status-badge" style="color:#10b981;">Dimuat (${ammoType.toUpperCase()})</span>`;
    }
    if (this.callbacks.onAmmoLoaded) {
      this.callbacks.onAmmoLoaded(ammoType);
    }
  }
}
