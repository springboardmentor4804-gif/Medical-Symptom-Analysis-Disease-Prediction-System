from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from app.database import engine
from app import models

from app.routes import prediction
from app.routes.auth import router as auth_router
from app.routes.patient import router as patient_router
from app.routes import symptoms
from app.routes import reports
from app.routes import doctor
from app.routes import admin
from app.routes import recommendation
from app.routes import analytics


# =========================================================
# Create database tables
# =========================================================

models.Base.metadata.create_all(
    bind=engine
)


# =========================================================
# Create FastAPI application
# =========================================================

app = FastAPI(
    title="MedAssist-AI API",
    version="1.0.0"
)


# =========================================================
# CORS Configuration
# =========================================================

app.add_middleware(
    CORSMiddleware,

    allow_origins=[
        "http://localhost:3000",
        "https://med-assist-ai-omega.vercel.app",
    ],

    allow_credentials=True,

    allow_methods=["*"],

    allow_headers=["*"],
)


# =========================================================
# Register Routers
# =========================================================

app.include_router(auth_router)

app.include_router(patient_router)

app.include_router(symptoms.router)

app.include_router(prediction.router)

app.include_router(reports.router)

app.include_router(doctor.router)

app.include_router(admin.router)

app.include_router(recommendation.router)

app.include_router(analytics.router)


# =========================================================
# Home
# =========================================================

@app.get("/")
def home():

    return {
        "message":
            "Database Connected Successfully!"
    }