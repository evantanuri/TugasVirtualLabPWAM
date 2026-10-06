# CONTRIBUTING.md — Workflow, Standar Kode & Panduan Kontribusi

Dokumen ini mendefinisikan standar teknis, alur kolaborasi, konvensi penulisan kode, dan prosedur jaminan kualitas (*Quality Assurance*) untuk proyek **Virtual Lab Fisika TPB ITB: Simulasi Gerak Parabola & Tembakan Meriam**.

Panduan ini wajib dipatuhi oleh seluruh kontributor manusia maupun AI Assistant.

---

## 1. Aturan Kritis untuk AI Agents & Otomasi

Demi menjaga integritas repositori dan mencegah regresi kode:
1. 🚫 **Larangan Push Langsung ke Branch `main`:** Seluruh perubahan wajib melalui branch fitur atau diverifikasi secara lokal sebelum digabungkan.
2. 🚫 **Larangan Melakukan Commit/Merge Tanpa Konfirmasi:** AI dilarang menjalankan perintah `git commit` otomatis atau `git push` tanpa persetujuan eksplisit dari pengembang.
3. 🚫 **Larangan Instalasi Dependensi Liar:** Dilarang menambahkan pustaka baru ke dalam `requirements.txt` tanpa justifikasi rasional yang lolos audit kompatibilitas Vercel Serverless.
4. 🚫 **Larangan Mengubah Konfigurasi Sensitif:** Dilarang menyentuh berkas konfigurasi kritis seperti `.env`, sertifikat, atau kredensial rahasia.

---

## 2. Prasyarat Sistem (Prerequisites)

Sebelum memulai pengembangan lokal, pastikan lingkungan Anda memenuhi spesifikasi berikut:

* **Runtime Python:** Python 3.10.x atau lebih baru (direkomendasikan Python 3.11/3.12).
* **Package Manager:** `pip` (Python package installer) versi terbaru.
* **Peramban Web (Browser):** Google Chrome 100+, Mozilla Firefox 100+, atau Microsoft Edge dengan dukungan penuh **HTML5 Canvas 2D** dan **HTML5 Drag and Drop API**.
* **Version Control:** Git 2.30+.
* **Opsional (Deployment Simulation):** Node.js 18+ & Vercel CLI (`npm install -g vercel`) untuk menjalankan pengujian emulasi serverless lokal.

---

## 3. Panduan Setup Lingkungan Lokal (Local Setup)

Ikuti langkah-langkah presisi berikut untuk menyiapkan lingkungan pengembangan dari nol:

### Langkah 1: Kloning Repositori
```bash
git clone https://github.com/evantanuri/TugasVirtualLabPWAM.git
cd TugasVirtualLab
```

### Langkah 2: Buat dan Aktifkan Virtual Environment
```bash
# Untuk Linux / macOS:
python3 -m venv venv
source venv/bin/activate

# Untuk Windows (Command Prompt / PowerShell):
# .\venv\Scripts\activate
```

### Langkah 3: Pasang Dependensi Python
```bash
pip install --upgrade pip
pip install -r requirements.txt
```

### Langkah 4: Konfigurasi Variabel Lingkungan
Salin berkas contoh konfigurasi:
```bash
cp .env.example .env
```
Isi konfigurasi standar di `.env`:
```ini
FLASK_ENV=development
FLASK_DEBUG=1
PORT=5000
SECRET_KEY=virtual-lab-tpb-itb-secret-key-2026
```

### Langkah 5: Jalankan Server Pengembangan
```bash
python src/app.py
```
Akses aplikasi melalui peramban di: `http://127.0.0.1:5000`.

---

## 4. Checklist Setelah `git pull` atau Ganti Branch

Setiap kali Anda menarik pembaruan terbaru dari remote:
* [ ] **Cek Dependensi:** Periksa apakah ada perubahan di `requirements.txt`. Jika ada, jalankan `pip install -r requirements.txt`.
* [ ] **Cek Aset Statis:** Bersihkan cache peramban (*Hard Reload* `Ctrl+F5` atau `Cmd+Shift+R`) untuk memastikan file JavaScript dan CSS terbaru termuat.
* [ ] **Cek Sinkronisasi Dokumentasi:** Buka `PLAN.md` untuk mengetahui status modul yang sedang dikerjakan.

---

## 5. Struktur Pohon Direktori Proyek (Project Structure)

Repositori dirancang dengan pemisahan tanggung jawab (*separation of concerns*) yang bersih antara Python Middleware dan Client-side Virtual Lab Engine:

```text
TugasVirtualLab/
├── .env.example                 # Template variabel lingkungan lokal
├── .gitignore                   # Daftar pengabaian file Git (venv, cache, env)
├── vercel.json                  # Konfigurasi deployment serverless Vercel
├── requirements.txt             # Dependensi Python minimal untuk Flask & Vercel
├── AGENTS.md                    # Kontrak perilaku AI & source of truth arsitektur
├── CONTRIBUTING.md              # Standar kontribusi, workflow, dan konvensi kode
├── PLAN.md                      # Roadmap, task tracker, dan catatan teknis dinamis
├── README.md                    # Pintu masuk utama & panduan publik proyek
├── api/
│   └── index.py                 # Entrypoint WSGI Serverless Function untuk Vercel
├── src/
│   ├── __init__.py              # Python package marker
│   ├── app.py                   # Entrypoint server lokal (Flask factory & runner)
│   ├── config.py                # Konfigurasi aplikasi & environment variables
│   ├── routes/
│   │   ├── __init__.py          # Routes package marker
│   │   ├── api_routes.py        # REST API endpoints (/api/calculate, /api/challenge, dll)
│   │   └── views.py             # Route render HTML utama (Flask Blueprint views)
│   ├── services/
│   │   ├── __init__.py          # Services package marker
│   │   └── physics_engine.py    # Logika kalkulasi fisika analitik & verifikasi sasaran
│   └── static/
│       ├── css/
│       │   ├── style.css        # Tata letak global, tema lanskap, tipografi TPB
│       │   └── components.css   # Styling komponen UI: panel kontrol, slider, modal, telemetri
│       ├── js/
│       │   ├── main.js          # Inisialisasi aplikasi klien & koordinator modul
│       │   ├── physics.js       # Engine kinematika 2D klien (Euler step, kalkulasi proyektil)
│       │   ├── canvas.js        # Renderer Canvas 2D (meriam, roda, benteng, partikel asap/ledakan)
│       │   ├── controls.js      # Handler event input, slider, HTML5 Drag & Drop amunisi
│       │   └── telemetry.js     # Live telemetry dashboard & visual tracker
│       └── assets/
│           ├── images/          # Ikon, ornamen grafis benteng/meriam (jika ada)
│           └── sounds/          # Efek audio tembakan meriam & ledakan benteng
├── templates/
│   ├── index.html               # Halaman utama aplikasi (HTML5 Semantic)
│   └── components/
│       └── modal.html           # Template modal panduan lab, kuis & data export
└── tests/
    ├── __init__.py              # Tests package marker
    └── test_physics.py          # Unit test komputasi analitik fisika & endpoint API
```

---

## 6. Konvensi Branching Git

Gunakan format penamaan branch berbasis prefix yang jelas:

* `feature/<nama-fitur>` — Untuk fitur baru (misal: `feature/canvas-explosion-effect`, `feature/drag-and-drop-ammo`).
* `fix/<deskripsi-bug>` — Untuk perbaikan bug (misal: `fix/trajectory-angle-inversion`, `fix/canvas-retina-scaling`).
* `chore/<pekerjaan-rutin>` — Untuk pemeliharaan dependensi atau konfigurasi (misal: `chore/update-requirements`, `chore/vercel-json-tuning`).
* `docs/<judul-dokumen>` — Untuk pembaruan dokumentasi (misal: `docs/update-plan-roadmap`).
* `refactor/<modul>` — Untuk perapihan kode tanpa mengubah fungsionalitas (misal: `refactor/physics-engine-modularization`).

---

## 7. Konvensi Commit (Conventional Commits)

Format pesan commit wajib mengikuti standar **Conventional Commits v1.0.0**:

```text
<type>(<scope>): <deskripsi singkat imperatif dalam bahasa Indonesia atau Inggris>

[opsional body penjelasan alasan perubahan]

[opsional footer: Closes #123]
```

### Scope yang Valid:
* `canvas` — Terkait rendering visual grafik Canvas 2D, sprite meriam, benteng, atau partikel.
* `physics` — Terkait engine kalkulasi fisika, rumus kinematika, atau integrasi numerik.
* `controls` — Terkait interaksi UI, slider, tombol aksi, atau Drag & Drop API.
* `telemetry` — Terkait dashboard data, logger percobaan, atau stopwatch.
* `api` — Terkait Flask routes, backend endpoints, dan serialisasi data.
* `docs` — Terkait pembaruan file dokumentasi (`README`, `PLAN`, `CONTRIBUTING`, `AGENTS`).
* `deploy` — Terkait konfigurasi Vercel, WSGI, atau environment.

### Contoh Commit yang Baik:
```bash
git commit -m "feat(canvas): tambahkan animasi kepulan asap dan partikel ledakan benturan"
git commit -m "feat(controls): implementasikan HTML5 Drag and Drop untuk amunisi meriam"
git commit -m "fix(physics): koreksi konversi sudut elevasi derajat ke radian pada v0x"
git commit -m "docs(plan): perbarui status pengerjaan modul telemetry ke fase alpha"
```

---

## 8. Standar Gaya Kode & Konvensi Penamaan (Code Style)

### 8.1. Filosofi Desain Perangkat Lunak
* **KISS (Keep It Simple, Stupid):** Hindari abstraksi berlebihan. Utamakan kejelasan kode agar mudah dinilai oleh asisten lab TPB.
* **Separation of Concerns:** Jangan campurkan kode rendering visual Canvas ke dalam modul komputasi matematika fisika murni.
* **Defensive Input Handling:** Validasi seluruh input pengguna pada sisi klien maupun server (cegah input sudut negatif, kecepatan tak hingga, atau pembagian dengan nol).

### 8.2. Standar Frontend (HTML / CSS / JavaScript)
* **HTML5:** Gunakan elemen semantik baku: `<header>`, `<main>`, `<section>`, `<aside>`, `<canvas>`, `<footer>`. Canvas wajib memiliki atribut `width` dan `height` yang proporsional.
* **CSS3:** Gunakan *CSS Custom Properties* (`:root`) untuk tema warna (bukit, benteng, langit, panel kontrol). Tata letak wajib fleksibel (*responsive*) menggunakan CSS Grid dan Flexbox.
* **JavaScript:** Gunakan standar modern **ES6+**. Pisahkan logika ke dalam modul terpisah (`physics.js`, `canvas.js`, `controls.js`, `telemetry.js`). Hindari manipulasi global variable yang tidak terkontrol (`window.variable`).

### 8.3. Standar Backend (Python & Flask)
* Terapkan panduan gaya **PEP 8**.
* Gunakan type hinting pada fungsi-fungsi krusial di `physics_engine.py`.
* Respon API wajib menggunakan format JSON standar:
  ```json
  {
    "success": true,
    "data": { ... },
    "message": "Deskripsi singkat hasil"
  }
  ```
  atau bila error:
  ```json
  {
    "success": false,
    "error": {
      "code": "INVALID_PARAMETER",
      "message": "Sudut elevasi harus berada di antara 0 dan 90 derajat."
    }
  }
  ```

### 8.4. Tabel Konvensi Penamaan Lengkap

| Kategori | Konvensi | Contoh |
| :--- | :--- | :--- |
| **Komponen / Objek JS** | PascalCase | `CannonRenderer`, `PhysicsEngine`, `TrajectoryPoint` |
| **Fungsi & Metode (JS & Python)**| camelCase (JS) / snake_case (Py) | `calculateTrajectory()`, `drawCannon()` (JS) / `calculate_trajectory()`, `verify_target_hit()` (Py) |
| **Variabel Konstan** | UPPER_SNAKE_CASE | `DEFAULT_GRAVITY = 9.81`, `MAX_VELOCITY = 100` |
| **File Modul JavaScript** | kebab-case atau camelCase | `physics.js`, `canvas.js`, `telemetry.js` |
| **File Modul Python** | snake_case | `physics_engine.py`, `api_routes.py` |
| **Endpoint REST API** | kebab-case, diawali `/api/` | `/api/calculate`, `/api/challenge/verify`, `/api/export` |
| **CSS Classes (BEM-like)** | kebab-case | `.cannon-viewport`, `.control-card__slider`, `.btn--fire` |
| **Variabel Lingkungan (Env)** | UPPER_SNAKE_CASE | `FLASK_ENV`, `SECRET_KEY`, `PORT` |

---

## 9. Pengujian & Jaminan Kualitas (QA & Testing)

### 9.1. Pengujian Otomatis Backend (Python Pytest)
Jalankan pengujian analitik rumus fisika:
```bash
pytest tests/ -v
```
Pengujian mencakup:
* Verifikasi ketinggian maksimum $h_{\max} = \frac{v_0^2 \sin^2\theta}{2g}$.
* Verifikasi jarak mendatar $R = \frac{v_0^2 \sin(2\theta)}{g}$ pada $y_0 = 0$.
* Validasi respon error untuk parameter tak valid (misal: $g \le 0$).

### 9.2. Checklist Pengujian Manual Frontend (Browser)
Sebelum menandai tugas selesai, lakukan verifikasi manual berikut di browser:
* [ ] **Rendering 60 FPS:** Pastikan animasi peluru dan kepulan asap berjalan mulus tanpa patah-patah (*stuttering*).
* [ ] **Interaksi Drag & Drop:** Ambil bola amunisi dari panel armory dan lepaskan (*drop*) tepat ke moncong meriam. Status amunisi harus berubah menjadi *Loaded*.
* [ ] **Perubahan Sudut Interaktif:** Geser slider sudut atau putar laras meriam; pastikan laras meriam berotasi sesuai sudut yang ditentukan.
* [ ] **Kesesuaian Lintasan (Trajectory Alignment):** Pastikan lintasan putus-putus (*dotted line*) tepat dilewati oleh peluru meriam selama gerak terbang.
* [ ] **Tumbukan Benteng (Collision Detection):** Pastikan efek ledakan mekar (*explosion particle burst*) muncul tepat saat peluru menyentuh koordinat benteng atau tanah.
* [ ] **Responsivitas Layar:** Uji tampilan pada resolusi desktop ($1920\times1080$, $1366\times768$) dan layar laptop sedang.

---

## 10. Pemecahan Masalah Umum (Troubleshooting)

### Masalah 1: Port 5000 Sudah Digunakan (*Port Conflict*)
* **Penyebab:** Pada macOS (fitur AirPlay Receiver) atau proses Flask sebelumnya masih berjalan di background.
* **Solusi:** Jalankan server dengan menentukan port berbeda:
  ```bash
  PORT=5001 python src/app.py
  ```
  Atau matikan proses yang menggunakan port 5000:
  ```bash
  lsof -i :5000 | awk 'NR>1 {print $2}' | xargs kill -9
  ```

### Masalah 2: Tampilan Canvas Buram pada Layar High-DPI / Retina
* **Penyebab:** Resolusi internal Canvas (`width`/`height` atribut HTML) tidak disesuaikan dengan `window.devicePixelRatio`.
* **Solusi:** Kalibrasi ukuran Canvas dalam `canvas.js`:
  ```javascript
  const dpr = window.devicePixelRatio || 1;
  canvas.width = rect.width * dpr;
  canvas.height = rect.height * dpr;
  ctx.scale(dpr, dpr);
  ```

### Masalah 3: Modul Python Tidak Ditemukan Saat Menjalankan `app.py`
* **Penyebab:** Virtual environment belum aktif atau `PYTHONPATH` belum mengarah ke root repositori.
* **Solusi:** Pastikan venv aktif dan jalankan dari root direktori proyek:
  ```bash
  source venv/bin/activate
  python -m src.app
  ```

### Masalah 4: Gagal Deploy di Vercel (*Function Size Exceeded* / *Build Error*)
* **Penyebab:** Ada dependensi besar seperti Pandas/Numpy terinstal secara tidak sengaja di `requirements.txt`.
* **Solusi:** Pertahankan `requirements.txt` seringan mungkin (hanya Flask dan modul esensial). Periksa file `vercel.json` untuk memastikan routing mengarah ke `api/index.py`.
