import json

from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session

from app.database import get_db
from app.dependencies import get_current_user

from app.models import (
    User,
    Prediction,
    Symptom,
)

from app.schemas import (
    PredictionCreate,
    PredictionUpdate,
    PredictionResponse,
    AIPredictionRequest,
    AIPredictionUpdateRequest,
)

from app.ai.predict import predict_disease
from app.ai.diabetes_predict import predict_diabetes
from app.ai.risk_engine import calculate_risk
from app.ai.severity_engine import calculate_severity
from app.ai.recommendation_engine import generate_recommendations


# =========================================================
# Router
# =========================================================

router = APIRouter(
    prefix="/prediction",
    tags=["Prediction"],
)


# =========================================================
# Get Stored ML Symptoms
# =========================================================

def get_stored_symptoms(
    symptom: Symptom | None,
) -> list[str]:

    if not symptom:
        return []

    if not symptom.notes:
        return []

    try:

        data = json.loads(
            symptom.notes
        )

        symptoms = data.get(
            "symptoms",
            []
        )

        if isinstance(
            symptoms,
            list
        ):
            return symptoms

    except (
        json.JSONDecodeError,
        TypeError,
    ):
        pass

    return []


# =========================================================
# Get Logged-In User
# =========================================================

def get_user_from_token(
    current_user,
    db: Session,
):

    user = (
        db.query(User)
        .filter(
            User.email
            == current_user["sub"]
        )
        .first()
    )

    if not user:

        raise HTTPException(
            status_code=404,
            detail="User not found",
        )

    return user


# =========================================================
# Create Prediction - Manual
# =========================================================

@router.post(
    "/",
    response_model=PredictionResponse,
)
def create_prediction(
    prediction: PredictionCreate,
    current_user=Depends(
        get_current_user
    ),
    db: Session = Depends(
        get_db
    ),
):

    user = get_user_from_token(
        current_user,
        db,
    )

    new_prediction = Prediction(
        patient_id=user.id,
        **prediction.model_dump(),
    )

    db.add(
        new_prediction
    )

    db.commit()

    db.refresh(
        new_prediction
    )

    return new_prediction


# =========================================================
# Latest Prediction
# =========================================================

@router.get(
    "/",
    response_model=PredictionResponse,
)
def get_latest_prediction(
    current_user=Depends(
        get_current_user
    ),
    db: Session = Depends(
        get_db
    ),
):

    user = get_user_from_token(
        current_user,
        db,
    )

    prediction = (
        db.query(Prediction)
        .filter(
            Prediction.patient_id
            == user.id
        )
        .order_by(
            Prediction.created_at.desc()
        )
        .first()
    )

    if not prediction:

        raise HTTPException(
            status_code=404,
            detail="No prediction found",
        )

    return prediction


# =========================================================
# Prediction History
# =========================================================

@router.get(
    "/history"
)
def prediction_history(
    current_user=Depends(
        get_current_user
    ),
    db: Session = Depends(
        get_db
    ),
):

    user = get_user_from_token(
        current_user,
        db,
    )

    predictions = (
        db.query(Prediction)
        .filter(
            Prediction.patient_id
            == user.id
        )
        .order_by(
            Prediction.created_at.desc()
        )
        .all()
    )

    result = []

    for prediction in predictions:

        symptoms = get_stored_symptoms(
            prediction.symptom
        )

        result.append({

            "id":
                prediction.id,

            "patient_id":
                prediction.patient_id,

            "symptom_id":
                prediction.symptom_id,

            "predicted_disease":
                prediction.predicted_disease,

            "confidence":
                prediction.confidence,

            "risk_level":
                prediction.risk_level,

            "recommendation":
                prediction.recommendation,

            "symptoms":
                symptoms,

            "created_at":
                prediction.created_at,
        })

    return result


# =========================================================
# Update AI Prediction
# =========================================================

@router.put(
    "/{prediction_id}/ai"
)
def update_ai_prediction(
    prediction_id: int,
    request: AIPredictionUpdateRequest,
    current_user=Depends(
        get_current_user
    ),
    db: Session = Depends(
        get_db
    ),
):

    # -----------------------------------------------------
    # Clean Symptoms
    # -----------------------------------------------------

    cleaned_symptoms = [
        symptom.strip().lower()
        for symptom in request.symptoms
        if symptom
        and symptom.strip()
    ]

    if not cleaned_symptoms:

        raise HTTPException(
            status_code=400,
            detail=(
                "Please provide at least "
                "one symptom."
            ),
        )

    # -----------------------------------------------------
    # Logged-In User
    # -----------------------------------------------------

    user = get_user_from_token(
        current_user,
        db,
    )

    # -----------------------------------------------------
    # Find Prediction
    # -----------------------------------------------------

    prediction = (
        db.query(Prediction)
        .filter(
            Prediction.id
            == prediction_id,

            Prediction.patient_id
            == user.id,
        )
        .first()
    )

    if not prediction:

        raise HTTPException(
            status_code=404,
            detail="Prediction not found",
        )

    # -----------------------------------------------------
    # Find Linked Symptom Record
    # -----------------------------------------------------

    symptom = (
        db.query(Symptom)
        .filter(
            Symptom.id
            == prediction.symptom_id,

            Symptom.patient_id
            == user.id,
        )
        .first()
    )

    # -----------------------------------------------------
    # Create Symptom Record If Missing
    # -----------------------------------------------------

    if not symptom:

        symptom = Symptom(
            patient_id=user.id
        )

        db.add(
            symptom
        )

        db.flush()

        prediction.symptom_id = (
            symptom.id
        )

    # -----------------------------------------------------
    # Store ML Symptoms
    # -----------------------------------------------------

    symptom.notes = json.dumps({
        "symptoms":
            cleaned_symptoms
    })

    # -----------------------------------------------------
    # Run Disease Prediction Again
    # -----------------------------------------------------

    ai_result = predict_disease(
        cleaned_symptoms
    )

    disease = ai_result[
        "disease"
    ]

    confidence = ai_result[
        "confidence"
    ]

    top_predictions = ai_result[
        "top_predictions"
    ]

    # -----------------------------------------------------
    # ML Confidence Level
    # -----------------------------------------------------

    if confidence >= 90:

        confidence_level = "High"

    elif confidence >= 70:

        confidence_level = "Medium"

    else:

        confidence_level = "Low"

    # -----------------------------------------------------
    # Risk Scoring
    # -----------------------------------------------------

    risk_result = calculate_risk(
        symptoms=cleaned_symptoms,
        confidence=confidence,
    )

    risk_score = risk_result[
        "risk_score"
    ]

    risk_level = risk_result[
        "risk_level"
    ]

    risk_factors = risk_result[
        "risk_factors"
    ]

    # -----------------------------------------------------
    # Severity Analysis
    # -----------------------------------------------------

    severity_result = calculate_severity(
        symptoms=cleaned_symptoms
    )

    severity_score = (
        severity_result["severity_score"]
    )

    severity_level = (
        severity_result["severity_level"]
    )

    severity_factors = (
        severity_result["severity_factors"]
    )

    # -----------------------------------------------------
    # Healthcare Recommendation Engine
    # -----------------------------------------------------

    recommendation_result = generate_recommendations(
        disease=disease,
        symptoms=cleaned_symptoms,
        risk_level=risk_level,
        severity_level=severity_level,
    )

    # -----------------------------------------------------
    # Update Database
    # -----------------------------------------------------

    prediction.predicted_disease = (
        disease
    )

    prediction.confidence = (
        f"{confidence:.2f}"
    )

    prediction.risk_level = (
        risk_level
    )

    prediction.recommendation = (
        recommendation_result["advisory"]
    )

    # -----------------------------------------------------
    # Commit
    # -----------------------------------------------------

    db.commit()

    db.refresh(
        prediction
    )

    # -----------------------------------------------------
    # Response
    # -----------------------------------------------------

    return {

        "message":
            "AI prediction updated successfully",

        "prediction_id":
            prediction.id,

        "disease":
            disease,

        "confidence":
            round(
                confidence,
                2,
            ),

        "confidence_level":
            confidence_level,

        "risk_score":
            risk_score,

        "risk_level":
            risk_level,

        "risk_factors":
            risk_factors,

        "severity_score":
            severity_score,

        "severity_level":
            severity_level,

        "severity_factors":
            severity_factors,

        "recommendation":
            recommendation_result["advisory"],

        "recommendations": {

            "treatment_suggestions":
                recommendation_result[
                    "treatment_suggestions"
                ],

            "preventive_advice":
                recommendation_result[
                    "preventive_advice"
                ],

            "lifestyle_advice":
                recommendation_result[
                    "lifestyle_advice"
                ],

            "warning_signs":
                recommendation_result[
                    "warning_signs"
                ],

            "advisory":
                recommendation_result[
                    "advisory"
                ],
        },

        "top_predictions":
            top_predictions,

        "symptoms":
            cleaned_symptoms,

        "created_at":
            prediction.created_at,
    }


# =========================================================
# Update Manual Prediction
# =========================================================

@router.put(
    "/{prediction_id}",
    response_model=PredictionResponse,
)
def update_prediction(
    prediction_id: int,
    prediction_data: PredictionUpdate,
    current_user=Depends(
        get_current_user
    ),
    db: Session = Depends(
        get_db
    ),
):

    user = get_user_from_token(
        current_user,
        db,
    )

    prediction = (
        db.query(Prediction)
        .filter(
            Prediction.id
            == prediction_id,

            Prediction.patient_id
            == user.id,
        )
        .first()
    )

    if not prediction:

        raise HTTPException(
            status_code=404,
            detail="Prediction not found",
        )

    update_data = (
        prediction_data.model_dump(
            exclude_unset=True
        )
    )

    for key, value in (
        update_data.items()
    ):

        setattr(
            prediction,
            key,
            value,
        )

    db.commit()

    db.refresh(
        prediction
    )

    return prediction


# =========================================================
# Delete Prediction
# =========================================================

@router.delete(
    "/{prediction_id}"
)
def delete_prediction(
    prediction_id: int,
    current_user=Depends(
        get_current_user
    ),
    db: Session = Depends(
        get_db
    ),
):

    user = get_user_from_token(
        current_user,
        db,
    )

    prediction = (
        db.query(Prediction)
        .filter(
            Prediction.id
            == prediction_id,

            Prediction.patient_id
            == user.id,
        )
        .first()
    )

    if not prediction:

        raise HTTPException(
            status_code=404,
            detail="Prediction not found",
        )

    db.delete(
        prediction
    )

    db.commit()

    return {
        "message":
            "Prediction deleted successfully"
    }


# =========================================================
# AI Disease Prediction
# =========================================================

@router.post(
    "/ai"
)
def ai_prediction(
    request: AIPredictionRequest,
    current_user=Depends(
        get_current_user
    ),
    db: Session = Depends(
        get_db
    ),
):

    # -----------------------------------------------------
    # Logged-In User
    # -----------------------------------------------------

    user = get_user_from_token(
        current_user,
        db,
    )

    # -----------------------------------------------------
    # Clean Symptoms
    # -----------------------------------------------------

    cleaned_symptoms = [
        symptom.strip().lower()
        for symptom in request.symptoms
        if symptom
        and symptom.strip()
    ]

    if not cleaned_symptoms:

        raise HTTPException(
            status_code=400,
            detail=(
                "Please provide at least "
                "one symptom."
            ),
        )

    # -----------------------------------------------------
    # Store Symptoms
    # -----------------------------------------------------

    symptom_record = Symptom(
        patient_id=user.id,

        notes=json.dumps({
            "symptoms": cleaned_symptoms
        }),
    )

    db.add(
        symptom_record
    )

    db.flush()

    # -----------------------------------------------------
    # AI Disease Prediction
    # -----------------------------------------------------

    ai_result = predict_disease(
        cleaned_symptoms
    )

    disease = ai_result[
        "disease"
    ]

    confidence = ai_result[
        "confidence"
    ]

    top_predictions = ai_result[
        "top_predictions"
    ]

    # -----------------------------------------------------
    # ML Confidence Level
    # -----------------------------------------------------

    if confidence >= 90:

        confidence_level = "High"

    elif confidence >= 70:

        confidence_level = "Medium"

    else:

        confidence_level = "Low"

    # -----------------------------------------------------
    # Risk Scoring Engine
    # -----------------------------------------------------

    risk_result = calculate_risk(
        symptoms=cleaned_symptoms,
        confidence=confidence,
    )

    risk_score = risk_result[
        "risk_score"
    ]

    risk_level = risk_result[
        "risk_level"
    ]

    risk_factors = risk_result[
        "risk_factors"
    ]

    # -----------------------------------------------------
    # Severity Analysis Engine
    # -----------------------------------------------------

    severity_result = calculate_severity(
        symptoms=cleaned_symptoms
    )

    severity_score = severity_result[
        "severity_score"
    ]

    severity_level = severity_result[
        "severity_level"
    ]

    severity_factors = severity_result[
        "severity_factors"
    ]

    # -----------------------------------------------------
    # Healthcare Recommendation Engine
    # -----------------------------------------------------

    recommendation_result = generate_recommendations(
        disease=disease,
        symptoms=cleaned_symptoms,
        risk_level=risk_level,
        severity_level=severity_level,
    )

    # -----------------------------------------------------
    # Save Prediction
    # -----------------------------------------------------

    prediction = Prediction(

        patient_id=user.id,

        symptom_id=
            symptom_record.id,

        predicted_disease=
            disease,

        confidence=
            f"{confidence:.2f}",

        risk_level=
            risk_level,

        recommendation=(
            recommendation_result["advisory"]
        ),
    )

    db.add(
        prediction
    )

    db.commit()

    db.refresh(
        prediction
    )

    # -----------------------------------------------------
    # Response
    # -----------------------------------------------------

    return {

        "message":
            "Prediction generated successfully",

        "prediction_id":
            prediction.id,

        "disease":
            disease,

        "confidence":
            round(
                confidence,
                2,
            ),

        "confidence_level":
            confidence_level,

        "risk_score":
            risk_score,

        "risk_level":
            risk_level,

        "risk_factors":
            risk_factors,

        "severity_score":
            severity_score,

        "severity_level":
            severity_level,

        "severity_factors":
            severity_factors,

        "recommendation":
            recommendation_result["advisory"],

        "recommendations": {

            "treatment_suggestions":
                recommendation_result[
                    "treatment_suggestions"
                ],

            "preventive_advice":
                recommendation_result[
                    "preventive_advice"
                ],

            "lifestyle_advice":
                recommendation_result[
                    "lifestyle_advice"
                ],

            "warning_signs":
                recommendation_result[
                    "warning_signs"
                ],

            "advisory":
                recommendation_result[
                    "advisory"
                ],
        },

        "top_predictions":
            top_predictions,

        "symptoms":
            cleaned_symptoms,

        "created_at":
            prediction.created_at,
    }


# =========================================================
# Diabetes Risk Prediction
# =========================================================

@router.post(
    "/diabetes"
)
def diabetes_prediction(
    data: dict,
    current_user=Depends(
        get_current_user
    ),
):

    result = predict_diabetes(
        data
    )

    return {

        "message":
            "Diabetes risk prediction "
            "generated successfully",

        **result,

    }


# =========================================================
# Health Risk Report
# =========================================================

@router.get(
    "/{prediction_id}/health-report"
)
def get_health_risk_report(
    prediction_id: int,
    current_user=Depends(
        get_current_user
    ),
    db: Session = Depends(
        get_db
    ),
):

    # -----------------------------------------------------
    # Logged-In User
    # -----------------------------------------------------

    user = get_user_from_token(
        current_user,
        db,
    )

    # -----------------------------------------------------
    # Find Prediction
    # -----------------------------------------------------

    prediction = (
        db.query(Prediction)
        .filter(
            Prediction.id == prediction_id,
            Prediction.patient_id == user.id,
        )
        .first()
    )

    if not prediction:

        raise HTTPException(
            status_code=404,
            detail="Prediction not found",
        )

    # -----------------------------------------------------
    # Find Linked Symptoms
    # -----------------------------------------------------

    symptom = (
        db.query(Symptom)
        .filter(
            Symptom.id == prediction.symptom_id,
            Symptom.patient_id == user.id,
        )
        .first()
    )

    if not symptom:

        raise HTTPException(
            status_code=404,
            detail="Symptoms not found for this prediction",
        )

    # -----------------------------------------------------
    # Get Stored Symptoms
    # -----------------------------------------------------

    cleaned_symptoms = get_stored_symptoms(
        symptom
    )

    if not cleaned_symptoms:

        raise HTTPException(
            status_code=404,
            detail="No symptoms found for this prediction",
        )

    # -----------------------------------------------------
    # Run Disease Prediction
    # -----------------------------------------------------

    ai_result = predict_disease(
        cleaned_symptoms
    )

    disease = ai_result[
        "disease"
    ]

    confidence = ai_result[
        "confidence"
    ]

    top_predictions = ai_result[
        "top_predictions"
    ]

    # -----------------------------------------------------
    # Confidence Level
    # -----------------------------------------------------

    if confidence >= 90:

        confidence_level = "High"

    elif confidence >= 70:

        confidence_level = "Medium"

    else:

        confidence_level = "Low"

    # -----------------------------------------------------
    # Risk Assessment
    # -----------------------------------------------------

    risk_result = calculate_risk(
        symptoms=cleaned_symptoms,
        confidence=confidence,
    )

    risk_score = risk_result[
        "risk_score"
    ]

    risk_level = risk_result[
        "risk_level"
    ]

    risk_factors = risk_result[
        "risk_factors"
    ]

    # -----------------------------------------------------
    # Severity Analysis
    # -----------------------------------------------------

    severity_result = calculate_severity(
        symptoms=cleaned_symptoms
    )

    severity_score = severity_result[
        "severity_score"
    ]

    severity_level = severity_result[
        "severity_level"
    ]

    severity_factors = severity_result[
        "severity_factors"
    ]

    # -----------------------------------------------------
    # Recommendation
    # -----------------------------------------------------

    recommendation_result = generate_recommendations(
        disease=disease,
        symptoms=cleaned_symptoms,
        risk_level=risk_level,
        severity_level=severity_level,
    )

    # -----------------------------------------------------
    # Medical Disclaimer
    # -----------------------------------------------------

    disclaimer = (
        "This AI-generated report is for "
        "informational purposes only and is "
        "not a medical diagnosis. Please "
        "consult a qualified healthcare "
        "professional for proper evaluation "
        "and treatment."
    )

    # -----------------------------------------------------
    # Health Risk Report
    # -----------------------------------------------------

    return {

        "report_id":
            prediction.id,

        "patient_id":
            user.id,

        "generated_at":
            prediction.created_at,

        "symptoms":
            cleaned_symptoms,

        # -------------------------------------------------
        # Disease Prediction
        # -------------------------------------------------

        "prediction": {

            "disease":
                disease,

            "confidence":
                round(
                    confidence,
                    2,
                ),

            "confidence_level":
                confidence_level,
        },

        # -------------------------------------------------
        # Top Predictions
        # -------------------------------------------------

        "top_predictions":
            top_predictions,

        # -------------------------------------------------
        # Risk Assessment
        # -------------------------------------------------

        "risk_assessment": {

            "score":
                risk_score,

            "level":
                risk_level,

            "factors":
                risk_factors,
        },

        # -------------------------------------------------
        # Severity Analysis
        # -------------------------------------------------

        "severity_analysis": {

            "score":
                severity_score,

            "level":
                severity_level,

            "factors":
                severity_factors,
        },

        # -------------------------------------------------
        # Recommendation
        # -------------------------------------------------

        "recommendation":
            recommendation_result["advisory"],

        "recommendations": {

            "treatment_suggestions":
                recommendation_result[
                    "treatment_suggestions"
                ],

            "preventive_advice":
                recommendation_result[
                    "preventive_advice"
                ],

            "lifestyle_advice":
                recommendation_result[
                    "lifestyle_advice"
                ],

            "warning_signs":
                recommendation_result[
                    "warning_signs"
                ],

            "advisory":
                recommendation_result[
                    "advisory"
                ],
        },

        # -------------------------------------------------
        # Disclaimer
        # -------------------------------------------------

        "disclaimer":
            disclaimer,
    }