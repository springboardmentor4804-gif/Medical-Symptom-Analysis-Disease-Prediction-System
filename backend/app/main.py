from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from app.dataset_loader import load_all_datasets
from app.auth import router as auth_router
from app.patient import router as patient_router
from app.caretaker import router as caretaker_router
from app.analytics import router as analytics_router


app = FastAPI()

# CORS Configuration
origins = [
    "http://localhost:5173",
]

app.add_middleware(
    CORSMiddleware,
    allow_origins=origins,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(auth_router)
app.include_router(patient_router)
app.include_router(caretaker_router)
app.include_router(analytics_router)

@app.get("/")
def read_root():
    return {"message": "MedAssist AI API is running"}


@app.get("/datasets/summary")
def get_dataset_summary():
    patient_profile, disease_dataset, symptom_severity = load_all_datasets()

    return {
        "patient_profile_dataset": {
            "rows": patient_profile.shape[0],
            "columns": patient_profile.shape[1]
        },
        "disease_prediction_dataset": {
            "rows": disease_dataset.shape[0],
            "columns": disease_dataset.shape[1]
        },
        "symptom_severity_dataset": {
            "rows": symptom_severity.shape[0],
            "columns": symptom_severity.shape[1]
        }
    }
