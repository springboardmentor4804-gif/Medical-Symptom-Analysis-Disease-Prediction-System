from sqlalchemy import Column, Integer, DateTime, ForeignKey
from sqlalchemy.orm import relationship
import datetime

from app.database import Base


class DoctorPatientInteraction(Base):
    __tablename__ = "doctor_patient_interactions"

    id = Column(Integer, primary_key=True, index=True)
    doctor_id = Column(Integer, ForeignKey("users.id"), nullable=False)
    patient_id = Column(Integer, ForeignKey("patients.id"), nullable=False)
    reviewed_at = Column(DateTime, default=datetime.datetime.utcnow, nullable=False)

    doctor = relationship("User")
    patient = relationship("Patient")