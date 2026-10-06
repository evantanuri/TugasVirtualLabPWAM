"""
Physics Engine Service for Kinematics & Ballistic Trajectory.
Provides exact analytical calculations, trajectory sampling,
and target collision verification for TPB ITB Virtual Physics Lab.
"""

import math
from typing import Dict, Any, List, Optional


def _validate_numeric(
    name: str,
    value: Any,
    min_val: Optional[float] = None,
    max_val: Optional[float] = None,
    strictly_positive: bool = False
) -> float:
    """Helper to validate numeric inputs against NaN, Infinity, and boundary ranges."""
    try:
        val = float(value)
    except (TypeError, ValueError):
        raise ValueError(f"Parameter '{name}' harus berupa angka numerik valid.")

    if math.isnan(val) or math.isinf(val):
        raise ValueError(f"Parameter '{name}' tidak boleh bernilai NaN atau Infinity.")

    if strictly_positive and val <= 0.0:
        raise ValueError(f"Parameter '{name}' harus bernilai positif lebih dari 0.")

    if min_val is not None and val < min_val:
        raise ValueError(f"Parameter '{name}' tidak boleh kurang dari {min_val}.")

    if max_val is not None and val > max_val:
        raise ValueError(f"Parameter '{name}' tidak boleh lebih dari {max_val}.")

    return val


class PhysicsEngine:
    """Analytical 2D projectile kinematics engine."""

    @staticmethod
    def calculate_analytical_trajectory(
        v0: float,
        angle_deg: float,
        y0: float = 0.0,
        g: float = 9.81,
        mass: float = 10.0,
        air_resistance: bool = False,
        drag_coefficient: float = 0.47
    ) -> Dict[str, Any]:
        """
        Calculate exact analytical projectile motion metrics in vacuum.
        All units in SI (m, s, deg, m/s^2).
        
        Benchmark reference:
        v0 = 45.0, angle_deg = 45.0, y0 = 0.0, g = 9.81
        -> R ≈ 206.42 m, h_max ≈ 51.61 m, flight_time ≈ 6.49 s
        """
        v0 = _validate_numeric("initial_velocity (v0)", v0, min_val=0.0, max_val=150.0)
        angle_deg = _validate_numeric("launch_angle (angle)", angle_deg, min_val=0.0, max_val=90.0)
        y0 = _validate_numeric("initial_height (y0)", y0, min_val=0.0, max_val=100.0)
        g = _validate_numeric("gravity (g)", g, min_val=0.1, max_val=25.0, strictly_positive=True)
        mass = _validate_numeric("projectile_mass (mass)", mass, min_val=0.1, max_val=100.0, strictly_positive=True)

        angle_rad = math.radians(angle_deg)
        v0x = v0 * math.cos(angle_rad)
        v0y = v0 * math.sin(angle_rad)

        # Time to peak height
        t_peak = (v0y / g) if v0y > 0.0 else 0.0
        # Peak height relative to ground
        h_max = y0 + ((v0y ** 2) / (2.0 * g)) if v0y > 0.0 else y0

        # Total flight time until y = 0
        # 0.5 * g * t^2 - v0y * t - y0 = 0
        discriminant = (v0y ** 2) + 2.0 * g * y0
        if v0 == 0.0 and y0 == 0.0:
            flight_time = 0.0
            horizontal_range = 0.0
            impact_velocity = 0.0
            impact_angle = 0.0
        elif discriminant < 0:
            flight_time = 0.0
            horizontal_range = 0.0
            impact_velocity = 0.0
            impact_angle = 0.0
        else:
            flight_time = (v0y + math.sqrt(discriminant)) / g
            horizontal_range = v0x * flight_time
            vy_final = v0y - g * flight_time
            impact_velocity = math.sqrt((v0x ** 2) + (vy_final ** 2))
            impact_angle = math.degrees(math.atan2(vy_final, v0x))

        # Generate sampled points for analytical verification
        sampled_points: List[Dict[str, float]] = []
        if flight_time <= 0.0:
            sampled_points.append({
                "t": 0.0,
                "x": 0.0,
                "y": round(y0, 2),
                "vx": round(v0x, 2),
                "vy": round(v0y, 2)
            })
        else:
            # Generate sample timestamps including t=0 and final impact
            if flight_time >= 2.0:
                dt = 1.0
            elif flight_time >= 0.5:
                dt = 0.5
            else:
                dt = max(0.05, flight_time / 10.0)

            t_samples: List[float] = []
            t_curr = 0.0
            while t_curr < flight_time - 1e-4:
                t_samples.append(t_curr)
                t_curr += dt
            t_samples.append(flight_time)

            for t in t_samples:
                x_t = v0x * t
                y_t = max(0.0, y0 + v0y * t - 0.5 * g * (t ** 2))
                vx_t = v0x
                vy_t = v0y - g * t
                sampled_points.append({
                    "t": round(t, 2),
                    "x": round(x_t, 2),
                    "y": round(y_t, 2),
                    "vx": round(vx_t, 2),
                    "vy": round(vy_t, 2)
                })

        return {
            # Canonical AGENTS.md §5.2 fields
            "flight_time": round(flight_time, 3),
            "max_height": round(h_max, 3),
            "time_to_max_height": round(t_peak, 3),
            "horizontal_range": round(horizontal_range, 3),
            "impact_velocity": round(impact_velocity, 3),
            "impact_angle": round(impact_angle, 2),
            "sampled_points": sampled_points,
            # Legacy and helper parameters for full compatibility
            "v0": round(v0, 2),
            "angle_deg": round(angle_deg, 2),
            "y0": round(y0, 2),
            "g": round(g, 2),
            "t_peak": round(t_peak, 3),
            "h_max": round(h_max, 3),
            "mass": round(mass, 2),
            "air_resistance": air_resistance,
            "drag_coefficient": round(drag_coefficient, 3)
        }

    @staticmethod
    def verify_target_hit(
        target_distance: Optional[float] = None,
        target_elevation: Optional[float] = None,
        target_tolerance_radius: Optional[float] = None,
        v0: float = 45.0,
        angle_deg: float = 45.0,
        y0: float = 0.0,
        g: float = 9.81,
        # Backward-compatibility alias keyword args:
        target_x: Optional[float] = None,
        target_y: Optional[float] = None,
        tolerance_radius: Optional[float] = None,
        tolerance: Optional[float] = None,
        angle: Optional[float] = None,
        initial_velocity: Optional[float] = None,
        launch_angle: Optional[float] = None,
        initial_height: Optional[float] = None,
        gravity: Optional[float] = None,
        **kwargs
    ) -> Dict[str, Any]:
        """
        Verify whether ballistic trajectory impacts the target fortress within tolerance.
        Checks if ground impact occurs before reaching target (R < target_distance).
        Returns compliance with AGENTS.md §5.3 schema.
        """
        # Resolve target distance
        dist = target_distance if target_distance is not None else target_x
        if dist is None:
            dist = 180.0

        # Resolve target elevation
        elev = target_elevation if target_elevation is not None else target_y
        if elev is None:
            elev = 20.0

        # Resolve tolerance radius
        tol = target_tolerance_radius if target_tolerance_radius is not None else (
            tolerance_radius if tolerance_radius is not None else (
                tolerance if tolerance is not None else 5.0
            )
        )

        # Resolve kinematics parameters
        vel = initial_velocity if initial_velocity is not None else v0
        ang = launch_angle if launch_angle is not None else (angle if angle is not None else angle_deg)
        h0 = initial_height if initial_height is not None else y0
        grav = gravity if gravity is not None else g

        # Validate inputs defensively
        dist = _validate_numeric("target_distance (target_x)", dist, min_val=0.1, strictly_positive=True)
        elev = _validate_numeric("target_elevation (target_y)", elev, min_val=0.0)
        tol = _validate_numeric("target_tolerance_radius (tolerance)", tol, min_val=0.01, strictly_positive=True)
        vel = _validate_numeric("initial_velocity (v0)", vel, min_val=0.0, max_val=150.0)
        ang = _validate_numeric("launch_angle (angle)", ang, min_val=0.0, max_val=90.0)
        h0 = _validate_numeric("initial_height (y0)", h0, min_val=0.0, max_val=100.0)
        grav = _validate_numeric("gravity (g)", grav, min_val=0.1, max_val=25.0, strictly_positive=True)

        ang_rad = math.radians(ang)
        v0x = vel * math.cos(ang_rad)
        v0y = vel * math.sin(ang_rad)

        # Calculate total range
        disc = (v0y ** 2) + 2.0 * grav * h0
        t_flight = (v0y + math.sqrt(disc)) / grav if (vel > 0 or h0 > 0) else 0.0
        total_range = v0x * t_flight

        # Case 1: No horizontal forward motion
        if v0x <= 1e-6:
            impact_point = {"x": 0.0, "y": round(max(0.0, h0), 2)}
            distance_from_center = round(math.hypot(dist - impact_point["x"], elev - impact_point["y"]), 2)
            return {
                "is_hit": False,
                "impact_point": impact_point,
                "distance_from_center": distance_from_center,
                "score": 0,
                "feedback_message": "Proyektil tidak memiliki kecepatan horizontal ke arah benteng sasaran.",
                "target_x": round(dist, 2),
                "target_y": round(elev, 2),
                "y_at_target": round(impact_point["y"], 3),
                "vertical_distance": round(distance_from_center, 3)
            }

        # Case 2: Projectile impacts ground before reaching target (R < target_distance)
        if total_range < dist:
            impact_point = {"x": round(total_range, 2), "y": 0.0}
            distance_from_center = round(math.hypot(dist - total_range, elev - 0.0), 2)
            return {
                "is_hit": False,
                "impact_point": impact_point,
                "distance_from_center": distance_from_center,
                "score": 0,
                "feedback_message": "Proyektil jatuh ke tanah sebelum mencapai benteng sasaran (jangkauan tembakan kurang jauh).",
                "target_x": round(dist, 2),
                "target_y": round(elev, 2),
                "y_at_target": 0.0,
                "vertical_distance": round(distance_from_center, 3)
            }

        # Case 3: Projectile crosses target distance in flight
        t_target = dist / v0x
        y_target = h0 + v0y * t_target - 0.5 * grav * (t_target ** 2)
        vertical_dist = abs(y_target - elev)
        is_hit = vertical_dist <= tol

        if is_hit:
            score = max(0, min(100, int(round(100.0 - (vertical_dist / tol) * 50.0))))
            if score >= 90:
                feedback = "Tepat mengenai puncak benteng sasaran dengan akurasi sangat tinggi!"
            else:
                feedback = "Tepat mengenai benteng sasaran!"
        else:
            score = 0
            if y_target > elev:
                feedback = "Tembakan melambung melewati bagian atas benteng sasaran."
            else:
                feedback = "Tembakan mengenai dinding benteng terlalu rendah."

        return {
            "is_hit": is_hit,
            "impact_point": {"x": round(dist, 2), "y": round(y_target, 2)},
            "distance_from_center": round(vertical_dist, 2),
            "score": score,
            "feedback_message": feedback,
            # Legacy fields for backward compatibility
            "target_x": round(dist, 2),
            "target_y": round(elev, 2),
            "y_at_target": round(y_target, 3),
            "vertical_distance": round(vertical_dist, 3)
        }
