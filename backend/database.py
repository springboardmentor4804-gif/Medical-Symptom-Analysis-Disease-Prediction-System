import logging
from pathlib import Path

from sqlalchemy import (
    create_engine, Column, Integer, String, DateTime, Text, ForeignKey,
    Boolean, JSON, text,
)
from sqlalchemy.dialects.postgresql import JSONB
from sqlalchemy.orm import declarative_base, sessionmaker, relationship
from datetime import datetime

from config import settings

logger = logging.getLogger(__name__)

# JSONB on PostgreSQL (indexable, queryable), plain JSON on SQLite, which
# stores it as TEXT but still round-trips dicts through the ORM. Declaring the
# variant keeps one model definition working on the dev SQLite database and the
# deployed Postgres one.
JSONVariant = JSON().with_variant(JSONB(), "postgresql")

DATABASE_URL = settings.database_url

if DATABASE_URL.startswith("sqlite:///"):
    db_path = Path(DATABASE_URL.removeprefix("sqlite:///"))
    db_path.parent.mkdir(parents=True, exist_ok=True)

connect_args = {"check_same_thread": False} if DATABASE_URL.startswith("sqlite") else {}
engine = create_engine(DATABASE_URL, connect_args=connect_args)
SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)
Base = declarative_base()

class User(Base):
    __tablename__ = "users"
    id = Column(Integer, primary_key=True, index=True)
    email = Column(String, unique=True, index=True, nullable=False)
    password_hash = Column(String, nullable=False)
    role = Column(String, default="patient")  # patient / provider / admin
    is_active = Column(Boolean, default=True, nullable=False)
    created_at = Column(DateTime, default=datetime.utcnow)

    assessments = relationship("Assessment", back_populates="user")
    profile = relationship("PatientProfile", back_populates="user", uselist=False)

class PatientProfile(Base):
    __tablename__ = "patient_profiles"
    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id"), unique=True, nullable=False)
    full_name = Column(String, nullable=True)
    date_of_birth = Column(String, nullable=True)  # ISO date string (YYYY-MM-DD)
    gender = Column(String, nullable=True)
    allergies = Column(Text, nullable=True)
    medical_history = Column(Text, nullable=True)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)

    user = relationship("User", back_populates="profile")


class Assessment(Base):
    __tablename__ = "assessments"
    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id"), nullable=False)
    input_json = Column(Text)
    result_json = Column(Text)
    risk_flag = Column(String)
    created_at = Column(DateTime, default=datetime.utcnow)

    # --- treatment cascade telemetry -------------------------------------
    # Denormalised out of result_json on purpose. These answer "how often does
    # Layer A actually fire in production, and when it doesn't, why?" - a
    # question you cannot answer by scanning a JSON blob across every row, and
    # the one that decides whether the gate needs retuning in the notebook.
    treatment_layer = Column(String, index=True)   # 'mimic'|'drug_reviews'|'none'
    gate_reason = Column(String, index=True)
    treatment_evidence = Column(JSONVariant)

    user = relationship("User", back_populates="assessments")
    provider_report = relationship("ProviderReport", back_populates="assessment", uselist=False)


class ProviderReport(Base):
    __tablename__ = "provider_reports"
    id = Column(Integer, primary_key=True, index=True)
    assessment_id = Column(Integer, ForeignKey("assessments.id"), nullable=False)
    patient_id = Column(Integer, ForeignKey("users.id"), nullable=False)
    provider_id = Column(Integer, ForeignKey("users.id"), nullable=False)
    provider_insights = Column(Text, nullable=False)
    treatment_suggestions = Column(Text, nullable=False)
    health_recommendations = Column(Text, nullable=False)
    doctor_suggestions = Column(Text, nullable=True)
    additional_notes = Column(Text, nullable=True)
    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)

    assessment = relationship("Assessment", back_populates="provider_report")
    patient = relationship("User", foreign_keys=[patient_id])
    provider = relationship("User", foreign_keys=[provider_id])


class ProviderProfile(Base):
    __tablename__ = "provider_profiles"
    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id"), unique=True, nullable=False)
    full_name = Column(String, nullable=False)
    qualifications = Column(String, nullable=False)  # Comma-separated or JSON
    registration_number = Column(String, nullable=False)
    clinic_name = Column(String, nullable=False)
    clinic_address = Column(Text, nullable=False)
    clinic_contact = Column(String, nullable=False)
    signature_image = Column(Text, nullable=True)  # Base64 or file path
    stamp_image = Column(Text, nullable=True)  # Base64 or file path
    signature_type = Column(String, default="typed")  # typed or uploaded
    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)

    user = relationship("User", backref="provider_profile")


class Prescription(Base):
    __tablename__ = "prescriptions"
    id = Column(Integer, primary_key=True, index=True)
    patient_id = Column(Integer, ForeignKey("users.id"), nullable=False)
    provider_id = Column(Integer, ForeignKey("users.id"), nullable=False)
    patient_name = Column(String, nullable=False)
    patient_age = Column(Integer, nullable=False)
    patient_sex = Column(String, nullable=False)
    patient_address = Column(Text, nullable=True)
    medications_json = Column(Text, nullable=False)  # JSON array of medication objects
    additional_notes = Column(Text, nullable=True)
    date_issued = Column(DateTime, default=datetime.utcnow, nullable=False)
    is_signed = Column(Boolean, default=False, nullable=False)
    created_at = Column(DateTime, default=datetime.utcnow)

    patient = relationship("User", foreign_keys=[patient_id])
    provider = relationship("User", foreign_keys=[provider_id])


class SystemSettings(Base):
    __tablename__ = "system_settings"
    id = Column(Integer, primary_key=True, index=True)
    key = Column(String, unique=True, nullable=False, index=True)
    value = Column(String, nullable=False)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)

def _existing_columns(conn, table: str) -> set:
    """Column names on `table`, for whichever backend is configured."""
    if DATABASE_URL.startswith("sqlite"):
        return {row[1] for row in conn.execute(text(f"PRAGMA table_info({table})"))}
    rows = conn.execute(
        text("SELECT column_name FROM information_schema.columns "
             "WHERE table_name = :t"),
        {"t": table},
    )
    return {r[0] for r in rows}


def _run_migrations():
    """
    Add columns introduced after the initial schema to pre-existing databases.

    create_all() creates missing TABLES, never missing COLUMNS on tables that
    already exist, so every column added after the first deploy needs an entry
    here or the app breaks against an older database.

    Each step is guarded by an existence check, so this is safe to re-run and
    safe on a brand-new database where create_all() already made the columns.
    """
    # (table, column, DDL type) - JSONB where the backend supports it.
    json_type = "TEXT" if DATABASE_URL.startswith("sqlite") else "JSONB"
    steps = [
        ("users", "is_active",
         "BOOLEAN DEFAULT 1" if DATABASE_URL.startswith("sqlite")
         else "BOOLEAN DEFAULT TRUE"),
        # Treatment cascade telemetry, added with the v3 model layer.
        ("assessments", "treatment_layer", "VARCHAR"),
        ("assessments", "gate_reason", "VARCHAR"),
        ("assessments", "treatment_evidence", json_type),
    ]

    # EACH statement gets its own connection, which matters on PostgreSQL and
    # not on SQLite. Postgres aborts the entire transaction on a failed
    # statement, so sharing one connection meant the first failure poisoned it
    # and every remaining step was silently skipped - the rollback() cleared
    # the error but the loop kept issuing statements against a connection that
    # would reject them. SQLite tolerates this, which is why it never showed.
    def _try(statement: str) -> None:
        try:
            with engine.connect() as conn:
                conn.execute(text(statement))
                conn.commit()
        except Exception:
            # A table that does not exist yet is handled by create_all(); a
            # duplicate column means another worker won the race. Neither
            # should stop the application from starting.
            logger.debug("migration step skipped: %s", statement, exc_info=True)

    with engine.connect() as conn:
        existing = {table: _existing_columns(conn, table)
                    for table in {t for t, _, _ in steps}}

    for table, column, ddl in steps:
        if column in existing.get(table, set()):
            continue
        _try(f"ALTER TABLE {table} ADD COLUMN {column} {ddl}")

    # Indexed because the monitoring queries filter on them.
    for column in ("treatment_layer", "gate_reason"):
        _try(f"CREATE INDEX IF NOT EXISTS ix_assessments_{column} "
             f"ON assessments ({column})")


def init_db():
    Base.metadata.create_all(bind=engine)
    _run_migrations()
    _initialize_system_settings()


def _initialize_system_settings():
    """Initialize default system settings if they don't exist."""
    db = SessionLocal()
    try:
        model_mode_setting = db.query(SystemSettings).filter(SystemSettings.key == "model_mode").first()
        if not model_mode_setting:
            db.add(SystemSettings(key="model_mode", value="off"))
            db.commit()
    finally:
        db.close()

def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()