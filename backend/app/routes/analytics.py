from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session

from app.database import get_db
from app.dependencies import get_current_user
from app.models import User, Prediction, Symptom

router = APIRouter(
    prefix="/analytics",
    tags=["Analytics"]
)


# ============================================
# Risk Score
# ============================================

def calculate_risk_score(risk_level: str) -> int:

    scores = {
        "Low": 20,
        "Moderate": 50,
        "Medium": 50,
        "High": 75,
        "Critical": 100,
    }

    return scores.get(
        risk_level,
        0
    )


# ============================================
# Severity Score
# ============================================

def calculate_severity_score(
    symptom: Symptom | None
) -> int:

    if not symptom:
        return 0

    score = 0

    if symptom.chest_pain:
        score += 25

    if symptom.shortness_of_breath:
        score += 25

    if symptom.fever:
        score += 10

    if symptom.cough:
        score += 5

    if symptom.headache:
        score += 5

    if symptom.fatigue:
        score += 5

    if symptom.heart_rate:
        score += 5

    if symptom.blood_pressure:
        score += 5

    if symptom.blood_sugar:
        score += 5

    if symptom.temperature:
        score += 5

    return min(score, 100)


# ============================================
# Symptom Distribution
# ============================================

def get_symptom_distribution(
    symptoms
):

    symptom_counts = {}

    symptom_fields = [
        "fever",
        "cough",
        "headache",
        "fatigue",
        "chest_pain",
        "shortness_of_breath",
        "blood_pressure",
        "heart_rate",
        "blood_sugar",
        "temperature",
    ]

    for symptom in symptoms:

        for field in symptom_fields:

            value = getattr(
                symptom,
                field,
                None
            )

            if value:

                symptom_name = (
                    field
                    .replace("_", " ")
                    .title()
                )

                symptom_counts[symptom_name] = (
                    symptom_counts.get(
                        symptom_name,
                        0
                    ) + 1
                )

    return [
        {
            "symptom": symptom,
            "count": count
        }

        for symptom, count
        in symptom_counts.items()
    ]


# ============================================
# Analytics Summary
# ============================================

@router.get("/summary")
def analytics_summary(
    current_user=Depends(get_current_user),
    db: Session = Depends(get_db),
):

    # ----------------------------------------
    # Get user
    # ----------------------------------------

    user = db.query(User).filter(
        User.email == current_user["sub"]
    ).first()

    if not user:

        raise HTTPException(
            status_code=404,
            detail="User not found"
        )


    # ----------------------------------------
    # Get predictions
    # ----------------------------------------

    predictions = (
        db.query(Prediction)
        .filter(
            Prediction.patient_id == user.id
        )
        .order_by(
            Prediction.created_at.asc()
        )
        .all()
    )


    # ----------------------------------------
    # Get symptoms
    # ----------------------------------------

    symptoms = (
        db.query(Symptom)
        .filter(
            Symptom.patient_id == user.id
        )
        .all()
    )


    # ----------------------------------------
    # Basic statistics
    # ----------------------------------------

    total_predictions = len(
        predictions
    )

    high_risk_count = 0

    critical_risk_count = 0


    # ----------------------------------------
    # Distribution dictionaries
    # ----------------------------------------

    disease_counts = {}

    risk_counts = {}


    # ----------------------------------------
    # Trend data
    # ----------------------------------------

    health_trends = []

    risk_scores = []

    severity_scores = []


    # ----------------------------------------
    # Process predictions
    # ----------------------------------------

    for prediction in predictions:

        disease = (
            prediction.predicted_disease
            or "Unknown"
        )

        risk_level = (
            prediction.risk_level
            or "Low"
        )


        # Disease count

        disease_counts[disease] = (
            disease_counts.get(
                disease,
                0
            ) + 1
        )


        # Risk count

        risk_counts[risk_level] = (
            risk_counts.get(
                risk_level,
                0
            ) + 1
        )


        # High risk

        if risk_level == "High":

            high_risk_count += 1


        # Critical risk

        if risk_level == "Critical":

            critical_risk_count += 1


        # ------------------------------------
        # Calculate risk score
        # ------------------------------------

        risk_score = calculate_risk_score(
            risk_level
        )


        # ------------------------------------
        # Calculate severity
        # ------------------------------------

        severity_score = (
            calculate_severity_score(
                prediction.symptom
            )
        )


        risk_scores.append(
            risk_score
        )

        severity_scores.append(
            severity_score
        )


        # ------------------------------------
        # Trend
        # ------------------------------------

        health_trends.append({

            "date": (
                prediction.created_at.isoformat()
                if prediction.created_at
                else None
            ),

            "disease": disease,

            "risk_score": risk_score,

            "severity_score":
                severity_score,

        })


    # ----------------------------------------
    # Most predicted disease
    # ----------------------------------------

    most_predicted_disease = None

    if disease_counts:

        most_predicted_disease = max(
            disease_counts,
            key=disease_counts.get
        )


    # ----------------------------------------
    # Average risk
    # ----------------------------------------

    average_risk_score = (

        sum(risk_scores)
        / len(risk_scores)

        if risk_scores

        else 0
    )


    # ----------------------------------------
    # Average severity
    # ----------------------------------------

    average_severity_score = (

        sum(severity_scores)
        / len(severity_scores)

        if severity_scores

        else 0
    )


    # ----------------------------------------
    # Symptom distribution
    # ----------------------------------------

    symptom_distribution = (
        get_symptom_distribution(
            symptoms
        )
    )


    # ----------------------------------------
    # Final response
    # ----------------------------------------

    return {

        "total_predictions":
            total_predictions,

        "high_risk_count":
            high_risk_count,

        "critical_risk_count":
            critical_risk_count,

        "most_predicted_disease":
            most_predicted_disease,

        "average_risk_score":
            round(
                average_risk_score,
                2
            ),

        "average_severity_score":
            round(
                average_severity_score,
                2
            ),

        "disease_distribution": [

            {
                "disease": disease,
                "count": count
            }

            for disease, count
            in disease_counts.items()

        ],

        "risk_distribution": [

            {
                "level": level,
                "count": count
            }

            for level, count
            in risk_counts.items()

        ],

        "symptom_distribution":
            symptom_distribution,

        "health_trends":
            health_trends,

    }