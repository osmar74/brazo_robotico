# Brazo Robótico 3DOF

Simulación interactiva de un brazo robótico de 3 grados de libertad
construida con FastAPI (backend) y Three.js (frontend), siguiendo
el patrón de arquitectura MVC.

## Tecnologías

- Python 3.x
- FastAPI — servidor y rutas REST
- Uvicorn — servidor ASGI
- Pydantic — validación de datos
- Three.js r128 — renderizado 3D en el browser

## Estructura del proyecto

brazo-robotico/
├── app/
│   ├── init.py
│   ├── main.py              ← Controller (FastAPI)
│   └── models/
│       ├── init.py
│       └── robot_model.py   ← Model (cinemática directa)
├── static/
│   └── index.html           ← View (Three.js)
├── requirements.txt
└── README.md

## Instalación y ejecución

### 1. Clonar el repositorio

```cmd
git clone https://github.com/TU_USUARIO/brazo-robotico.git
cd brazo-robotico
```

### 2. Crear y activar el entorno virtual

```cmd
python -m venv venv
venv\Scripts\activate
```

### 3. Instalar dependencias

```cmd
pip install -r requirements.txt
```

### 4. Ejecutar el servidor

```cmd
uvicorn app.main:app --reload --port 8000
```

### 5. Abrir en el browser
http://127.0.0.1:8000

## Endpoints API

| Método | Ruta | Descripción |
|--------|------|-------------|
| POST | `/kinematics` | Recibe θ1 θ2 θ3 y retorna XYZ |
| GET  | `/reset`      | Retorna posición home del brazo |
| GET  | `/info`       | Datos del modelo (L1, L2, DOF) |
| GET  | `/docs`       | Documentación automática FastAPI |

## Cinemática directa
r = L1·cos(θ2) + L2·cos(θ2 + θ3 - π)
z = L1·sin(θ2) + L2·sin(θ2 + θ3 - π) + h_base
x = r · sin(θ1)
y = r · cos(θ1)
Donde `L1 = 2.2`, `L2 = 1.8`, `h_base = 0.9`.

## Controles de la simulación

| Control | Rango | Descripción |
|---------|-------|-------------|
| θ1 Base | -180° a 180° | Rotación de la base sobre eje Z |
| θ2 Hombro | 0° a 150° | Elevación del brazo superior |
| θ3 Codo | 0° a 170° | Flexión del antebrazo |
| Pinza | 0 a 100 | Apertura del efector final |

## Arquitectura MVC
Browser  →  View (index.html)
↓ fetch POST /kinematics
→  Controller (main.py / FastAPI)
↓ instancia
→  Model (robot_model.py / RobotArm)
↓ retorna JSON {x, y, z}
←  Controller  ←  View actualiza pantalla
