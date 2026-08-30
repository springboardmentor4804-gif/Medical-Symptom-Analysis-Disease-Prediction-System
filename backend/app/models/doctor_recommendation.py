from sqlalchemy import Column, Integer, String, Text, DateTime, ForeignKey
from sqlalchemy.orm import relationship
import datetime
from app.database import Base

class DoctorRecommendation(Base):
    __tablename__ = "doctor_recommendations"

    id = Column(Integer, primary_key=True, index=True)
    doctor_id = Column(Integer, ForeignKey("users.id"), nullable=False)
    patient_id = Column(Integer, ForeignKey("patients.id"), nullable=False)
    diagnosis = Column(String, nullable=False)
    recommendations = Column(Text, nullable=True)
    prescription = Column(Text, nullable=True)
    status = Column(String, default="Solved", nullable=False)  # "Pending", "Under Review", "Solved"
    created_at = Column(DateTime, default=datetime.datetime.utcnow, nullable=False)

    doctor = relationship("User")
    patient = relationship("Patient")
