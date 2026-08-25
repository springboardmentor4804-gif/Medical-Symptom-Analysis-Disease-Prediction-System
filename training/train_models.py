from pathlib import Path
import json, joblib, pandas as pd
from sklearn.model_selection import train_test_split
from sklearn.ensemble import RandomForestClassifier
from sklearn.metrics import accuracy_score, precision_score, recall_score, f1_score
from sklearn.preprocessing import OneHotEncoder
from sklearn.compose import ColumnTransformer
from sklearn.pipeline import Pipeline

ROOT=Path(__file__).resolve().parents[1]
# Disease model: actual 4,920-row dataset
df=pd.read_csv(ROOT/"backend/data/disease_prediction_train.csv")
features=[c for c in df.columns if c not in ["prognosis","Unnamed: 133"]]
X=df[features].astype(int); y=df["prognosis"].astype(str).str.strip()
Xtr,Xv,ytr,yv=train_test_split(X,y,test_size=.2,random_state=42,stratify=y)
model=RandomForestClassifier(n_estimators=300,random_state=42,n_jobs=-1,class_weight="balanced")
model.fit(Xtr,ytr); p=model.predict(Xv)
m={"validation_accuracy":accuracy_score(yv,p),"validation_precision":precision_score(yv,p,average="weighted",zero_division=0),"validation_recall":recall_score(yv,p,average="weighted",zero_division=0),"validation_f1":f1_score(yv,p,average="weighted",zero_division=0)}
joblib.dump({"model":model,"features":features},ROOT/"backend/models/disease_model.joblib")

# Risk model: actual 349-row patient-profile dataset
df=pd.read_csv(ROOT/"backend/data/disease_symptoms_patient_profile.csv"); df.columns=[c.strip() for c in df.columns]
target="Outcome Variable"; rf=[c for c in df.columns if c not in ["Disease",target]]
cat=[c for c in rf if df[c].dtype=="object"]
pre=ColumnTransformer([("cat",OneHotEncoder(handle_unknown="ignore"),cat)],remainder="passthrough")
rm=Pipeline([("pre",pre),("clf",RandomForestClassifier(n_estimators=250,random_state=42,class_weight="balanced"))])
rx,ry=df[rf],df[target].astype(str).str.strip()
rtr,rv,rytr,ryv=train_test_split(rx,ry,test_size=.2,random_state=42,stratify=ry)
rm.fit(rtr,rytr); rp=rm.predict(rv)
m.update({"risk_accuracy":accuracy_score(ryv,rp),"risk_precision":precision_score(ryv,rp,average="weighted",zero_division=0),"risk_recall":recall_score(ryv,rp,average="weighted",zero_division=0),"risk_f1":f1_score(ryv,rp,average="weighted",zero_division=0)})
joblib.dump({"model":rm,"features":rf},ROOT/"backend/models/risk_model.joblib")
(ROOT/"training/results/metrics.json").write_text(json.dumps(m,indent=2))
print(json.dumps(m,indent=2))
