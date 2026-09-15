# MedAssist AI Backend

FastAPI backend for MedAssist AI. PostgreSQL is supported through SQLAlchemy.

## Setup
1. Create a PostgreSQL database named `medassist_ai` in pgAdmin 4.
2. Copy `.env.example` to `.env` and set your PostgreSQL password.
3. `python -m venv venv`
4. `venv\Scripts\Activate.ps1`
5. `pip install -r requirements.txt`
6. `uvicorn app.main:app --reload`

API docs: http://127.0.0.1:8000/docs
