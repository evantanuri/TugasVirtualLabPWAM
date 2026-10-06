# E2E Test Infra: Virtual Lab Fisika TPB ITB

## Test Philosophy
- Opaque-box & transparent verification.
- Dual-track testing: Backend Pytest suite (kinematics, validation, API endpoints) + Frontend E2E browser tests (Canvas 2D, DND, Telemetry, Fallback, Viewports).
- Methodology: Category-Partition + Boundary Value Analysis + Real-World Workload Testing.

## Test Architecture
1. **Backend Testing Track (`tests/`)**:
   - Runner: `pytest`
   - Scope:
     - `tests/test_physics.py`: Formula accuracy ($y_0=0$ and $y_0>0$), benchmark tolerance ($\le 0.5\%$), sampled points consistency, target collision logic.
     - `tests/test_api.py`: Flask test client testing for `GET /api/health`, `POST /api/calculate`, `POST /api/challenge/verify`, `POST /api/export`. Boundary value validation (HTTP 400 on $g\le 0$, NaN, Infinity, angle $<0$ or $>90$).
2. **Frontend E2E & Browser Automation Track**:
   - Scope:
     - Headless browser verification (Playwright / Puppeteer / Node script) ensuring:
       - No console errors.
       - HTML5 Drag and Drop events functioning.
       - Rotating cannon barrel angle updates canvas.
       - Persistent dashed trajectory trail remaining after impact.
       - Hit/Miss detection triggering explosion/smoke.
       - Real-time telemetry updating and adhering to $\le 1\%$ error.
       - Experiment log export generating valid CSV/JSON conforming to `LabExperimentSession`.
       - Automatic offline fallback operating without `/api/*` and generating zero user-facing console errors.
       - Multi-viewport layout integrity on 1920×1080, 1366×768, and 390×844.

## Coverage Goals
- Backend Pytest: 100% test pass.
- Benchmark: $v_0=45\text{ m/s}, \theta=45^\circ, y_0=0\text{ m}, g=9.81\text{ m/s}^2 \implies R \approx 206.42\text{ m}, h_{\max} \approx 51.61\text{ m}$ within 0.5%.
- Offline Fallback: 100% functional without backend server.
