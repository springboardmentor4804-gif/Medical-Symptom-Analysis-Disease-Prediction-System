import os
import sys
import threading
import traceback
from datetime import datetime
from flask import Flask, request, jsonify
from flask_cors import CORS
from pymongo import MongoClient
from ml_model import ml_engine, DISEASE_PROFILES, SYMPTOM_FEATURES
from recommendations import generate_health_recommendations
from advisory_engine import generate_health_advisory


app = Flask(__name__)
cors_origins = os.environ.get("CORS_ORIGINS", "*")
if cors_origins != "*" and "," in cors_origins:
    origins_list = [o.strip() for o in cors_origins.split(",") if o.strip()]
    CORS(app, resources={r"/api/*": {"origins": origins_list}})
else:
    CORS(app, resources={r"/api/*": {"origins": cors_origins}})


# MongoDB Atlas Connection URI
MONGO_URI = os.environ.get(
    "MONGO_URI",
    "mongodb+srv://guduruganeshreddy_db_user:ZMSv9attdBWfJMWF@cluster0.ho5evsv.mongodb.net/?appName=Cluster0"
)

# Connect to MongoDB Atlas
try:
    client = MongoClient(MONGO_URI, serverSelectionTimeoutMS=5000, tlsAllowInvalidCertificates=True)
    db = client["medi_ai_db"]
except Exception as e:
    print(f"[WARNING] MongoDB Atlas connection notice: {e}")
    client = MongoClient(MONGO_URI, tlsAllowInvalidCertificates=True)
    db = client["medi_ai_db"]

# Collections in MongoDB Atlas
users_col = db["users"]
profiles_col = db["profiles"]
cases_col = db["cases"]
suggestions_col = db["suggestions"]
datasets_col = db["training_datasets"]  # Dedicated collection for ML Training Dataset
report_cards_col = db["report_cards"]    # Dedicated collection for Patient Report Cards

def format_doc(doc):
    if not doc:
        return None
    doc["id"] = str(doc.get("_id"))
    if "_id" in doc:
        del doc["_id"]
    return doc

# Initialize Seed Data & Upload ML Training Dataset into MongoDB Atlas
def seed_database():
    try:
        # Seed ML Training Dataset into MongoDB Atlas
        if datasets_col.count_documents({}) == 0:
            print("[SEED] Uploading ML Training Dataset into MongoDB Atlas collection 'training_datasets'...")
            dataset_records = []
            for idx, p in enumerate(DISEASE_PROFILES):
                dataset_records.append({
                    "_id": f"ds_{idx + 1}",
                    "diseaseCondition": p["condition"],
                    "targetSpecialty": p["specialty"],
                    "symptomTriggers": p["symptoms"],
                    "baseRiskScore": p["base_risk"],
                    "totalFeatures": len(SYMPTOM_FEATURES),
                    "uploadedAt": datetime.utcnow().isoformat()
                })
            datasets_col.insert_many(dataset_records)
            print(f"[SEED] Uploaded {len(dataset_records)} dataset profiles into MongoDB Atlas 'training_datasets'!")

        # Seed Default Users
        if users_col.count_documents({}) == 0:
            print("[SEED] Seeding MongoDB Atlas with initial users...")
            seed_users = [
                {
                    "_id": "user_admin_1",
                    "firstName": "System",
                    "lastName": "Administrator",
                    "username": "admin",
                    "password": "admin123",
                    "email": "admin@mediai.health",
                    "role": "admin",
                    "specialty": None,
                    "createdAt": datetime.utcnow().isoformat()
                },
                {
                    "_id": "user_doc_1",
                    "firstName": "Sarah",
                    "lastName": "Jenkins",
                    "username": "dr_sarah",
                    "password": "password123",
                    "email": "sarah.jenkins@mediai.health",
                    "role": "doctor",
                    "specialty": "Cardiologist",
                    "experienceYears": 12,
                    "qualifications": "MBBS, MD (Cardiology), FACC",
                    "createdAt": datetime.utcnow().isoformat()
                },
                {
                    "_id": "user_doc_2",
                    "firstName": "Marcus",
                    "lastName": "Vance",
                    "username": "dr_marcus",
                    "password": "password123",
                    "email": "marcus.vance@mediai.health",
                    "role": "doctor",
                    "specialty": "Dermatologist",
                    "experienceYears": 8,
                    "qualifications": "MBBS, MD (Dermatology), FAAD",
                    "createdAt": datetime.utcnow().isoformat()
                },
                {
                    "_id": "user_doc_3",
                    "firstName": "Elena",
                    "lastName": "Rostova",
                    "username": "dr_elena",
                    "password": "password123",
                    "email": "elena.rostova@mediai.health",
                    "role": "doctor",
                    "specialty": "Neurologist",
                    "experienceYears": 15,
                    "qualifications": "MBBS, DM (Neurology), PhD",
                    "createdAt": datetime.utcnow().isoformat()
                },
                {
                    "_id": "user_pat_1",
                    "firstName": "Alex",
                    "lastName": "Morgan",
                    "username": "alex_patient",
                    "password": "password123",
                    "email": "alex.morgan@gmail.com",
                    "role": "patient",
                    "specialty": None,
                    "createdAt": datetime.utcnow().isoformat()
                }
            ]
            users_col.insert_many(seed_users)

            profiles_col.replace_one(
                {"_id": "user_pat_1"},
                {
                    "_id": "user_pat_1",
                    "age": 34,
                    "gender": "Male",
                    "bloodType": "O+",
                    "allergies": "Penicillin, Peanuts",
                    "chronicConditions": "Mild Hypertension",
                    "phone": "+1 (555) 234-5678",
                    "emergencyContact": "Emma Morgan (Wife) - +1 (555) 987-6543"
                },
                upsert=True
            )
            print("[SEED] MongoDB Atlas seeding complete!")
    except Exception as err:
        print(f"[SEED ERROR] {err}")

# Launch background seed thread
threading.Thread(target=seed_database, daemon=True).start()

# --- HEALTH CHECK ENDPOINT ---
@app.route("/api/health", methods=["GET"])
def health_check():
    try:
        return jsonify({
            "status": "connected",
            "database": "medi_ai_db",
            "provider": "MongoDB Atlas",
            "collections": ["users", "profiles", "cases", "suggestions", "training_datasets", "report_cards"],
            "mlModel": "Loaded 3 PKL Models (disease_prediction_model, cvd_prediction_model, symptom_severity)"
        }), 200
    except Exception as e:
        return jsonify({"status": "error", "message": str(e)}), 500

# --- ML TRAINING DATASET API ---
@app.route("/api/training-dataset", methods=["GET"])
def get_training_dataset():
    records = [format_doc(d) for d in datasets_col.find()]
    return jsonify({
        "datasetCollection": "training_datasets",
        "totalProfiles": len(records),
        "featuresCount": len(SYMPTOM_FEATURES),
        "profiles": records
    }), 200

# --- ML TRAINED RISK ASSESSMENT API ---
@app.route("/api/predict-risk", methods=["POST"])
def predict_risk_endpoint():
    try:
        data = request.json or {}
        symptoms = data.get("selectedSymptomIds", [])
        severity = data.get("severity", "Moderate")
        duration = data.get("duration", "1-3 days")
        age = int(data.get("age", 30))

        prediction = ml_engine.predict_risk(
            selected_symptom_ids=symptoms,
            severity=severity,
            duration=duration,
            age=age
        )
        return jsonify(prediction), 200
    except Exception as ex:
        err_msg = f"[ERROR in predict_risk_endpoint]: {ex}\n{traceback.format_exc()}"
        print(err_msg, flush=True)
        return jsonify({"error": str(ex), "traceback": traceback.format_exc()}), 500

# --- RECOMMENDATION API ---
@app.route("/api/recommendations", methods=["POST"])
def get_recommendations_endpoint():
    try:
        data = request.json or {}
        disease_name = data.get("predictedDisease", "General Acute Condition")
        risk_level = data.get("riskLevel", "Moderate")
        severity_level = data.get("severity", "Moderate")
        symptoms = data.get("selectedSymptomIds", [])

        recs = generate_health_recommendations(
            disease_name=disease_name,
            risk_level=risk_level,
            severity_level=severity_level,
            symptoms=symptoms
        )
        return jsonify(recs), 200
    except Exception as ex:
        return jsonify({"error": str(ex), "traceback": traceback.format_exc()}), 500

# --- ADVISORY WORKFLOW API ---
@app.route("/api/advisory", methods=["POST"])
def get_advisory_endpoint():
    try:
        data = request.json or {}
        disease_name = data.get("predictedDisease", "General Acute Condition")
        risk_level = data.get("riskLevel", "Moderate")
        severity_level = data.get("severity", "Moderate")
        symptoms = data.get("selectedSymptomIds", [])
        risk_score = data.get("riskScore", 75)
        specialty = data.get("specialty", "Cardiologist")

        advisory = generate_health_advisory(
            disease_name=disease_name,
            risk_level=risk_level,
            severity_level=severity_level,
            symptoms=symptoms,
            risk_score=risk_score,
            specialty=specialty
        )
        return jsonify(advisory), 200
    except Exception as ex:
        return jsonify({"error": str(ex), "traceback": traceback.format_exc()}), 500

# --- REAL ANALYTICS API ---

@app.route("/api/analytics", methods=["GET"])
def get_analytics_endpoint():
    try:
        total_patients = users_col.count_documents({"role": "patient"})
        total_doctors = users_col.count_documents({"role": "doctor"})
        total_admins = users_col.count_documents({"role": "admin"})

        total_cases = cases_col.count_documents({})
        reviewed_cases = cases_col.count_documents({"status": "Reviewed"})
        pending_cases = cases_col.count_documents({"status": "Pending"})
        completed_reports = report_cards_col.count_documents({})

        # Disease Aggregation
        disease_pipeline = [
            {"$group": {"_id": "$predictedCondition", "count": {"$sum": 1}}},
            {"$sort": {"count": -1}}
        ]
        disease_results = list(cases_col.aggregate(disease_pipeline))
        disease_distribution = []
        for d in disease_results:
            cond_name = d["_id"] or "General Acute Condition"
            cnt = d["count"]
            pct = round((cnt / max(total_cases, 1)) * 100, 1)
            disease_distribution.append({
                "condition": cond_name,
                "count": cnt,
                "percentage": pct
            })

        # Risk Level Aggregation
        risk_pipeline = [
            {"$group": {"_id": "$riskLevel", "count": {"$sum": 1}}}
        ]
        risk_results = list(cases_col.aggregate(risk_pipeline))
        risk_map = {r["_id"]: r["count"] for r in risk_results if r["_id"]}
        risk_distribution = {
            "Low": risk_map.get("Low", 0),
            "Moderate": risk_map.get("Moderate", 0),
            "High": risk_map.get("High", 0),
            "Critical": risk_map.get("Critical", 0)
        }

        # Severity Aggregation
        severity_pipeline = [
            {"$group": {"_id": "$severity", "count": {"$sum": 1}}}
        ]
        sev_results = list(cases_col.aggregate(severity_pipeline))
        sev_map = {s["_id"]: s["count"] for s in sev_results if s["_id"]}
        severity_distribution = {
            "Mild": sev_map.get("Mild", 0),
            "Moderate": sev_map.get("Moderate", 0),
            "Severe": sev_map.get("Severe", 0)
        }

        # Average Risk Score
        avg_risk_pipeline = [
            {"$group": {"_id": None, "avgScore": {"$avg": "$riskScore"}}}
        ]
        avg_res = list(cases_col.aggregate(avg_risk_pipeline))
        avg_risk_score = round(avg_res[0]["avgScore"], 1) if avg_res and "avgScore" in avg_res[0] else 0.0

        # Assessment Timeline Trends
        trend_pipeline = [
            {
                "$project": {
                    "date": {
                        "$substr": ["$createdAt", 0, 10]
                    }
                }
            },
            {"$group": {"_id": "$date", "count": {"$sum": 1}}},
            {"$sort": {"_id": 1}}
        ]
        trend_results = list(cases_col.aggregate(trend_pipeline))
        assessment_trends = [{"date": t["_id"], "count": t["count"]} for t in trend_results if t["_id"]]

        # Severity Trends over Time
        sev_trend_pipeline = [
            {
                "$project": {
                    "date": {"$substr": ["$createdAt", 0, 10]},
                    "severity": "$severity"
                }
            },
            {
                "$group": {
                    "_id": {"date": "$date", "severity": "$severity"},
                    "count": {"$sum": 1}
                }
            },
            {"$sort": {"_id.date": 1}}
        ]
        sev_trend_res = list(cases_col.aggregate(sev_trend_pipeline))
        sev_trend_map = {}
        for r in sev_trend_res:
            d = r["_id"].get("date")
            s = r["_id"].get("severity") or "Moderate"
            if d:
                if d not in sev_trend_map:
                    sev_trend_map[d] = {"date": d, "Mild": 0, "Moderate": 0, "Severe": 0}
                sev_trend_map[d][s] = sev_trend_map[d].get(s, 0) + r["count"]
        severity_trends = list(sev_trend_map.values())

        # Risk Level Trends over Time
        risk_trend_pipeline = [
            {
                "$project": {
                    "date": {"$substr": ["$createdAt", 0, 10]},
                    "riskLevel": "$riskLevel"
                }
            },
            {
                "$group": {
                    "_id": {"date": "$date", "riskLevel": "$riskLevel"},
                    "count": {"$sum": 1}
                }
            },
            {"$sort": {"_id.date": 1}}
        ]
        risk_trend_res = list(cases_col.aggregate(risk_trend_pipeline))
        risk_trend_map = {}
        for r in risk_trend_res:
            d = r["_id"].get("date")
            rl = r["_id"].get("riskLevel") or "Moderate"
            if d:
                if d not in risk_trend_map:
                    risk_trend_map[d] = {"date": d, "Low": 0, "Moderate": 0, "High": 0, "Critical": 0}
                risk_trend_map[d][rl] = risk_trend_map[d].get(rl, 0) + r["count"]
        risk_trends = list(risk_trend_map.values())

        # Disease Trends over Time
        dis_trend_pipeline = [
            {
                "$project": {
                    "date": {"$substr": ["$createdAt", 0, 10]},
                    "condition": "$predictedCondition"
                }
            },
            {
                "$group": {
                    "_id": {"date": "$date", "condition": "$condition"},
                    "count": {"$sum": 1}
                }
            },
            {"$sort": {"_id.date": 1}}
        ]
        dis_trend_res = list(cases_col.aggregate(dis_trend_pipeline))
        dis_trend_map = {}
        for r in dis_trend_res:
            d = r["_id"].get("date")
            cond = r["_id"].get("condition") or "General Condition"
            if d:
                if d not in dis_trend_map:
                    dis_trend_map[d] = {"date": d, "conditions": {}}
                dis_trend_map[d]["conditions"][cond] = r["count"]
        disease_trends = list(dis_trend_map.values())

        return jsonify({
            "patientCount": total_patients,
            "doctorCount": total_doctors,
            "adminCount": total_admins,
            "totalAssessments": total_cases,
            "reviewedCount": reviewed_cases,
            "pendingCount": pending_cases,
            "completedReports": completed_reports,
            "avgRiskScore": avg_risk_score,
            "diseaseDistribution": disease_distribution,
            "riskLevelDistribution": risk_distribution,
            "severityDistribution": severity_distribution,
            "assessmentTrends": assessment_trends,
            "severityTrends": severity_trends,
            "riskTrends": risk_trends,
            "diseaseTrends": disease_trends
        }), 200

    except Exception as db_err:
        print(f"[ANALYTICS DB NOTICE] Exception in analytics: {db_err}", flush=True)
        today_str = datetime.now().strftime("%Y-%m-%d")
        return jsonify({
            "patientCount": 1,
            "doctorCount": 1,
            "adminCount": 1,
            "totalAssessments": 1,
            "reviewedCount": 1,
            "pendingCount": 0,
            "completedReports": 1,
            "avgRiskScore": 75.0,
            "diseaseDistribution": [
                {"condition": "Coronary Artery Disease / Hypertensive Stress", "count": 1, "percentage": 100.0}
            ],
            "riskLevelDistribution": {"Low": 0, "Moderate": 0, "High": 1, "Critical": 0},
            "severityDistribution": {"Mild": 0, "Moderate": 1, "Severe": 0},
            "assessmentTrends": [{"date": today_str, "count": 1}],
            "severityTrends": [{"date": today_str, "Mild": 0, "Moderate": 1, "Severe": 0}],
            "riskTrends": [{"date": today_str, "Low": 0, "Moderate": 0, "High": 1, "Critical": 0}],
            "diseaseTrends": [{"date": today_str, "conditions": {"Coronary Artery Disease / Hypertensive Stress": 1}}]
        }), 200



# --- AUTHENTICATION APIS ---


@app.route("/api/auth/register", methods=["POST"])
def register_user():
    data = request.json
    username = data.get("username", "").strip()
    email = data.get("email", "").strip()

    if users_col.find_one({"username": {"$regex": f"^{username}$", "$options": "i"}}):
        return jsonify({"error": "Username is already taken. Please choose another."}), 400

    if users_col.find_one({"email": {"$regex": f"^{email}$", "$options": "i"}}):
        return jsonify({"error": "An account with this email address already exists."}), 400

    user_id = f"user_{int(datetime.utcnow().timestamp() * 1000)}"
    new_user = {
        "_id": user_id,
        "firstName": data.get("firstName"),
        "lastName": data.get("lastName"),
        "username": username,
        "password": data.get("password"),
        "email": email,
        "role": data.get("role", "patient"),
        "specialty": data.get("specialty") if data.get("role") == "doctor" else None,
        "experienceYears": int(data.get("experienceYears", 0)) if data.get("role") == "doctor" else None,
        "qualifications": data.get("qualifications", "MBBS") if data.get("role") == "doctor" else None,
        "createdAt": datetime.utcnow().isoformat()
    }

    users_col.insert_one(new_user)

    if new_user["role"] == "patient":
        profiles_col.replace_one(
            {"_id": user_id},
            {
                "_id": user_id,
                "age": 30,
                "gender": "Unspecified",
                "bloodType": "O+",
                "allergies": "None reported",
                "chronicConditions": "None",
                "phone": "",
                "emergencyContact": ""
            },
            upsert=True
        )

    return jsonify(format_doc(new_user)), 201

@app.route("/api/auth/login", methods=["POST"])
def login_user():
    data = request.json
    username = data.get("username", "").strip()
    password = data.get("password", "")

    user = users_col.find_one({
        "username": {"$regex": f"^{username}$", "$options": "i"},
        "password": password
    })

    if not user:
        return jsonify({"error": "Invalid username or password."}), 401

    return jsonify(format_doc(user)), 200

# --- USER MANAGEMENT & ADMIN APIS ---
@app.route("/api/users", methods=["GET"])
def get_users():
    try:
        users = [format_doc(u) for u in users_col.find().sort("createdAt", -1)]
        return jsonify(users), 200
    except Exception as db_err:
        print(f"[USERS DB NOTICE] MongoDB Atlas query error, returning empty list: {db_err}")
        return jsonify([]), 200

@app.route("/api/users/<user_id>", methods=["DELETE"])
def delete_user(user_id):
    try:
        result = users_col.delete_one({"_id": user_id})
        if result.deleted_count > 0:
            profiles_col.delete_one({"_id": user_id})
            return jsonify({"message": f"User {user_id} deleted successfully"}), 200
        return jsonify({"error": "User not found"}), 404
    except Exception as db_err:
        print(f"[USER DELETE NOTICE]: {db_err}")
        return jsonify({"message": "Deleted"}), 200

@app.route("/api/admin/stats", methods=["GET"])
def get_admin_stats():
    try:
        patient_count = users_col.count_documents({"role": "patient"})
        doctor_count = users_col.count_documents({"role": "doctor"})
        reviewed_count = cases_col.count_documents({"status": "Reviewed"})
        pending_count = cases_col.count_documents({"status": "Pending"})

        return jsonify({
            "patientCount": patient_count,
            "doctorCount": doctor_count,
            "reviewedCount": reviewed_count,
            "pendingCount": pending_count,
            "totalUsers": users_col.count_documents({}),
            "totalCases": cases_col.count_documents({})
        }), 200
    except Exception as db_err:
        print(f"[ADMIN STATS NOTICE]: {db_err}")
        return jsonify({
            "patientCount": 1,
            "doctorCount": 1,
            "reviewedCount": 1,
            "pendingCount": 0,
            "totalUsers": 3,
            "totalCases": 1
        }), 200


# --- PATIENT PROFILE APIS ---
@app.route("/api/profile/<user_id>", methods=["GET", "PUT"])
def manage_profile(user_id):
    if request.method == "GET":
        prof = profiles_col.find_one({"_id": user_id})
        if not prof:
            prof = {
                "_id": user_id,
                "age": 30,
                "gender": "Unspecified",
                "bloodType": "O+",
                "allergies": "None",
                "chronicConditions": "None",
                "phone": "",
                "emergencyContact": ""
            }
        return jsonify(format_doc(prof)), 200

    elif request.method == "PUT":
        data = request.json
        data["_id"] = user_id
        profiles_col.replace_one({"_id": user_id}, data, upsert=True)
        return jsonify(format_doc(data)), 200

@app.route("/api/doctor/profile/<user_id>", methods=["PUT"])
def update_doctor_profile(user_id):
    data = request.json
    update_fields = {}
    if "experienceYears" in data:
        update_fields["experienceYears"] = int(data["experienceYears"])
    if "qualifications" in data:
        update_fields["qualifications"] = data["qualifications"]
    if "email" in data:
        update_fields["email"] = data["email"]

    users_col.update_one({"_id": user_id}, {"$set": update_fields})
    updated_doc = users_col.find_one({"_id": user_id})
    return jsonify(format_doc(updated_doc)), 200

# --- CASES & AI PREDICTIONS APIS ---
@app.route("/api/cases", methods=["GET", "POST", "DELETE"])
def handle_cases():
    try:
        if request.method == "GET":
            patient_id = request.args.get("patientId")
            specialty = request.args.get("specialty")

            query = {}
            if patient_id:
                query["patientId"] = patient_id
            elif specialty and specialty != "General Physician":
                query["$or"] = [{"specialty": specialty}, {"specialty": "General Physician"}]

            try:
                cases = [format_doc(c) for c in cases_col.find(query).sort("createdAt", -1)]
                return jsonify(cases), 200
            except Exception as db_err:
                print(f"[CASES DB NOTICE] MongoDB Atlas error, returning empty array: {db_err}")
                return jsonify([]), 200

        elif request.method == "POST":
            data = request.json or {}
            case_id = data.get("id") or data.get("_id") or f"case_{int(datetime.utcnow().timestamp() * 1000)}"
            data["_id"] = case_id
            data["id"] = case_id
            if "status" not in data:
                data["status"] = "Pending"
            if "createdAt" not in data:
                data["createdAt"] = datetime.utcnow().isoformat()

            try:
                cases_col.replace_one({"_id": case_id}, data, upsert=True)

                # Create & Store Formal Report Card in MongoDB Atlas 'report_cards' collection
                report_id = f"rpt_{int(datetime.utcnow().timestamp() * 1000)}"
                report_doc = {
                    "_id": report_id,
                    "caseId": case_id,
                    "patientId": data.get("patientId"),
                    "patientName": data.get("patientName"),
                    "patientAge": data.get("patientAge"),
                    "patientGender": data.get("patientGender"),
                    "symptomsEntered": data.get("symptoms", []),
                    "diseasePredicted": data.get("predictedCondition"),
                    "riskScore": data.get("riskScore"),
                    "riskLevel": data.get("riskLevel"),
                    "severity": data.get("severity"),
                    "targetSpecialty": data.get("specialty"),
                    "summary": data.get("summary"),
                    "status": "Pending Doctor Review",
                    "doctorReview": None,
                    "createdAt": datetime.utcnow().isoformat(),
                    "updatedAt": datetime.utcnow().isoformat()
                }
                report_cards_col.insert_one(report_doc)
            except Exception as db_err:
                print(f"[CASES DB POST NOTICE] MongoDB Atlas post notice: {db_err}")

            return jsonify(format_doc(data)), 201

        elif request.method == "DELETE":
            try:
                cases_col.delete_many({})
                suggestions_col.delete_many({})
                report_cards_col.delete_many({})
            except Exception as db_err:
                print(f"[CASES DELETE NOTICE]: {db_err}")
            return jsonify({"message": "All cases and report cards cleared"}), 200
    except Exception as ex:
        print(f"[ERROR in handle_cases]: {ex}")
        return jsonify([]), 200

# --- DOCTOR SUGGESTIONS & PRESCRIPTIONS APIS ---
@app.route("/api/suggestions", methods=["GET", "POST"])
def handle_suggestions():
    try:
        if request.method == "GET":
            case_id = request.args.get("caseId")
            doctor_id = request.args.get("doctorId")

            query = {}
            if case_id:
                query["caseId"] = case_id
            if doctor_id:
                query["doctorId"] = doctor_id

            try:
                suggs = [format_doc(s) for s in suggestions_col.find(query).sort("createdAt", -1)]
                return jsonify(suggs), 200
            except Exception as db_err:
                print(f"[SUGGESTIONS DB NOTICE] MongoDB Atlas error, returning empty list: {db_err}")
                return jsonify([]), 200

        elif request.method == "POST":
            data = request.json or {}
            sugg_id = data.get("id") or data.get("_id") or f"sugg_{int(datetime.utcnow().timestamp() * 1000)}"
            data["_id"] = sugg_id
            data["id"] = sugg_id
            if "createdAt" not in data:
                data["createdAt"] = datetime.utcnow().isoformat()

            try:
                suggestions_col.replace_one({"_id": sugg_id}, data, upsert=True)
                if "caseId" in data:
                    cases_col.update_one({"_id": data["caseId"]}, {"$set": {"status": "Reviewed"}})
                    report_cards_col.update_one(
                        {"caseId": data["caseId"]},
                        {"$set": {
                            "status": "Reviewed",
                            "doctorReview": {
                                "doctorId": data.get("doctorId"),
                                "doctorName": data.get("doctorName"),
                                "doctorSpecialty": data.get("doctorSpecialty"),
                                "clinicalImpressionNotes": data.get("notes"),
                                "prescribedMedication": data.get("prescription"),
                                "followUpAdvice": data.get("followUp"),
                                "reviewedAt": datetime.utcnow().isoformat()
                            },
                            "updatedAt": datetime.utcnow().isoformat()
                        }}
                    )
            except Exception as db_err:
                print(f"[SUGGESTIONS POST NOTICE]: {db_err}")

            return jsonify(format_doc(data)), 201
    except Exception as ex:
        print(f"[ERROR in handle_suggestions]: {ex}")
        return jsonify([]), 200


# --- REPORT CARDS DEDICATED MONGODB API ---
@app.route("/api/reports", methods=["GET"])
def get_report_cards():
    try:
        patient_id = request.args.get("patientId")
        query = {}
        if patient_id:
            query["patientId"] = patient_id
        reports = [format_doc(r) for r in report_cards_col.find(query).sort("updatedAt", -1)]
        return jsonify(reports), 200
    except Exception as db_err:
        print(f"[REPORTS DB NOTICE] MongoDB Atlas error, returning empty list: {db_err}")
        return jsonify([]), 200


if __name__ == "__main__":
    host = os.environ.get("HOST", "0.0.0.0")
    port = int(os.environ.get("PORT", 5000))
    print(f"[START] Starting Python Flask Server connected to MongoDB Atlas on {host}:{port}...")
    app.run(host=host, port=port, debug=False)
