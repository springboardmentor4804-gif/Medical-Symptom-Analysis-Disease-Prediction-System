"""
Pydantic models for MongoDB documents in the MedAssist AI `medassist` database.

These are NOT SQLAlchemy models — they are plain Pydantic classes used to
validate and serialise data before inserting into MongoDB collections.

Collections / Models:
  users        → MongoUser
  patients     → MongoPatient
  symptoms     → MongoSymptom
  user_inputs  → MongoUserInput  (generic catch-all for every form submission)
"""

from __future__ import annotations

import datetime
from typing import Any, Dict, List, Optional

from pydantic import BaseModel, EmailStr, Field


# ─────────────────────────────────────────────────────────────────
# Helper: current UTC timestamp
# ─────────────────────────────────────────────────────────────────

def _utcnow() -> datetime.datetime:
    return datetime.datetime.utcnow()


# ─────────────────────────────────────────────────────────────────
# users collection
# ─────────────────────────────────────────────────────────────────

class MongoUser(BaseModel):
    """Mirrors a user registration into the MongoDB `users` collection."""

    email: str
    name: Optional[str] = None
    role: str = "patient"                # "patient" | "doctor" | "admin" | "clinic"
    specialty: Optional[str] = None      # Doctors only
    # We store the HASHED password — never the plain-text password
    password_hash: str
    created_at: datetime.datetime = Field(default_factory=_utcnow)

    model_config = {"json_encoders": {datetime.datetime: lambda v: v.isoformat()}}


# ─────────────────────────────────────────────────────────────────
# patients collection
# ─────────────────────────────────────────────────────────────────

class MongoPatient(BaseModel):
    """Mirrors a patient profile into the MongoDB `patients` collection."""

    user_email: str                          # FK to MongoUser.email
    name: str
    age: int
    gender: str
    medical_history: Optional[str] = None
    updated_at: datetime.datetime = Field(default_factory=_utcnow)

    model_config = {"json_encoders": {datetime.datetime: lambda v: v.isoformat()}}


# ─────────────────────────────────────────────────────────────────
# symptoms collection
# ─────────────────────────────────────────────────────────────────

class MongoSymptom(BaseModel):
    """Mirrors a symptom submission into the MongoDB `symptoms` collection."""

    user_email: str                          # FK to MongoUser.email
    patient_name: str
    symptom_name: str
    submitted_at: datetime.datetime = Field(default_factory=_utcnow)

    model_config = {"json_encoders": {datetime.datetime: lambda v: v.isoformat()}}


# ─────────────────────────────────────────────────────────────────
# user_inputs collection  (generic catch-all)
# ─────────────────────────────────────────────────────────────────

class MongoUserInput(BaseModel):
    """
    A generic log document written every time a user submits any form.

    Fields
    ------
    input_type : str
        One of: "registration", "patient_profile_update", "symptom_submission"
    user_email : str
        The email of the authenticated user (or 'anonymous' for public routes)
    payload    : dict
        The raw sanitised data the user submitted (no passwords)
    timestamp  : datetime
        When the submission was received by the server
    """

    input_type: str
    user_email: str
    payload: Dict[str, Any]
    timestamp: datetime.datetime = Field(default_factory=_utcnow)

    model_config = {"json_encoders": {datetime.datetime: lambda v: v.isoformat()}}
