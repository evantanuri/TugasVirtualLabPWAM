from flask import Blueprint, jsonify, request
from src.services.physics_engine import PhysicsEngine

api_bp = Blueprint("api", __name__, url_prefix="/api")


@api_bp.route("/health", methods=["GET"])
def health_check():
    """Health check endpoint."""
    return jsonify({
        "success": True,
        "service": "Virtual Lab Fisika TPB ITB API",
        "status": "healthy"
    }), 200


@api_bp.route("/calculate", methods=["POST"])
def calculate_trajectory():
    """Calculate analytical trajectory based on input parameters."""
    data = request.get_json() or {}
    try:
        v0 = float(data.get("v0", 45.0))
        angle = float(data.get("angle", 45.0))
        y0 = float(data.get("y0", 0.0))
        g = float(data.get("g", 9.81))

        result = PhysicsEngine.calculate_analytical_trajectory(v0, angle, y0, g)
        return jsonify({
            "success": True,
            "data": result
        }), 200
    except ValueError as e:
        return jsonify({
            "success": False,
            "error": {"code": "INVALID_PARAM", "message": str(e)}
        }), 400
    except Exception as e:
        return jsonify({
            "success": False,
            "error": {"code": "SERVER_ERROR", "message": str(e)}
        }), 500


@api_bp.route("/challenge/verify", methods=["POST"])
def verify_challenge():
    """Verify target hit."""
    data = request.get_json() or {}
    try:
        target_x = float(data.get("target_x", 150.0))
        target_y = float(data.get("target_y", 20.0))
        tolerance = float(data.get("tolerance", 5.0))
        v0 = float(data.get("v0", 45.0))
        angle = float(data.get("angle", 45.0))
        y0 = float(data.get("y0", 0.0))
        g = float(data.get("g", 9.81))

        result = PhysicsEngine.verify_target_hit(
            target_x, target_y, tolerance, v0, angle, y0, g
        )
        return jsonify({
            "success": True,
            "data": result
        }), 200
    except Exception as e:
        return jsonify({
            "success": False,
            "error": {"code": "VERIFY_ERROR", "message": str(e)}
        }), 400
