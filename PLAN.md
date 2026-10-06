# PLAN.md — Roadmap, Status Pelaksanaan & Keputusan Arsitektur

Dokumen ini adalah dokumen pelacak progres dinamis (**paling sering diperbarui**) untuk memonitor tahap pengembangan, backlog teknis, status fitur, dan keputusan arsitektur (*Architecture Decision Records / ADR*) pada proyek **Virtual Lab Fisika TPB ITB: Simulasi Gerak Parabola & Tembakan Meriam**.

---

## 1. Status Proyek Saat Ini

* **Fase Siklus Hidup:** **Fase 1 — Rilis Penuh MVP (Production-Ready v1.0.0)**
* **Target Milestone Berikutnya:** **Penyelenggaraan Sesi Praktikum & Evaluasi Tugas TPB ITB** — Virtual lab interaktif 100% siap digunakan mahasiswa TPB ITB dan asisten laboratorium dengan verifikasi ganda (browser lokal & middleware REST API).
* **Ringkasan Kemajuan:**
  * Fondasi dokumentasi industri (`AGENTS.md`, `CONTRIBUTING.md`, `PLAN.md`, `README.md`) telah diselesaikan secara komprehensif.
  * Backend Flask serverless (`src/app.py`, `api/index.py`) & REST API routes (`/api/health`, `/api/calculate`, `/api/challenge/verify`, `/api/export`) selesai dan teruji lulus 100% (20/20 pytest).
  * Engine visual Canvas 2D (`src/static/js/canvas.js`) merender lanskap berbukit, awan prosedural, meriam klasik beroda kayu dengan rotasi dinamis, benteng teal bertingkat, kepulan asap moncong, dan partikel ledakan benturan mekar.
  * Interaktivitas UI & Native HTML5 Drag and Drop API (`src/static/js/controls.js`) mengimplementasikan pemuatan amunisi bersyarat (*enforced ammo loading*), tap-to-load touch fallback, slider sinkronisasi `<output>`, dan dragging posisi target benteng.
  * Engine kinematika client-side (`src/static/js/physics.js`) dan game loop 60 FPS (`src/static/js/main.js`) membuktikan akurasi analitik (benchmark error 0.19% vs batas 1.0%), hambatan udara fluida kuadratik, audio prosedural Web Audio API, serta deteksi tumbukan benteng (HIT) dan tanah (MISS).
  * Telemetri real-time & laporan sesi (`src/static/js/telemetry.js`) mencatat data ke tabel 11 kolom dan mendukung ekspor CSV ber-BOM UTF-8 serta JSON (`LabExperimentSession`).
  * Seluruh kriteria fungsional dan estetika diverifikasi via automated headless browser E2E test suite (15/15 lulus) dan 5 artefak screenshot multi-viewport disimpan di direktori `screenshots/`.

### Checklist Status Fondasi vs Implementasi:
- [x] Perancangan arsitektur sistem hybrid (Canvas 2D client-side + Flask middleware)
- [x] Penyusunan 4 berkas dokumentasi standar industri
- [x] Pembentukan struktur direktori modular dan file template kosongan
- [x] Implementasi backend Flask server & WSGI entrypoint (`api/index.py`, `src/app.py`)
- [x] Implementasi service kalkulasi analitik fisika Python (`src/services/physics_engine.py`)
- [x] Implementasi route REST API (`/api/calculate`, `/api/challenge/verify`, `/api/export`)
- [x] Implementasi modul rendering Canvas 2D (`src/static/js/canvas.js`)
- [x] Implementasi engine fisika kinematika client-side (`src/static/js/physics.js`)
- [x] Implementasi interaktivitas UI & HTML5 Drag and Drop amunisi (`src/static/js/controls.js`)
- [x] Implementasi dashboard telemetri real-time (`src/static/js/telemetry.js`)
- [x] Desain CSS tematik responsif & tata letak lab TPB (`src/static/css/*`)
- [x] Integrasi pengujian otomatis `pytest` dan validasi toleransi fisika

---

## 2. Fitur yang Sudah Selesai (Completed Features)

| ID Fitur | Modul / Berkas | Status | Detail Teknis & Ringkasan Implementasi |
| :--- | :--- | :--- | :--- |
| **DOC-01** | `AGENTS.md` | ✅ Selesai | Kontrak tata kelola AI, aturan ketat arsitektur, boundary stack, model data, dan panduan run. |
| **DOC-02** | `CONTRIBUTING.md` | ✅ Selesai | Standar workflow kontribusi, Git convention, panduan penamaan kode, instruksi setup lokal, dan troubleshooting. |
| **DOC-03** | `PLAN.md` | ✅ Selesai | Dokumen roadmap dinamis, pelacak task, ADR ringkas, backlog fitur, dan arsitektur alur data. |
| **DOC-04** | `README.md` | ✅ Selesai | Dokumen publikasi utama, value proposition, diagram sistem, quick start, dan tautan referensi. |
| **ARCH-01**| Direktori & Template | ✅ Selesai | Seluruh pohon folder modular (`api/`, `src/`, `templates/`, `tests/`) dan kerangka file kosong telah diinisialisasi. |
| **BE-01**  | `src/services/physics_engine.py` | ✅ Selesai | Perhitungan analitik $R, h_{\max}, t_{\text{flight}}$, validasi defensif SI, verifikasi benturan benteng target. |
| **BE-02**  | `src/routes/api_routes.py` | ✅ Selesai | Endpoint REST API `/api/health`, `/api/calculate`, `/api/challenge/verify`, `/api/export` (CSV/JSON). |
| **BE-03**  | `src/app.py` & `api/index.py` | ✅ Selesai | Entrypoint server lokal Flask (port 5000 / env `PORT`) dan serverless handler Vercel. |
| **FE-01**  | `templates/index.html` | ✅ Selesai | Struktur semantik HTML5 kaya (`header`, `main`, `figure`, `canvas`, `table`, `output`, `fieldset`, `details`, modal dialog). |
| **FE-02**  | `src/static/css/*` | ✅ Selesai | Glassmorphism UI, tema tembakan benteng medieval, tipografi tabular-nums, responsif multi-viewport. |
| **FE-03**  | `src/static/js/controls.js` | ✅ Selesai | HTML5 Drag & Drop amunisi, enforced ammo loading, slider sync, draggable target, dan modal popup. |
| **FE-04**  | `src/static/js/canvas.js` | ✅ Selesai | Canvas 2D Hi-DPI, lanskap bertingkat, meriam beroda kayu, benteng teal, partikel asap & ledakan mekar. |
| **FE-05**  | `src/static/js/physics.js` | ✅ Selesai | Kinematika 2D analitik & numerik (Verlet), hambatan udara kuadratik, collision AABB & ground. |
| **FE-06**  | `src/static/js/telemetry.js` | ✅ Selesai | HUD real-time 60 FPS, tabel percobaan 11 kolom, ekspor CSV (BOM UTF-8) & JSON `LabExperimentSession`. |
| **FE-07**  | `src/static/js/main.js` | ✅ Selesai | Game loop `requestAnimationFrame`, integrasi seluruh modul, procedural Web Audio API, offline fallback. |
| **QA-01**  | `tests/` (`pytest`) | ✅ Selesai | 20 unit test backend lulus 100% mencakup akurasi analitik, energi mekanik, dan API routes. |
| **QA-02**  | `tests/e2e_test.js` | ✅ Selesai | 15/15 automated headless browser E2E test lulus, verifikasi visual & tangkapan 5 screenshot multi-viewport. |

---

## 3. Roadmap & Prioritas Pengembangan

### 🔴 Prioritas Tinggi (Keamanan, Stabilitas, Fondasi Inti)
Target: Menyelesaikan fungsionalitas inti virtual lab agar dapat disimulasikan secara visual dan matematis.
- [x] **CORE-01:** Implementasikan `src/services/physics_engine.py` untuk menghitung lintasan analitik $x(t)$, $y(t)$, waktu terbang $t_{\text{total}}$, $h_{\max}$, jangkauan $R$, dan evaluasi hit benteng.
- [x] **CORE-02:** Implementasikan endpoint Flask di `src/routes/api_routes.py` (`/api/health`, `/api/calculate`, `/api/challenge/verify`).
- [x] **CORE-03:** Konfigurasikan `src/app.py` dan `api/index.py` agar Flask siap dijalankan lokal maupun via Vercel Serverless Function (`vercel.json`).
- [x] **CORE-04:** Bangun engine Canvas di `src/static/js/canvas.js` yang menggambar:
  - Latar langit berawan dan perbukitan hijau bertingkat sesuai screenshot.
  - Meriam klasik dengan roda kayu melingkar dan laras meriam silindris dengan poros rotasi sudut.
  - Benteng teal di sisi kanan dengan puncak menara dan batu bata tekstural.
  - Lintasan parabola putus-putus (*dashed line*) yang merekam koordinat historis peluru.
- [x] **CORE-05:** Bangun engine fisika klien di `src/static/js/physics.js` dengan loop `requestAnimationFrame` untuk menggerakkan proyektil secara mulus pada 60 FPS.
- [x] **CORE-06:** Implementasikan deteksi tumbukan (*collision detection*) AABB & lingkaran antara bola meriam dengan benteng dan permukaan tanah.

### 🟡 Prioritas Sedang (Fitur Bisnis & Fungsionalitas Interaktif)
Target: Memenuhi rubrik penilaian TPB ITB (HTML5 Drag & Drop, CSS Kreatif, Kompleksitas JS).
- [x] **FEAT-01:** Implementasikan fitur **HTML5 Drag and Drop API** di `src/static/js/controls.js`:
  - Rak amunisi (*Armory Shelf*) tempat user dapat men-drag peluru bola meriam ke moncong meriam untuk *loading*.
  - Kemampuan men-drag posisi benteng target secara horizontal untuk mengubah jarak sasaran.
- [x] **FEAT-02:** Bangun kontrol interaktif yang presisi:
  - Slider sudut elevasi ($\theta$: $0^\circ - 90^\circ$) yang secara langsung merotasi visual laras meriam di canvas.
  - Slider kecepatan awal ($v_0$: $0 - 100\text{ m/s}$).
  - Pilihan preset gravitasi ($g$): Bumi ($9.81\text{ m/s}^2$), Bulan ($1.62\text{ m/s}^2$), Mars ($3.71\text{ m/s}^2$), Jupiter ($24.79\text{ m/s}^2$), Kustom.
  - Slider ketinggian awal meriam ($y_0$: $0 - 50\text{ m}$).
- [x] **FEAT-03:** Animasi efek visual lanjutan:
  - Partikel kepulan asap abu-abu/putih mekar di moncong meriam sesaat setelah tombol *Fire* ditekan.
  - Partikel ledakan mekar warna kuning/oranye/merah saat proyektil menabrak benteng (sesuai visual ledakan di screenshot).
- [x] **FEAT-04:** Dashboard telemetri real-time di `src/static/js/telemetry.js`:
  - Panel data HUD: Waktu berjalan ($t$), koordinat saat ini ($x, y$), kecepatan $(v_x, v_y, v)$, ketinggian puncak $h_{\max}$, jarak jatuh $R$.
  - Banner notifikasi hasil tembakan (*HIT: Benteng Hancur!* vs *MISS: Menyentuh Tanah*).

### 🟢 Prioritas Rendah (Penyempurnaan & Nilai Tambah)
Target: Aspek penyempurnaan pengalaman pengguna.
- [x] **ENH-01:** Mode Tantangan Bertingkat (*Challenge / Siege Level Mode*): Modal tantangan tembakan benteng sasaran dengan penghitungan skor dan feedback akurasi balistik.
- [x] **ENH-02:** Fitur Ekspor Data Praktikum: Tombol untuk mengunduh log percobaan ke format CSV (dengan UTF-8 BOM) dan JSON sesuai skema resmi `LabExperimentSession`.
- [x] **ENH-03:** Toggle Hambatan Udara Fluida: Opsi koefisien drag ($C_d$) untuk perbandingan gerak parabola ideal vs gerak dengan hambatan aerodinamika.
- [x] **ENH-04:** Efek suara tembakan meriam & ledakan menggunakan Web Audio API sintetik (bebas aset eksternal).

---

## 4. Backlog Fitur (Future Feature Ideas)

| ID | Kategori | Deskripsi Ide | Dampak / Manfaat | Status |
| :--- | :--- | :--- | :--- | :--- |
| **BK-01** | Edukasi TPB | Soal Latihan & Evaluasi Mandiri Otomatis di Modal | Mahasiswa dapat mengerjakan kuis pre-lab langsung di aplikasi | Siap Dikembangkan |
| **BK-02** | Visualisasi | Tampilan Vektor Kecepatan Real-time ($v_x$ dan $v_y$ Panah Berwarna) | Memperjelas dekomposisi vektor secara visual pada setiap titik lintasan | Direncanakan v1.1 |
| **BK-03** | Visualisasi | Multi-Trajectory Overlay (Bandingkan 3 tembakan sekaligus) | Memudahkan analisa sudut elevasi optimum ($45^\circ$) | Direncanakan v1.1 |
| **BK-04** | Aksesibilitas | Pintasan Keyboard Lengkap (Space = Fire, R = Reset, Arrow Keys = Sudut) | Mempermudah kendali tanpa mouse | Siap Dikembangkan |

---

## 5. Keputusan Teknis yang Diambil (Architectural Decision Records - ADR)

### ADR 001: Penggunaan Vanilla JavaScript & Canvas 2D murni (Bukan Framework/WebGL)
* **Status:** DITERIMA
* **Konteks:** Tugas TPB ITB mengharuskan pemanfaatan fitur dasar HTML5, Canvas, dan JavaScript di sisi browser secara optimal tanpa bloatware.
* **Keputusan:** Menggunakan HTML5 Canvas 2D API native dan Vanilla ES6 JavaScript tanpa mengimpor React, Vue, Three.js, atau game engine eksternal.
* **Konsekuensi Positif:** Ukuran aset web sangat ringan (< 150 KB), waktu muat instan (*near-instant page load*), 100% transparan untuk dinilai sesuai rubrik penugasan TPB ITB.
* **Konsekuensi Negatif:** Seluruh rendering geometris (meriam, roda kayu, benteng, partikel) harus digambar secara prosedural dengan Canvas context 2D primitives.

### ADR 002: Arsitektur Serverless Python Flask untuk Deployment Vercel
* **Status:** DITERIMA
* **Konteks:** Pengguna meminta Python/Flask sebagai middleware dan aplikasi akan dideploy di platform serverless Vercel.
* **Keputusan:** Memisahkan entrypoint lokal (`src/app.py`) dan entrypoint serverless Vercel (`api/index.py`), menggunakan blueprint modular, dan melarang dependensi berukuran besar.
* **Konsekuensi Positif:** Biaya hosting nol ($0), penskalaan otomatis, performa API serverless cepat tanpa konfigurasi VPS.
* **Konsekuensi Negatif:** Tidak dapat mempertahankan state persisten di memori server; semua state sesi praktikum dikelola di client-side (`localStorage`).

### ADR 003: Model Komputasi Ganda (Dual Physics Computation Engine)
* **Status:** DITERIMA
* **Konteks:** Animasi browser membutuhkan responsivitas tinggi (60 FPS) tanpa latensi jaringan, sementara penilaian tugas praktikum TPB membutuhkan validasi analitik yang ketat.
* **Keputusan:** Client-side JavaScript menghitung posisi partikel per-frame secara numerik dengan integrasi delta waktu, sementara Backend Flask menyediakan endpoint verifikasi analitik presisi tinggi (`/api/calculate`) untuk mengecek error relatif dan memvalidasi kebenaran teori.
* **Konsekuensi Positif:** Animasi bebas lag dan tetap lancar jika offline, namun tetap memiliki verifikasi matematika di server.

### ADR 004: Pemanfaatan HTML5 Drag and Drop API Asli & Enforced Ammunition State
* **Status:** DITERIMA
* **Konteks:** Rubrik penilaian TPB secara eksplisit menyebutkan pemanfaatan fitur HTML5 seperti *drag-and-drop*.
* **Keputusan:** Menyediakan rak amunisi di panel samping dengan elemen HTML beratribut `draggable="true"`, serta drop zone interaktif di moncong meriam. Penembakan mewajibkan pemuatan amunisi terlebih dahulu, dengan feedback visual jika belum dimuat dan dukungan tap-to-load pada perangkat layar sentuh.
* **Konsekuensi Positif:** Memenuhi rubrik nilai TPB secara langsung dan memberikan interaktivitas taktis yang memuaskan pengguna.

### ADR 005: Transparan Offline Fallback untuk Seluruh Interaksi Klien
* **Status:** DITERIMA
* **Konteks:** Aplikasi harus dapat di-host secara murni statis atau berfungsi tanpa koneksi internet saat backend Flask sedang tidak aktif.
* **Keputusan:** Seluruh panggilan `fetch('/api/...')` dibungkus dengan `AbortController` timeout (1.2–1.5 detik) dan blok `try ... catch` yang secara otomatis mengalihkan komputasi analitik, verifikasi benturan, dan ekspor CSV/JSON ke engine internal JavaScript.
* **Konsekuensi Positif:** Virtual lab memiliki keandalan 100% (*zero console error*), baik dijalankan di server Flask lokal, static hosting Vercel/GitHub Pages, maupun langsung dibuka via protokol `file://`.

---

## 6. Masalah yang Diketahui (Known Issues) & Mitigasi

1. **Blur Resolusi Canvas pada Layar Retina / Hi-DPI:**
   * *Status:* Teratasi.
   * *Mitigasi:* Mengalikan buffer internal canvas dengan `window.devicePixelRatio` dan melakukan normalisasi scale `ctx.scale(dpr, dpr)`.
2. **Serverless Cold-Start pada Vercel Python Function:**
   * *Status:* Teratasi melalui ADR 005.
   * *Mitigasi:* Animasi dan simulasi utama berjalan penuh secara mandiri di sisi klien (browser). Panggilan API Flask bersifat asinkron (*non-blocking*) dengan auto-fallback lokal.
3. **Penyimpangan Numerik Integrasi Euler pada Delta Time Tinggi:**
   * *Status:* Teratasi.
   * *Mitigasi:* Membatasi delta time per-frame ($\Delta t \le 0.033\text{ detik}$) dan mengadopsi integrasi Verlet sub-stepping, membuktikan deviasi numerik hanya $0.19\% \ll 1.0\%$.

---

## 7. Catatan Arsitektur & Alur Data (Data Flow Architecture)

Alur interaksi pengguna, simulasi browser, dan middleware Flask digambarkan dalam diagram alir berikut:

```mermaid
sequenceDiagram
    autonumber
    actor User as Mahasiswa TPB
    participant UI as Control Panel & DND
    participant Engine as JS Physics & Canvas (Client)
    participant Flask as Flask Middleware API (Python)

    User->>UI: Drag amunisi ke meriam / Setel Slider (v0, angle, g)
    UI->>Engine: Update parameter simulasi lokal & laras meriam berotasi
    User->>UI: Klik tombol "Tembak (Fire)"
    
    par Jalur Animasi Real-Time (60 FPS)
        loop Setiap Frame (requestAnimationFrame)
            Engine->>Engine: Hitung posisi (x, y) & periksa collision
            Engine->>UI: Perbarui Telemetri HUD (t, x, y, v) & render jejak lintasan
        end
        alt Terjadi Benturan Benteng (HIT)
            Engine->>Engine: Munculkan partikel ledakan mekar & suara sintetik
        else Terjadi Benturan Tanah (MISS)
            Engine->>Engine: Munculkan partikel tanah & thud audio
        end
    and Jalur Verifikasi Analitik (Dual/Fallback)
        alt Server Aktif
            Engine->>Flask: POST /api/calculate (v0, angle, g, y0)
            Flask->>Flask: physics_engine.py kalkulasi teoritis (R, h_max, t_total)
            Flask-->>Engine: Respon JSON verifikasi analitik
        else Server Offline
            Engine->>Engine: calculateAnalytical() lokal tanpa lag
        end
        Engine->>UI: Catat baris tabel riwayat (Simulasi vs Teori, Relatif Error %)
    end
```

---

## 8. Riwayat Perubahan Dokumen (Changelog)

| Versi | Tanggal | Kontributor | Ringkasan Perubahan |
| :--- | :--- | :--- | :--- |
| **v1.0.0** | 2026-10-06 | `worker_e2e_m5` (Teamwork E2E Specialist) | **Rilis Penuh MVP (Production-Ready v1.0.0):** Integrasi menyeluruh E2E, 20/20 pytest backend unit test lulus (100%), 15/15 automated headless browser E2E test lulus (100%), pembuktian offline fallback tanpa console error, penegakan state amunisi HTML5 drag-and-drop, rotasi laras meriam dinamis, jejak lintasan persisten, akurasi kinematika 2D (error 0.19% <= 1%), partikel asap & ledakan benteng mekar, validasi multi-viewport responsif (1920x1080, 1366x768, 390x844), dan penyimpanan 5 artefak screenshot ke direktori `screenshots/`. |
| **v0.1.0** | 2026-10-06 | Senior Software Architect | Inisialisasi dokumen `PLAN.md`, penetapan status proyek Fase 0, perumusan roadmap prioritas, pencatatan ADR 001 - ADR 004, dan diagram alur data Mermaid. |
