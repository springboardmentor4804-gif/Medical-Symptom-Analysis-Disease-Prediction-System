from fastapi import FastAPI, HTTPException, Depends, Header
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
from typing import List, Optional
import psycopg2
import jwt
from datetime import datetime, timedelta

app = FastAPI(title="MedAssist AI API with Strict JWT", version="2.0")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

SECRET_KEY = "medassist_super_secret_jwt_key_2026"
ALGORITHM = "HS256"

DATABASE_URL = "postgresql://neondb_owner:npg_9qVPz6ZnYMNQ@ep-wandering-rice-za12azx0-pooler.c-2.eu-west-2.aws.neon.tech/neondb?sslmode=require&channel_binding=require"

def get_db_connection():
    try:
        conn = psycopg2.connect(DATABASE_URL)
        return conn
    except Exception as e:
        print("Database Connection Error:", e)
        return None

def init_db():
    conn = get_db_connection()
    if conn:
        cursor = conn.cursor()
        cursor.execute("""
            CREATE TABLE IF NOT EXISTS users (
                id SERIAL PRIMARY KEY,
                email TEXT UNIQUE,
                password TEXT,
                role TEXT
            )
        """)
        cursor.execute("""
            CREATE TABLE IF NOT EXISTS symptoms_log (
                id SERIAL PRIMARY KEY,
                email TEXT,
                symptoms TEXT,
                prediction TEXT,
                risk_level TEXT
            )
        """)
        conn.commit()
        cursor.close()
        conn.close()

init_db()

class UserAuth(BaseModel):
    email: str
    password: str
    role: str

class SymptomRequest(BaseModel):
    email: str
    symptoms: List[str]

def verify_jwt_token(authorization: Optional[str] = Header(None)):
    if not authorization or not authorization.startswith("Bearer "):
        raise HTTPException(status_code=401, detail="Missing or invalid JWT token header")
    token = authorization.split(" ")[1]
    try:
        payload = jwt.decode(token, SECRET_KEY, algorithms=[ALGORITHM])
        return payload
    except jwt.ExpiredSignatureError:
        raise HTTPException(status_code=401, detail="JWT token has expired")
    except jwt.InvalidTokenError:
        raise HTTPException(status_code=401, detail="Invalid JWT token")

@app.post("/api/login")
def login_user(user: UserAuth):
    conn = get_db_connection()
    if not conn:
        raise HTTPException(status_code=500, detail="Database connection failed")
    
    cursor = conn.cursor()
    cursor.execute("SELECT * FROM users WHERE email = %s AND role = %s", (user.email, user.role))
    db_user = cursor.fetchone()
    
    if not db_user:
        cursor.execute("INSERT INTO users (email, password, role) VALUES (%s, %s, %s)", 
                       (user.email, user.password, user.role))
        conn.commit()
    elif db_user[2] != user.password:
        cursor.close()
        conn.close()
        raise HTTPException(status_code=401, detail="Incorrect password provided")
        
    cursor.close()
    conn.close()
    
    # Generate JWT token for both Patient and Provider
    token_payload = {
        "sub": user.email, 
        "role": user.role, 
        "exp": datetime.utcnow() + timedelta(hours=24)
    }
    access_token = jwt.encode(token_payload, SECRET_KEY, algorithm=ALGORITHM)
    
    return {
        "status": "success", 
        "access_token": access_token, 
        "token_type": "bearer",
        "role": user.role,
        "message": f"JWT authentication successful for {user.role}"
    }

@app.post("/api/predict")
def predict_disease(data: SymptomRequest, token_data: dict = Depends(verify_jwt_token)):
    symptoms_str = ", ".join(data.symptoms)
    prediction = "Influenza / Viral Respiratory Infection" if len(data.symptoms) < 3 else "Acute Bronchitis / Comprehensive Screening"
    risk = "Low" if len(data.symptoms) < 3 else "Medium"
    
    conn = get_db_connection()
    if conn:
        cursor = conn.cursor()
        cursor.execute("INSERT INTO symptoms_log (email, symptoms, prediction, risk_level) VALUES (%s, %s, %s, %s)",
                       (data.email, symptoms_str, prediction, risk))
        conn.commit()
        cursor.close()
        conn.close()
    
    return {
        "prediction": prediction,
        "risk_level": risk,
        "recommendations": "Maintain strict oral hydration, rest for 3-5 days, and monitor temperature."
    }

@app.get("/api/patients")
def get_patients(token_data: dict = Depends(verify_jwt_token)):
    if token_data.get("role") != "provider":
        raise HTTPException(status_code=403, detail="Access denied: Provider role required")
        
    conn = get_db_connection()
    if not conn:
        return {"patients": []}
    
    cursor = conn.cursor()
    cursor.execute("SELECT id, email, symptoms, prediction, risk_level FROM symptoms_log ORDER BY id DESC")
    rows = cursor.fetchall()
    cursor.close()
    conn.close()
    
    patients_list = []
    for r in rows:
        patients_list.append({
            "id": r[0],
            "email": r[1],
            "symptoms": r[2],
            "prediction": r[3],
            "risk_level": r[4]
        })
    return {"patients": patients_list}
