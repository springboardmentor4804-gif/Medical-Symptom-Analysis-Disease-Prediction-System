# MedAssist AI

**Clinical decision-support web application** providing symptom-based differential diagnosis, chronic condition risk screening, rule-weighted triage, and treatment recommendations.

> **⚠️ Not a Medical Device**  
> MedAssist is informational decision support only. It does not diagnose and must not be used to make treatment decisions without a clinician. See [Honest Limitations](#honest-limitations) for important caveats.

---

## 📋 Table of Contents

- [Quick Start](#quick-start)
- [Features](#features)
- [Architecture](#architecture)
- [Machine Learning Models](#machine-learning-models)
- [Database Setup](#database-setup)
- [API Documentation](#api-documentation)
- [Project Structure](#project-structure)
- [Testing](#testing)
- [Deployment](#deployment)
- [Honest Limitations](#honest-limitations)
- [Contributing](#contributing)

---

## 🚀 Quick Start

### Step 0 — Clone (Git LFS required)

The trained models live in `backend/artifacts/` and the large ones are stored
with **Git LFS**. Install it *before* cloning, or you get 130-byte text pointer
files instead of models and the API refuses to start.

```bash
git lfs install                 # once per machine
git clone https://github.com/tharunkumardeveloper/MedAssist.git
cd MedAssist
```

Already cloned without it? Fix it in place:

```bash
git lfs install && git lfs pull
```

Check it worked — this must report ~102 MB, not ~130 bytes:

```bash
ls -l backend/artifacts/model3_text_condition.joblib
```

Install Git LFS from <https://git-lfs.com> (or `brew install git-lfs`,
`apt install git-lfs`, `winget install GitHub.GitLFS`).

### Windows (Automated)

```bat
install.bat    # Creates .venv, installs dependencies, verifies models
start.bat      # Runs backend API and web UI
```

Then open:
- **Web UI:** http://localhost:5173
- **API Docs:** http://localhost:8000/docs
- **Streamlit UI:** http://localhost:8501 (optional)

**Requirements:** Python 3.10–3.12, Node.js 18+, and Git LFS.

> Python 3.10+ is not optional: the artifacts are pickled under numpy 2.x,
> which does not support earlier versions. `requirements.txt` pins `numpy>=2`
> for the same reason — on numpy 1.26 the models fail to load with
> `PCG64 is not a known BitGenerator`.

### Manual Setup (macOS / Linux)

```bash
# 1. Create virtual environment
python -m venv .venv
source .venv/bin/activate  # On Windows: .venv\Scripts\activate

# 2. Install backend dependencies
pip install -r backend/requirements.txt

# 3. Configure environment
cp backend/.env.example backend/.env
# Generate SECRET_KEY:
python -c "import secrets; print(secrets.token_hex(32))"
# Add it to backend/.env

# 4. Start backend (terminal 1)
cd backend
uvicorn main:app --reload --host 0.0.0.0 --port 8000

# 5. Install and start frontend (terminal 2)
cd web
npm install
npm run dev
```

### Default Admin Credentials

- **Email:** `admin@medassist.local`
- **Password:** `ChangeMe123!` (⚠️ Change in production!)

---

## ✨ Features

### 🏥 For Patients
- ✅ **Symptom Assessment** - Enter symptoms with intensity levels (mild/moderate/severe)
- ✅ **AI Diagnosis** - Get top 5 possible conditions with confidence scores
- ✅ **Health Risk Screening** - Chronic disease risk assessment (diabetes, heart disease, etc.)
- ✅ **Severity Triage** - Automatic prioritization (Emergency/Urgent/Moderate/Mild)
- ✅ **Treatment Recommendations** - Patient-reviewed treatment options
- ✅ **Assessment History** - Track health trends over time
- ✅ **Health Dashboard** - Visual health score trends
- ✅ **PDF Reports** - Download detailed assessment reports

### 👨‍⚕️ For Healthcare Providers
- ✅ **Patient Queue** - Triage dashboard for high-priority cases
- ✅ **Patient Assessments** - View all patient evaluations
- ✅ **Provider Reports** - Create detailed clinical reports
- ✅ **E-Prescriptions** - Generate and manage prescriptions
- ✅ **Provider Profile** - Professional credentials and digital signature
- ✅ **Analytics Dashboard** - System-wide health metrics

### 🔐 For Administrators
- ✅ **User Management** - Create and manage user accounts
- ✅ **Role-Based Access** - Patient, Nurse, Provider, Admin, Org Admin roles
- ✅ **System Analytics** - Assessment trends, disease distribution
- ✅ **Model Status** - Monitor AI model health and performance

### 🤖 AI/ML Capabilities
- ✅ **684 Disease Conditions** - Comprehensive disease database
- ✅ **377 Symptom Vocabulary** - Standardized symptom recognition
- ✅ **10 Chronic Risk Models** - Individual risk scores per condition
- ✅ **Red Flag Detection** - Automatic emergency symptom identification
- ✅ **Vital Signs Analysis** - Heart rate, BP, temperature, SpO2 monitoring
- ✅ **Confidence Calibration** - Realistic accuracy reporting

---

## 🏗️ Architecture

```
┌─────────────────────────────────────────────────────────────┐
│                  Browser (React + Vite)                     │
│                   http://localhost:5173                     │
└────────────────────────┬────────────────────────────────────┘
                         │ POST /assess
                         ▼
┌─────────────────────────────────────────────────────────────┐
│              FastAPI Backend (Port 8000)                    │
│                                                             │
│  ┌────────────────────────────────────────────────────┐   │
│  │       services.engine.analyze()                    │   │
│  │                                                     │   │
│  │  ┌────────────────────────────────────────────┐   │   │
│  │  │ Model 1: Disease Prediction                │   │   │
│  │  │ Algorithm: Bernoulli Naive Bayes           │   │   │
│  │  │ Input: 377 symptoms → Output: 684 diseases │   │   │
│  │  └────────────────────────────────────────────┘   │   │
│  │                                                     │   │
│  │  ┌────────────────────────────────────────────┐   │   │
│  │  │ Model 2: Chronic Risk (10 conditions)      │   │   │
│  │  │ Algorithm: Hist. Gradient Boosting         │   │   │
│  │  │ Input: lifestyle/demographics              │   │   │
│  │  └────────────────────────────────────────────┘   │   │
│  │                                                     │   │
│  │  ┌────────────────────────────────────────────┐   │   │
│  │  │ Severity: Rule-Based Triage                │   │   │
│  │  │ 6 weighted components + red flags          │   │   │
│  │  └────────────────────────────────────────────┘   │   │
│  │                                                     │   │
│  │  ┌────────────────────────────────────────────┐   │   │
│  │  │ Model 3: Treatment Recommendations         │   │   │
│  │  │ Algorithm: Bayesian-Shrunk Ranking         │   │   │
│  │  └────────────────────────────────────────────┘   │   │
│  └────────────────────────────────────────────────┘   │
└────────────────────────┬────────────────────────────────────┘
                         ▼
┌─────────────────────────────────────────────────────────────┐
│          PostgreSQL / SQLite Database                       │
│  Tables: users, assessments, patient_profiles,              │
│          provider_profiles, prescriptions, provider_reports │
└─────────────────────────────────────────────────────────────┘
```

### Key Architectural Principle

**The diagnosis model and risk model use completely different inputs:**
- **Model 1 (Diagnosis):** Takes symptom vector (e.g., "fever + cough")
- **Model 2 (Risk):** Takes lifestyle/demographics (e.g., age, BMI, smoking status)

You **cannot** compute diabetes risk from symptoms alone, and you **cannot** diagnose a chest infection from BMI. This is why the UI has two separate input steps, and why the API returns `available: false` with a reason when data is missing.

---

## 🤖 Machine Learning Models

### Model 1: Disease Prediction (Diagnosis)

**Algorithm:** **Bernoulli Naive Bayes**
- **Library:** `sklearn.naive_bayes.BernoulliNB`
- **Input:** 377 binary symptom features (sparse matrix)
- **Output:** 684 disease conditions with probability scores
- **Performance:** 87.0% top-1 accuracy, 96.5% top-3 accuracy
- **Training Data:** 247k synthetically augmented symptom matrix
- **Artifact:** `backend/artifacts/model1_classifier.joblib`

**Why Bernoulli NB?**
- Extremely memory efficient (~10 MB vs. 9 GB for Random Forest)
- Fast inference (<10ms per prediction)
- Handles sparse binary data naturally
- Provides calibrated probability scores

#### Anatomical plausibility filter

The symptom matrix has no sex or age feature, so nothing in the classifier
stops it ranking `hypertension of pregnancy` first for a 35-year-old man - it
did, at 42.6%. Conditions that are **impossible** for the patient are removed
before ranking and the remaining probabilities are renormalised; the removed
names come back in `diagnosis.excluded_sex_specific` so the filter is visible
rather than silent.

Only the impossible is filtered. Conditions that are merely *rare* in one sex —
breast cyst or breast infection in a man — stay in the differential, because
expressing "unlikely" is the model's job and hiding them would conceal real
presentations.

### Model 2: Chronic Risk Assessment

**Algorithm:** **Histogram Gradient Boosting + Isotonic Calibration**
- **Library:** `sklearn.ensemble.HistGradientBoostingClassifier` + `sklearn.isotonic.IsotonicRegression`
- **Input:** 18 lifestyle/demographic features
  - Age band, BMI, sex, smoking status
  - Exercise habits, blood pressure, cholesterol
  - Alcohol consumption, sleep hours, mental health days
  - Education, income, activity levels
- **Output:** 10 chronic disease risk scores (0-100 percentile)
  1. Diabetes
  2. Heart Attack
  3. Coronary Heart Disease
  4. Stroke
  5. Asthma
  6. Skin Cancer
  7. Other Cancer
  8. Arthritis
  9. Depression
  10. Kidney Disease
- **Performance:** Mean ROC-AUC 0.797 across all conditions
- **Training Data:** CDC BRFSS 2011-2015 (2.2M survey responses)
- **Artifact:** `backend/artifacts/model2_risk_models.joblib`

**Why Histogram Gradient Boosting?**
- Native handling of missing values (no imputation needed)
- Native categorical feature support (no one-hot encoding)
- Memory efficient (bins features to uint8)
- Captures non-linear health relationships

### Severity Scoring (Triage)

**Algorithm:** **Rule-Based Weighted Scoring System** (NOT machine learning)
- **Type:** Deterministic rules with configurable weights
- **Configuration:** `backend/artifacts/severity_config.json`

**6 Weighted Components:**
1. **Symptom Burden** - Number and intensity of symptoms
2. **Age Vulnerability** - Age-based risk (infants, elderly)
3. **Diagnosis Confidence** - How certain the AI is
4. **Chronic Risk** - Underlying health conditions
5. **Red Flags** - Critical/serious symptoms
6. **Vitals** - Heart rate, BP, temperature, SpO2, respiratory rate

**Escalation Overrides:**
- Any **critical red flag** → EMERGENCY (chest pain, seizures, vomiting blood)
- 2+ **serious red flags** → EMERGENCY (shortness of breath, fainting)
- **Vital sign critically out of range** (>75% deviation) → EMERGENCY

**Output Levels:**
- `EMERGENCY` - "Seek emergency care now"
- `URGENT` - "Seek medical attention today"
- `MODERATE` - "Schedule appointment within a few days"
- `MILD` - "Monitor symptoms, self-care"

**Why Rule-Based Instead of ML?**
> "No training datasets carry labeled triage outcomes. A learned severity model would be fitting noise and presenting it with unearned authority. Rule-based is explainable, clinician-tunable, and medically defensible."

### Model 3: Treatment Cascade (Two Layers)

Treatment is the one place where **the source matters more than the ranking**,
so Model 3 is a cascade of two sources that are never presented under the same
label.

#### Layer A — Real hospital prescriptions (preferred)

- **Data source:** MIMIC-IV discharge prescriptions, 754 admissions
- **Algorithm:** TF-IDF diagnosis similarity → Stage 1 drug-class classifier
  gated on **lift over its own prior** → drugs ranked by what the genuinely
  similar admissions were actually prescribed, scored against corpus base rate
- **Artifact:** `backend/artifacts/model3_mimic_layer.joblib`
- **Means:** clinicians treating similar admissions prescribed these drugs

> **Why lift, not raw probability.** Stage 1's prior already clears
> `cat_threshold` for all 13 classes — ask it about a query with no vocabulary
> overlap and it still answers "analgesic 0.50, gi_medication 0.48,
> antibiotic 0.47", because nearly every ICU admission receives one of each.
> Taking those at face value and naming one drug per class returned ward
> routine for everything: docusate sodium for migraine, ciprofloxacin for
> depression. The prior is read from the model itself, never hard-coded.

Layer A only answers when it clears **three gates**, all read from the
artifact's `gate` key:

| Gate | Value | Fails with |
|---|---|---|
| `sim_floor` | 0.10 | `similarity_below_floor` |
| `min_support` | 3 | `insufficient_support` |
| `cat_threshold` | 0.30 | `no_class_predicted` / `no_drug_predicted` |

> **The gate is never hard-coded.** The thresholds travel inside
> `model3_mimic_layer.joblib` so the notebook and the application cannot drift
> apart on the next retrain. Retune them in the notebook and re-export.

#### Layer B — Patient-reported experience (fallback)

- **Algorithm:** Bayesian-shrunk rating ranking (statistical, not ML)
- **Formula:** `score = (shrunk_rating^(1-γ)) × (n_reviews^γ)`, γ = 0.5
- **Data source:** UCI Drug Review Dataset (209,000 patient reviews)
- **Coverage:** 328 rankable conditions, 219 of 684 diseases linked (32%)
- **Artifact:** `backend/artifacts/model3_treatment_table.csv`
- **Means:** patients rated these drugs highly — satisfaction, not efficacy

```
shrunk_rating = (n_reviews × mean_rating + prior_weight × global_mean) /
                (n_reviews + prior_weight)
```

Bayesian shrinkage stops a drug with two five-star reviews from outranking one
with two thousand good ones.

#### Layer "none" — an empty panel is a correct answer

If the query resolves to no condition above a 0.45 match score, the cascade
returns an **empty drug list**, not the drugs for the nearest-spelled
condition.

Condition matching squares its token-coverage score, so sharing one word out of
two is not a match. That single change moved answered coverage from 54% to 33%
— and every match it removed was wrong:

| Disease | Was matched to | Would have prescribed |
|---|---|---|
| amyotrophic lateral sclerosis | multiple sclerosis | MS disease-modifying drugs |
| acute respiratory distress syndrome | acute coronary syndrome | cardiac drugs |
| interstitial lung disease | interstitial cystitis | bladder drugs (Elmiron) |
| acute bronchospasm | gout acute | urate-lowering drugs |
| abscess of the lung | dental abscess | — |

The remaining 462 unanswered diseases are mostly surgical, dermatological or
congenital conditions that genuinely have no entry in either corpus. Saying so
is the correct output. Every response carries `layer`, `gate_reason` and a
source-appropriate `evidence.caveat`.

| `layer` | UI label | Caveat |
|---|---|---|
| `mimic` | Real hospital prescriptions | Co-occurrence across every problem the patient had, not attribution |
| `drug_reviews` | Patient-reported experience | Satisfaction, not clinical efficacy or safety |
| `none` | No treatment data available | Absence of data, not evidence that no treatment exists |

#### Known data defect: substring-collision links

The notebook builds 112 of its 219 disease→condition links by substring match
with no word-boundary check, producing fragment buckets: `ge` (27 diseases,
whose only drug is an antihypertensive), `min` (3), `gas` (4). These are
dropped at load time and reported on `/system/model-status`; genuine short
links from the same matcher (`flu → influenza`, `allergy → allergies`) are
kept. **Fix the link builder in the notebook** — the repair here is a
guardrail, not a substitute.

#### Prescribing

`GET /treatment-suggestions?patient_id=…` (or `?query=…`, clinical staff only)
returns the cascade for a patient's latest assessment, and the prescription
form offers those drugs as one-click fills. Only the drug NAME is copied:
strength, frequency, route and duration are the prescriber's judgement and the
models do not estimate them.

### Performance Metrics

| Model | Metric | Value |
|-------|--------|-------|
| Disease Prediction | Top-1 Accuracy | 87.0% |
| Disease Prediction | Top-3 Accuracy | 96.5% |
| Disease Prediction | Macro F1-Score | 0.866 |
| Chronic Risk (avg) | ROC-AUC | 0.797 |
| Treatment Ranking | Hit@5 | 0.538 |
| Severity | Type | Rule-based (no metrics) |

**⚠️ Important:** See [Honest Limitations](#honest-limitations) for caveats about these numbers.

---

## 💾 Database Setup

### Option 1: SQLite (Default - Development)

No setup required! The database is created automatically at `backend/medassist.db`.

**Pros:**
- Zero configuration
- Perfect for development and testing
- Portable (single file)

**Cons:**
- Not suitable for production
- Limited concurrency
- No advanced features

### Option 2: PostgreSQL (Recommended - Production)

#### Prerequisites
- PostgreSQL 15+ installed and running
- Database named `medassist` created
- pgAdmin 4 (optional, for management)

#### Setup Steps

1. **Update Database URL in `.env`**

   Edit `backend/.env` line 4:
   ```env
   DATABASE_URL=postgresql://postgres:YOUR_PASSWORD@localhost:5432/medassist
   ```
   Replace `YOUR_PASSWORD` with your PostgreSQL password.

2. **Test Connection**

   ```bash
   cd backend
   .venv\Scripts\activate
   python test_postgres_connection.py
   ```

   Expected output:
   ```
   ✅ Connected successfully!
   PostgreSQL version: PostgreSQL 15.x
   Database: medassist
   Tables found: 7
   ✅ PostgreSQL connection test PASSED!
   ```

3. **Start Backend**

   The backend will automatically create all tables on first startup:
   ```bash
   cd backend
   python main.py
   ```

4. **Verify in pgAdmin**

   - Open pgAdmin 4
   - Navigate to: Servers → PostgreSQL 15 → Databases → medassist → Schemas → public → Tables
   - You should see 7 tables:
     - `users`
     - `patient_profiles`
     - `provider_profiles`
     - `assessments`
     - `provider_reports`
     - `prescriptions`
     - `system_settings`

#### Database Schema

```sql
-- Users table (authentication + roles)
users (id, email, password_hash, role, is_active, created_at)

-- Patient profiles
patient_profiles (id, user_id, full_name, date_of_birth, gender, allergies, medical_history)

-- Provider profiles (doctors/nurses)
provider_profiles (id, user_id, full_name, qualifications, registration_number, clinic_info)

-- Assessment records (AI evaluations)
assessments (id, user_id, input_json, result_json, risk_flag, created_at,
             treatment_layer, gate_reason, treatment_evidence)

-- Provider reports (clinical notes)
provider_reports (id, assessment_id, patient_id, provider_id, insights, treatment_suggestions)

-- Prescriptions (e-prescriptions)
prescriptions (id, patient_id, provider_id, medications_json, date_issued, is_signed)

-- System settings (configuration)
system_settings (id, key, value, updated_at)
```

#### Migration Notes

- **No migrations needed** - SQLAlchemy creates tables automatically
- **Data safety** - Existing PostgreSQL data is preserved
- **Schema compatibility** - All tables match expectations
- **Foreign keys** - Automatic relationship validation

---

## 📡 API Documentation

### Authentication Endpoints

#### POST `/auth/register`
Register a new user account.

**Request:**
```json
{
  "email": "user@example.com",
  "password": "SecurePassword123!",
  "role": "patient"
}
```

**Response:**
```json
{
  "access_token": "eyJ0eXAiOiJKV1QiLCJhbGc...",
  "token_type": "bearer"
}
```

#### POST `/auth/login`
Login with credentials.

**Request:**
```json
{
  "email": "user@example.com",
  "password": "SecurePassword123!"
}
```

**Response:**
```json
{
  "access_token": "eyJ0eXAiOiJKV1QiLCJhbGc...",
  "token_type": "bearer"
}
```

### Core Assessment Endpoints

#### POST `/assess`
**Main endpoint** - Performs AI assessment and returns comprehensive results.

**Request:**
```json
{
  "symptoms": [
    {"name": "fever", "severity": "high"},
    {"name": "cough", "severity": "moderate"},
    {"name": "shortness of breath", "severity": "moderate"}
  ],
  "age": 45,
  "gender": "male",
  "lifestyle": {
    "age": 45,
    "sex": "male",
    "bmi": 28.5,
    "smoker_status": 4,
    "exercise": true,
    "high_cholesterol": false,
    "high_blood_pressure": true,
    "alcohol_days_per_month": 5,
    "general_health": 3,
    "sleep_hours": 7,
    "physical_unwell_days": 2,
    "mental_unwell_days": 1
  },
  "vitals": {
    "heart_rate": 92,
    "systolic_bp": 145,
    "diastolic_bp": 92,
    "temperature_c": 38.5,
    "respiratory_rate": 22,
    "spo2": 94
  },
  "top_k": 5
}
```

**Response:**
```json
{
  "schema_version": "3.0",
  "generated_at": "2026-08-21T16:30:00Z",
  "diagnosis": {
    "available": true,
    "predictions": [
      {
        "rank": 1,
        "disease": "pneumonia",
        "display_name": "Pneumonia",
        "probability": 0.7234,
        "confidence_pct": 72.3,
        "matched_symptoms": ["fever", "cough", "shortness of breath"],
        "typical_symptoms": ["fever", "cough", "shortness of breath", "chest pain"]
      }
    ],
    "confidence": {
      "raw": 0.7234,
      "calibrated": 0.6891,
      "display": 0.6891,
      "label": "Moderate"
    }
  },
  "risk": {
    "available": true,
    "conditions": {
      "diabetes": {
        "probability": 0.1523,
        "risk_score": 45,
        "band": "average",
        "flagged": false
      }
    },
    "composite": {
      "score": 52.3,
      "band": "elevated"
    }
  },
  "severity": {
    "score": 0.4721,
    "level": "URGENT",
    "action": "Seek medical attention today",
    "components": {
      "symptom_burden": {"contribution": 0.12},
      "age_vulnerability": {"contribution": 0.05},
      "diagnosis_confidence": {"contribution": 0.08},
      "chronic_risk": {"contribution": 0.06},
      "red_flags": {"contribution": 0.10},
      "vitals": {"contribution": 0.07}
    },
    "serious_red_flags": ["shortness of breath"],
    "abnormal_vitals": [
      {"vital": "temperature_c", "value": 38.5, "normal_range": [36.1, 37.5]}
    ]
  },
  "treatment": {
    "available": true,
    "layer": "drug_reviews",
    "layer_label": "Patient-reported experience",
    "gate_reason": "similarity_below_floor",
    "condition": "acne",
    "drugs": [
      {
        "drug": "Isotretinoin",
        "rank": 1,
        "rank_by_rating": 4,
        "adjusted_rating": 8.2,
        "satisfaction_rate": 0.846,
        "n_reviews": 682,
        "mimic_confirmed": false
      }
    ],
    "evidence": {
      "source": "UCI ML Drug Review corpus",
      "caveat": "Ranked from aggregated patient-reported satisfaction ... NOT clinical efficacy, safety, or suitability for this patient.",
      "match_score": 1.0,
      "match_method": "disease_link"
    }
  },
  "meta": {
    "flag": "HIGH PRIORITY",
    "treatment_layer": "drug_reviews",
    "gate_reason": "similarity_below_floor",
    "model_version": "3.0"
  }
}
```

#### GET `/reference-data`
Get vocabulary and options for building forms.

**Response:**
```json
{
  "schema_version": "3.0",
  "symptoms": [
    {"name": "fever", "red_flag": false, "critical": false},
    {"name": "sharp chest pain", "red_flag": true, "critical": true}
  ],
  "red_flags": {
    "critical": ["sharp chest pain", "vomiting blood", "seizures"],
    "serious": ["shortness of breath", "fainting"]
  },
  "risk_conditions": [
    {"key": "diabetes", "label": "Diabetes"}
  ],
  "severity_options": [
    {"value": "low", "label": "Mild"},
    {"value": "moderate", "label": "Moderate"},
    {"value": "high", "label": "Severe"}
  ]
}
```

#### GET `/history`
Get current user's assessment history.

#### GET `/me/summary`
Get personal health dashboard summary.

#### GET `/triage` (Clinical staff only)
Get triage queue of high-priority assessments.

#### GET `/all-assessments` (Clinical staff only)
Get all assessments across all patients.

#### GET `/assessments/{id}/download`
Download assessment as PDF report.

### System Endpoints

#### GET `/health`
Health check endpoint.

**Response:**
```json
{"status": "ok"}
```

#### GET `/system/model-status`
Check if AI models loaded successfully.

**Response:**
```json
{
  "healthy": true,
  "model_version": "2.0.0",
  "artifacts": {
    "disease_model": {"loaded": true, "size": 684},
    "risk_models": {"loaded": true, "size": 10}
  }
}
```

#### GET `/analytics` (Clinical staff only)
System-wide analytics dashboard data.

### Interactive API Documentation

Once the backend is running, visit:
- **Swagger UI:** http://localhost:8000/docs
- **ReDoc:** http://localhost:8000/redoc

---

## 📁 Project Structure

```
MedAssist-main/
├── backend/                      # FastAPI backend
│   ├── services/                # AI/ML model layer (inference only)
│   │   ├── engine.py           # Orchestrator - analyze()
│   │   ├── artifacts.py        # Artifact loading, required/optional policy
│   │   ├── startup.py          # Startup health check + preload
│   │   ├── disease_model.py    # Model 1
│   │   ├── risk_model.py       # Model 2
│   │   ├── treatment_cascade.py # Model 3 two-layer cascade
│   │   └── severity_engine.py  # Rule-based triage (not a model)
│   ├── artifacts/               # **REQUIRED** - 21 trained artifacts (Git LFS)
│   │   ├── model1_classifier.joblib           # Disease prediction
│   │   ├── model1_label_encoder.joblib
│   │   ├── model1_symptom_columns.json        # 377 features, ORDER MATTERS
│   │   ├── model1_symptom_evidence.json
│   │   ├── model1_metrics.json
│   │   ├── model1_disease_lookup.csv          # optional reference text
│   │   ├── model2_risk_models.joblib          # 10 models + tuned thresholds
│   │   ├── model2_condition_metrics.csv
│   │   ├── model2_metrics.json
│   │   ├── model3_mimic_layer.joblib          # Layer A + TUNED GATE CONFIG
│   │   ├── model3_mimic_matrix.npz            # Layer A diagnosis TF-IDF
│   │   ├── model3_mimic_records.csv           # Layer A neighbour display
│   │   ├── model3_treatment_table.csv         # Layer B rankings
│   │   ├── model3_disease_condition_link.json # Layer B disease -> condition
│   │   ├── model3_text_condition.joblib       # 100 MB, LOADED LAZILY
│   │   ├── model3_note_vectorizer.joblib      # similar-case lookup
│   │   ├── model3_note_matrix.npz
│   │   ├── model3_note_reference.csv
│   │   ├── model3_metrics.json
│   │   ├── model3_cascade_metrics.json
│   │   ├── model3_note_metrics.json
│   │   ├── severity_config.json               # Severity rules
│   │   └── MANIFEST.json                      # Build provenance + gate
│   ├── routers/                 # API route modules
│   │   ├── auth_routes.py      # Authentication endpoints
│   │   ├── patient_routes.py   # Patient-specific endpoints
│   │   ├── prescription_routes.py  # Prescription management
│   │   ├── report_routes.py    # Provider reports
│   │   └── admin_routes.py     # Admin functions
│   ├── main.py                  # FastAPI application entry
│   ├── database.py              # SQLAlchemy models
│   ├── auth.py                  # JWT authentication
│   ├── config.py                # Configuration settings
│   ├── report_builder.py        # PDF generation
│   ├── requirements.txt         # Python dependencies
│   ├── .env                     # Environment variables (create from .env.example)
│   └── test_postgres_connection.py  # PostgreSQL test script
├── web/                         # React + Vite frontend (PRIMARY UI)
│   ├── src/
│   │   ├── pages/              # Page components
│   │   ├── components/         # Reusable UI components
│   │   ├── lib/                # Utilities (API client)
│   │   └── main.jsx            # Entry point
│   ├── package.json
│   └── vite.config.js
├── frontend/                    # Streamlit UI (SECONDARY, optional)
│   └── app.py
├── training/                    # Model training pipeline
│   └── kaggle_train.py         # Single-file training script
├── scripts/                     # Additional utility scripts
│   ├── install_fixed.bat       # Improved installation script
│   └── README.md               # Script documentation
├── docs/                        # Documentation
│   └── legacy-v1/              # Historical v1 documentation
├── .venv/                       # Python virtual environment
├── install.bat                  # Windows installation script
├── start.bat                    # Windows startup script
├── start.ps1                    # PowerShell startup script
├── docker-compose.yml           # Docker deployment
├── .gitignore
└── README.md                    # This file
```

---

## 🧪 Testing

### Backend Tests

Run pytest test suite (26 tests):

```bash
cd backend
.venv\Scripts\activate
python -m pytest tests -v
```

**Test Coverage:**
- ✅ Authentication (register, login, JWT)
- ✅ Disease prediction API
- ✅ Risk assessment API
- ✅ Severity calculation
- ✅ Patient profiles
- ✅ Prescriptions
- ✅ Provider reports
- ✅ Role-based access control
- ✅ Database operations

### Frontend Build

Test React production build:

```bash
cd web
npm run build
```

### Manual Testing Checklist

- [ ] Register new patient account
- [ ] Login as patient
- [ ] Submit symptom assessment
- [ ] View assessment results
- [ ] Check health dashboard
- [ ] Download PDF report
- [ ] Login as provider
- [ ] View triage queue
- [ ] Create provider report
- [ ] Generate prescription
- [ ] Login as admin
- [ ] View analytics
- [ ] Manage users
- [ ] Check model status

---

## 🚢 Deployment

### Docker Deployment (Recommended)

```bash
docker-compose up -d
```

This starts:
- FastAPI backend (port 8000)
- React frontend (port 5173)
- Streamlit UI (port 8501)

`backend/artifacts/` is inside the API build context, so the 21 trained artifacts ship with the image. Nothing is mounted at runtime.

### Environment Variables for Production

Edit `backend/.env`:

```env
# Generate with: python -c "import secrets; print(secrets.token_hex(32))"
SECRET_KEY=your-secret-key-here

# Change this password!
BOOTSTRAP_ADMIN_PASSWORD=YourStrongPasswordHere123!

# PostgreSQL connection
DATABASE_URL=postgresql://user:password@host:5432/medassist

# Restrict to your actual frontend origin
CORS_ORIGINS=https://your-domain.com

# Rate limiting
LOGIN_RATE_LIMIT_ATTEMPTS=5
LOGIN_RATE_LIMIT_WINDOW_SECONDS=300
```

### Security Checklist

- [ ] Change `BOOTSTRAP_ADMIN_PASSWORD`
- [ ] Generate new `SECRET_KEY`
- [ ] Use PostgreSQL (not SQLite) in production
- [ ] Restrict `CORS_ORIGINS` to your domain
- [ ] Enable HTTPS/SSL
- [ ] Set up database backups
- [ ] Configure firewall rules
- [ ] Implement rate limiting
- [ ] Review user permissions
- [ ] Set up monitoring/logging
- [ ] Secure environment variables
- [ ] Keep dependencies updated

### Database Considerations

⚠️ **Assessment records contain protected health information (PHI)**

- Use encrypted connections (SSL/TLS)
- Implement proper access controls
- Follow HIPAA guidelines if in the US
- Regular backups with encryption
- Audit logging for compliance
- Data retention policies

---

## ⚠️ Honest Limitations

These caveats are included in every API response (`meta.caveats`) and are critical to understand:

### 1. Disease Model Accuracy Is Overstated

**Issue:** The disease prediction model is trained on a **synthetically augmented** symptom matrix. Rows were generated from disease→symptom profiles, so the model is partly recovering its own generator.

**Impact:** The 87% held-out accuracy **overstates real clinical performance**.

**Evidence:** Check `worst_classes_by_f1` in `model1_metrics.json` — headline accuracy hides wide per-class variation. Some diseases have <50% F1-score.

**Recommendation:** Treat predictions as differential diagnosis suggestions, not definitive diagnoses.

### 2. Chronic Risk Is Prevalence, Not Incidence

**Issue:** BRFSS data is **cross-sectional and self-reported**. The models estimate how similar a profile is to respondents who *report* having a condition.

**Impact:** This is **NOT** the probability of developing a condition in the future (incidence). It's a prevalence-style screening.

**Limitation:** Percentiles are relative to US adult population and **do not transfer to other populations**.

**Recommendation:** Use for screening and awareness, not predictive forecasting.

### 3. Neither Treatment Layer Is Efficacy Data

The cascade has two sources and they fail in **different** ways. Check
`treatment.layer` before reading anything into the drug list.

**Layer B — `drug_reviews` (patient-reported satisfaction):**
- Outcome bias is severe (people who felt better are more likely to review)
- Self-selection bias (sicker patients may rate differently)
- Not controlled clinical trials; no safety or adverse-effect data
- The blended ranking is statistically tied with a plain popularity baseline
  in held-out tests (Hit@5 0.540 vs 0.533)

**Layer A — `mimic` (real hospital prescriptions):**
- **Co-occurrence, not attribution.** A discharge note lists every drug for a
  patient who often had several problems at once. A statin appearing beside a
  pneumonia diagnosis does not mean it treated the pneumonia.
- Built on only 754 admissions, so coverage is narrow and skewed to inpatient
  presentations
- Stage-1 class prediction scores F1-micro 0.596 — useful, far from reliable

**Recommendation:** Use either layer as a conversation starter with a
clinician, never as prescribing guidance.

### 4. Treatment Coverage Is Partial

**Issue:** Only 219 of 684 predictable conditions (32%) link to drug-review
data, and Layer A covers a narrow inpatient slice.

**Impact:** Many predicted diseases will correctly return `layer: "none"` with
an empty drug list.

**This is expected behavior** — better to show nothing than to serve the drugs
for the nearest-spelled condition. The cascade refuses any condition match
below 0.45 for exactly this reason.

### 4b. The Gate Is Tuned, Not Proven

`sim_floor` is set at 0.10, the loosest point on the notebook's sweep (94.7%
coverage). That maximises how often Layer A answers, which also maximises how
often it answers on a thin match. The sweep in
`backend/artifacts/model3_cascade_metrics.json` shows the trade-off, and
`backend/tests/test_cascade.py` fails loudly if an outpatient condition such as
`acne` starts routing to the hospital layer. **Retune in the notebook, never in
application code** — the thresholds live in the artifact so the two cannot
drift apart.

### 5. Pediatric Risk Models Are Extrapolations

**Issue:** BRFSS surveys adults only (18+).

**Impact:** Chronic risk scores for patients under 18 are **extrapolations** using the lowest age band.

**Mitigation:** The API flags `paediatric_extrapolation: true` in the response when age < 18.

### 6. No External Validation

**Issue:** All metrics are from held-out test sets within the same data source.

**Impact:** There is **no prospective validation** against real clinical outcomes.

**Recommendation:** MedAssist is a research prototype, not a validated medical device.

---

## 🤝 Contributing

### Retraining Models

The entire training pipeline is in `training/kaggle_train.py` — a single self-contained script designed for Kaggle notebooks (30 GB RAM, ~7 minutes runtime).

**Run on Kaggle (recommended):**

```python
# Cell 1: Write script to file
%%writefile kaggle_train.py
# <paste entire kaggle_train.py contents>

# Cell 2: Install dependencies and run
!pip -q install kagglehub duckdb
!python kaggle_train.py

# For GPU sessions (limited memory):
!python kaggle_train.py --low-mem
```

**Run Locally:**

```bash
cd training
python kaggle_train.py
```

After training:
1. Copy `training/artifacts/` to `backend/artifacts/`
2. Restart the backend
3. Verify with GET `/system/model-status`

### Code Style

- **Backend:** Black formatter, type hints preferred
- **Frontend:** Prettier, ESLint
- **Naming:** snake_case (Python), camelCase (JavaScript)

### Pull Request Process

1. Fork the repository
2. Create feature branch (`git checkout -b feature/amazing-feature`)
3. Commit changes (`git commit -m 'Add amazing feature'`)
4. Push to branch (`git push origin feature/amazing-feature`)
5. Open Pull Request with description

---

## 📄 License

This project is provided as-is for educational and research purposes.

**⚠️ IMPORTANT MEDICAL DISCLAIMER:**

MedAssist AI is **NOT a medical device** and is **NOT intended for clinical use** without proper validation, regulatory approval, and oversight by qualified healthcare professionals.

- This software provides informational decision support only
- It does not diagnose medical conditions
- It does not prescribe treatments
- It does not replace professional medical advice
- All output must be reviewed by licensed clinicians before any clinical action

**By using this software, you acknowledge:**
- You understand the limitations described in this README
- You will not use it for actual patient care without proper validation
- You accept full responsibility for any use of this software
- The developers assume no liability for any outcomes

---

## 📞 Support & Contact

- **Issues:** Open a GitHub issue
- **Documentation:** See inline code comments and `docs/` folder
- **API Docs:** http://localhost:8000/docs (when running)

---

## 📚 Additional Resources

### Key Files to Read

- `training/kaggle_train.py` - Understand how models are trained
- `backend/services/engine.py` - Orchestrator, assembles the full response
- `backend/services/treatment_cascade.py` - Two-layer cascade and its gates
- `backend/services/severity_engine.py` - Triage rules explained
- `backend/artifacts/MANIFEST.json` - Model metadata and tuned gate
- `backend/artifacts/*_metrics.json` - Performance details

### Model Artifacts Required

`backend/artifacts/` is **required** for the backend to start; a missing required artifact aborts startup with the filename rather than serving degraded output. The large `.joblib`/`.npz` files are stored via Git LFS, so `git lfs install` before cloning.

### Version Constraint

⚠️ **Numpy 2.x Required**

The model artifacts were pickled under numpy 2.x. Numpy 1.26 cannot read them and fails with:
```
ValueError: PCG64 is not a known BitGenerator
```

Solution: `backend/requirements.txt` pins `numpy>=2.0,<3`

---

**Built with ❤️ for advancing AI in healthcare responsibly**
