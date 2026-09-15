from sqlalchemy import (
    Column,
    Integer,
    String,
    DateTime,
    ForeignKey,
    Text,
)
from sqlalchemy.orm import relationship
from sqlalchemy.sql import func

from app.database import Base


# =====================================
# User Model
# =====================================

class User(Base):
    __tablename__ = "users"

    id = Column(
        Integer,
        primary_key=True,
        index=True
    )

    full_name = Column(
        String,
        nullable=False
    )

    email = Column(
        String,
        unique=True,
        nullable=False
    )

    password = Column(
        String,
        nullable=False
    )

    role = Column(
        String,
        nullable=False
    )

    created_at = Column(
        DateTime(timezone=True),
        server_default=func.now()
    )

    # Relationships
    patient_profile = relationship(
        "PatientProfile",
        back_populates="user",
        uselist=False,
        cascade="all, delete-orphan",
    )

    symptoms = relationship(
        "Symptom",
        back_populates="patient",
        cascade="all, delete-orphan",
    )

    predictions = relationship(
        "Prediction",
        back_populates="patient",
        cascade="all, delete-orphan",
    )


# =====================================
# Patient Profile
# =====================================

class PatientProfile(Base):
    __tablename__ = "patient_profiles"

    id = Column(
        Integer,
        primary_key=True,
        index=True
    )

    user_id = Column(
        Integer,
        ForeignKey("users.id"),
        unique=True,
        nullable=False,
    )

    phone = Column(String(20))

    date_of_birth = Column(String(20))

    gender = Column(String(20))

    blood_group = Column(String(10))

    height = Column(String(10))

    weight = Column(String(10))

    address = Column(Text)

    emergency_contact = Column(String(20))

    allergies = Column(Text)

    medical_history = Column(Text)

    created_at = Column(
        DateTime(timezone=True),
        server_default=func.now(),
    )

    updated_at = Column(
        DateTime(timezone=True),
        server_default=func.now(),
        onupdate=func.now(),
    )

    user = relationship(
        "User",
        back_populates="patient_profile",
    )


# =====================================
# Symptoms
# =====================================

class Symptom(Base):
    __tablename__ = "symptoms"

    id = Column(
        Integer,
        primary_key=True,
        index=True
    )

    patient_id = Column(
        Integer,
        ForeignKey("users.id"),
        nullable=False,
    )

    fever = Column(String(20))

    cough = Column(String(20))

    headache = Column(String(20))

    fatigue = Column(String(20))

    chest_pain = Column(String(20))

    shortness_of_breath = Column(String(20))

    blood_pressure = Column(String(20))

    heart_rate = Column(String(20))

    blood_sugar = Column(String(20))

    temperature = Column(String(20))

    notes = Column(Text)

    created_at = Column(
        DateTime(timezone=True),
        server_default=func.now(),
    )

    patient = relationship(
        "User",
        back_populates="symptoms",
    )

    predictions = relationship(
        "Prediction",
        back_populates="symptom",
        cascade="all, delete-orphan",
    )


# =====================================
# Prediction
# =====================================

class Prediction(Base):
    __tablename__ = "predictions"

    id = Column(
        Integer,
        primary_key=True,
        index=True
    )

    patient_id = Column(
        Integer,
        ForeignKey("users.id"),
        nullable=False,
    )

    symptom_id = Column(
        Integer,
        ForeignKey("symptoms.id"),
        nullable=False,
    )

    predicted_disease = Column(
        String(100)
    )

    confidence = Column(
        String(20)
    )

    # NEW
    risk_score = Column(
        Integer
    )

    risk_level = Column(
        String(20)
    )

    # NEW
    severity_score = Column(
        Integer
    )

    # NEW
    severity_level = Column(
        String(20)
    )

    recommendation = Column(
        Text
    )

    created_at = Column(
        DateTime(timezone=True),
        server_default=func.now(),
    )

    patient = relationship(
        "User",
        back_populates="predictions",
    )

    symptom = relationship(
        "Symptom",
        back_populates="predictions",
    )


# =====================================
# Doctor Patient Assignment
# =====================================

class DoctorPatientAssignment(Base):
    __tablename__ = "doctor_patient_assignments"

    id = Column(
        Integer,
        primary_key=True,
        index=True
    )

    doctor_id = Column(
        Integer,
        ForeignKey("users.id"),
        nullable=False
    )

    patient_id = Column(
        Integer,
        ForeignKey("users.id"),
        nullable=False,
        unique=True
    )

    assigned_at = Column(
        DateTime(timezone=True),
        server_default=func.now()
    )

    doctor = relationship(
        "User",
        foreign_keys=[doctor_id]
    )

    patient = relationship(
        "User",
        foreign_keys=[patient_id]
    )