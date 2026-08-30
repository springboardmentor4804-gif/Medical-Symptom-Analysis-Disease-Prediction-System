from sqlalchemy import Column, Integer, String, DateTime, ForeignKey
from sqlalchemy.orm import relationship
import datetime
from app.database import Base

class Symptom(Base):
    __tablename__ = "symptoms"

    id = Column(Integer, primary_key=True, index=True)
    patient_id = Column(Integer, ForeignKey("patients.id"), nullable=False)
    symptom_name = Column(String, nullable=False)
    occurrence_count = Column(Integer, default=1, nullable=False)
    duration_onset = Column(String, nullable=True, default="Just today")
    submitted_at = Column(DateTime, default=datetime.datetime.utcnow, nullable=False)

    patient = relationship("Patient", back_populates="symptoms")
