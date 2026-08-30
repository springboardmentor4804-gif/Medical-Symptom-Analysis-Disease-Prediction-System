import os
import sys
import csv

# Ensure backend directory is in path to support direct execution
sys.path.append(os.path.dirname(os.path.abspath(__file__)))

from app.database import SessionLocal, Base, engine
from app.models.reference import SymptomDiseaseReference

def load_dataset():
    # Define candidate paths for the CSV file
    candidate_paths = [
        os.path.abspath("./data/disease_symptoms.csv"),
        os.path.abspath("../data/disease_symptoms.csv"),
        os.path.abspath("/data/disease_symptoms.csv"),
        os.path.abspath(os.path.join(os.path.dirname(__file__), "data", "disease_symptoms.csv")),
        os.path.abspath(os.path.join(os.path.dirname(__file__), "..", "data", "disease_symptoms.csv")),
    ]

    csv_path = None
    for path in candidate_paths:
        if os.path.exists(path):
            csv_path = path
            break

    if not csv_path:
        print("Error: Could not find 'disease_symptoms.csv' in any of the expected locations:")
        for path in candidate_paths:
            print(f"  - {path}")
        print("\nPlease make sure to upload the file to './data/disease_symptoms.csv'.")
        return False

    print(f"Found CSV at: {csv_path}")
    db = SessionLocal()
    try:
        # Create table if it doesn't exist
        Base.metadata.create_all(bind=engine)
        
        print("Reading CSV and parsing records...")
        with open(csv_path, mode='r', encoding='utf-8') as f:
            reader = csv.DictReader(f)
            
            headers = reader.fieldnames
            print(f"Detected columns: {headers}")

            # Clear existing table data to prevent duplicate entries
            print("Clearing existing reference records in 'symptom_disease_reference'...")
            db.query(SymptomDiseaseReference).delete()
            db.commit()

            count = 0
            for row in reader:
                # Compile active symptoms from the boolean symptom columns for the summary column
                active = []
                for sym_col in ["Fever", "Cough", "Fatigue", "Difficulty Breathing"]:
                    val = row.get(sym_col, "").strip().lower()
                    if val == "yes":
                        active.append(sym_col)
                symptom_summary = ", ".join(active) if active else "None"

                try:
                    age_val = int(row.get("Age", 0))
                except (ValueError, TypeError):
                    age_val = None

                ref_record = SymptomDiseaseReference(
                    disease=row.get("Disease", "").strip(),
                    symptom=symptom_summary,
                    fever=row.get("Fever", "").strip(),
                    cough=row.get("Cough", "").strip(),
                    fatigue=row.get("Fatigue", "").strip(),
                    difficulty_breathing=row.get("Difficulty Breathing", "").strip(),
                    age=age_val,
                    gender=row.get("Gender", "").strip(),
                    blood_pressure=row.get("Blood Pressure", "").strip(),
                    cholesterol_level=row.get("Cholesterol Level", "").strip(),
                    outcome_variable=row.get("Outcome Variable", "").strip()
                )
                db.add(ref_record)
                count += 1

            db.commit()
            print(f"Successfully ingested {count} reference records from CSV into PostgreSQL database.")
            return True
    except Exception as e:
        print(f"Error loading dataset: {e}")
        db.rollback()
        return False
    finally:
        db.close()

if __name__ == "__main__":
    load_dataset()
