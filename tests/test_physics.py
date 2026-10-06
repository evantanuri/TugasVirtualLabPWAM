"""
Unit tests for analytical physics engine calculations.
"""

import pytest
import math
from src.services.physics_engine import PhysicsEngine


def test_analytical_trajectory_symmetric():
    """Test 45 degree symmetric trajectory on flat ground (y0 = 0)."""
    v0 = 20.0
    angle = 45.0
    g = 9.8
    result = PhysicsEngine.calculate_analytical_trajectory(v0=v0, angle_deg=angle, y0=0.0, g=g)

    # Theoretical: R = v0^2 / g = 400 / 9.8 = ~40.816 m
    expected_range = (v0 ** 2) / g
    assert math.isclose(result["horizontal_range"], expected_range, rel_tol=1e-2)

    # Theoretical: h_max = (v0 * sin(45))^2 / (2 * g) = 200 / 19.6 = ~10.204 m
    expected_hmax = ((v0 * math.sin(math.radians(45))) ** 2) / (2 * g)
    assert math.isclose(result["h_max"], expected_hmax, rel_tol=1e-2)


def test_invalid_parameters():
    """Test exception raising on non-physical negative gravity."""
    with pytest.raises(ValueError):
        PhysicsEngine.calculate_analytical_trajectory(v0=20.0, angle_deg=45.0, g=-9.8)


def test_target_verification_hit():
    """Test target verification with a guaranteed hit trajectory."""
    # Shoot at 45 deg, v0 = 20, g = 9.8, target at range/2
    v0 = 20.0
    angle = 45.0
    g = 9.8
    traj = PhysicsEngine.calculate_analytical_trajectory(v0=v0, angle_deg=angle, y0=0.0, g=g)
    target_x = traj["horizontal_range"] / 2
    # at half range, y = h_max
    target_y = traj["h_max"]

    hit_result = PhysicsEngine.verify_target_hit(
        target_x=target_x,
        target_y=target_y,
        tolerance_radius=2.0,
        v0=v0,
        angle_deg=angle,
        y0=0.0,
        g=g
    )
    assert hit_result["is_hit"] is True
    assert hit_result["score"] >= 90
