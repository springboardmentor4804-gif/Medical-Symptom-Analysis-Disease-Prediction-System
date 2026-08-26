import sqlite3

DB = "medassist_recovery_copy.db"

conn = sqlite3.connect(DB)
cursor = conn.cursor()

# -------------------------------------------------
# RESTORE OLD REPORT RECORDS
# -------------------------------------------------

reports = [
    ("Radha", "report_Radha.pdf"),
    ("Radha", "report_Radha (2).pdf"),
    ("Manu", "report_Manu (1).pdf"),
    ("Manu", "report_Manu (2).pdf"),
    ("Radha", "report_Radha (3).pdf"),
    ("Manu", "report_Manu (4).pdf"),
    ("Radha", "report_Radha (4).pdf"),
    ("Radha", "report_Radha (5).pdf"),
]

cursor.executemany(
    "INSERT INTO reports (patient_name, filename) VALUES (?, ?)",
    reports
)

# -------------------------------------------------
# RESTORE OLD PREDICTION RECORDS
# -------------------------------------------------

predictions = [
    ("Patient", "high_fever, headache, joint_pain", "Paralysis (brain hemorrhage)", 16.0, "Moderate Risk"),
    ("Patient", "high_fever, headache, joint_pain, muscle_pain, sweating", "Malaria", 57.0, "High Risk"),
    ("Patient", "high_fever, headache_muscle_pain, sweating", "Heart attack", 33.0, "Moderate Risk"),
    ("Patient", "high_fever, headache, muscle_pain, sweating", "Malaria", 74.0, "Moderate Risk"),

    ("Radha", "itching, skin_rash, nodal_skin_eruptions, dischromic_patches", "Fungal infection", 100.0, "Moderate Risk"),
    ("Radha", "itching, skin_rash", "Fungal infection", 54.0, "Low Risk"),
    ("Radha", "itching, dischromic_patches", "Fungal infection", 36.0, "Low Risk"),
    ("Radha", "itching, skin_rash, nodal_skin_eruptions, dischromic_patches", "Fungal infection", 100.0, "Moderate Risk"),

    ("Manu", "high_fever, headache, joint_pain, muscle_pain, sweating", "Malaria", 57.0, "High Risk"),
    ("Manu", "continuous_sneezing, runny_nose, itching, watering_from_eyes", "Allergy", 69.0, "Moderate Risk"),
    ("Manu", "continuous_sneezing, runny_nose0", "Allergy", 63.0, "Low Risk"),
    ("Manu", "continuous_sneezing, runny_nose", "Allergy", 56.0, "Low Risk"),

    ("Rohit", "yellowing_of_eyes, fatigue", "Hepatitis C", 29.0, "Low Risk"),
    ("Rohit", "yellowing_of_eyes, yellowish_skin", "Hepatitis C", 34.0, "Low Risk"),
    ("Rohit", "fatigue, weight_loss, excessive_hunger, restlessnes", "Jaundice", 29.0, "Moderate Risk"),

    ("Radha", "vomiting, diarrhoea, stomach_pain", "Gastroenteritis", 44.0, "Moderate Risk"),
    ("Radha", "vomiting, diarrhea, stomach_pain", "GERD", 33.0, "Moderate Risk"),
    ("Radha", "vomiting, diarrheas, stomach_pain", "GERD", 33.0, "Moderate Risk"),
    ("Radha", "vomiting, diarrheas, stomach_pain", "GERD", 33.0, "Moderate Risk"),
    ("Radha", "vomiting, diarrhoea, stomach_pain", "Gastroenteritis", 44.0, "Moderate Risk"),
    ("Radha", "itching, skin_rash", "Fungal infection", 54.0, "Low Risk"),
    ("Radha", "itching, skin_rash", "Fungal infection", 54.0, "Low Risk"),

    ("Test Patient", "fever, sweating, headache", "Heart attack", 32.0, "Moderate Risk"),
    ("Test Patient", "fever, sweating, headache, chills", "Allergy", 24.0, "Moderate Risk"),
    ("Test Patient", "high_fever, sweating, headache, chills", "Malaria", 30.0, "Moderate Risk"),
    ("Test Patient", "high fever, sweating, headache, chills", "Allergy", 45.0, "Moderate Risk"),
    ("Test Patient", "sweating", "Heart attack", 52.0, "Low Risk"),
    ("Test Patient", "high fever, sweating, headache, chills", "Allergy", 45.0, "Moderate Risk"),
    ("Test Patient", "high fever, sweating, headache, chills", "Allergy", 45.0, "Moderate Risk"),
    ("Test Patient", "high fever, sweating, headache, chills", "Allergy", 45.0, "Moderate Risk"),
    ("Test Patient", "high fever, sweating, headache, chills", "Malaria", 30.0, "Moderate Risk"),
    ("Test Patient", "high fever, sweating, headache, chills", "Malaria", 30.0, "Moderate Risk"),
    ("Test Patient", "cough, runny nose, continuous sneezing", "Allergy", 51.0, "Moderate Risk"),
    ("Test Patient", "cough, runny nose, continuous sneezing", "Common Cold", 51.0, "Moderate Risk"),
]

cursor.executemany(
    """
    INSERT INTO predictions
    (patient_name, symptoms, predicted_disease, confidence, risk_level)
    VALUES (?, ?, ?, ?, ?)
    """,
    predictions
)

conn.commit()

# -------------------------------------------------
# VERIFY
# -------------------------------------------------

report_count = cursor.execute(
    "SELECT COUNT(*) FROM reports"
).fetchone()[0]

prediction_count = cursor.execute(
    "SELECT COUNT(*) FROM predictions"
).fetchone()[0]

user_count = cursor.execute(
    "SELECT COUNT(*) FROM users"
).fetchone()[0]

appointment_count = cursor.execute(
    "SELECT COUNT(*) FROM appointments"
).fetchone()[0]

print("RESTORATION COMPLETE")
print("--------------------")
print("Reports:", report_count)
print("Predictions:", prediction_count)
print("Users:", user_count)
print("Appointments:", appointment_count)

conn.close()