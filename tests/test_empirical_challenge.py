"""
Empirical Challenger Test Suite — Virtual Lab Fisika TPB ITB
Adversarial Stress Harness, Oracles, Boundary Probes, and Invariant Verification.
"""

import math
import json
import pytest
from src.app import create_app
from src.services.physics_engine import PhysicsEngine


@pytest.fixture
def app():
    app = create_app()
    app.config["TESTING"] = True
    return app


@pytest.fixture
def client(app):
    return app.test_client()


# ==============================================================================
# MISSION 1: BENCHMARK PRECISION CHALLENGE
# ==============================================================================

def test_benchmark_precision_backend():
    """
    Challenge 1: Benchmark Precision in Python backend.
    Parameters: v0=45.0 m/s, theta=45.0°, y0=0.0 m, g=9.81 m/s^2.
    Acceptance: R ≈ 206.42m, h_max ≈ 51.61m within 0.5% tolerance.
    """
    res = PhysicsEngine.calculate_analytical_trajectory(v0=45.0, angle_deg=45.0, y0=0.0, g=9.81)

    expected_R = 206.42
    expected_H = 51.61
    expected_T = 6.49

    # Check 0.5% tolerance relative error
    rel_err_R = abs(res["horizontal_range"] - expected_R) / expected_R
    rel_err_H = abs(res["max_height"] - expected_H) / expected_H
    rel_err_T = abs(res["flight_time"] - expected_T) / expected_T

    assert rel_err_R <= 0.005, f"R error {rel_err_R:.4%} exceeds 0.5%"
    assert rel_err_H <= 0.005, f"H error {rel_err_H:.4%} exceeds 0.5%"
    assert rel_err_T <= 0.005, f"T error {rel_err_T:.4%} exceeds 0.5%"

    # Exact analytical equality
    exact_R = (45.0 ** 2) * math.sin(math.radians(90.0)) / 9.81
    exact_H = ((45.0 * math.sin(math.radians(45.0))) ** 2) / (2.0 * 9.81)
    exact_T = (2.0 * 45.0 * math.sin(math.radians(45.0))) / 9.81

    assert math.isclose(res["horizontal_range"], exact_R, rel_tol=1e-4)
    assert math.isclose(res["max_height"], exact_H, rel_tol=1e-4)
    assert math.isclose(res["flight_time"], exact_T, rel_tol=1e-4)


def test_benchmark_precision_api_endpoint(client):
    """
    Challenge 1: Benchmark Precision via HTTP POST /api/calculate.
    """
    payload = {
        "initial_velocity": 45.0,
        "launch_angle": 45.0,
        "initial_height": 0.0,
        "gravity": 9.81
    }
    response = client.post("/api/calculate", json=payload)
    assert response.status_code == 200
    data = response.get_json()["data"]

    assert abs(data["horizontal_range"] - 206.42) / 206.42 <= 0.005
    assert abs(data["max_height"] - 51.61) / 51.61 <= 0.005
    assert abs(data["flight_time"] - 6.49) / 6.49 <= 0.005


# ==============================================================================
# MISSION 2: ELEVATED PLATFORM & ENERGY CONSERVATION INVARIANT
# ==============================================================================

@pytest.mark.parametrize("v0,angle,y0,g", [
    (10.0, 30.0, 5.0, 9.81),
    (45.0, 55.0, 10.0, 9.81),
    (45.0, 45.0, 50.0, 9.81),
    (75.0, 20.0, 25.0, 9.81),
    (100.0, 60.0, 100.0, 9.81),
    (30.0, 0.0, 35.0, 9.81),    # Horizontal launch from elevated cliff
    (40.0, 89.9, 15.0, 9.81),   # Steep near-vertical from platform
    (50.0, 90.0, 40.0, 9.81),   # Pure vertical from platform
    (20.0, 45.0, 50.0, 1.62),   # Moon gravity
    (60.0, 45.0, 50.0, 3.71),   # Mars gravity
    (35.0, 45.0, 20.0, 24.79),  # Jupiter gravity
])
def test_energy_conservation_invariant(v0, angle, y0, g):
    """
    Challenge 2: Verify mechanical energy conservation invariant:
    E_initial = 1/2 m v0^2 + m g y0
    E_final   = 1/2 m v_impact^2 + 0
    => v_impact = sqrt(v0^2 + 2 * g * y0)
    This MUST hold independently of launch angle theta.
    """
    res = PhysicsEngine.calculate_analytical_trajectory(v0=v0, angle_deg=angle, y0=y0, g=g)

    expected_v_impact = math.sqrt((v0 ** 2) + 2.0 * g * y0)
    actual_v_impact = res["impact_velocity"]

    rel_error = abs(actual_v_impact - expected_v_impact) / expected_v_impact
    assert rel_error < 0.001, (
        f"Energy conservation violated: got v_impact={actual_v_impact}, "
        f"expected={expected_v_impact} (error={rel_error:.5%})"
    )


# ==============================================================================
# MISSION 3: BOUNDARY & CORNER CASES (HTTP 400 & DEFENSIVE VALIDATIONS)
# ==============================================================================

@pytest.mark.parametrize("invalid_param,invalid_value", [
    ("gravity", 0.0),
    ("gravity", -1.0),
    ("gravity", -9.81),
    ("initial_velocity", -0.01),
    ("initial_velocity", -50.0),
    ("launch_angle", -0.01),
    ("launch_angle", -45.0),
    ("launch_angle", 90.01),
    ("launch_angle", 180.0),
    ("initial_height", -0.01),
    ("initial_height", -10.0),
    ("projectile_mass", 0.0),
    ("projectile_mass", -5.0),
])
def test_boundary_validation_http_400(client, invalid_param, invalid_value):
    """
    Challenge 3: Non-positive gravity g<=0, negative v0, angles outside [0, 90],
    negative heights, and non-positive mass MUST return HTTP 400.
    """
    base_payload = {
        "initial_velocity": 45.0,
        "launch_angle": 45.0,
        "initial_height": 0.0,
        "gravity": 9.81,
        "projectile_mass": 10.0
    }
    base_payload[invalid_param] = invalid_value

    response = client.post("/api/calculate", json=base_payload)
    assert response.status_code == 400, f"Expected HTTP 400 for {invalid_param}={invalid_value}, got {response.status_code}"
    res_json = response.get_json()
    assert res_json["success"] is False
    assert "error" in res_json


@pytest.mark.parametrize("param_name", ["initial_velocity", "launch_angle", "initial_height", "gravity", "projectile_mass"])
@pytest.mark.parametrize("bad_literal", ["NaN", "Infinity", "-Infinity", "abc", None])
def test_nan_infinity_malformed_rejection(client, param_name, bad_literal):
    """
    Challenge 3: Verify NaN, Infinity, -Infinity, strings, and null return HTTP 400.
    """
    base_payload = {
        "initial_velocity": 45.0,
        "launch_angle": 45.0,
        "initial_height": 0.0,
        "gravity": 9.81,
        "projectile_mass": 10.0
    }
    base_payload[param_name] = bad_literal

    response = client.post("/api/calculate", json=base_payload)
    assert response.status_code == 400
    res_json = response.get_json()
    assert res_json["success"] is False


def test_edge_case_angle_zero_cliff_drop():
    """
    Challenge 3: Verify angle=0° horizontal launch behavior from cliff (y0 > 0).
    Expected:
    h_max = y0
    flight_time = sqrt(2 * y0 / g)
    range = v0 * flight_time
    """
    v0 = 35.0
    y0 = 45.0
    g = 9.81

    res = PhysicsEngine.calculate_analytical_trajectory(v0=v0, angle_deg=0.0, y0=y0, g=g)

    expected_t = math.sqrt(2.0 * y0 / g)
    expected_R = v0 * expected_t

    assert math.isclose(res["max_height"], y0, rel_tol=1e-3)
    assert math.isclose(res["time_to_max_height"], 0.0, abs_tol=1e-3)
    assert math.isclose(res["flight_time"], expected_t, rel_tol=1e-3)
    assert math.isclose(res["horizontal_range"], expected_R, rel_tol=1e-3)
    assert math.isclose(res["impact_velocity"], math.sqrt(v0 ** 2 + 2 * g * y0), rel_tol=1e-3)


def test_edge_case_angle_ninety_pure_vertical():
    """
    Challenge 3: Verify angle=90° pure vertical launch behavior.
    Expected:
    horizontal_range = 0
    h_max = y0 + v0^2 / (2 * g)
    flight_time = (v0 + sqrt(v0^2 + 2 * g * y0)) / g
    """
    v0 = 40.0
    y0 = 15.0
    g = 9.81

    res = PhysicsEngine.calculate_analytical_trajectory(v0=v0, angle_deg=90.0, y0=y0, g=g)

    expected_hmax = y0 + (v0 ** 2) / (2.0 * g)
    expected_t = (v0 + math.sqrt(v0 ** 2 + 2.0 * g * y0)) / g

    assert math.isclose(res["horizontal_range"], 0.0, abs_tol=1e-3)
    assert math.isclose(res["max_height"], expected_hmax, rel_tol=1e-3)
    assert math.isclose(res["flight_time"], expected_t, rel_tol=1e-3)


def test_edge_case_zero_initial_velocity_and_height():
    """
    Challenge 3: Verify v0=0, y0=0 boundary condition does not divide by zero or crash.
    """
    res = PhysicsEngine.calculate_analytical_trajectory(v0=0.0, angle_deg=45.0, y0=0.0, g=9.81)
    assert res["flight_time"] == 0.0
    assert res["horizontal_range"] == 0.0
    assert res["max_height"] == 0.0
    assert res["impact_velocity"] == 0.0


# ==============================================================================
# MISSION 4: DATA EXPORT & OFFLINE FALLBACK COMPLIANCE
# ==============================================================================

def test_export_csv_headers_and_rfc4180(client):
    """
    Challenge 4: Verify CSV export has RFC 4180 headers and valid trial rows.
    """
    payload = {
        "format": "csv",
        "session": {
            "session_id": "test-exp-session",
            "student_name": "Mahasiswa TPB ITB",
            "experiment_timestamp": "2026-10-06T08:30:00Z",
            "trials": [
                {
                    "trial_number": 1,
                    "v0": 45.0,
                    "angle": 45.0,
                    "y0": 0.0,
                    "g": 9.81,
                    "simulated_range": 206.81,
                    "theoretical_range": 206.42,
                    "relative_error_percentage": 0.19,
                    "status": "VALID"
                }
            ]
        }
    }
    res = client.post("/api/export", json=payload)
    assert res.status_code == 200
    assert "text/csv" in res.content_type
    csv_text = res.get_data(as_text=True)

    header_line = csv_text.splitlines()[0]
    expected_headers = [
        "trial_number", "v0", "angle", "y0", "g",
        "simulated_range", "theoretical_range",
        "relative_error_percentage", "status"
    ]
    for h in expected_headers:
        assert h in header_line, f"Header {h} missing in CSV"


def test_export_json_conforms_to_schema(client):
    """
    Challenge 4: Verify JSON export matches AGENTS.md §5.4 LabExperimentSession schema.
    """
    payload = {
        "format": "json",
        "session": {
            "session_id": "lab-uuid-v4-test",
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
    }
    res = client.post("/api/export", json=payload)
    assert res.status_code == 200
    assert "application/json" in res.content_type
    body = res.get_json()

    # Verify canonical schema fields (§5.4)
    assert body["session_id"] == "lab-uuid-v4-test"
    assert body["student_name"] == "Mahasiswa TPB"
    assert body["experiment_timestamp"] == "2026-10-06T08:25:00Z"
    assert isinstance(body["trials"], list)
    assert len(body["trials"]) == 1

    trial = body["trials"][0]
    assert trial["trial_number"] == 1
    assert trial["v0"] == 45.0
    assert trial["angle"] == 45.0
    assert trial["y0"] == 0.0
    assert trial["g"] == 9.81
    assert trial["simulated_range"] == 206.42
    assert trial["theoretical_range"] == 206.42
    assert trial["relative_error_percentage"] == 0.0
    assert trial["status"] == "VALID"


def test_export_empty_trials_rejection(client):
    """
    Challenge 4: Empty trials should be rejected with HTTP 400.
    """
    res = client.post("/api/export", json={"format": "csv", "session": {"trials": []}})
    assert res.status_code == 400
    assert res.get_json()["error"]["code"] == "EMPTY_TRIALS"


# ==============================================================================
# TARGET CHALLENGE RIGOROUS COLLISION VERIFICATION
# ==============================================================================

def test_target_challenge_trajectory_crossing():
    """
    Verify collision physics when projectile flies toward fortress:
    - If R < target_distance: ground impact (is_hit = False, impact_point.y = 0)
    - If trajectory passes target within tolerance: hit (is_hit = True, score >= 90)
    - If trajectory passes target above tolerance: overshot (is_hit = False)
    """
    # 1. Direct hit scenario:
    hit_res = PhysicsEngine.verify_target_hit(
        target_distance=150.0,
        target_elevation=25.0,
        target_tolerance_radius=5.0,
        v0=50.0,
        angle_deg=50.0,
        y0=0.0,
        g=9.81
    )
    # Check y at x=150:
    v0x = 50.0 * math.cos(math.radians(50.0))
    v0y = 50.0 * math.sin(math.radians(50.0))
    t = 150.0 / v0x
    y_at_150 = v0y * t - 0.5 * 9.81 * (t ** 2)
    dist = abs(y_at_150 - 25.0)

    if dist <= 5.0:
        assert hit_res["is_hit"] is True
        assert hit_res["distance_from_center"] <= 5.0
    else:
        assert hit_res["is_hit"] is False

    # 2. Short fall scenario (target is 400m away, total range is ~250m)
    short_res = PhysicsEngine.verify_target_hit(
        target_distance=400.0,
        target_elevation=20.0,
        target_tolerance_radius=5.0,
        v0=50.0,
        angle_deg=45.0,
        y0=0.0,
        g=9.81
    )
    assert short_res["is_hit"] is False
    assert short_res["impact_point"]["y"] == 0.0
    assert short_res["score"] == 0
