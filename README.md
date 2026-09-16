# 🩺 MedAssist AI

<p align="center">
  <strong>AI-Powered Medical Symptom Analysis & Disease Prediction System</strong>
</p>

<p align="center">
  A healthcare decision-support platform for Patients, Doctors, Clinics, and System Administrators.
</p>

<p align="center">
  <img src="https://img.shields.io/badge/Python-3.11-blue?style=for-the-badge&logo=python" alt="Python">
  <img src="https://img.shields.io/badge/FastAPI-Backend-009688?style=for-the-badge&logo=fastapi" alt="FastAPI">
  <img src="https://img.shields.io/badge/Next.js-14-black?style=for-the-badge&logo=next.js" alt="Next.js">
  <img src="https://img.shields.io/badge/React-18-61DAFB?style=for-the-badge&logo=react" alt="React">
  <img src="https://img.shields.io/badge/Scikit--Learn-ML-F7931E?style=for-the-badge&logo=scikit-learn" alt="Scikit-Learn">
  <img src="https://img.shields.io/badge/PostgreSQL-Database-4169E1?style=for-the-badge&logo=postgresql" alt="PostgreSQL">
  <img src="https://img.shields.io/badge/MongoDB-Document_DB-47A248?style=for-the-badge&logo=mongodb" alt="MongoDB">
  <img src="https://img.shields.io/badge/Docker-Containerized-2496ED?style=for-the-badge&logo=docker" alt="Docker">
</p>

---

# 🌟 About the Project

**MedAssist AI** is an intelligent medical symptom-checker, AI risk assessment, and clinical patient-profile management platform.

The system combines:

- Artificial Intelligence
- Machine Learning
- Healthcare data management
- Secure authentication
- Patient profile management
- Risk assessment
- Disease prediction
- Clinical reporting
- Interactive analytics

MedAssist AI provides dedicated role-based dashboards for:

> 👤 Patients  
> 🩺 Doctors  
> 🏥 Clinics  
> ⚙️ System Administrators

The platform is designed to support healthcare workflows by providing symptom-based predictions and risk information while keeping healthcare professionals involved in the decision-making process.

---

# 🎯 Project Objectives

The major objectives of MedAssist AI are:

- Provide an easy-to-use medical symptom assessment interface.
- Analyze combinations of patient symptoms and vital information.
- Predict possible diseases using machine learning.
- Classify health risk into different severity levels.
- Maintain patient medical history securely.
- Provide doctors with patient symptom and prediction information.
- Provide clinics with operational and patient activity analytics.
- Provide administrators with system and dataset management capabilities.
- Generate downloadable clinical PDF reports.
- Implement secure role-based access control.

---

# ✨ Key Features

## 🧠 AI-Powered Symptom Analysis

The system analyzes:

- Patient symptoms
- Symptom severity
- Vital measurements
- Age-related information
- Clinical feature combinations

The collected information is processed through the machine learning prediction pipeline.

---

## 🦠 Disease Prediction

MedAssist AI uses a multi-class machine learning model to identify possible disease patterns from the patient's input symptoms and clinical information.

The system supports prediction across:

**116 unique disease classes.**

---

## 🚦 Risk Stratification

The system categorizes health risk into four levels:

| Risk Level | Description |
| :---: | :--- |
| 🟢 **Low** | Lower estimated risk based on the available information |
| 🟡 **Moderate** | Requires attention and monitoring |
| 🟠 **High** | Higher estimated risk requiring professional evaluation |
| 🔴 **Critical** | Potentially urgent situation requiring immediate professional attention |

---

## 📄 Clinical PDF Reports

The platform can generate downloadable PDF reports containing relevant patient information and assessment results.

PDF generation is implemented using:

**ReportLab**

---

## 📊 Interactive Analytics

The system provides visual analytics for:

- Patient vitals
- Symptom progression
- Risk trends
- Patient activity
- Clinic statistics
- Population-level information

---

## 🔐 Secure Authentication

MedAssist AI implements:

- JWT authentication
- Bcrypt password hashing
- Role-based authorization
- Input validation
- Protected API routes
- Role-specific dashboards

---

# 👥 User Roles

## 👤 Patient Portal

Patients can:

- Register an account.
- Log in securely.
- Enter symptoms.
- Provide symptom severity.
- Submit vital information.
- Receive AI-based assessment.
- View prediction results.
- View medical history.
- Track symptom trends.
- Generate PDF clinical reports.

---

## 🩺 Doctor Portal

Doctors can:

- Log in through the doctor portal.
- View assigned patients.
- Review patient symptom histories.
- Analyze patient trends.
- Review AI-generated risk information.
- Add clinical recommendations.
- Prepare digital medical summaries.

---

## 🏥 Clinic Portal

Clinics can:

- Monitor patient intake.
- View facility activity.
- Monitor attending staff.
- Track patient queues.
- View operational statistics.

---

## ⚙️ Admin Panel

Administrators can:

- Manage users.
- Manage user roles.
- Maintain datasets.
- Audit database information.
- Monitor system analytics.
- Manage platform-level settings.

---

# 🏗️ System Architecture

```text
                         ┌───────────────────────────┐
                         │        MEDASSIST AI       │
                         │ Healthcare Decision       │
                         │ Support Platform          │
                         └─────────────┬─────────────┘
                                       │
               ┌───────────────────────┼────────────────────────┐
               │                       │                        │
               ▼                       ▼                        ▼
      ┌────────────────┐      ┌────────────────┐      ┌────────────────┐
      │ Patient Portal │      │ Doctor Portal  │      │ Clinic Portal  │
      └───────┬────────┘      └───────┬────────┘      └───────┬────────┘
              │                       │                       │
              │                       │                       │
              └───────────────────────┼───────────────────────┘
                                      │
                                      ▼
                         ┌────────────────────────┐
                         │      FastAPI Backend   │
                         │       REST API         │
                         └────────────┬───────────┘
                                      │
              ┌───────────────────────┼────────────────────────┐
              │                       │                        │
              ▼                       ▼                        ▼
       ┌──────────────┐       ┌──────────────┐        ┌──────────────┐
       │ PostgreSQL / │       │   MongoDB    │        │  ML Engine   │
       │    SQLite    │       │ Audit / Logs │        │ Scikit-Learn │
       └──────────────┘       └──────────────┘        └──────┬───────┘
                                                              │
                                                              ▼
                                                    ┌─────────────────┐
                                                    │ Disease + Risk  │
                                                    │   Prediction    │
                                                    └─────────────────┘

---

# 📊 Model Accuracy Overview

MedAssist AI uses machine learning models to perform **disease prediction** and **health-risk assessment**.

| Model | Prediction Type | Accuracy |
| :--- | :--- | :---: |
| 🩺 **Outcome Risk Model** | Binary Risk Classification | **80.00%** |
| 🦠 **Disease Prediction Model** | Top-1 Prediction | **80.00%** |
| 🧠 **Disease Prediction Model** | Top-3 Prediction | **98.57%** |
| 🎯 **Disease Prediction Model** | Top-5 Prediction | **100.00%** |

### 🏆 Accuracy Highlights

```text
┌─────────────────────────────────────────────┐
│          MEDASSIST AI MODEL ACCURACY        │
├─────────────────────────────────────────────┤
│                                             │
│  Health Risk Prediction      →   80.00%     │
│                                             │
│  Disease Top-1 Accuracy      →   80.00%     │
│                                             │
│  Disease Top-3 Accuracy      →   98.57%     │
│                                             │
│  Disease Top-5 Accuracy      →  100.00%     │
│                                             │
└─────────────────────────────────────────────┘
