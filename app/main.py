from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles
from pydantic import BaseModel, Field
from app.models.robot_model import RobotArm


app = FastAPI(
    title="Brazo Robótico 3DOF",
    description="API para controlar la simulación del brazo robótico",
    version="1.0.0",
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_methods=["*"],
    allow_headers=["*"],
)

arm = RobotArm(L1=2.2, L2=1.8)


class AngulosInput(BaseModel):
    theta1: float = Field(default=0.0,   ge=-180.0, le=180.0)
    theta2: float = Field(default=45.0,  ge=0.0,    le=150.0)
    theta3: float = Field(default=90.0,  ge=0.0,    le=170.0)
    grip:   float = Field(default=0.0,   ge=0.0,    le=100.0)


@app.post("/kinematics")
def calcular_cinematica(angulos: AngulosInput):
    """
    Recibe los ángulos de las articulaciones,
    retorna la posición XYZ del efector final.
    """
    resultado = arm.forward_kinematics(
        theta1_deg=angulos.theta1,
        theta2_deg=angulos.theta2,
        theta3_deg=angulos.theta3,
    )
    resultado["grip"] = angulos.grip
    return resultado


@app.get("/reset")
def posicion_home():
    """Retorna la posición inicial (home) del brazo."""
    return arm.reset_position()


@app.get("/info")
def info():
    """Información del modelo del brazo."""
    return {
        "L1": arm.L1,
        "L2": arm.L2,
        "base_height": arm.base_height,
        "dof": 3,
    }


app.mount("/", StaticFiles(directory="static", html=True), name="static")