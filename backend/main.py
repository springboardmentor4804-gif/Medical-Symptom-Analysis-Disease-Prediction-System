from contextlib import asynccontextmanager
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from app.database import engine, Base
from app.routes import auth, patients, symptoms, admin, doctor, clinic, prediction
from app.routes import mongo_routes
from app.mongo_database import connect_mongo, close_mongo
from sqlalchemy import inspect


# Create tables in PostgreSQL (if they do not exist)
Base.metadata.create_all(bind=engine)


def ensure_user_name_column():
    if engine.dialect.name != "sqlite":
        return

    inspector = inspect(engine)
    user_columns = [column["name"] for column in inspector.get_columns("users")]
    with engine.begin() as connection:
        if "name" not in user_columns:
            connection.exec_driver_sql("ALTER TABLE users ADD COLUMN name VARCHAR")
        if "medical_reg_no" not in user_columns:
            connection.exec_driver_sql("ALTER TABLE users ADD COLUMN medical_reg_no VARCHAR")
        if "council_type" not in user_columns:
            connection.exec_driver_sql("ALTER TABLE users ADD COLUMN council_type VARCHAR")
        if "state_council" not in user_columns:
            connection.exec_driver_sql("ALTER TABLE users ADD COLUMN state_council VARCHAR")
        if "qualification" not in user_columns:
            connection.exec_driver_sql("ALTER TABLE users ADD COLUMN qualification VARCHAR")
        if "registration_year" not in user_columns:
            connection.exec_driver_sql("ALTER TABLE users ADD COLUMN registration_year INTEGER")
        if "is_verified" not in user_columns:
            connection.exec_driver_sql("ALTER TABLE users ADD COLUMN is_verified BOOLEAN DEFAULT 0")

    if inspector.has_table("symptoms"):
        symptom_columns = [column["name"] for column in inspector.get_columns("symptoms")]
        with engine.begin() as connection:
            if "occurrence_count" not in symptom_columns:
                connection.exec_driver_sql("ALTER TABLE symptoms ADD COLUMN occurrence_count INTEGER DEFAULT 1")
            if "duration_onset" not in symptom_columns:
                connection.exec_driver_sql("ALTER TABLE symptoms ADD COLUMN duration_onset VARCHAR DEFAULT 'Just today'")


ensure_user_name_column()


# ── Application lifespan (startup + shutdown) ──────────────────────
@asynccontextmanager
async def lifespan(app: FastAPI):
    # Startup: connect to MongoDB (non-fatal if unavailable)
    await connect_mongo()
    yield
    # Shutdown: close MongoDB connection cleanly
    await close_mongo()


app = FastAPI(
    title="MedAssist AI API",
    description="Backend API for MedAssist AI - Milestone 1",
    version="1.0.0",
    lifespan=lifespan,
)

# CORS configuration
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # For production, specify the exact domains
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Include routers
app.include_router(auth.router)
app.include_router(patients.router)
app.include_router(symptoms.router)
app.include_router(admin.router)
app.include_router(doctor.router)
app.include_router(clinic.router)
app.include_router(prediction.router)
app.include_router(mongo_routes.router)  # MongoDB read-only admin routes

@app.api_route("/", methods=["GET", "HEAD"])
def read_root():
    return {"message": "Welcome to MedAssist AI API!"}

@app.api_route("/health", methods=["GET", "HEAD"])
def health_check():
    return {"status": "healthy"}
