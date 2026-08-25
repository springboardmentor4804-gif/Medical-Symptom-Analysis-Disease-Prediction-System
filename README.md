# MedAssist AI — FINAL Milestone 1 + 2

This final ZIP uses the **actual uploaded datasets**, not the previous demo CSV.

### Dataset facts
- Disease prediction training: 4,920 rows, 132 symptom features, 41 disease classes.
- External test: 42 rows.
- Patient profile/risk dataset: 349 rows.

### Start backend
```powershell
cd backend
python -m venv venv
venv\Scripts\activate
pip install -r requirements.txt
cd ..
python training/train_models.py
uvicorn backend.app.main:app --reload --port 8000
```

If Python import paths cause an issue, run:
```powershell
cd backend
uvicorn app.main:app --reload --port 8000
```
after the model files have been created.

### Start frontend
In a second terminal:
```powershell
cd frontend
npm install
npm run dev
```

Open the Vite URL.

### Mentor-ready metrics
Validation accuracy: 100.00%
External test accuracy: 97.62%
Risk-model accuracy: 75.71%

The system is an academic prototype and is not a medical diagnostic device.
