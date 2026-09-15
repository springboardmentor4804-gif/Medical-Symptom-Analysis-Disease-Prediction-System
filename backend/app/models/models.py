from datetime import datetime
from sqlalchemy import String, Integer, DateTime, ForeignKey, Text, Float
from sqlalchemy.orm import Mapped, mapped_column
from app.db.session import Base
class User(Base):
    __tablename__='users'
    id: Mapped[int]=mapped_column(Integer, primary_key=True)
    full_name: Mapped[str]=mapped_column(String(120))
    email: Mapped[str]=mapped_column(String(255), unique=True, index=True)
    password_hash: Mapped[str]=mapped_column(String(255))
    role: Mapped[str]=mapped_column(String(20), default='patient')
    created_at: Mapped[datetime]=mapped_column(DateTime, default=datetime.utcnow)
class Prediction(Base):
    __tablename__='predictions'
    id: Mapped[int]=mapped_column(Integer, primary_key=True)
    user_id: Mapped[int]=mapped_column(ForeignKey('users.id', ondelete='CASCADE'))
    symptoms: Mapped[str]=mapped_column(Text)
    disease: Mapped[str]=mapped_column(String(120))
    confidence: Mapped[float]=mapped_column(Float)
    risk_level: Mapped[str]=mapped_column(String(30))
    recommendation: Mapped[str]=mapped_column(Text)
    created_at: Mapped[datetime]=mapped_column(DateTime, default=datetime.utcnow)
