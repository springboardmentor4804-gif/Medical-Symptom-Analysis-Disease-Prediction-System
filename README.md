# 🏥 MedAssist AI

> An AI-powered healthcare assistance platform for symptom analysis, disease prediction, patient risk assessment, healthcare recommendations, and patient–caretaker interaction.

## 📌 Overview

**MedAssist AI** is an AI/ML-focused healthcare assistance platform designed to help patients understand their health conditions through an interactive web application.

The system accepts patient symptoms and health information, processes them using machine learning models, and provides:

- Disease prediction
- Top possible conditions
- Patient risk assessment
- Healthcare recommendations
- Treatment suggestions
- Health advisory guidance
- Disease prediction reports
- Health analytics and visualizations
- Patient–caretaker interaction

The platform is designed as a **decision-support and educational system** and is **not intended to replace professional medical diagnosis or treatment**.

---

## 🎯 Objectives

The main objectives of MedAssist AI are to:

1. Build an AI-powered symptom analysis and disease prediction system.
2. Assess potential patient health risks using machine learning.
3. Generate personalized healthcare recommendations based on available patient information.
4. Provide treatment and advisory suggestions for educational purposes.
5. Generate downloadable disease prediction reports.
6. Provide healthcare analytics and health trend visualizations.
7. Enable patients to connect with caretakers.
8. Provide caretakers with access to assigned patient information.

---

## ✨ Key Features

### 🤖 AI & Machine Learning

- Symptom-based disease prediction
- Top condition prediction
- Patient health risk assessment
- Machine learning model integration
- Prediction history
- Healthcare recommendation engine
- Treatment suggestions
- AI-assisted healthcare advisory

### 👤 Patient Module

- Patient registration and login
- Patient profile management
- Symptom management
- Disease prediction
- Risk assessment
- Healthcare recommendations
- Medical history
- Health reports
- Health analytics
- Health trend visualization
- Caretaker selection

### 👨‍⚕️ Caretaker Module

- Caretaker registration and login
- Caretaker profile management
- View assigned patients
- View patient details
- Patient-caregiver relationship management

### 📊 Analytics

The analytics module provides insights such as:

- Recorded symptoms
- Predicted diseases
- Prediction probabilities
- Risk assessment results
- Disease prediction history
- Health trends over time

### 📄 Reports

The system can generate disease prediction reports containing relevant prediction information and patient health analysis.

---

## 🏗️ System Architecture

```text
                    ┌──────────────────────┐
                    │      Patient         │
                    └──────────┬───────────┘
                               │
                               ▼
                    ┌──────────────────────┐
                    │   React Frontend     │
                    │      Web UI           │
                    └──────────┬───────────┘
                               │
                         REST API Calls
                               │
                               ▼
                    ┌──────────────────────┐
                    │    FastAPI Backend   │
                    └──────────┬───────────┘
                               │
             ┌─────────────────┼─────────────────┐
             │                 │                 │
             ▼                 ▼                 ▼
      ┌─────────────┐   ┌─────────────┐   ┌─────────────┐
      │ Disease     │   │ Risk        │   │ Healthcare  │
      │ Prediction  │   │ Assessment  │   │ Recommendation│
      │ Model       │   │ Model       │   │ Engine      │
      └─────────────┘   └─────────────┘   └─────────────┘
             │                 │                 │
             └─────────────────┼─────────────────┘
                               │
                               ▼
                    ┌──────────────────────┐
                    │     PostgreSQL       │
                    │      Database        │
                    └──────────────────────┘


# Healthcare Analysis Workflow


            Patient Symptoms
                │
                ▼
            Symptom Processing
                │
                ▼
            Disease Prediction
                │
                ├──────────────► Top Possible Conditions
                │
                ▼
            Risk Assessment
                │
                ▼
            Healthcare Recommendations
                │
                ▼
            Treatment / Advisory Suggestions
                │
                ▼
            Disease Prediction Report
                │
                ▼
            Analytics & Health Trends





🛠️ Technology Stack

    # Frontend
        React.js
        JavaScript
        Vite
        HTML5
        CSS3
        Axios
        React Router

    # Backend
        Python
        FastAPI
        REST APIs
        Pydantic
        Uvicorn

    # AI / Machine Learning
        Python
        Scikit-learn
        NumPy
        Pandas
        Machine Learning classification models
        Feature engineering
        Model evaluation

    # Database
        PostgreSQL
        SQL

    # Development Tools
        Git
        GitHub
        VS Code
        Postman
        pgAdmin
