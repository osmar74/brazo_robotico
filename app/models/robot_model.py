import math


class RobotArm:
    """
    Modelo cinemático de un brazo robótico 3DOF (RRR).
    Articulaciones:
        θ1 — rotación de la base sobre eje Z
        θ2 — elevación del hombro
        θ3 — flexión del codo
    """

    def __init__(self, L1: float = 2.2, L2: float = 1.8):
        self.L1 = L1  # longitud del brazo superior (hombro → codo)
        self.L2 = L2  # longitud del antebrazo  (codo  → efector)
        self.base_height = 0.9  # altura de la base cilíndrica

    def forward_kinematics(
        self,
        theta1_deg: float,
        theta2_deg: float,
        theta3_deg: float,
    ) -> dict:
        """
        Cinemática directa: dados los ángulos en grados,
        retorna la posición XYZ del efector final.

        Fórmulas:
            r  = L1·cos(θ2) + L2·cos(θ2 + θ3 - π)
            z  = L1·sin(θ2) + L2·sin(θ2 + θ3 - π) + base_height
            x  = r · sin(θ1)
            y  = r · cos(θ1)
        """
        t1 = math.radians(theta1_deg)
        t2 = math.radians(theta2_deg)
        t3 = math.radians(180 - theta3_deg)  # codo relativo al hombro

        r = self.L1 * math.cos(t2) + self.L2 * math.cos(t2 + t3 - math.pi)
        z = self.L1 * math.sin(t2) + self.L2 * math.sin(t2 + t3 - math.pi) + self.base_height

        x = round(r * math.sin(t1), 4)
        y = round(r * math.cos(t1), 4)
        z = round(z, 4)

        return {
            "x": x,
            "y": y,
            "z": z,
            "theta1": theta1_deg,
            "theta2": theta2_deg,
            "theta3": theta3_deg,
            "L1": self.L1,
            "L2": self.L2,
        }

    def reset_position(self) -> dict:
        """Retorna la posición inicial (home) del brazo."""
        return self.forward_kinematics(
            theta1_deg=0.0,
            theta2_deg=45.0,
            theta3_deg=90.0,
        )