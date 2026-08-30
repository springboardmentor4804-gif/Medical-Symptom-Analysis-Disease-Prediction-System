from sqlalchemy import Column, Integer, String, DateTime
from sqlalchemy.orm import relationship
import datetime
from app.database import Base

class User(Base):
    __tablename__ = "users"

    id = Column(Integer, primary_key=True, index=True)
    email = Column(String, unique=True, index=True, nullable=False)
    name = Column(String, nullable=True)
    password_hash = Column(String, nullable=False)
    role = Column(String, default="patient", nullable=False)  # "patient", "doctor", "admin", or "clinic"
    specialty = Column(String, nullable=True)  # Doctor specialty (e.g. Cardiologist, Neurologist)
    created_at = Column(DateTime, default=datetime.datetime.utcnow, nullable=False)

    patient = relationship("Patient", back_populates="user", uselist=False, cascade="all, delete-orphan")
    clinic = relationship("Clinic", back_populates="user", uselist=False, cascade="all, delete-orphan")
