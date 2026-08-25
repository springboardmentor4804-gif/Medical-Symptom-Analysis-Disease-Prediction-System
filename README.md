# MedAssist AI

MedAssist AI is a full-stack healthcare application designed to support both patients and healthcare providers. It enables patients to enter symptoms, maintain medical history, receive disease predictions, monitor their risk level, and access recommendations. Providers can review patient data, assess AI-generated predictions, monitor risk trends, and manage care recommendations from one dashboard.

## Project goal

The application is built to demonstrate how AI-assisted healthcare workflows can be delivered through a modern web stack. It combines:

- patient-friendly interfaces for symptom entry and profile management
- provider-side monitoring and review dashboards
- backend APIs for authentication and protected workflows
- machine learning-based disease prediction using symptoms and patient profile context
- PostgreSQL-backed data persistence for user and clinical records

## Main user roles

### Patient
A patient can:

- register and log in
- update profile details and contact information
- add medical history records
- add and edit symptom entries
- search symptoms by name
- generate disease prediction results from selected symptoms
- check health risk assessment outcomes
- view AI-generated recommendations and approved care guidance
- review generated healthcare reports
- update privacy and notification settings

### Provider
A provider can:

- log in with a doctor/provider role
- access a provider dashboard overview
- view patient lists and patient conditions
- review patient medical history and symptom trends
- assess disease prediction outputs and patient risk levels
- approve, reject, or review recommendations
- analyze population-level and patient-level statistics
- access provider analytics and reporting views

## Features implemented in the application

### Authentication and user management

- user registration for patient and healthcare-provider roles
- email-based user login
- JWT-style bearer token pattern using API tokens
- role-based access control for patient-only and provider-only endpoints
- token validation and authorization middleware
- account creation with provider profile data

### Patient dashboard features

- patient home overview with latest health information
- profile editing for personal and medical information
- medical history management with add, edit, and delete operations
- symptom tracking with severity, duration, frequency, and notes
- symptom search to find common symptom names in the database
- disease prediction using symptoms and patient profile context
- risk assessment that evaluates age, chronic conditions, severe symptoms, lifestyle factors, and prior risk data
- recommendation review and patient-facing approved suggestions
- generated reports for predictions and care summaries
- analytics for patient trends and health overview
- settings update for password and preferences

### Provider dashboard features

- provider dashboard overview with patient counts and summaries
- patient list view with patient metadata, risk levels, and last visit status
- patient conditions and history timeline
- symptom analysis dashboard across all patient data
- disease prediction review panel
- risk assessment review panel
- provider recommendations creation and review
- report review and provider monitoring
- analytics summaries for model and patient metrics
- provider profile information display

### AI and clinical logic

- disease prediction using a trained model and saved preprocessing components
- model loading from `backend/ml/models`
- disease confidence scoring
- healthcare advisory generation based on symptoms and risk assessment
- recommendation generation for predicted conditions
- risk scoring based on patient profile and symptom burden
- provider feedback on predictions and recommendations

### Reporting and notifications

- report payload generation for patient reports
- downloadable PDF-like report generation using reportlab
- notifications for new symptoms, predictions, and recommendation updates
- provider alerts when patients add new symptom data or risk events

## Application workflow

### 1. Landing page

The application starts from a landing page that explains the product, highlights features, and gives users access to login and registration.

### 2. Registration flow

Users can register as:

- patient
- healthcare provider

The registration API creates the user row and associated profile row:

- patient profiles are stored in the `patient_profile` table
- provider profiles are stored in the `provider_profile` table

The frontend validates form values before sending them to the backend.

### 3. Login flow

Users log in with email and password. On success:

- a token is issued and stored in local storage
- the frontend redirects based on the user role
- patient users go to `/dashboard/patient`
- provider users go to `/dashboard/provider`

### 4. Patient workflow

After login, the patient sees a dashboard with modules for:

- profile
- medical history
- symptoms
- disease prediction
- risk assessment
- reports
- analytics
- recommendations
- settings

Each panel pulls its data from backend endpoints with the valid bearer token. Data is refreshed periodically so the interface reflects the latest medical records.

### 5. Symptom tracking and analysis

A patient can submit one or more symptoms with details such as:

- severity
- duration
- frequency
- notes

The backend stores these records in the `patient_symptoms` and `symptoms` tables. Providers can later review this information as part of the patient timeline.

### 6. Disease prediction

When the user requests a prediction:

1. selected symptom names are collected
2. the patient profile is loaded
3. the model preprocessing pipeline is applied
4. the trained model predicts the most likely disease
5. confidence is computed from probabilities
6. a disease prediction record is saved
7. a report and preliminary recommendations are generated

### 7. Risk assessment

Risk is evaluated using:

- age
- existing conditions
- current symptoms and symptom count
- severe symptom indicators
- BMI and lifestyle factors
- predicted disease context

The result is stored in the `risk_assessment` table and shown in the patient dashboard and provider dashboard.

### 8. Recommendations and reports

The app creates care recommendations from disease prediction and provider review. The system allows:

- patient-view accepted recommendations
- provider-recommended interventions
- review of recommendation status
- generation of clinical-style reports containing risk summaries and healthcare guidance

### 9. Provider workflow

The provider dashboard aggregates data from all patients and displays:

- patient overview
- patient condition history
- symptom trends
- predictions and risk scores
- recommendations status
- analytics summaries

Providers can approve or reject recommendations and add guidance for patients.

## Technical architecture

### Frontend

The frontend is a React app built with Vite.

Main frontend files and screens include:

- `backend/frontend/src/App.jsx` – top-level routing
- `backend/frontend/src/pages/Landing.jsx` – landing page
- `backend/frontend/src/pages/Login.jsx` – authentication page
- `backend/frontend/src/pages/Register.jsx` – unified registration form
- `backend/frontend/src/pages/RegisterProvider.jsx` – provider-specific registration
- `backend/frontend/src/pages/PatientDashboard.jsx` – patient dashboard shell
- `backend/frontend/src/pages/ProviderDashboard.jsx` – provider dashboard shell
- `backend/frontend/src/api/client.js` – API request management and token storage

### Backend

The backend is a FastAPI application organized around:

- API routes in `backend/app/main.py`
- SQLAlchemy models in `backend/app/models.py`
- request/response validation in `backend/app/schemas.py`
- user creation and hashing logic in `backend/app/crud.py`
- recommendation generation in `backend/app/recommendation_engine.py`

### Database

The database layer is managed with SQLAlchemy and PostgreSQL.

Key database tables include:

- `users` – system users and roles
- `patient_profile` – patient personal and medical profile data
- `provider_profile` – provider professional data
- `medical_history` – patient disease history
- `symptoms` – known symptom catalog
- `patient_symptoms` – symptom entries tied to patient records
- `disease_predictions` – AI prediction results
- `risk_assessment` – risk scoring results
- `recommendations` – provider and AI recommendations
- `reports` – generated patient reports
- `api_tokens` – bearer tokens for API authentication
- `notifications` – updates for patient/provider notifications

## Key backend API areas

### Authentication endpoints

- `POST /register` – create a new user account
- `POST /login` – log in and receive a bearer token
- `GET /confirm` – confirm email token

### Patient endpoints

- `GET /dashboard/patient` – patient dashboard payload
- `GET /patient/profile` – patient profile data
- `PUT /patient/profile` – edit profile
- `GET /patient/history` – patient medical history
- `POST /patient/history` – add medical history item
- `PUT /patient/history/{history_id}` – update history item
- `DELETE /patient/history/{history_id}` – delete history item
- `GET /patient/symptoms` – patient symptom list
- `POST /patient/symptoms` – add symptom records
- `PUT /patient/symptoms/{symptom_id}` – edit symptom
- `DELETE /patient/symptoms/{symptom_id}` – remove symptom
- `GET /symptoms/search` – search symptom catalog
- `POST /patient/prediction` – generate disease prediction
- `POST /patient/risk` – calculate risk score
- `PUT /patient/settings` – update account settings
- `GET /patient/recommendations` – list approved recommendations
- `GET /patient/reports` – list report records

### Provider endpoints

- `GET /dashboard/provider` – provider dashboard payload
- `GET /provider/analytics` – provider analytics summary
- `POST /provider/recommendations` – add recommendation
- `POST /provider/recommendations/review` – review recommendation status
- `GET /provider/reports` – provider report view

## ML model flow

The model pipeline depends on saved artifacts in `backend/ml/models`:

- `best_model.keras` or fallback pickle model
- `preprocessor.pkl`
- `label_encoder.pkl`

The backend loads these files and transforms user input into the same feature format used in training. The prediction function returns:

- predicted disease
- confidence score
- recommendation seed data

This is integrated into the patient disease prediction endpoint and also influences the risk calculation logic.

## Data flow in the project

1. User registers or logs in.
2. Browser stores a bearer token in local storage.
3. Frontend calls protected endpoints using the bearer token.
4. FastAPI validates the token against `api_tokens` and loads the corresponding user.
5. The backend fetches patient/provider profile information and stored records.
6. Business logic computes disease predictions, risk levels, or recommendations.
7. The database stores the new clinical data.
8. The frontend refreshes the dashboard with the latest result set.

## How the application works end-to-end

### For a patient

- patient signs up and enters personal information
- patient adds symptoms and medical history
- patient runs disease prediction
- app runs ML inference on symptoms and profile context
- prediction is stored with confidence score
- risk score is calculated
- generated recommendations are shown
- report is created for overview and future review
- provider receives notifications when significant new data arrives

### For a provider

- provider logs in using provider account
- provider sees patient list and summary data
- provider reviews patient conditions, symptoms, predictions, and risk trends
- provider can approve or reject recommendations
- provider monitors analytics and reports for the care population

## Setup and run

### Prerequisites

- Python 3.11 or higher
- Node.js and npm
- PostgreSQL database
- Access to the project virtual environment or a fresh Python environment

### Install backend dependencies

```powershell
cd backend
python -m pip install -r requirements.txt
```

### Initialize the database

```powershell
cd backend
python -m db.init_db
```

### Start the backend

```powershell
cd backend
python -m uvicorn app.main:app --reload --port 8000
```

### Start the frontend

```powershell
cd backend\frontend
npm install
npm run dev
```

### Open the application

Open:

```text
http://127.0.0.1:5173
```

### Quick launch helper

From the project root you can also run:

```powershell
.\start-dev.ps1
```

This script launches the backend and frontend in separate terminal windows.

## Important project notes

- The backend uses PostgreSQL and expects database settings to be available in the environment or defaults configured in the connection script.
- The frontend expects the API at `http://127.0.0.1:8000`.
- Some generated folders such as `__pycache__`, `node_modules`, `dist`, and local virtual environments should not be committed.
- This project is designed as an educational and demo healthcare AI workflow and should be used with clinical oversight in real deployment scenarios.

## Technology stack summary

- Python
- FastAPI
- SQLAlchemy
- PostgreSQL
- React
- Vite
- TensorFlow / scikit-learn / joblib
- ReportLab

## License

This project is intended for educational, demonstration, and research-oriented use.
