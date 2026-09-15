# MedAssist AI — Professional Edition

A professional full-stack AI-assisted medical symptom triage platform with separate Patient and Doctor roles, FastAPI backend, React/Vite frontend, JWT authentication, assessment history, doctor patient view, and PostgreSQL persistence.

## Project structure
- `backend/` FastAPI + SQLAlchemy + PostgreSQL
- `frontend/` React + Vite

## PostgreSQL / pgAdmin 4
Create a database in pgAdmin 4 named `medassist_ai`.
Copy `backend/.env.example` to `backend/.env` and replace `YOUR_PASSWORD` with your PostgreSQL password.

## Run backend (PowerShell)
```powershell
cd backend
python -m venv venv
.\venv\Scripts\Activate.ps1
pip install -r requirements.txt
uvicorn app.main:app --reload
```
API docs: http://127.0.0.1:8000/docs

## Run frontend (new terminal)
```powershell
cd frontend
npm install
npm run dev
```
Frontend: http://localhost:5173

## Roles
Registration includes Patient and Doctor. Patients can run assessments and view history. Doctors can view registered patients.

## Medical safety
This project provides preliminary educational/triage guidance and is not a diagnosis or a substitute for professional medical care.
