"""
Integration tests for Flask API endpoints via Flask test client.
Tests cover:
- GET /api/health
- POST /api/calculate (benchmark <=0.5% tolerance, aliases, validation HTTP 400 errors)
- POST /api/challenge/verify (hit, miss, short-fall, validation HTTP 400 errors)
- POST /api/export (CSV export format, JSON export format, empty trials validation error)
- GET / (serves templates/index.html without 404)
"""

import json
import math
import pytest
from src.app import create_app


@pytest.fixture
def client():
    """Create test client for Flask application."""
    app = create_app()
    app.config["TESTING"] = True
    with app.test_client() as client:
        yield client


def test_api_health(client):
    """Verify GET /api/health returns 200 OK and expected status payload."""
    response = client.get("/api/health")
    assert response.status_code == 200
    data = response.get_json()
    assert data["status"] == "healthy"
    assert data["service"] == "virtual-lab-tpb"
    assert data["success"] is True


def test_api_calculate_benchmark(client):
    """
    Verify POST /api/calculate matches primary benchmark criteria within 0.5% tolerance:
    v0=45.0, launch_angle=45.0, initial_height=0.0, gravity=9.81
    -> R ≈ 206.42, h_max ≈ 51.61, t_flight ≈ 6.49
    """
    payload = {
        "initial_velocity": 45.0,
        "launch_angle": 45.0,
        "initial_height": 0.0,
        "gravity": 9.81,
        "projectile_mass": 10.0
    }
    response = client.post("/api/calculate", json=payload)
    assert response.status_code == 200
    res_json = response.get_json()
    assert res_json["success"] is True
    data = res_json["data"]

    # 0.5% tolerance checks
    assert math.isclose(data["horizontal_range"], 206.42, rel_tol=0.005)
    assert math.isclose(data["max_height"], 51.61, rel_tol=0.005)
    assert math.isclose(data["flight_time"], 6.49, rel_tol=0.005)
    assert math.isclose(data["impact_velocity"], 45.0, rel_tol=0.005)

    # Sampled points presence and validity
    assert "sampled_points" in data
    assert len(data["sampled_points"]) >= 2
    assert data["sampled_points"][0]["t"] == 0.0


def test_api_calculate_shorthand_aliases(client):
    """Verify POST /api/calculate accepts shorthand field names (v0, angle, y0, g)."""
    payload = {
        "v0": 45.0,
        "angle": 45.0,
        "y0": 0.0,
        "g": 9.81
    }
    response = client.post("/api/calculate", json=payload)
    assert response.status_code == 200
    res_json = response.get_json()
    assert res_json["success"] is True
    data = res_json["data"]
    assert math.isclose(data["horizontal_range"], 206.42, rel_tol=0.005)


def test_api_calculate_validation_errors(client):
    """Verify that invalid inputs return HTTP 400 Bad Request."""
    # 1. Negative gravity
    res = client.post("/api/calculate", json={"gravity": -9.81})
    assert res.status_code == 400
    assert res.get_json()["success"] is False

    # 2. Zero gravity
    res = client.post("/api/calculate", json={"gravity": 0.0})
    assert res.status_code == 400

    # 3. Negative initial velocity
    res = client.post("/api/calculate", json={"initial_velocity": -10.0})
    assert res.status_code == 400

    # 4. Angle out of bounds (> 90 deg)
    res = client.post("/api/calculate", json={"launch_angle": 120.0})
    assert res.status_code == 400

    # 5. Angle out of bounds (< 0 deg)
    res = client.post("/api/calculate", json={"launch_angle": -15.0})
    assert res.status_code == 400

    # 6. Negative initial height
    res = client.post("/api/calculate", json={"initial_height": -5.0})
    assert res.status_code == 400

    # 7. Non-numeric parameter
    res = client.post("/api/calculate", json={"initial_velocity": "not-a-number"})
    assert res.status_code == 400

    # 8. Malformed body
    res = client.post("/api/calculate", data="not json", content_type="application/json")
    assert res.status_code == 400


def test_api_challenge_verify_hit(client):
    """Verify POST /api/challenge/verify for target hit scenario."""
    payload = {
        "target_distance": 180.0,
        "target_elevation": 20.0,
        "target_tolerance_radius": 5.0,
        "parameters": {
            "initial_velocity": 45.0,
            "launch_angle": 55.0,
            "initial_height": 5.0,
            "gravity": 9.81
        }
    }
    response = client.post("/api/challenge/verify", json=payload)
    assert response.status_code == 200
    res_json = response.get_json()
    assert res_json["success"] is True
    assert "is_hit" in res_json
    assert "score" in res_json
    assert "impact_point" in res_json
    assert "distance_from_center" in res_json
    assert "feedback_message" in res_json
    assert isinstance(res_json["score"], int)


def test_api_challenge_verify_short_fall(client):
    """Verify POST /api/challenge/verify returns is_hit=False when shot falls short of target."""
    payload = {
        "target_distance": 300.0,
        "target_elevation": 20.0,
        "target_tolerance_radius": 5.0,
        "parameters": {
            "initial_velocity": 45.0,
            "launch_angle": 45.0,
            "initial_height": 0.0,
            "gravity": 9.81
        }
    }
    response = client.post("/api/challenge/verify", json=payload)
    assert response.status_code == 200
    res_json = response.get_json()
    assert res_json["success"] is True
    assert res_json["is_hit"] is False
    assert res_json["score"] == 0
    assert "jatuh ke tanah sebelum mencapai benteng" in res_json["feedback_message"]


def test_api_challenge_verify_validation_error(client):
    """Verify POST /api/challenge/verify returns HTTP 400 on invalid input parameters."""
    # Negative target distance
    payload = {
        "target_distance": -50.0,
        "target_elevation": 20.0,
        "target_tolerance_radius": 5.0,
        "parameters": {"initial_velocity": 45.0, "launch_angle": 45.0}
    }
    res = client.post("/api/challenge/verify", json=payload)
    assert res.status_code == 400
    assert res.get_json()["success"] is False

    # Negative tolerance radius
    payload["target_distance"] = 150.0
    payload["target_tolerance_radius"] = -2.0
    res = client.post("/api/challenge/verify", json=payload)
    assert res.status_code == 400


def test_api_export_csv(client):
    """Verify POST /api/export generates valid RFC 4180 CSV text with trials data."""
    payload = {
        "format": "csv",
        "session": {
            "session_id": "test-session-uuid",
            "student_name": "Mahasiswa Fisika",
            "experiment_timestamp": "2026-10-06T08:00:00Z",
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
                },
                {
                    "trial_number": 2,
                    "v0": 30.0,
                    "angle": 60.0,
                    "y0": 5.0,
                    "g": 9.81,
                    "simulated_range": 85.12,
                    "theoretical_range": 85.12,
                    "relative_error_percentage": 0.0,
                    "status": "VALID"
                }
            ]
        }
    }
    response = client.post("/api/export", json=payload)
    assert response.status_code == 200
    assert "text/csv" in response.content_type
    assert "attachment" in response.headers.get("Content-Disposition", "")

    csv_text = response.get_data(as_text=True)
    assert "trial_number,v0,angle,y0,g,simulated_range,theoretical_range,relative_error_percentage,status" in csv_text
    assert "1,45.0,45.0,0.0,9.81,206.42,206.42,0.0,VALID" in csv_text
    assert "2,30.0,60.0,5.0,9.81,85.12,85.12,0.0,VALID" in csv_text


def test_api_export_json(client):
    """Verify POST /api/export generates valid JSON download payload."""
    payload = {
        "format": "json",
        "session": {
            "session_id": "test-json-session",
            "student_name": "Mahasiswa TPB",
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
    response = client.post("/api/export", json=payload)
    assert response.status_code == 200
    assert "application/json" in response.content_type
    res_json = json.loads(response.get_data(as_text=True))
    assert res_json["session_id"] == "test-json-session"
    assert len(res_json["trials"]) == 1


def test_api_export_empty_trials_error(client):
    """Verify POST /api/export rejects empty trials list with HTTP 400."""
    payload = {
        "format": "csv",
        "session": {
            "session_id": "empty-session",
            "trials": []
        }
    }
    response = client.post("/api/export", json=payload)
    assert response.status_code == 400
    res_json = response.get_json()
    assert res_json["success"] is False
    assert res_json["error"]["code"] == "EMPTY_TRIALS"


def test_views_index_serves_html(client):
    """Verify GET / successfully serves templates/index.html without 404."""
    response = client.get("/")
    assert response.status_code == 200
    html = response.get_data(as_text=True)
    assert "<canvas" in html
    assert "simCanvas" in html
