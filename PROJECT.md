# Project: Virtual Lab Fisika TPB ITB — Simulasi Gerak Parabola & Tembakan Meriam

## Architecture
- **Pola Arsitektur**: Hybrid Client-Centric with Lightweight Python Flask Middleware.
- **Client (Frontend)**:
  - Semantic HTML5 structure (Header, Main, Aside, Section, Figure, Figcaption, Canvas, Details, Table).
  - Modern CSS3 (CSS Variables, Flexbox, Grid, Glassmorphism, Responsive Viewports: 1920x1080, 1366x768, 390x844).
  - Vanilla ES6+ JavaScript modules (No frameworks, No 3D/physics libraries).
  - Canvas 2D API 60 FPS Procedural Rendering with Hi-DPI (`devicePixelRatio`) scaling.
  - Native HTML5 Drag and Drop API (`dragstart`, `dragover`, `drop`) for ammo loading & target placement, with touch fallback.
  - Transparent client-side offline fallback when Flask API is unavailable.
- **Middleware (Backend)**:
  - Python 3.10+ / Flask 3.0+ REST API (`/api/health`, `/api/calculate`, `/api/challenge/verify`, `/api/export`).
  - Strict analytical physics engine (`math` library only, no Pandas/NumPy/SciPy).
  - Defensive input sanitization (HTTP 400 on $g \le 0$, $\theta \notin [0, 90]$, NaN, Infinity, negative values).
  - Dual entrypoints: `src/app.py` (local execution reading `PORT` env) and `api/index.py` (Vercel Serverless Function).
- **Data & Persistence**:
  - Stateless architecture; client-side session management via `localStorage` and structured CSV/JSON export conforming to `LabExperimentSession`.

---

## Feature Inventory
Every feature from the survey phase appears here with its assigned milestone.
| # | Feature | Description | Milestone | Source |
|---|---------|-------------|-----------|--------|
| F01 | 2D Kinematics Analytical Physics Service | Komputasi analitik $x(t), y(t), v_x, v_y, v, R, h_{\max}, t_{\text{flight}}, t_{\text{peak}}$, kecepatan & sudut impak untuk $y_0=0$ dan $y_0>0$, preset gravitasi, sampled points | M1 | AGENTS.md §3.1, §5.2 |
| F02 | Target Challenge Verification Service | Evaluasi benturan benteng: koordinat impak, jarak dari target, skor 0-100, pesan umpan balik, penanganan proyektil jatuh sebelum target | M1 | AGENTS.md §3.5, §5.3 |
| F03 | Flask REST API Endpoints & Validasi HTTP 400 | Endpoint `/api/health`, `/api/calculate`, `/api/challenge/verify`, `/api/export`. Validasi HTTP 400 untuk $g\le 0$, NaN, Infinity, sudut $<0$ atau $>90$ | M1 | AGENTS.md §5, ORIGINAL_REQUEST.md §Backend |
| F04 | Flask Runner, Vercel WSGI & Pytest Suite | `pytest tests/` lulus 100% (unit test formula, validation 400, Flask test client), `src/app.py` membaca `PORT` (default 5000), benchmark $v_0=45, \theta=45^\circ, y_0=0, g=9.81 \Rightarrow R \approx 206.42, h_{\max} \approx 51.61$ | M1 | ORIGINAL_REQUEST.md §Backend |
| F05 | Semantic HTML5 & Standalone Fallback Structure | Elemen semantik `<header>`, `<main>`, `<aside>`, `<section>`, `<figure>`, `<figcaption>`, `<canvas>`, `<fieldset>`, `<legend>`, `<output>`, `<details>`, `<table>` log percobaan. Bersih dari Jinja sintaks di sisi statis | M2 | AGENTS.md §2, ORIGINAL_REQUEST.md §R3 |
| F06 | CSS3 Styling, Thematic UI & Responsive Layout | Desain tematik benteng & meriam klasik, glassmorphism panel kontrol, bebas overflow pada 1920×1080, 1366×768, dan 390×844 | M2 | AGENTS.md §2, ORIGINAL_REQUEST.md §Frontend |
| F07 | Native HTML5 Drag and Drop API Interactivity | Drag peluru dari Armory Shelf ke moncong meriam (`dragstart`, `dragover`, `drop`) dengan validasi tembak; drag target benteng; touch fallback mobile | M2 | AGENTS.md §3.3, ORIGINAL_REQUEST.md §Frontend |
| F08 | Canvas 2D Procedural Renderer & Visual Theme | Rendering 60 FPS Hi-DPI: meriam beroda kayu 8 jari-jari & laras rotasi dinamis, benteng batu teal bertingkat, bukit hijau lembut, awan langit, jejak lintasan putus-putus persisten hingga Clear Trails | M3 | AGENTS.md §3.2, ORIGINAL_REQUEST.md §Visual |
| F09 | Sistem Partikel Efek Asap & Ledakan | Kepulan partikel asap putih di moncong meriam saat tembak, partikel ledakan mekar (kuning/oranye/merah + serpihan teal + asap) saat proyektil menabrak benteng atau tanah | M3 | AGENTS.md §3.2, ORIGINAL_REQUEST.md §Visual |
| F10 | Client-side Kinematics Engine (60 FPS Game Loop) | Loop `requestAnimationFrame`, pergerakan proyektil real-time, deteksi tumbukan ground & castle AABB, audio Web Audio API prosedural | M4 | AGENTS.md §3.1, §3.4, PLAN.md ADR-003 |
| F11 | Telemetry HUD, Local Fallback & Lab Export | Telemetri real-time ($t, x, y, v_x, v_y, v, h_{\max}, R$, status Hit/Miss), auto-fallback ke JS lokal saat API offline tanpa error console, ekspor CSV (BOM) & JSON sesuai `LabExperimentSession` | M4 | AGENTS.md §3.4, §5.4, ORIGINAL_REQUEST.md §Frontend |
| F12 | E2E Integration, Dual-Mode Test, Rubrik & Screenshots | Pengujian otomatis Playwright/headless browser pada mode online & offline, verifikasi 3 viewport, tangkapan layar `screenshots/`, evaluasi rubrik dosen $\ge 5$ bukti per kriteria | M5 | ORIGINAL_REQUEST.md §Acceptance Criteria |

---

## Milestones
| # | Name | Scope | Dependencies | Status |
|---|------|-------|-------------|--------|
| M1 | Backend Flask & Pytest Analytical Engine | F01, F02, F03, F04: `src/services/physics_engine.py`, `src/routes/api_routes.py`, `src/app.py`, `api/index.py`, `tests/*`, `requirements.txt` | none | PLANNED |
| M2 | Semantic HTML5 & CSS Thematic DND UI | F05, F06, F07: `templates/index.html`, `src/static/css/*`, `src/static/js/controls.js` | none | PLANNED |
| M3 | Canvas 2D Engine & Visual Particle Effects | F08, F09: `src/static/js/canvas.js` (Hi-DPI, Meriam, Benteng, Lintasan Persisten, Partikel Asap & Ledakan) | M2 | PLANNED |
| M4 | Client Kinematics, Telemetry & Export Engine | F10, F11: `src/static/js/physics.js`, `src/static/js/telemetry.js`, `src/static/js/main.js` (Loop 60 FPS, Fallback Mandiri, Ekspor Data) | M1, M3 | PLANNED |
| M5 | E2E Integration, Multi-Viewport Verification & Rubric Evidence | F12: Pengujian browser headless, verifikasi 3 viewport, capture screenshot, rubrik evaluasi dosen | M1, M2, M3, M4 | PLANNED |

---

## Interface Contracts

### 1. Client ↔ Backend (`/api/calculate`)
- **Request Format (`SimulationParameters`)**:
  ```json
  {
    "initial_velocity": 45.0,
    "launch_angle": 45.0,
    "initial_height": 0.0,
    "gravity": 9.81,
    "projectile_mass": 10.0,
    "air_resistance": false,
    "drag_coefficient": 0.47
  }
  ```
  *(Alias kompatibel: `v0`, `angle`, `y0`, `g` didukung sebagai alias fallback).*
- **Response Format (`AnalyticalTrajectoryResult`)**:
  ```json
  {
    "flight_time": 6.487,
    "max_height": 51.606,
    "time_to_max_height": 3.244,
    "horizontal_range": 206.422,
    "impact_velocity": 45.0,
    "impact_angle": -45.0,
    "sampled_points": [
      {"t": 0.0, "x": 0.0, "y": 0.0, "vx": 31.82, "vy": 31.82}
    ]
  }
  ```
- **Error Response**: HTTP 400 Bad Request with `{"error": "Validation error message"}` on $g \le 0$, $\theta \notin [0, 90]$, NaN, or Infinity.

### 2. Client ↔ Backend (`/api/challenge/verify`)
- **Request Format (`TargetChallengeVerification`)**:
  ```json
  {
    "target_distance": 180.0,
    "target_elevation": 20.0,
    "target_tolerance_radius": 5.0,
    "parameters": { ... }
  }
  ```
  *(Alias: `target_x`, `target_y`, `tolerance`, `params`).*
- **Response Format**:
  ```json
  {
    "is_hit": true,
    "impact_point": {"x": 180.4, "y": 21.2},
    "distance_from_center": 1.26,
    "score": 95,
    "feedback_message": "Tepat mengenai sasaran benteng!"
  }
  ```

### 3. Client ↔ Backend (`/api/export`)
- **Request Format**:
  ```json
  {
    "format": "json", // atau "csv"
    "session": {
      "session_id": "uuid",
      "student_name": "Mahasiswa TPB",
      "experiment_timestamp": "ISO-8601",
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
  }
  ```
- **Response Format**: File download stream (JSON / CSV attachment) atau JSON confirmation.

### 4. Client Internal Modules
- `CanvasRenderer` (`src/static/js/canvas.js`):
  - `setDPR(dpr)`
  - `drawScene(state)`
  - `drawCannon(x, y, angleRad, barrelLength)`
  - `drawCastle(x, y, width, height)`
  - `drawTrajectoryHistory(trailArray)`
  - `drawCurrentTrajectory(pointsArray)`
  - `drawProjectile(x, y, radius)`
  - `emitMuzzleSmoke(x, y, angleRad)`
  - `emitExplosion(x, y, isCastleHit)`
  - `updateParticles(dt)`
  - `clearTrails()`
- `PhysicsEngine` (`src/static/js/physics.js`):
  - `calculateAnalytical(params)` -> identical to backend format for zero-error offline fallback
  - `stepKinematics(currentPos, currentVel, dt, params)` -> numerical step for 60 FPS animation
  - `checkCollision(projectilePos, groundY, castleBounds)` -> `{ hit: bool, target: 'ground'|'castle'|null, point: {x, y} }`
- `ControlsManager` (`src/static/js/controls.js`):
  - Binds slider events, updates angle / v0 / g / y0 displays
  - Manages HTML5 Drag and Drop lifecycle (`ammo` item -> `cannon` muzzle; target flag/pin -> distance)
  - Exports `isAmmoLoaded()`, `consumeAmmo()`, `loadAmmo(type)`
- `TelemetryManager` (`src/static/js/telemetry.js`):
  - `updateHUD(liveTelemetry)`
  - `recordTrial(trialData)`
  - `exportData(format)` -> handles both API-based and pure client-side Blob/URL download

---

## Code Layout
- `src/`
  - `app.py`: Standalone Flask entrypoint (reads `PORT`, default 5000)
  - `config.py`: Flask configuration
  - `routes/api_routes.py`: REST API blueprints
  - `services/physics_engine.py`: Backend analytical & collision physics
  - `static/css/style.css`: Layout, glassmorphism, responsive styles
  - `static/css/components.css`: Sliders, badges, HUD, armory, table styles
  - `static/js/canvas.js`: Procedural Canvas 2D engine & particle systems
  - `static/js/physics.js`: Client-side kinematics & offline fallback math
  - `static/js/controls.js`: UI listeners & native Drag and Drop
  - `static/js/telemetry.js`: Telemetry updates, trial logging & export
  - `static/js/main.js`: Main loop (`requestAnimationFrame`) & orchestration
- `api/index.py`: Vercel Serverless Function entrypoint
- `templates/index.html`: Semantic HTML5 template
- `tests/`:
  - `test_physics.py`: Mathematical tests, boundary validation, benchmarks
  - `test_api.py`: Flask test client endpoint tests
- `screenshots/`: Multi-viewport evidence screenshots
