from pathlib import Path
import sqlite3, hashlib, joblib, pandas as pd
from datetime import datetime
from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel, Field

ROOT=Path(__file__).resolve().parents[1]; DB=ROOT/"medassist.db"
DM=joblib.load(ROOT/"models/disease_model.joblib"); RM=joblib.load(ROOT/"models/risk_model.joblib")
dmodel=DM["model"]; DFEATURES=DM["features"]; rmodel=RM["model"]; RFEATURES=RM["features"]
LABELS={f:f.replace("_"," ").replace("  "," ").title() for f in DFEATURES}
app=FastAPI(title="MedAssist AI",version="Final Milestone 1-2")
app.add_middleware(CORSMiddleware,allow_origins=["*"],allow_credentials=True,allow_methods=["*"],allow_headers=["*"])

def conn():
    c=sqlite3.connect(DB)
    c.execute("CREATE TABLE IF NOT EXISTS users(id INTEGER PRIMARY KEY AUTOINCREMENT,name TEXT,email TEXT UNIQUE,password TEXT,role TEXT)")
    c.execute("""CREATE TABLE IF NOT EXISTS assessments(
      id INTEGER PRIMARY KEY AUTOINCREMENT,user_id INTEGER,symptoms TEXT,prediction TEXT,confidence REAL,
      risk TEXT,risk_score REAL,severity INTEGER,created_at TEXT)""")
    c.commit(); return c
conn().close()
def hp(x): return hashlib.sha256(x.encode()).hexdigest()

class Reg(BaseModel):
    name:str; email:str; password:str; role:str=Field(pattern="^(patient|provider)$")
class Login(BaseModel): email:str; password:str
class Assessment(BaseModel):
    user_id:int|None=None
    symptoms:dict[str,int]
    age:int=30; gender:str="Female"; blood_pressure:str="Normal"; cholesterol:str="Normal"
    bmi:float=22; smoker:bool=False; exercise:bool=True; known_condition:bool=False

@app.get("/api/health")
def health(): return {"status":"ok","disease_model":True,"risk_model":True,"disease_features":len(DFEATURES)}

@app.get("/api/symptoms")
def symptoms(): return [{"id":x,"label":LABELS[x]} for x in DFEATURES]

@app.post("/api/register")
def register(x:Reg):
    c=conn()
    try:
        c.execute("INSERT INTO users(name,email,password,role) VALUES(?,?,?,?)",(x.name,x.email.lower(),hp(x.password),x.role));c.commit()
        return {"message":"Registration successful"}
    except sqlite3.IntegrityError: raise HTTPException(400,"Email already registered")
    finally:c.close()

@app.post("/api/login")
def login(x:Login):
    c=conn(); r=c.execute("SELECT id,name,email,role FROM users WHERE email=? AND password=?",(x.email.lower(),hp(x.password))).fetchone();c.close()
    if not r: raise HTTPException(401,"Invalid email or password")
    return {"user":{"id":r[0],"name":r[1],"email":r[2],"role":r[3]}}

@app.post("/api/assess")
def assess(x:Assessment):
    v={f:int(bool(x.symptoms.get(f,0))) for f in DFEATURES}
    X=pd.DataFrame([v],columns=DFEATURES)
    pro=dmodel.predict_proba(X)[0]; cls=dmodel.classes_; order=pro.argsort()[::-1][:5]
    preds=[{"disease":str(cls[i]),"probability":round(float(pro[i])*100,2)} for i in order]
    top=preds[0]
    # Risk model uses the actual 349-row patient profile feature schema.
    rf_input={
      "Fever":"Yes" if v.get("high_fever",0) or v.get("mild_fever",0) else "No",
      "Cough":"Yes" if v.get("cough",0) else "No",
      "Fatigue":"Yes" if v.get("fatigue",0) else "No",
      "Difficulty Breathing":"Yes" if v.get("breathlessness",0) else "No",
      "Age":x.age,"Gender":x.gender,"Blood Pressure":x.blood_pressure,"Cholesterol Level":x.cholesterol
    }
    rX=pd.DataFrame([rf_input],columns=RFEATURES)
    rpro=rmodel.predict_proba(rX)[0]; rcls=rmodel.classes_; ri=rpro.argmax()
    rawrisk=float(rpro[ri])*100
    # Add transparent symptom/lifestyle adjustment for UI severity.
    urgent=25 if v.get("chest_pain",0) or v.get("breathlessness",0) else 0
    lifestyle=(15 if x.smoker else 0)+(10 if not x.exercise else 0)+(10 if x.bmi>=30 else 0)
    score=min(100,round(rawrisk*.65+top["probability"]*.2+urgent+lifestyle,2))
    risk="High" if score>=70 else "Moderate" if score>=40 else "Low"
    severity=min(100,round(top["probability"]*.7+sum(v.values())*1.5,2))
    rec="Seek prompt professional medical evaluation, especially if symptoms are severe or worsening." if risk=="High" else "Arrange a healthcare consultation and monitor symptoms closely." if risk=="Moderate" else "Monitor symptoms and consult a healthcare professional if they persist."
    if x.user_id:
        c=conn();c.execute("INSERT INTO assessments(user_id,symptoms,prediction,confidence,risk,risk_score,severity,created_at) VALUES(?,?,?,?,?,?,?,?)",
          (x.user_id,str(x.symptoms),top["disease"],top["probability"],risk,score,int(severity),datetime.now().isoformat(timespec="seconds")));c.commit();c.close()
    return {"predictions":preds,"top_prediction":top["disease"],"confidence":top["probability"],"risk":risk,"risk_score":score,"severity":severity,"recommendation":rec,
            "risk_model_output":rcls[ri],"risk_model_probability":round(float(rpro[ri])*100,2),
            "disclaimer":"Academic preliminary assessment; not a medical diagnosis."}

@app.get("/api/provider/patients")
def patients():
    c=conn(); rows=c.execute("SELECT id,name,email,role FROM users WHERE role='patient' ORDER BY id DESC").fetchall();c.close()
    return [{"id":a,"name":b,"email":d,"role":e} for a,b,d,e in rows]
@app.get("/api/provider/history")
def history():
    c=conn(); rows=c.execute("""SELECT a.id,u.name,a.prediction,a.confidence,a.risk,a.risk_score,a.severity,a.created_at
      FROM assessments a LEFT JOIN users u ON a.user_id=u.id ORDER BY a.id DESC""").fetchall();c.close()
    return [{"id":a,"patient":b or "—","prediction":d,"confidence":e,"risk":f,"risk_score":g,"severity":h,"created_at":i} for a,b,d,e,f,g,h,i in rows]
@app.get("/api/provider/analysis")
def analysis():
    c=conn(); total=c.execute("SELECT COUNT(*) FROM assessments").fetchone()[0]; high=c.execute("SELECT COUNT(*) FROM assessments WHERE risk='High'").fetchone()[0]
    rows=c.execute("SELECT prediction,COUNT(*) FROM assessments GROUP BY prediction ORDER BY COUNT(*) DESC").fetchall();c.close()
    return {"total_assessments":total,"high_risk_cases":high,"disease_distribution":[{"disease":a,"count":b} for a,b in rows]}
