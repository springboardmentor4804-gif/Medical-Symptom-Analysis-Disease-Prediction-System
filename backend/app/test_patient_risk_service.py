from app.patient_risk_service import assess_patient_risk


patient = {

    "Fever": "Yes",

    "Cough": "Yes",

    "Fatigue": "Yes",

    "Difficulty Breathing": "No",

    "Age": 45,

    "Gender": "Male",

    "Blood Pressure": "High",

    "Cholesterol Level": "High",

}


print("=" * 60)
print("MEDASSIST AI - PATIENT RISK SERVICE TEST")
print("=" * 60)


result = assess_patient_risk(
    patient
)


print("\nPatient profile:")

for key, value in patient.items():

    print(
        f"{key}: {value}"
    )


print("\nRisk assessment:")

print(
    "Predicted outcome:",
    result["predicted_outcome"]
)

print(
    "Positive model score:",
    result["positive_model_score"],
    "%"
)

print(
    "Negative model score:",
    result["negative_model_score"],
    "%"
)

print(
    "\nDisclaimer:"
)

print(
    result["disclaimer"]
)