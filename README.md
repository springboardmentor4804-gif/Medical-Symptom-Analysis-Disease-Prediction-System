# MedAssist AI — Comprehensive Project Guide

MedAssist AI is an intelligent medical symptom-checker, AI risk assessment, and clinical patient-profile management platform. Designed for modern healthcare decision support, it provides dedicated, role-tailored dashboards for **Patients**, **Doctors**, **Clinics**, and **System Administrators**.

---

## 🚀 Quick Run Links

When the application is running, access the platform services using these direct links:

| Service | Access Link | Description |
| :--- | :--- | :--- |
| **Frontend Web App** | [http://localhost:3000](http://localhost:3000) | Interactive user portal (Patient, Doctor, Clinic, Admin) |
| **Backend REST API** | [http://localhost:8000](http://localhost:8000) | FastAPI core application & ML prediction engine |
| **Interactive API Docs** | [http://localhost:8000/docs](http://localhost:8000/docs) | Interactive Swagger UI for testing API endpoints |
| **ReDoc API Docs** | [http://localhost:8000/redoc](http://localhost:8000/redoc) | Clean OpenAPI documentation view |

---

## 🌟 System Architecture & User Roles

MedAssist AI features strict **Role-Based Access Control (RBAC)** securing 4 specialized user interfaces:

```
                  ┌─────────────────────────────────────────┐
                  │              MedAssist AI               │
                  └────────────────────┬────────────────────┘
                                       │
         ┌──────────────────┬──────────┴───────────┬──────────────────┐
         │                  │                      │                  │
 ┌───────▼───────┐  ┌───────▼───────┐      ┌───────▼───────┐  ┌───────▼───────┐
 │ Patient Portal│  │ Doctor Portal │      │ Clinic Portal │  │  Admin Panel  │
 └───────────────┘  └───────────────┘      └───────────────┘  └───────────────┘
```

1. 👤 **Patient Portal**:
   - Guided symptom intake with auto-suggestions and severity scoring.
   - Instant AI-driven condition probability assessment and risk stratification.
   - Access to personal medical history logs and one-click PDF clinical report generation.
2. 🩺 **Doctor Portal**:
   - View assigned patient symptom histories and trend analytics.
   - Review AI risk findings and add clinical recommendations.
   - Issue official digital medical summaries.
3. 🏥 **Clinic Portal**:
   - Overview of patient intake volumes and facility activity stats.
   - Monitor attending medical staff and patient care queues.
4. ⚙️ **Admin Panel**:
   - Full system access, account role updates, and user management.
   - Dataset maintenance, database auditing, and platform analytics.

---

## ✨ Key Features & Capabilities

- 🧠 **AI-Powered Symptom Engine**: Evaluates combinations of symptoms, severity scales, and vitals against trained dataset patterns to output condition probability matches.
- 🚦 **Risk Stratification**: Automatically classifies risk levels into **Low**, **Moderate**, **High**, or **Critical** urgency with appropriate care recommendations.
- 📄 **Official PDF Reports**: Generates downloadable, print-ready clinical health reports powered by ReportLab.
- 📊 **Interactive Analytics**: Dynamic visual charts for vitals tracking, symptom progression over time, and population analytics.
- 🔒 **Enterprise-Grade Security**: JWT token authorization, bcrypt password hashing, input validation, and role middleware protection.

---

## 🛠️ Technology Stack

| Layer | Technology | Usage |
| :--- | :--- | :--- |
| **Frontend UI** | Next.js 14 (App Router), React 18 | Modern server-rendered and interactive web client |
| **Styling & Animation** | Tailwind CSS, Framer Motion | Dynamic UI design, dark/light modes, micro-animations |
| **Backend API** | Python 3.11, FastAPI, Uvicorn | High-performance asynchronous RESTful backend API |
| **Data Science & ML** | Scikit-learn, Pandas, Joblib | Symptom classification and disease pattern matching |
| **PDF Generation** | ReportLab | Programmatic compilation of official clinical reports |
| **Relational Database** | PostgreSQL / SQLite | Patient profiles, auth tables, symptom logs, reference dataset |
| **Document Store** | MongoDB (Motor / PyMongo) | High-volume audit logs and flexible metadata persistence |
| **Containerization** | Docker, Docker Compose | Multi-container orchestration and environment reproducibility |

---

## ⚡ How to Run the Application

### Option 1: Run Locally (Native Python & Node.js)

#### 1. Start the Backend API
Open a terminal in the root directory:
```bash
cd backend
python -m uvicorn main:app --reload --host 127.0.0.1 --port 8000
```
*Backend server will start at:* [http://localhost:8000](http://localhost:8000)

#### 2. Start the Frontend Application
In a second terminal:
```bash
cd frontend
npm run dev
```
*Frontend web app will start at:* [http://localhost:3000](http://localhost:3000)

---

### Option 2: Run with Docker Compose

1. **Spin up all containers**:
   ```bash
   docker compose up --build
   ```
2. **Seed the Default Admin**:
   ```bash
   docker compose exec backend python seed_admin.py
   ```
3. **Ingest Reference Dataset**:
   Place `disease_symptoms.csv` inside `/data/` and run:
   ```bash
   docker compose exec backend python load_dataset.py
   ```

---

## 🔑 Default Seed Credentials & Access

- 🛡️ **Admin Email**: `admin@medassist.ai`
- 🔑 **Admin Password**: `admin123`
- 📝 **Patient Registration**: Anyone can register a patient account directly at [http://localhost:3000/register](http://localhost:3000/register).

---

## 📁 Repository Structure

```
Med/
├── README.md                       # Master Project Guide & Documentation
├── docker-compose.yml              # Docker multi-container specification
│
├── backend/                        # FastAPI Backend Application
│   ├── main.py                     # Application entry point & CORS configuration
│   ├── seed_admin.py               # Admin account seeding script
│   ├── load_dataset.py             # Symptom dataset ingestion script
│   ├── train_model.py              # ML model training script
│   ├── requirements.txt            # Python dependencies
│   └── app/
│       ├── models/                 # SQLAlchemy & Pydantic models
│       ├── routes/                 # Auth, Patient, Symptoms, Admin, Doctor, Clinic routes
│       └── core/                   # Security, DB connections, JWT handlers
│
├── frontend/                       # Next.js Frontend Application
│   ├── app/                        # Next.js App Router (pages & layouts)
│   ├── components/                 # Reusable UI components & modals
│   ├── context/                    # AuthContext & ThemeContext
│   └── lib/                        # API client helper & utility functions
│
└── data/                           # Disease & Symptom dataset CSV directory
```

---

## 🔌 Core API Endpoints

- `POST /auth/register` — Register a new patient account
- `POST /auth/login` — Authenticate and receive JWT access token
- `GET /patients/me` — Get current logged-in patient profile
- `POST /symptoms/submit` — Submit new symptom entries
- `POST /prediction/predict` — Trigger AI symptom assessment
- `GET /patients/me/report` — Download official PDF clinical summary report
- `GET /doctor/patients` — Doctor access to patient history logs
- `GET /admin/users` — Admin user management endpoint
