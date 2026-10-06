"""
Comprehensive unit tests for the PhysicsEngine analytical kinematics service.
Covers:
- Primary benchmark verification (v0=45, angle=45, y0=0, g=9.81 -> R≈206.42, h_max≈51.61, t≈6.49 <= 0.5% tolerance)
- Elevated platform trajectory (y0 > 0)
- Conservation of mechanical energy invariant
- Sampled points array generation
- Boundary physical edge cases (theta=0, theta=90, cliff drops)
- Defensive validations (g<=0, v0<0, angle outside 0-90, y0<0, NaN, Inf)
- Target challenge verification (direct hit, short fall, overshot, invalid inputs)
"""

import math
import pytest
from src.services.physics_engine import PhysicsEngine


def test_analytical_trajectory_benchmark_y0_zero():
    """
    Verify primary acceptance criteria benchmark:
    v0=45.0 m/s, theta=45.0 deg, y0=0.0 m, g=9.81 m/s^2.
    Theoretical: R ≈ 206.42 m, h_max ≈ 51.61 m, t_flight ≈ 6.49 s within 0.5% tolerance.
    """
    v0 = 45.0
    angle = 45.0
    y0 = 0.0
    g = 9.81

    result = PhysicsEngine.calculate_analytical_trajectory(v0=v0, angle_deg=angle, y0=y0, g=g)

    # Theoretical exact calculations
    expected_range = (v0 ** 2) * math.sin(math.radians(2 * angle)) / g  # 2025 / 9.81 = 206.4220 m
    expected_hmax = ((v0 * math.sin(math.radians(angle))) ** 2) / (2.0 * g)  # 1012.5 / 19.62 = 51.6055 m
    expected_flight_time = (2.0 * v0 * math.sin(math.radians(angle))) / g  # 6.4872 s

    # Strict benchmark tolerance <= 0.5% (rel_tol=0.005)
    assert math.isclose(result["horizontal_range"], 206.42, rel_tol=0.005)
    assert math.isclose(result["horizontal_range"], expected_range, rel_tol=0.005)

    assert math.isclose(result["max_height"], 51.61, rel_tol=0.005)
    assert math.isclose(result["max_height"], expected_hmax, rel_tol=0.005)

    assert math.isclose(result["flight_time"], 6.49, rel_tol=0.005)
    assert math.isclose(result["flight_time"], expected_flight_time, rel_tol=0.005)

    # Terminal metrics
    assert math.isclose(result["impact_velocity"], 45.0, rel_tol=0.005)
    assert math.isclose(result["impact_angle"], -45.0, abs_tol=0.1)

    # Backwards compatibility keys
    assert "h_max" in result
    assert "t_peak" in result


def test_analytical_trajectory_elevated_platform_y0_greater_zero():
    """
    Verify elevated launch platform (y0 > 0) per AGENTS.md §5.1 & §5.2.
    v0=45.0, angle=55.0, y0=5.0, g=9.81
    """
    v0 = 45.0
    angle = 55.0
    y0 = 5.0
    g = 9.81

    result = PhysicsEngine.calculate_analytical_trajectory(v0=v0, angle_deg=angle, y0=y0, g=g)

    v0x = v0 * math.cos(math.radians(angle))
    v0y = v0 * math.sin(math.radians(angle))

    expected_t_peak = v0y / g
    expected_hmax = y0 + (v0y ** 2) / (2.0 * g)
    expected_flight_time = (v0y + math.sqrt((v0y ** 2) + 2.0 * g * y0)) / g
    expected_range = v0x * expected_flight_time
    expected_v_impact = math.sqrt((v0 ** 2) + 2.0 * g * y0)

    assert math.isclose(result["time_to_max_height"], expected_t_peak, rel_tol=0.005)
    assert math.isclose(result["max_height"], expected_hmax, rel_tol=0.005)
    assert math.isclose(result["flight_time"], expected_flight_time, rel_tol=0.005)
    assert math.isclose(result["horizontal_range"], expected_range, rel_tol=0.005)
    assert math.isclose(result["impact_velocity"], expected_v_impact, rel_tol=0.005)


def test_conservation_of_energy_invariant():
    """
    Verify mechanical energy conservation invariant:
    v_impact = sqrt(v0^2 + 2 * g * y0) for arbitrary launch angles and heights.
    """
    test_cases = [
        (30.0, 30.0, 10.0, 9.81),
        (50.0, 60.0, 25.0, 9.81),
        (20.0, 15.0, 0.0, 1.62),   # Moon gravity
        (60.0, 45.0, 50.0, 3.71),  # Mars gravity
    ]

    for v0, angle, y0, g in test_cases:
        res = PhysicsEngine.calculate_analytical_trajectory(v0=v0, angle_deg=angle, y0=y0, g=g)
        expected_v_impact = math.sqrt((v0 ** 2) + 2.0 * g * y0)
        assert math.isclose(res["impact_velocity"], expected_v_impact, rel_tol=1e-3)


def test_sampled_points_generation():
    """Verify that sampled_points array complies with AGENTS.md §5.2 schema."""
    result = PhysicsEngine.calculate_analytical_trajectory(v0=45.0, angle_deg=55.0, y0=5.0, g=9.81)

    sampled_points = result["sampled_points"]
    assert isinstance(sampled_points, list)
    assert len(sampled_points) >= 2

    # Verify first point is at t=0
    first_pt = sampled_points[0]
    assert first_pt["t"] == 0.0
    assert first_pt["x"] == 0.0
    assert first_pt["y"] == 5.0
    assert "vx" in first_pt
    assert "vy" in first_pt

    # Verify last point is near flight_time and ground level
    last_pt = sampled_points[-1]
    assert math.isclose(last_pt["t"], result["flight_time"], abs_tol=0.05)
    assert math.isclose(last_pt["x"], result["horizontal_range"], abs_tol=0.1)
    assert last_pt["y"] == 0.0


def test_edge_cases_kinematics():
    """Verify physical edge cases: theta=0, theta=90, zero velocity."""
    # 1. Cliff drop with horizontal launch (theta=0, y0=20)
    res_cliff = PhysicsEngine.calculate_analytical_trajectory(v0=30.0, angle_deg=0.0, y0=20.0, g=9.81)
    expected_t = math.sqrt(2.0 * 20.0 / 9.81)
    assert math.isclose(res_cliff["flight_time"], expected_t, rel_tol=1e-2)
    assert math.isclose(res_cliff["max_height"], 20.0, rel_tol=1e-2)
    assert math.isclose(res_cliff["horizontal_range"], 30.0 * expected_t, rel_tol=1e-2)

    # 2. Pure vertical launch (theta=90, y0=0)
    res_vertical = PhysicsEngine.calculate_analytical_trajectory(v0=40.0, angle_deg=90.0, y0=0.0, g=9.81)
    assert math.isclose(res_vertical["horizontal_range"], 0.0, abs_tol=1e-2)
    expected_hmax = (40.0 ** 2) / (2.0 * 9.81)
    assert math.isclose(res_vertical["max_height"], expected_hmax, rel_tol=1e-2)

    # 3. Zero velocity at ground (v0=0, y0=0)
    res_zero = PhysicsEngine.calculate_analytical_trajectory(v0=0.0, angle_deg=45.0, y0=0.0, g=9.81)
    assert res_zero["flight_time"] == 0.0
    assert res_zero["horizontal_range"] == 0.0


def test_defensive_validations():
    """Verify that PhysicsEngine raises ValueError on invalid boundaries and non-finite numbers."""
    # Negative gravity or zero gravity
    with pytest.raises(ValueError, match="gravity"):
        PhysicsEngine.calculate_analytical_trajectory(v0=20.0, angle_deg=45.0, g=0.0)
    with pytest.raises(ValueError, match="gravity"):
        PhysicsEngine.calculate_analytical_trajectory(v0=20.0, angle_deg=45.0, g=-9.8)

    # Negative velocity
    with pytest.raises(ValueError, match="initial_velocity"):
        PhysicsEngine.calculate_analytical_trajectory(v0=-10.0, angle_deg=45.0, g=9.81)

    # Angle outside [0, 90]
    with pytest.raises(ValueError, match="launch_angle"):
        PhysicsEngine.calculate_analytical_trajectory(v0=20.0, angle_deg=-5.0, g=9.81)
    with pytest.raises(ValueError, match="launch_angle"):
        PhysicsEngine.calculate_analytical_trajectory(v0=20.0, angle_deg=95.0, g=9.81)

    # Negative height
    with pytest.raises(ValueError, match="initial_height"):
        PhysicsEngine.calculate_analytical_trajectory(v0=20.0, angle_deg=45.0, y0=-2.0, g=9.81)

    # NaN / Infinity guards
    with pytest.raises(ValueError, match="NaN atau Infinity"):
        PhysicsEngine.calculate_analytical_trajectory(v0=float("nan"), angle_deg=45.0, g=9.81)
    with pytest.raises(ValueError, match="NaN atau Infinity"):
        PhysicsEngine.calculate_analytical_trajectory(v0=20.0, angle_deg=float("inf"), g=9.81)
    with pytest.raises(ValueError, match="NaN atau Infinity"):
        PhysicsEngine.calculate_analytical_trajectory(v0=20.0, angle_deg=45.0, g=float("-inf"))


def test_target_challenge_direct_hit():
    """Test target verification with a guaranteed direct hit."""
    v0 = 45.0
    angle = 45.0
    g = 9.81
    y0 = 0.0

    # Calculate exact position at x = 100 m
    traj = PhysicsEngine.calculate_analytical_trajectory(v0=v0, angle_deg=angle, y0=y0, g=g)
    v0x = v0 * math.cos(math.radians(angle))
    v0y = v0 * math.sin(math.radians(angle))
    t_target = 100.0 / v0x
    y_target = v0y * t_target - 0.5 * g * (t_target ** 2)

    hit_res = PhysicsEngine.verify_target_hit(
        target_distance=100.0,
        target_elevation=y_target,
        target_tolerance_radius=3.0,
        v0=v0,
        angle_deg=angle,
        y0=y0,
        g=g
    )

    assert hit_res["is_hit"] is True
    assert hit_res["score"] >= 95
    assert hit_res["impact_point"]["x"] == 100.0
    assert math.isclose(hit_res["impact_point"]["y"], y_target, abs_tol=0.01)
    assert hit_res["distance_from_center"] <= 0.05
    assert "puncak benteng" in hit_res["feedback_message"]


def test_target_challenge_short_fall():
    """Verify that if total range R < target_distance, it is properly reported as a ground impact."""
    # At v0=20, 45 deg, range is ~40.8 m
    # Target is positioned at x = 100 m (well beyond range)
    hit_res = PhysicsEngine.verify_target_hit(
        target_distance=100.0,
        target_elevation=10.0,
        target_tolerance_radius=5.0,
        v0=20.0,
        angle_deg=45.0,
        y0=0.0,
        g=9.81
    )

    assert hit_res["is_hit"] is False
    assert hit_res["score"] == 0
    assert hit_res["impact_point"]["y"] == 0.0  # Ground impact
    assert hit_res["impact_point"]["x"] < 50.0  # Fell far short of 100m
    assert "jatuh ke tanah sebelum mencapai benteng" in hit_res["feedback_message"]


def test_target_challenge_overshot_miss():
    """Verify vertical miss when projectile flies over target outside tolerance radius."""
    # Shoot over a low target at half range
    v0 = 45.0
    angle = 45.0
    traj = PhysicsEngine.calculate_analytical_trajectory(v0=v0, angle_deg=angle, y0=0.0, g=9.81)
    target_x = traj["horizontal_range"] / 2.0  # at peak height ~51.6m
    target_y = 10.0  # Low fortress target, projectile is at ~51.6m

    hit_res = PhysicsEngine.verify_target_hit(
        target_distance=target_x,
        target_elevation=target_y,
        target_tolerance_radius=5.0,
        v0=v0,
        angle_deg=angle,
        y0=0.0,
        g=9.81
    )

    assert hit_res["is_hit"] is False
    assert hit_res["score"] == 0
    assert "melambung" in hit_res["feedback_message"]
