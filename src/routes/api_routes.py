"""
API Routes Blueprint for Virtual Lab Fisika TPB ITB.
Exposes endpoints:
- GET /api/health
- POST /api/calculate
- POST /api/challenge/verify
- POST /api/export
"""

import io
import csv
import json
from flask import Blueprint, jsonify, request, Response
from src.services.physics_engine import PhysicsEngine

api_bp = Blueprint("api", __name__, url_prefix="/api")


@api_bp.route("/health", methods=["GET"])
def health_check():
    """Health check endpoint confirming service status."""
    return jsonify({
        "status": "healthy",
        "service": "virtual-lab-tpb",
        "success": True,
        "message": "Virtual Lab Fisika TPB ITB API is running normally"
    }), 200


@api_bp.route("/calculate", methods=["POST"])
def calculate_trajectory():
    """
    Calculate analytical 2D kinematics trajectory.
    Accepts SimulationParameters (AGENTS.md §5.1) and returns AnalyticalTrajectoryResult (AGENTS.md §5.2).
    """
    data = request.get_json(silent=True)
    if not isinstance(data, dict):
        return jsonify({
            "success": False,
            "error": {"code": "INVALID_JSON", "message": "Body request harus berupa JSON object."}
        }), 400

    try:
        # Flexible parser supporting both canonical AGENTS.md §5.1 and shorthand names
        v0 = data.get("initial_velocity", data.get("v0", 45.0))
        angle = data.get("launch_angle", data.get("angle", data.get("angle_deg", 45.0)))
        y0 = data.get("initial_height", data.get("y0", 0.0))
        g = data.get("gravity", data.get("g", 9.81))
        mass = data.get("projectile_mass", data.get("mass", 10.0))
        air_res = bool(data.get("air_resistance", False))
        drag_coeff = data.get("drag_coefficient", data.get("cd", 0.47))

        result = PhysicsEngine.calculate_analytical_trajectory(
            v0=v0,
            angle_deg=angle,
            y0=y0,
            g=g,
            mass=mass,
            air_resistance=air_res,
            drag_coefficient=drag_coeff
        )

        return jsonify({
            "success": True,
            "data": result,
            "message": "Perhitungan analitik berhasil."
        }), 200

    except ValueError as e:
        return jsonify({
            "success": False,
            "error": {"code": "INVALID_PARAM", "message": str(e)}
        }), 400
    except Exception as e:
        return jsonify({
            "success": False,
            "error": {"code": "SERVER_ERROR", "message": f"Terjadi kesalahan internal server: {str(e)}"}
        }), 500


@api_bp.route("/challenge/verify", methods=["POST"])
def verify_challenge():
    """
    Verify castle target hit according to AGENTS.md §5.3 schema.
    """
    data = request.get_json(silent=True)
    if not isinstance(data, dict):
        return jsonify({
            "success": False,
            "error": {"code": "INVALID_JSON", "message": "Body request harus berupa JSON object."}
        }), 400

    try:
        # Extract target specifications
        target_dist = data.get("target_distance", data.get("target_x", 180.0))
        target_elev = data.get("target_elevation", data.get("target_y", 20.0))
        tol = data.get("target_tolerance_radius", data.get("tolerance_radius", data.get("tolerance", 5.0)))

        # Extract kinematics parameters from nested 'parameters' or root level
        params = data.get("parameters", {})
        if not isinstance(params, dict):
            params = {}

        v0 = params.get("initial_velocity", params.get("v0", data.get("initial_velocity", data.get("v0", 45.0))))
        angle = params.get("launch_angle", params.get("angle", params.get("angle_deg", data.get("launch_angle", data.get("angle", 45.0)))))
        y0 = params.get("initial_height", params.get("y0", data.get("initial_height", data.get("y0", 0.0))))
        g = params.get("gravity", params.get("g", data.get("gravity", data.get("g", 9.81))))

        result = PhysicsEngine.verify_target_hit(
            target_distance=target_dist,
            target_elevation=target_elev,
            target_tolerance_radius=tol,
            v0=v0,
            angle_deg=angle,
            y0=y0,
            g=g
        )

        return jsonify({
            "success": True,
            "data": result,
            "is_hit": result["is_hit"],
            "score": result["score"],
            "impact_point": result["impact_point"],
            "distance_from_center": result["distance_from_center"],
            "feedback_message": result["feedback_message"]
        }), 200

    except ValueError as e:
        return jsonify({
            "success": False,
            "error": {"code": "INVALID_PARAM", "message": str(e)}
        }), 400
    except Exception as e:
        return jsonify({
            "success": False,
            "error": {"code": "SERVER_ERROR", "message": f"Terjadi kesalahan verifikasi: {str(e)}"}
        }), 500


@api_bp.route("/export", methods=["POST"])
def export_experiment_data():
    """
    Export experiment trials dataset to CSV or JSON format.
    Adheres to LabExperimentSession schema (AGENTS.md §5.4).
    """
    data = request.get_json(silent=True)
    if not isinstance(data, dict):
        return jsonify({
            "success": False,
            "error": {"code": "INVALID_JSON", "message": "Body request harus berupa JSON object."}
        }), 400

    export_format = str(data.get("format", "json")).strip().lower()

    # Session can be wrapped under 'session' key or root object
    session_data = data.get("session", data)
    if not isinstance(session_data, dict):
        return jsonify({
            "success": False,
            "error": {"code": "INVALID_SESSION", "message": "Format data sesi praktikum tidak valid."}
        }), 400

    trials = session_data.get("trials", [])
    if not isinstance(trials, list) or len(trials) == 0:
        return jsonify({
            "success": False,
            "error": {"code": "EMPTY_TRIALS", "message": "Data percobaan (trials) tidak boleh kosong."}
        }), 400

    # Build standardized session structure
    session_payload = {
        "session_id": session_data.get("session_id", "session-tpb-default"),
        "student_name": session_data.get("student_name", "Mahasiswa TPB ITB"),
        "experiment_timestamp": session_data.get("experiment_timestamp", ""),
        "trials": trials
    }

    if export_format == "csv":
        output = io.StringIO()
        fieldnames = [
            "trial_number",
            "v0",
            "angle",
            "y0",
            "g",
            "simulated_range",
            "theoretical_range",
            "relative_error_percentage",
            "status"
        ]
        writer = csv.DictWriter(output, fieldnames=fieldnames, extrasaction="ignore")
        writer.writeheader()

        for idx, trial in enumerate(trials, start=1):
            if not isinstance(trial, dict):
                continue
            writer.writerow({
                "trial_number": trial.get("trial_number", idx),
                "v0": trial.get("v0", 0.0),
                "angle": trial.get("angle", trial.get("launch_angle", 0.0)),
                "y0": trial.get("y0", trial.get("initial_height", 0.0)),
                "g": trial.get("g", trial.get("gravity", 9.81)),
                "simulated_range": trial.get("simulated_range", trial.get("range", 0.0)),
                "theoretical_range": trial.get("theoretical_range", 0.0),
                "relative_error_percentage": trial.get("relative_error_percentage", 0.0),
                "status": trial.get("status", "VALID")
            })

        csv_content = output.getvalue()
        return Response(
            csv_content,
            mimetype="text/csv",
            headers={
                "Content-Disposition": "attachment; filename=laporan_praktikum_parabola.csv"
            }
        )

    # Default: JSON format
    return Response(
        json.dumps(session_payload, indent=2),
        mimetype="application/json",
        headers={
            "Content-Disposition": "attachment; filename=laporan_praktikum_parabola.json"
        }
    )
