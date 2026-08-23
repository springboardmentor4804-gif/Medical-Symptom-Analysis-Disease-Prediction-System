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

### Windows (Automated)

```bat
install.bat    # Creates .venv, installs dependencies, verifies models
start.bat      # Runs backend API and web UI
```

Then open:
- **Web UI:** http://localhost:5173
- **API Docs:** http://localhost:8000/docs
- **Streamlit UI:** http://localhost:8501 (optional)

**Requirements:** Python 3.10–3.12 and Node.js 18+

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
│  │      medmodels.engine.analyze()                    │   │
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
- **Artifact:** `model/artifacts/model1_classifier.joblib`

**Why Bernoulli NB?**
- Extremely memory efficient (~10 MB vs. 9 GB for Random Forest)
- Fast inference (<10ms per prediction)
- Handles sparse binary data naturally
- Provides calibrated probability scores

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
- **Artifact:** `model/artifacts/model2_risk_models.joblib`

**Why Histogram Gradient Boosting?**
- Native handling of missing values (no imputation needed)
- Native categorical feature support (no one-hot encoding)
- Memory efficient (bins features to uint8)
- Captures non-linear health relationships

### Severity Scoring (Triage)

**Algorithm:** **Rule-Based Weighted Scoring System** (NOT machine learning)
- **Type:** Deterministic rules with configurable weights
- **Configuration:** `model/artifacts/severity_config.json`

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

### Model 3: Treatment Recommendations

**Algorithm:** **Bayesian-Shrunk Rating Ranking** (Statistical, not ML)
- **Formula:** `score = (shrunk_rating^(1-γ)) × (n_reviews^γ)`
- **Data Source:** UCI Drug Review Dataset (215,000 patient reviews)
- **Coverage:** 219 of 684 conditions (32%)
- **Artifact:** `model/artifacts/model3_treatment_table.csv`

**Bayesian Shrinkage Formula:**
```
shrunk_rating = (n_reviews × mean_rating + prior_weight × global_mean) / 
                (n_reviews + prior_weight)
```

**Why Bayesian Ranking?**
- Prevents drugs with 1-2 reviews from dominating
- Balances quality vs. prevalence (tunable gamma parameter)
- Statistically sound, interpretable
- No training required

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
assessments (id, user_id, input_json, result_json, risk_flag, created_at)

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
  "schema_version": "2.0",
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
    "options": [
      {
        "drug": "Amoxicillin",
        "rank": 1,
        "adjusted_rating": 8.2,
        "satisfaction_rate": 0.78,
        "n_reviews": 342
      }
    ]
  },
  "meta": {
    "flag": "HIGH PRIORITY",
    "model_version": "2.0.0"
  }
}
```

#### GET `/reference-data`
Get vocabulary and options for building forms.

**Response:**
```json
{
  "schema_version": "2.0",
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
│   ├── medmodels/               # AI/ML model layer
│   │   ├── engine.py           # Main inference engine
│   │   ├── artifacts.py        # Model artifact loading
│   │   └── severity.py         # Severity/triage scoring
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
├── model/                       # **REQUIRED** - AI model artifacts
│   └── artifacts/
│       ├── model1_classifier.joblib           # Disease prediction
│       ├── model1_label_encoder.joblib
│       ├── model1_symptom_columns.json
│       ├── model1_symptom_evidence.json
│       ├── model1_disease_lookup.csv
│       ├── model1_metrics.json
│       ├── model2_risk_models.joblib          # Chronic risk models
│       ├── model2_metrics.json
│       ├── model3_treatment_table.csv         # Treatment recommendations
│       ├── model3_disease_condition_link.json
│       ├── model3_metrics.json
│       ├── severity_config.json               # Severity rules
│       └── manifest.json                      # Pipeline metadata
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

The `model/artifacts/` directory is copied into the API container, so models ship with the image.

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

### 3. Treatment Rankings Are Patient Satisfaction, Not Clinical Efficacy

**Issue:** The treatment recommendations are based on **patient-reported satisfaction** from drug reviews.

**Impact:** 
- Outcome bias is severe (people who felt better are more likely to review)
- Self-selection bias (sicker patients may rate differently)
- Not controlled clinical trials
- No safety or adverse effect data

**Evidence:** The blended ranking is statistically tied with a plain popularity baseline in held-out tests.

**Recommendation:** Use as conversation starters with clinicians, not prescribing guidance.

### 4. Treatment Coverage Is Partial

**Issue:** Only 219 of 684 predictable conditions (32%) have drug review data.

**Impact:** Many predicted diseases will correctly show an empty treatment panel.

**This is expected behavior** — better to show nothing than fabricate recommendations.

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
1. Copy `training/artifacts/` to `model/artifacts/`
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
- `backend/medmodels/engine.py` - Main inference logic
- `backend/medmodels/severity.py` - Triage rules explained
- `model/artifacts/manifest.json` - Model metadata
- `model/artifacts/*_metrics.json` - Performance details

### Model Artifacts Required

The `model/artifacts/` directory is **required** for the backend to start. If missing, download or retrain using `training/kaggle_train.py`.

### Version Constraint

⚠️ **Numpy 2.x Required**

The model artifacts were pickled under numpy 2.x. Numpy 1.26 cannot read them and fails with:
```
ValueError: PCG64 is not a known BitGenerator
```

Solution: `backend/requirements.txt` pins `numpy>=2.0,<3`

---

**Built with ❤️ for advancing AI in healthcare responsibly**
