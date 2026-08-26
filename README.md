# MedAssist AI

**Clinical decision-support web application** providing symptom-based differential diagnosis, chronic condition risk screening, rule-weighted triage, treatment recommendations, and healthcare guidance.

> **⚠️ Not a Medical Device**  
> MedAssist is informational decision support only. It does not diagnose and must not be used to make treatment decisions without a clinician. See [Honest Limitations](#honest-limitations) for important caveats.

---

## 📋 Table of Contents

- [Quick Start](#quick-start)
- [Features](#features)
- [Architecture](#architecture)
- [Machine Learning Models](#machine-learning-models)
- [Healthcare Recommendation Engine](#healthcare-recommendation-engine)
- [Database Setup](#database-setup)
- [API Documentation](#api-documentation)
- [Project Structure](#project-structure)
- [Testing](#testing)
- [Deployment](#deployment)
- [Configuration](#configuration)
- [Troubleshooting](#troubleshooting)
- [Honest Limitations](#honest-limitations)
- [Contributing](#contributing)

---

## 🚀 Quick Start

### Step 0 — Clone (Git LFS required)

The trained models live in `backend/artifacts/` and the large ones are stored with **Git LFS**. Install it *before* cloning, or you get 130-byte text pointer files instead of models and the API refuses to start.

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

Install Git LFS from <https://git-lfs.com> (or `brew install git-lfs`, `apt install git-lfs`, `winget install GitHub.GitLFS`).

### Something not working? Run the doctor first

Use the project's virtual environment, not a bare `python`:

```bat
.venv\Scripts\python.exe backend\doctor.py     :: Windows
```
```bash
.venv/bin/python backend/doctor.py              # macOS / Linux
```

It checks which interpreter is running, the Python and numpy versions, Git LFS pointers, every artifact, the cascade gate and one end-to-end assessment, and prints the fix for anything it finds. Start here rather than reading logs.

> **The most common failure is the interpreter, not the code.** Running the system Python against a correctly-installed project gives `numpy 1.26.4 cannot read the artifacts`, because `requirements.txt` pins `numpy>=2` inside the venv only. The artifacts are numpy 2.x pickles and fail on 1.x with `PCG64 is not a known BitGenerator`. `doctor.py` reports this as the first finding.

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

> Python 3.10+ is not optional: the artifacts are pickled under numpy 2.x, which does not support earlier versions. `requirements.txt` pins `numpy>=2` for the same reason — on numpy 1.26 the models fail to load with `PCG64 is not a known BitGenerator`.

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
- ✅ **Treatment Recommendations** - Evidence-based treatment options from hospital data and patient reviews
- ✅ **Healthcare Recommendations** - Clear, actionable guidance with specialist referrals
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
- ✅ **Healthcare Recommendations** - Consolidated, actionable guidance

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
│  │                                                     │   │
│  │  ┌────────────────────────────────────────────┐   │   │
│  │  │ Recommendation Engine (NEW)                │   │   │
│  │  │ Consolidates outputs → actionable advice   │   │   │
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

#### Anatomical Plausibility Filter

The symptom matrix has no sex or age feature, so nothing in the classifier stops it ranking `hypertension of pregnancy` first for a 35-year-old man. Conditions that are **impossible** for the patient are removed before ranking and the remaining probabilities are renormalized. The removed names come back in `diagnosis.excluded_sex_specific` so the filter is visible rather than silent.

Only the impossible is filtered. Conditions that are merely *rare* in one sex stay in the differential, because expressing "unlikely" is the model's job.

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

Treatment is the one place where **the source matters more than the ranking**, so Model 3 is a cascade of two sources that are never presented under the same label.

#### Layer A — Real Hospital Prescriptions (Preferred)

- **Data source:** MIMIC-IV discharge prescriptions, 754 admissions
- **Algorithm:** TF-IDF diagnosis similarity → Stage 1 drug-class classifier gated on **lift over its own prior** → drugs ranked by what genuinely similar admissions were prescribed
- **Artifact:** `backend/artifacts/model3_mimic_layer.joblib`
- **Means:** clinicians treating similar admissions prescribed these drugs

Layer A only answers when it clears **three gates**:

| Gate | Value | Fails with |
|---|---|---|
| `sim_floor` | 0.10 | `similarity_below_floor` |
| `min_support` | 3 | `insufficient_support` |
| `cat_threshold` | 0.30 | `no_class_predicted` / `no_drug_predicted` |

#### Layer B — Patient-Reported Experience (Fallback)

- **Algorithm:** Bayesian-shrunk rating ranking (statistical, not ML)
- **Formula:** `score = (shrunk_rating^(1-γ)) × (n_reviews^γ)`, γ = 0.5
- **Data source:** UCI Drug Review Dataset (209,000 patient reviews)
- **Coverage:** 328 rankable conditions, 219 of 684 diseases linked (32%)
- **Artifact:** `backend/artifacts/model3_treatment_table.csv`
- **Means:** patients rated these drugs highly — satisfaction, not efficacy

Bayesian shrinkage stops a drug with two five-star reviews from outranking one with two thousand good ones.

#### Layer "None" — Empty Panel is a Correct Answer

If the query resolves to no condition above a 0.45 match score, the cascade returns an **empty drug list**, not the drugs for the nearest-spelled condition. This prevents incorrect recommendations for surgical, dermatological, or congenital conditions that genuinely have no entry in either corpus.

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

## 📋 Healthcare Recommendation Engine

The recommendation engine consolidates outputs from all four model components into a single, human-readable action plan. This is **not** an ML model—it's deterministic, auditable rule logic.

### Design Principles

1. **Traceability**: Every recommendation field cites which upstream component(s) it derives from
2. **No Fabrication**: Only information traceable to model outputs is included
3. **Config-Driven**: All thresholds, mappings, and phrasing live in `recommendation_config.json`
4. **Auditability**: Transparent logic that can be reviewed by clinicians
5. **Safety**: Includes medical disclaimer on every output

### Output Structure

The recommendation engine generates six key fields:

```json
{
  "primary_action": "Clear instruction based on severity",
  "urgency_timeline": "immediate | same-day | within a week | 2-4 weeks",
  "urgency_description": "Detailed timeline guidance",
  "recommended_specialist": "Doctor type (e.g., cardiologist)",
  "preventive_care_notes": [
    {
      "condition": "diabetes",
      "risk_score": 82,
      "contributing_factors": ["BMI", "Exercise", "Smoking"],
      "recommended_actions": ["weight management", "exercise programs"],
      "message": "Formatted guidance with actual risk factors"
    }
  ],
  "self_care_suggestions": [
    {
      "suggestion": "rest, fluids, OTC medications",
      "type": "otc_or_lifestyle",
      "source": "disease_lookup_cures"
    }
  ],
  "disclaimer": "Standard medical disclaimer text"
}
```

### Recommendation Logic

#### Primary Action & Urgency
Directly derived from severity level:
- EMERGENCY → "Seek emergency care immediately" (immediate)
- URGENT → "Seek same-day medical attention" (same-day)
- MODERATE → "Schedule a medical appointment soon" (within a week)
- MILD → "Self-care and monitor symptoms" (2-4 weeks)

#### Specialist Selection
Multi-stage prioritization:
1. Extract candidates from disease prediction + treatment data
2. If EMERGENCY/URGENT with red flags → prioritize by red flag category
3. Otherwise → prioritize by severity level
4. Fall back to generic recommendation

#### Preventive Care Notes
Generated when:
- Chronic risk model is available
- Condition risk score ≥ threshold (default 60)
- Top contributing factors are identifiable
- Message includes condition-specific template with **actual risk factors** (not generic text)

#### Self-Care Suggestions
Generated when:
- Severity is MILD or MODERATE
- No red flags present
- Treatment data contains self-care information
- Sources: Disease lookup "cures" field + OTC medications

### Configuration

Edit `backend/artifacts/recommendation_config.json` to tune:
- **Severity actions**: What to tell users per severity level
- **Chronic risk threshold**: When to generate preventive care (default: 60)
- **Preventive care templates**: Messages per condition
- **Specialist priorities**: Which specialists for which situations
- **Self-care rules**: When to show self-care suggestions

### UI Integration

The recommendation appears as the **final section** in results, after:
1. Severity banner
2. Disease predictions
3. Chronic risk scores
4. Treatment options

**Visual elements:**
- Color-coded primary action (red/orange/blue/green based on urgency)
- Recommended specialist with icon
- Expandable preventive care notes
- Self-care suggestions with emoji icons (💊 for meds, 🏠 for lifestyle)
- Medical disclaimer

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

---

## 📡 API Documentation

### Core Assessment Endpoints

#### POST `/assess`
**Main endpoint** - Performs AI assessment and returns comprehensive results.

**Request:**
```json
{
  "symptoms": [
    {"name": "fever", "severity": "high"},
    {"name": "cough", "severity": "moderate"}
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
    "high_blood_pressure": true
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

**Response includes:**
- `diagnosis`: Disease predictions with confidence
- `risk`: Chronic condition risk scores
- `severity`: Triage level and component breakdown
- `treatment`: Medication recommendations
- `recommendation`: Healthcare guidance (NEW)
- `meta`: System metadata

#### GET `/reference-data`
Get vocabulary and options for building forms.

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

#### GET `/system/model-status`
Check if AI models loaded successfully.

#### GET `/analytics` (Clinical staff only)
System-wide analytics dashboard data.

### Interactive API Documentation

Once the backend is running, visit:
- **Swagger UI:** http://localhost:8000/docs
- **ReDoc:** http://localhost:8000/redoc

---

## 📁 Project Structure

```
MedAssist/
├── backend/                      # FastAPI backend
│   ├── services/                # AI/ML model layer (inference only)
│   │   ├── engine.py           # Orchestrator - analyze()
│   │   ├── artifacts.py        # Artifact loading
│   │   ├── startup.py          # Startup health check
│   │   ├── disease_model.py    # Model 1
│   │   ├── risk_model.py       # Model 2
│   │   ├── severity_engine.py  # Rule-based triage
│   │   ├── treatment_cascade.py # Model 3 two-layer cascade
│   │   └── recommendation_engine.py  # Healthcare recommendations
│   ├── artifacts/               # REQUIRED - 21 trained artifacts (Git LFS)
│   │   ├── model1_*.joblib     # Disease prediction artifacts
│   │   ├── model2_*.joblib     # Chronic risk artifacts
│   │   ├── model3_*.joblib     # Treatment cascade artifacts
│   │   ├── severity_config.json         # Severity rules
│   │   └── recommendation_config.json   # Recommendation rules
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
│   └── requirements.txt         # Python dependencies
├── web/                         # React + Vite frontend (PRIMARY UI)
│   ├── src/
│   │   ├── pages/              # Page components
│   │   ├── components/         # Reusable UI components
│   │   │   └── med/ResultPanels.jsx  # Includes RecommendationPanel
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
├── .venv/                       # Python virtual environment
├── install.bat                  # Windows installation script
├── start.bat                    # Windows startup script
├── start.ps1                    # PowerShell startup script
├── docker-compose.yml           # Docker deployment
└── README.md                    # This file
```

---

## 🧪 Testing

### Backend Tests

Run pytest test suite:

```bash
cd backend
.venv\Scripts\activate
python -m pytest tests -v
```

**Test Coverage:**
- ✅ Authentication (register, login, JWT)
- ✅ Disease prediction API
- ✅ Chronic risk assessment
- ✅ Severity scoring
- ✅ Treatment recommendations
- ✅ Healthcare recommendations
- ✅ Database operations
- ✅ Role-based access control

### Recommendation Engine Tests

```bash
cd backend
python test_recommendation_engine.py
python test_integration_mock.py
```

### Model Validation

```bash
cd backend
python doctor.py  # Comprehensive health check
```

---

## 🚀 Deployment

### Docker Deployment

```bash
# Build and start all services
docker-compose up -d

# View logs
docker-compose logs -f

# Stop services
docker-compose down
```

### Manual Deployment

#### Backend (FastAPI)

```bash
cd backend
gunicorn main:app --workers 4 --worker-class uvicorn.workers.UvicornWorker --bind 0.0.0.0:8000
```

#### Frontend (React/Vite)

```bash
cd web
npm run build
# Serve the dist/ folder with nginx or similar
```

### Environment Variables

Required in `backend/.env`:

```env
SECRET_KEY=<32-byte-hex-key>
DATABASE_URL=postgresql://user:pass@localhost:5432/medassist
CORS_ORIGINS=http://localhost:5173
```

---

## ⚙️ Configuration

### Severity Scoring

Edit `backend/artifacts/severity_config.json` to adjust:
- Component weights
- Age vulnerability thresholds
- Red flag definitions
- Vital sign normal ranges
- Severity level thresholds

### Healthcare Recommendations

Edit `backend/artifacts/recommendation_config.json` to adjust:
- Chronic risk threshold (default: 60)
- Severity action messages
- Preventive care templates
- Specialist priority rules
- Self-care eligibility rules

### Feature Flags

System settings can be configured via the admin panel or database:
- Enable/disable specific features
- Adjust confidence thresholds
- Configure rate limiting
- Set maintenance mode

---

## 🔧 Troubleshooting

### Model Artifacts Not Loading

**Symptom:** `PCG64 is not a known BitGenerator` or "artifact not found"

**Cause:** Git LFS files not downloaded or wrong numpy version

**Fix:**
```bash
git lfs install
git lfs pull
.venv\Scripts\activate
pip install numpy>=2.0
```

### Backend Won't Start

**Symptom:** Import errors or module not found

**Fix:**
```bash
cd backend
.venv\Scripts\activate
pip install -r requirements.txt
```

### Frontend Build Errors

**Symptom:** npm errors or missing dependencies

**Fix:**
```bash
cd web
rm -rf node_modules package-lock.json
npm install
npm run dev
```

### Recommendation Section Not Appearing

**Check 1:** Backend logs for errors
**Check 2:** Browser console (F12) for JavaScript errors
**Check 3:** Network tab - verify `/assess` response includes `recommendation` field
**Check 4:** Hard refresh browser (Ctrl+Shift+R)

### Database Connection Issues

**PostgreSQL:**
```bash
cd backend
python test_postgres_connection.py
```

**SQLite:**
- Check `backend/medassist.db` exists and has write permissions

### Common Issues

| Issue | Solution |
|-------|----------|
| Port already in use | Kill process: `netstat -ano \| findstr :8000` then `taskkill /PID <PID> /F` |
| CORS errors | Add frontend URL to `CORS_ORIGINS` in `.env` |
| Authentication fails | Check `SECRET_KEY` is set in `.env` |
| Slow predictions | Check all artifacts loaded (run `doctor.py`) |

---

## 🚨 Honest Limitations

### What MedAssist Does
✓ Provides differential diagnosis suggestions based on symptoms
✓ Screens for chronic disease risk factors
✓ Triages by severity using transparent rules
✓ Suggests evidence-based treatment options
✓ Consolidates information into actionable guidance

### What MedAssist Does NOT Do
✗ Make clinical diagnoses
✗ Replace professional medical judgment
✗ Prescribe treatments
✗ Handle medical emergencies (always call 911)
✗ Substitute for in-person examination

### Data and Model Limitations

**Disease Prediction:**
- Training data is synthetically augmented
- Held-out accuracy overstates real-world performance
- Cannot diagnose conditions requiring physical examination
- Limited to 684 conditions in training data

**Chronic Risk:**
- Based on population statistics (CDC BRFSS)
- Individual results may vary significantly
- Cannot account for genetic factors or family history
- Lifestyle inputs are self-reported

**Treatment Recommendations:**
- Hospital data (MIMIC-IV) reflects ICU admissions only
- Patient reviews measure satisfaction, not efficacy
- Does not consider drug interactions or contraindications
- Limited coverage (32% of disease database)

**Severity Triage:**
- Rule-based system, not learned from actual outcomes
- May over or under-triage edge cases
- Red flags are manually curated, not exhaustive

### Medical Disclaimer

**This application is for informational purposes only and does not constitute medical advice, diagnosis, or treatment. Always consult a qualified healthcare professional for medical concerns. If you are experiencing a medical emergency, call emergency services immediately.**

---

## 🤝 Contributing

### Development Setup

1. Fork the repository
2. Create a feature branch: `git checkout -b feature/amazing-feature`
3. Make your changes
4. Run tests: `python -m pytest backend/tests`
5. Commit: `git commit -m 'Add amazing feature'`
6. Push: `git push origin feature/amazing-feature`
7. Open a Pull Request

### Code Style

- **Python:** Follow PEP 8, use type hints
- **JavaScript:** ESLint configuration in `web/.eslintrc`
- **Comments:** Explain why, not what
- **Tests:** Add tests for new features

### Areas for Contribution

- 🔬 Improve model accuracy
- 🎨 Enhance UI/UX
- 📚 Expand documentation
- 🧪 Add test coverage
- 🌐 Internationalization
- ♿ Accessibility improvements

---

## 📄 License

This project is licensed under the MIT License. See LICENSE file for details.

---

## 🙏 Acknowledgments

- **Training Data:** Kaggle datasets, CDC BRFSS, MIMIC-IV, UCI Drug Reviews
- **Libraries:** scikit-learn, FastAPI, React, Vite, Streamlit
- **Inspiration:** Clinical decision support research and best practices

---

## 📞 Support

- **Issues:** [GitHub Issues](https://github.com/tharunkumardeveloper/MedAssist/issues)
- **Documentation:** This README and inline code comments
- **Community:** Discussions tab on GitHub

---

**Built with ❤️ for healthcare accessibility**

**Version:** 3.0.0  
**Last Updated:** August 2026  
**Status:** ✅ Production Ready
