# AGENTS.md — Source of Truth & AI Agent Governance

<!-- trigger: always_on -->
> [!CRITICAL]
> **PERINGATAN KERAS UNTUK SEMUA AI CODING ASSISTANTS & AUTOMATED AGENTS:**
> Dokumen ini adalah kontrak arsitektur tertinggi (*single source of truth*) yang **mengikat secara mutlak**. AI dilarang keras berhalusinasi, menulis kode sembarangan (*sloppy/lazy code*), mengabaikan arsitektur yang sudah digariskan, menambahkan dependensi pihak ketiga tanpa izin, atau mengubah file ini tanpa instruksi tertulis eksplisit dari Lead Software Architect/Pengembang Utama.

---

## 1. Identitas & Latar Belakang Proyek (Project Identity & Background)

* **Nama Proyek:** Virtual Lab Fisika TPB ITB — Simulasi Gerak Parabola & Tembakan Meriam (*Projectile Motion & Cannon Artillery Lab*)
* **Domain:** Pendidikan Tinggi Sains & Teknik (TPB ITB - Fisika Dasar I, Kinematika 2D)
* **Bobot Akademik:** 10% Komponen Penilaian Tugas Virtual Lab TPB ITB
* **Masalah yang Diselesaikan:**
  * Mahasiswa TPB ITB sering mengalami kesulitan konseptual dalam memahami gerak dua dimensi (gerak parabola / kinematika proyektil), dekomposisi vektor kecepatan ($v_{0x}$ dan $v_{0y}$), pengaruh gravitasi lokal ($g$), hambatan fluida/udara, dan elevasi sudut meriam ($\theta$) hanya melalui rumus analitik di papan tulis.
  * Praktikum fisik di laboratorium nyata memiliki kendala keterbatasan alat mekanik, ketidakakuratan pengukuran manual jarak jangkauan proyektil ($R$) dan tinggi maksimum ($h_{\max}$), serta risiko keamanan pelontar proyektil fisik.
* **Solusi yang Dibangun:**
  * Aplikasi web interaktif *Virtual Laboratory* berbasis HTML5 Canvas 2D dengan performa 60 FPS, memadukan ilustrasi grafis tematik meriam klasik & benteng sasaran (*castle siege ballistic simulation* sesuai visual referensi TPB ITB).
  * Dilengkapi fitur interaktif *Drag and Drop* amunisi dan penempatan target, kalkulasi analitik & numerik real-time, telemetri data percobaan (kecepatan, posisi, waktu, ketinggian puncak), verifikasi tantangan target benteng (*gamified lab challenge*), dan backend middleware Python (Flask) untuk validasi data & ekspor laporan praktikum.
* **Target Pengguna:**
  1. **Mahasiswa TPB ITB:** Melakukan simulasi, eksperimen mandiri, menguji hipotesis kinematika, dan menyelesaikan tantangan tembakan sasaran.
  2. **Dosen & Asisten Praktikum TPB ITB:** Memberikan demonstrasi kelas interaktif dan memverifikasi ketepatan pemahaman matematis mahasiswa.
  3. **Pengembang / Penilai:** Memeriksa ketercapaian rubrik tugas TPB (HTML5 Semantic, CSS Styling Kreatif, Kompleksitas JavaScript, dan Arsitektur Web).

---

## 2. Tech Stack & Ekosistem Teknologi

Arsitektur aplikasi mengadopsi pola **Hybrid Client-Centric with Lightweight Python Middleware**, dirancang untuk performa tinggi di browser dan kompatibel secara penuh untuk deployment serverless di **Vercel**.

| Layer | Teknologi | Versi / Spesifikasi | Rationale & Fungsi |
| :--- | :--- | :--- | :--- |
| **Frontend UI** | Semantic HTML5 & Modern CSS3 | HTML5, CSS Variables, Flexbox, Grid | Struktur semantik baku (`<canvas>`, `<header>`, `<main>`, `<aside>`, `<section>`), antarmuka responsif bertema benteng & meriam, kontrol UI kaca (*glassmorphism*). |
| **Simulasi Visual** | HTML5 Canvas 2D API | Context 2D, `requestAnimationFrame` | Rendering proyektil, lintasan parabola putus-putus (*dotted trajectory*), roda & laras meriam, benteng teal, kepulan asap tembakan, partikel ledakan benturan. |
| **Interaktivitas** | Native HTML5 Drag & Drop API | Drag Events (`dragstart`, `dragover`, `drop`) | Memindahkan amunisi bola meriam ke moncong laras, memindahkan target benteng/rintangan secara interaktif. |
| **Client Engine** | Modern Vanilla JavaScript | ES6+ Modules (`import`/`export`), no bundler required | Engine kinematika real-time ($60\text{ fps}$), integrasi numerik Euler/Verlet, listener slider & input kontrol, pembaruan tabel telemetri. |
| **Backend Middleware**| Python & Flask | Python 3.10+, Flask 3.0+ | Middleware REST API untuk verifikasi analitik, evaluasi kuis/tantangan benteng, komputasi presisi tinggi, dan ekspor data tabel praktikum. |
| **Runtime & WSGI** | Python WSGI / Serverless | `@vercel/python` | Entrypoint serverless `api/index.py` untuk Vercel deployment; standalone `src/app.py` untuk pengembangan lokal. |
| **Storage / Data** | Client Storage & In-Memory JSON | `localStorage` + JSON Schema | Penyimpanan log percobaan praktikum lokal tanpa overhead DB server persistent, menjamin zero-cost serverless lifecycle. |
| **Quality & Test** | Pytest & Browser Native Testing | Pytest 8.x | Pengujian validasi formula fisika analitik backend dan verifikasi API endpoints. |
| **Deployment Platform** | Vercel Serverless | Configuration `vercel.json` | Hosting static frontend terpadu dengan Python Serverless API. |

---

## 3. Cakupan Fitur Sah (In-Scope)

AI Agent **hanya diizinkan** mengerjakan fitur yang berada dalam batasan in-scope berikut:

1. **Simulasi Fisika Kinematika 2D Akurat:**
   * Gerak horizontal GLB: $x(t) = x_0 + (v_0 \cos\theta) \cdot t$
   * Gerak vertikal GLBB: $y(t) = y_0 + (v_0 \sin\theta) \cdot t - \frac{1}{2} g t^2$
   * Kecepatan seketika: $v_x(t) = v_0 \cos\theta$, $v_y(t) = v_0 \sin\theta - g t$, $v(t) = \sqrt{v_x(t)^2 + v_y(t)^2}$
   * Kalkulasi analitik jarak jangkauan terjauh ($R$) dan tinggi puncak maksimum ($h_{\max}$).
   * Pilihan preset gravitasi ($g$): Bumi ($9.8\text{ m/s}^2$ / $9.81\text{ m/s}^2$), Bulan ($1.62\text{ m/s}^2$), Mars ($3.71\text{ m/s}^2$), Gravitasi Custom.
   * Opsi aktivasi koefisien hambatan udara fluida (hambatan kuadratik Stokes/Newtonian sederhana).

2. **Visual Rendering Canvas Bertema Sesuai Referensi TPB:**
   * Visual meriam klasik lengkap dengan roda kayu cokelat dan laras meriam dengan elevasi sudut yang bergerak dinamis.
   * Visual benteng target batu bertingkat di sisi kanan layar (warna teal/slate sesuai screenshot).
   * Latar belakang lanskap bukit hijau lembut, rumput, dan langit berawan.
   * Visualisasi garis lintasan parabola putus-putus (*dashed/dotted curve*) yang mencatat jalur tembakan sebelumnya dan yang sedang berlangsung.
   * Animasi partikel efek kepulan asap putih di moncong meriam saat ditembakkan dan efek ledakan kuning/oranye mekar saat proyektil menghantam benteng atau tanah.

3. **Fitur Drag and Drop HTML5 Asli:**
   * Drag amunisi meriam (peluru besi standar, peluru berbobot besar, proyektil eksperimental) dari *Armory Shelf* ke dalam laras meriam untuk mempersiapkan tembakan.
   * Drag target benteng atau bendera sasaran secara horizontal untuk mengubah jarak target simulasi ($R_{\text{target}}$).

4. **Panel Kontrol Interaktif & Telemetri Real-Time:**
   * Kontrol slider & input numerik: Kecepatan awal $v_0$ ($0 - 100\text{ m/s}$), sudut elevasi $\theta$ ($0^\circ - 90^\circ$), ketinggian awal moncong $y_0$ ($0 - 50\text{ m}$), percepatan gravitasi $g$, massa proyektil $m$.
   * Tombol aksi: **Tembak (Fire)**, **Jeda/Lanjut (Pause/Resume)**, **Atur Ulang (Reset)**, **Hapus Jejak Lintasan (Clear Trails)**.
   * Dashboard telemetri: waktu tempuh $t$, koordinat posisi $(x, y)$, komponen kecepatan $(v_x, v_y)$, total kecepatan $v$, $h_{\max}$, dan status tumbukan (*Hit/Miss*).

5. **Middleware Python (Flask) API:**
   * Endpoint `GET /api/health`: Status pemeriksaan kesehatan server.
   * Endpoint `POST /api/calculate`: Validasi perhitungan fisika analitik dari parameter input.
   * Endpoint `POST /api/challenge/verify`: Evaluasi apakah tembakan pengguna sukses mengenai target benteng berdasarkan toleransi radius tumbukan.
   * Endpoint `POST /api/export`: Menghasilkan dataset tabel hasil praktikum dalam format JSON/CSV terstruktur untuk laporan praktikum TPB ITB.

---

## 4. Larangan Keras Arsitektur & Dependensi (Out-of-Scope)

AI Agent **DILARANG KERAS** melanggar hal-hal berikut. Pelanggaran terhadap poin ini dianggap sebagai kegagalan instruksi kritis:

* 🚫 **DILARANG MENGGUNAKAN FRONTEND HEAVY FRAMEWORKS:** Dilarang menginstal atau mengimpor React, Vue.js, Angular, Svelte, jQuery, atau lit-html. Tugas mewajibkan teknologi dasar browser (Vanilla HTML5, CSS3, ES6+ JavaScript).
* 🚫 **DILARANG MENGGUNAKAN 3D GRAPHICS/PHYSICS LIBS BERAT:** Dilarang menggunakan Three.js, Babylon.js, Matter.js, Cannon.js, Ammo.js, atau PixiJS. Engine rendering wajib menggunakan Canvas 2D API murni dan kalkulasi fisika ditulis menggunakan matematika native JS/Python.
* 🚫 **DILARANG DATABASE PERSISTENT SERVER BERAT:** Dilarang mengonfigurasi atau mewajibkan PostgreSQL, MySQL, MongoDB, Redis, atau Docker containers yang membutuhkan daemon aktif. Arsitektur harus *stateless* dan berjalan mulus pada lingkungan serverless Vercel gratis tanpa dependensi eksternal.
* 🚫 **DILARANG DEPENDENSI PYTHON DENGAN COMPILED C-EXTENSION MASIF:** Dilarang memasukkan Pandas, TensorFlow, PyTorch, SciPy, atau OpenCV ke dalam `requirements.txt`. Ukuran bundle Vercel Serverless Function sangat terbatas (maksimal 250MB uncompressed). Cukup gunakan standard library Python (`math`, `json`, `dataclasses`) dan `Flask` + `flask-cors`.
* 🚫 **DILARANG MERUSAK KOMPATIBILITAS VERCEL:** Dilarang membuat proses background jangka panjang (*long-running daemons*), threading background tak terkontrol, atau menulis file permanen ke disk lokal (`/tmp` hanya sementara pada serverless).

---

## 5. Model Data & Skema Kontrak API (Data Models)

Meskipun sistem beroperasi secara serverless dan stateless, seluruh pertukaran data harus mematuhi skema kontrak data formal berikut:

### 5.1. Model Parameter Simulasi (`SimulationParameters`)
```json
{
  "initial_velocity": 45.0,    // float, m/s (0.0 <= v0 <= 150.0)
  "launch_angle": 55.0,        // float, derajat (0.0 <= angle <= 90.0)
  "initial_height": 5.0,       // float, meter (0.0 <= y0 <= 100.0)
  "gravity": 9.81,             // float, m/s^2 (0.1 <= g <= 25.0)
  "projectile_mass": 10.0,     // float, kg (0.1 <= mass <= 100.0)
  "air_resistance": false,     // boolean
  "drag_coefficient": 0.47     // float (opsional jika air_resistance=true)
}
```

### 5.2. Model Hasil Perhitungan Analitik (`AnalyticalTrajectoryResult`)
```json
{
  "flight_time": 7.62,         // float, detik (total waktu hingga menyentuh tanah)
  "max_height": 76.54,         // float, meter (ketinggian puncak relatif terhadap ground)
  "time_to_max_height": 3.75,  // float, detik
  "horizontal_range": 196.55,  // float, meter (jarak x saat y = 0)
  "impact_velocity": 46.08,    // float, m/s (kecepatan saat menyentuh permukaan)
  "impact_angle": -56.3,       // float, derajat
  "sampled_points": [          // array koordinat referensi analitik untuk verifikasi
    {"t": 0.0, "x": 0.0, "y": 5.0, "vx": 25.81, "vy": 36.86},
    {"t": 1.0, "x": 25.81, "y": 36.95, "vx": 25.81, "vy": 27.05}
  ]
}
```

### 5.3. Model Verifikasi Tantangan Benteng (`TargetChallengeVerification`)
```json
// REQUEST
{
  "target_distance": 180.0,    // float, jarak x pusat benteng (meter)
  "target_elevation": 20.0,    // float, ketinggian dinding benteng (meter)
  "target_tolerance_radius": 5.0, // float, radius toleransi benturan (meter)
  "parameters": { ... }        // Object SimulationParameters
}

// RESPONSE
{
  "is_hit": true,              // boolean
  "impact_point": {"x": 180.4, "y": 21.2},
  "distance_from_center": 1.26,// float, meter
  "score": 95,                 // integer, 0 - 100
  "feedback_message": "Tepat mengenai puncak benteng sasaran!"
}
```

### 5.4. Model Laporan Data Praktikum (`LabExperimentSession`)
```json
{
  "session_id": "lab-uuid-v4",
  "student_name": "Mahasiswa TPB",
  "experiment_timestamp": "2026-10-06T08:25:00Z",
  "trials": [
    {
      "trial_number": 1,
      "v0": 45.0,
      "angle": 45.0,
      "y0": 0.0,
      "g": 9.81,
      "simulated_range": 206.42,
      "theoretical_range": 206.42,
      "relative_error_percentage": 0.0,
      "status": "VALID"
    }
  ]
}
```

---

## 6. Aturan Perilaku AI Agents (AI Behavioral Rules)

1. **Prinsip KISS (Keep It Simple, Stupid):**
   * Hindari arsitektur *over-engineered*. Jangan membuat abstraksi berlapis atau *design pattern* rumit yang tidak diperlukan untuk virtual lab skala TPB ITB.
   * Kode harus bersih, elegan, mudah dibaca oleh dosen penilai maupun mahasiswa.

2. **Validasi Sebelum Refactor:**
   * Jangan menghapus atau mengubah berkas tanpa membaca isinya secara mendalam.
   * Setiap kali menyentuh logika fisika, pastikan satuan matematis konsisten (SI: meter, detik, radian/derajat, $\text{m/s}$, $\text{m/s}^2$). Konversi derajat ke radian ($\theta_{\text{rad}} = \theta \times \frac{\pi}{180}$) wajib dijaga keabsahannya.

3. **Penanganan Port & Jaringan:**
   * Server Flask lokal berjalan di host `127.0.0.1` port `5000` secara default, namun port harus membaca variabel lingkungan `PORT` (`os.environ.get("PORT", 5000)`) agar siap berjalan di cloud/Vercel.
   * Frontend harus mendukung *relative fetch* (`/api/...`) sehingga dapat berjalan langsung tanpa masalah CORS saat di-bundle satu domain oleh Vercel.

4. **Kebiasaan Manajemen Dependensi:**
   * Dilarang melakukan eksekusi `pip install <package>` tanpa memastikan package tersebut dicatat di `requirements.txt`.
   * Minimalisir dependensi Python: cukup `Flask>=3.0.0`, `flask-cors>=4.0.0`, dan `gunicorn>=21.0.0` (untuk staging WSGI).

5. **Proteksi File Rahasia & Keamanan:**
   * Dilarang melakukan commit terhadap file `.env`, file kredensial, cache python (`__pycache__`), atau artifact build sementara.
   * Selalu pertahankan sanitasi input numerik pada API endpoints untuk mencegah *division by zero* ($g = 0$) atau nilai tak hingga (*Infinity/NaN*).

---

## 7. Alur Eksekusi & Pengujian (Run & Testing Flow)

Urutan resmi untuk menyiapkan, menjalankan, dan menguji sistem:

```bash
# 1. Navigasi ke direktori kerja
cd /home/evan/Documents/projects/TugasVirtualLab

# 2. Inisialisasi Virtual Environment Python (Lokal)
python3 -m venv venv
source venv/bin/activate

# 3. Instalasi Dependensi Terbatas
pip install -r requirements.txt

# 4. Salin Variabel Lingkungan
cp .env.example .env

# 5. Jalankan Unit Testing Komputasi Fisika
pytest tests/

# 6. Jalankan Development Server Lokal
python src/app.py
# Server aktif pada http://127.0.0.1:5000

# 7. Verifikasi Simulasi Vercel Serverless (Opsional jika Vercel CLI terpasang)
vercel dev
```

---

## 8. Hirarki & Aturan Pemeliharaan Dokumentasi

Setiap dokumen dalam repositori ini memiliki level volatilitas dan protokol pemeliharaan yang tegas:

1. **`PLAN.md` — PALING DINAMIS (Level 1 - Frekuensi Update Tinggi):**
   * Diperbarui setiap kali ada task yang selesai dikerjakan, keputusan teknis baru diambil, atau ada *known issues* yang ditemukan.
   * AI wajib mencentang checklist progres saat menyelesaikan implementasi fitur.

2. **`README.md` — JARANG BERUBAH (Level 2 - Volatilitas Rendah):**
   * Berfungsi sebagai etalase publik dan manual instalasi cepat.
   * Hanya diubah jika terdapat perubahan arsitektur besar, endpoint baru, atau penambahan fitur signifikan.

3. **`CONTRIBUTING.md` — JARANG BERUBAH (Level 3 - Volatilitas Sangat Rendah):**
   * Standar baku gaya pengkodean, branching, dan konvensi commit.
   * Hanya diubah atas persetujuan Lead Architect jika tim memutuskan mengganti konvensi linter atau alur QA.

4. **`AGENTS.md` — PALING STATIS (Level 4 - Immutable Contract):**
   * Dokumen ini adalah konstitusi sistem.
   * **DILARANG DIUBAH OLEH AI SECARA SEPIHAK TANPA PERMINTAAN TERTULIS DARI USER.**
