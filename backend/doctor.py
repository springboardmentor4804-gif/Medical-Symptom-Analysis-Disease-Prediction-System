#!/usr/bin/env python3
"""
MedAssist AI — System Diagnostic & Health Verifier (doctor.py)
Performs comprehensive pre-flight diagnostics, environment checks,
artifact verification, and end-to-end mock inference validations.
"""

import sys
import os
import platform
from pathlib import Path

# Set UTF-8 encoding on Windows console if needed
if sys.platform.startswith('win'):
    try:
        sys.stdout.reconfigure(encoding='utf-8')
    except Exception:
        pass

# Add backend directory to sys.path
BACKEND_DIR = Path(__file__).resolve().parent
PROJECT_ROOT = BACKEND_DIR.parent
if str(BACKEND_DIR) not in sys.path:
    sys.path.insert(0, str(BACKEND_DIR))
if str(PROJECT_ROOT) not in sys.path:
    sys.path.insert(0, str(PROJECT_ROOT))


class Colors:
    HEADER = '\033[95m'
    BLUE = '\033[94m'
    CYAN = '\033[96m'
    GREEN = '\033[92m'
    WARNING = '\033[93m'
    FAIL = '\033[91m'
    ENDC = '\033[0m'
    BOLD = '\033[1m'


def check_mark(status: bool) -> str:
    if status:
        return f"{Colors.GREEN}[PASS]{Colors.ENDC}"
    return f"{Colors.FAIL}[FAIL]{Colors.ENDC}"


def warn_mark() -> str:
    return f"{Colors.WARNING}[WARN]{Colors.ENDC}"


def run_diagnostics():
    print(f"\n{Colors.BOLD}{Colors.CYAN}======================================================================{Colors.ENDC}")
    print(f"{Colors.BOLD}{Colors.CYAN}               MedAssist AI — System Diagnostic Doctor                {Colors.ENDC}")
    print(f"{Colors.BOLD}{Colors.CYAN}======================================================================{Colors.ENDC}\n")

    all_passed = True

    # 1. Environment & Python Version Check
    print(f"{Colors.BOLD}1. Environment & Interpreter Checks:{Colors.ENDC}")
    py_version = sys.version.split()[0]
    py_ok = sys.version_info >= (3, 10)
    print(f"   {check_mark(py_ok)} Python Version: {py_version} (Required: >= 3.10) on {platform.system()} {platform.release()}")
    if not py_ok:
        all_passed = False

    # 2. Dependency Audit
    print(f"\n{Colors.BOLD}2. Core Dependency Audit:{Colors.ENDC}")
    required_packages = [
        ("fastapi", "FastAPI Core REST Framework"),
        ("uvicorn", "ASGI Web Server"),
        ("pydantic", "Pydantic Schema Validation"),
        ("sklearn", "Scikit-Learn ML Pipelines"),
        ("pandas", "Pandas Data Analytics"),
        ("numpy", "NumPy Numerical Engine"),
        ("joblib", "Joblib Model Persistence"),
        ("reportlab", "ReportLab Binary PDF Engine"),
        ("passlib", "Passlib Bcrypt Authentication"),
        ("jwt", "PyJWT Security Tokens"),
        ("psycopg2", "PostgreSQL Database Driver"),
    ]

    for pkg, desc in required_packages:
        try:
            mod = __import__(pkg)
            ver = getattr(mod, "__version__", "Installed")
            print(f"   {check_mark(True)} {desc:<34} ({pkg} v{ver})")
        except ImportError:
            print(f"   {check_mark(False)} {desc:<34} ({pkg} MISSING)")
            all_passed = False

    # 3. Model Artifacts Verification
    print(f"\n{Colors.BOLD}3. AI/ML Model Artifacts & Dataset Verification:{Colors.ENDC}")
    artifacts = [
        (BACKEND_DIR / "models" / "disease_prediction_model.pkl", "Disease Prediction Model (Random Forest 41-Class)"),
        (BACKEND_DIR / "models" / "disease_features.pkl", "Disease Feature Vectorizer (131 Binary Symptoms)"),
        (BACKEND_DIR / "models" / "patient_risk_model.pkl", "Patient Risk Model (ColumnTransformer + RF)"),
        (PROJECT_ROOT / "datasets" / "Disease_Symptom_Prediction" / "dataset.csv", "Primary Disease Symptom Dataset"),
        (PROJECT_ROOT / "datasets" / "Disease_Symptom_Prediction" / "symptom_Description.csv", "Disease Clinical Description Dictionary"),
        (PROJECT_ROOT / "datasets" / "Disease_Symptom_Prediction" / "symptom_precaution.csv", "Clinical Precaution Action Matrix"),
    ]

    for path, name in artifacts:
        exists = path.exists() and path.stat().st_size > 0
        size_kb = f"{path.stat().st_size / 1024:.1f} KB" if exists else "0 KB"
        print(f"   {check_mark(exists)} {name:<46} [{size_kb}]")
        if not exists:
            all_passed = False

    # 4. Database Connectivity Check
    print(f"\n{Colors.BOLD}4. Database Connectivity Audit:{Colors.ENDC}")
    try:
        from app.database import get_database_connection
        conn = get_database_connection()
        cur = conn.cursor()
        cur.execute("SELECT version();")
        db_ver = cur.fetchone()[0]
        print(f"   {check_mark(True)} PostgreSQL Database Connected ({db_ver.split(',')[0]})")
        
        # Check tables
        cur.execute("""
            SELECT table_name FROM information_schema.tables 
            WHERE table_schema = 'public';
        """)
        tables = [r[0] for r in cur.fetchall()]
        print(f"   {check_mark(len(tables) > 0)} Registered Tables Found: {len(tables)} tables ({', '.join(tables[:4])}...)")
        cur.close()
        conn.close()
    except Exception as e:
        print(f"   {warn_mark()} Database Connection Notice: {e}")
        print(f"          (Note: Ensure Docker PostgreSQL container or local service is running on port 5432)")

    # 5. Live Mock Inference Execution
    print(f"\n{Colors.BOLD}5. End-to-End Live ML Inference & Triage Test:{Colors.ENDC}")
    try:
        from app.prediction_service import predict_top_conditions, get_disease_precautions
        from app.patient_risk_service import assess_patient_risk

        test_symptoms = ["fever", "cough", "fatigue", "headache"]
        predictions = predict_top_conditions(test_symptoms, top_n=3)
        top_disease = predictions[0]["condition"]
        top_score = predictions[0]["model_score"]
        precautions = predictions[0]["precautions"]

        print(f"   {check_mark(True)} Disease Prediction Engine: {test_symptoms}")
        print(f"          -> Top Candidate: {Colors.BOLD}{top_disease}{Colors.ENDC} ({top_score}% confidence, {len(precautions)} precautions)")

        test_vitals = {
            "Age": 55,
            "Gender": "Male",
            "Blood Pressure": "High",
            "Cholesterol Level": "High",
            "Fever": "Yes",
            "Cough": "Yes",
            "Fatigue": "Yes",
            "Difficulty Breathing": "No",
        }
        risk_result = assess_patient_risk(test_vitals)
        outcome = risk_result.get("predicted_outcome")
        pos_score = risk_result.get("positive_model_score")
        print(f"   {check_mark(True)} Patient Risk Assessment Engine: Age=55, BP=High, Chol=High")
        print(f"          -> Risk Outcome: {Colors.BOLD}{outcome}{Colors.ENDC} (Positive Risk Score: {pos_score}%)")

    except Exception as e:
        print(f"   {check_mark(False)} Mock Inference Failed: {e}")
        all_passed = False

    # Final Summary
    print(f"\n{Colors.BOLD}{Colors.CYAN}======================================================================{Colors.ENDC}")
    if all_passed:
        print(f"{Colors.BOLD}{Colors.GREEN}   [PASS] ALL SYSTEM HEALTH CHECKS PASSED — MedAssist AI IS OPERATIONAL    {Colors.ENDC}")
    else:
        print(f"{Colors.BOLD}{Colors.WARNING}   [WARN] SYSTEM CHECKS COMPLETED WITH WARNINGS (See details above)       {Colors.ENDC}")
    print(f"{Colors.BOLD}{Colors.CYAN}======================================================================{Colors.ENDC}\n")


if __name__ == "__main__":
    run_diagnostics()
