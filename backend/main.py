from contextlib import asynccontextmanager
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from app.database import engine, Base
from app.routes import auth, patients, symptoms, admin, doctor, clinic, prediction, feedback
from app.routes import mongo_routes
from app.mongo_database import connect_mongo, close_mongo
from sqlalchemy import inspect


def ensure_user_name_column():
    if engine.dialect.name != "sqlite":
        return
    try:
        inspector = inspect(engine)
        if inspector.has_table("users"):
            user_columns = [column["name"] for column in inspector.get_columns("users")]
            with engine.begin() as connection:
                if "name" not in user_columns:
                    connection.exec_driver_sql("ALTER TABLE users ADD COLUMN name VARCHAR")
    except Exception as e:
        print(f"[SQLite Schema Check Warning]: {e}")

# Create tables in Database (if reachable) & Seed Admin
try:
    Base.metadata.create_all(bind=engine)
    ensure_user_name_column()
    from seed_admin import seed_admin
    seed_admin("admin@medassist.ai", "admin123")
except Exception as e:
    print(f"[Database Warning] Could not connect or create database tables on startup: {e}")


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
    allow_origin_regex=r"https?://.*",
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
app.include_router(feedback.router)
app.include_router(mongo_routes.router)  # MongoDB read-only admin routes

@app.api_route("/", methods=["GET", "HEAD"])
def read_root():
    return {"message": "Welcome to MedAssist AI API!"}

@app.api_route("/health", methods=["GET", "HEAD"])
def health_check():
    return {"status": "healthy"}
