from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from app.db.session import Base,engine
from app.models import User,Prediction
from app.api import auth,predict,system,doctor
Base.metadata.create_all(bind=engine)
app=FastAPI(title='MedAssist AI',version='2.0.0',description='Professional AI-assisted symptom triage and health insights platform.')
app.add_middleware(CORSMiddleware,allow_origins=['http://localhost:5173','http://127.0.0.1:5173'],allow_credentials=True,allow_methods=['*'],allow_headers=['*'])
app.include_router(auth.router); app.include_router(predict.router); app.include_router(system.router); app.include_router(doctor.router)
