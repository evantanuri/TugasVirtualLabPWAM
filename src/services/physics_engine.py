"""
Physics Engine Service for Kinematics & Ballistic Trajectory.
Provides analytical calculations and target collision verification.
"""

import math
from typing import Dict, Any, List


class PhysicsEngine:
    @staticmethod
    def calculate_analytical_trajectory(
        v0: float,
        angle_deg: float,
        y0: float = 0.0,
        g: float = 9.81
    ) -> Dict[str, Any]:
        """
        Calculate ideal projectile motion metrics (without air resistance).
        All units in SI (m, s, deg, m/s^2).
        """
        if g <= 0:
            raise ValueError("Gravitational acceleration must be positive.")
        if v0 < 0:
            raise ValueError("Initial velocity cannot be negative.")

        angle_rad = math.radians(angle_deg)
        v0x = v0 * math.cos(angle_rad)
        v0y = v0 * math.sin(angle_rad)

        # Time to peak height
        t_peak = v0y / g if v0y > 0 else 0.0
        # Peak height relative to ground
        h_max = y0 + (v0y ** 2) / (2 * g) if v0y > 0 else y0

        # Total flight time until y = 0
        # 0 = y0 + v0y*t - 0.5*g*t^2  =>  0.5*g*t^2 - v0y*t - y0 = 0
        discriminant = (v0y ** 2) + 2 * g * y0
        if discriminant < 0:
            flight_time = 0.0
        else:
            flight_time = (v0y + math.sqrt(discriminant)) / g

        # Total horizontal range
        horizontal_range = v0x * flight_time

        # Impact velocity
        vy_final = v0y - g * flight_time
        impact_velocity = math.sqrt(v0x ** 2 + vy_final ** 2)
        impact_angle = math.degrees(math.atan2(vy_final, v0x))

        return {
            "v0": v0,
            "angle_deg": angle_deg,
            "y0": y0,
            "g": g,
            "t_peak": round(t_peak, 3),
            "h_max": round(h_max, 3),
            "flight_time": round(flight_time, 3),
            "horizontal_range": round(horizontal_range, 3),
            "impact_velocity": round(impact_velocity, 3),
            "impact_angle": round(impact_angle, 2)
        }

    @staticmethod
    def verify_target_hit(
        target_x: float,
        target_y: float,
        tolerance_radius: float,
        v0: float,
        angle_deg: float,
        y0: float = 0.0,
        g: float = 9.81
    ) -> Dict[str, Any]:
        """Verify whether trajectory impacts within the target bounding region."""
        angle_rad = math.radians(angle_deg)
        v0x = v0 * math.cos(angle_rad)
        v0y = v0 * math.sin(angle_rad)

        if v0x <= 0:
            return {"is_hit": False, "reason": "No forward velocity"}

        t_at_target = target_x / v0x
        y_at_target = y0 + v0y * t_at_target - 0.5 * g * (t_at_target ** 2)

        vertical_distance = abs(y_at_target - target_y)
        is_hit = vertical_distance <= tolerance_radius

        score = max(0, int(100 - (vertical_distance / tolerance_radius) * 50)) if is_hit else 0

        return {
            "is_hit": is_hit,
            "target_x": target_x,
            "target_y": target_y,
            "y_at_target": round(y_at_target, 3),
            "vertical_distance": round(vertical_distance, 3),
            "score": score
        }
