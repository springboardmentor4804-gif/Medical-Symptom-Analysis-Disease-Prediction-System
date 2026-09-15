import json

from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session

from app.database import get_db
from app.dependencies import get_current_user

from app.models import (
    User,
    Prediction,
    Symptom,
    DoctorPatientAssignment,
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
# Get Stored Symptoms
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
# Verify Doctor Has Access To Patient
# =========================================================

def verify_doctor_patient_access(
    doctor_id: int,
    patient_id: int,
    db: Session,
):
    assignment = (
        db.query(DoctorPatientAssignment)
        .filter(
            DoctorPatientAssignment.doctor_id == doctor_id,
            DoctorPatientAssignment.patient_id == patient_id,
        )
        .first()
    )

    if not assignment:
        raise HTTPException(
            status_code=403,
            detail="You are not assigned to this patient.",
        )

    return True


# =========================================================
# Create Manual Prediction
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

        symptoms = get_stored_symptoms(
            symptom
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

            "risk_score":
                prediction.risk_score,

            "risk_level":
                prediction.risk_level,

            "severity_score":
                prediction.severity_score,

            "severity_level":
                prediction.severity_level,

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

    # Clean symptoms

    cleaned_symptoms = [
        symptom.strip().lower()
        for symptom in request.symptoms
        if symptom
        and symptom.strip()
    ]

    if not cleaned_symptoms:

        raise HTTPException(
            status_code=400,
            detail="Please provide at least one symptom.",
        )

    # Get user

    user = get_user_from_token(
        current_user,
        db,
    )

    # Find prediction

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

    # Find symptom

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

    # Create symptom if missing

    if not symptom:

        symptom = Symptom(
            patient_id=user.id
        )

        db.add(
            symptom
        )

        db.flush()

        prediction.symptom_id = symptom.id

    # Store symptoms

    symptom.notes = json.dumps({
        "symptoms":
            cleaned_symptoms
    })

    # AI prediction

    ai_result = predict_disease(
        cleaned_symptoms
    )

    disease = ai_result["disease"]

    confidence = ai_result["confidence"]

    top_predictions = ai_result[
        "top_predictions"
    ]

    # Confidence level

    if confidence >= 90:

        confidence_level = "High"

    elif confidence >= 70:

        confidence_level = "Medium"

    else:

        confidence_level = "Low"

    # Risk

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

    # Severity

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

    # Recommendations

    recommendation_result = (
        generate_recommendations(
            disease=disease,
            symptoms=cleaned_symptoms,
            risk_level=risk_level,
            severity_level=severity_level,
        )
    )

    # Update prediction

    prediction.predicted_disease = disease

    prediction.confidence = (
        f"{confidence:.2f}"
    )

    prediction.risk_score = int(
        risk_score
    )

    prediction.risk_level = (
        risk_level
    )

    prediction.severity_score = int(
        severity_score
    )

    prediction.severity_level = (
        severity_level
    )

    prediction.recommendation = (
        recommendation_result[
            "advisory"
        ]
    )

    db.commit()

    db.refresh(
        prediction
    )

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
                2
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
            recommendation_result[
                "advisory"
            ],

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

    for key, value in update_data.items():

        setattr(
            prediction,
            key,
            value
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

    user = get_user_from_token(
        current_user,
        db,
    )

    # Clean symptoms

    cleaned_symptoms = [
        symptom.strip().lower()
        for symptom in request.symptoms
        if symptom
        and symptom.strip()
    ]

    if not cleaned_symptoms:

        raise HTTPException(
            status_code=400,
            detail="Please provide at least one symptom.",
        )

    # Store symptoms

    symptom_record = Symptom(
        patient_id=user.id,

        notes=json.dumps({
            "symptoms":
                cleaned_symptoms
        }),
    )

    db.add(
        symptom_record
    )

    db.flush()

    # Disease prediction

    ai_result = predict_disease(
        cleaned_symptoms
    )

    disease = ai_result["disease"]

    confidence = ai_result["confidence"]

    top_predictions = ai_result[
        "top_predictions"
    ]

    # Confidence

    if confidence >= 90:

        confidence_level = "High"

    elif confidence >= 70:

        confidence_level = "Medium"

    else:

        confidence_level = "Low"

    # Risk

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

    # Severity

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

    # Recommendation

    recommendation_result = (
        generate_recommendations(
            disease=disease,
            symptoms=cleaned_symptoms,
            risk_level=risk_level,
            severity_level=severity_level,
        )
    )

    # Save prediction

    prediction = Prediction(

        patient_id=user.id,

        symptom_id=symptom_record.id,

        predicted_disease=disease,

        confidence=f"{confidence:.2f}",

        risk_score=int(risk_score),

        risk_level=risk_level,

        severity_score=int(
            severity_score
        ),

        severity_level=severity_level,

        recommendation=
            recommendation_result[
                "advisory"
            ],
    )

    db.add(
        prediction
    )

    db.commit()

    db.refresh(
        prediction
    )

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
                2
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
            recommendation_result[
                "advisory"
            ],

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
            "Diabetes risk prediction generated successfully",

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
            Prediction.id == prediction_id
        )
        .first()
    )

    if not prediction:
        raise HTTPException(
            status_code=404,
            detail="Prediction not found",
        )

    # -----------------------------------------------------
    # Access Control
    # -----------------------------------------------------

    # Patient can access their own prediction
    if user.role.lower() == "patient":

        if prediction.patient_id != user.id:
            raise HTTPException(
                status_code=403,
                detail="You do not have access to this prediction.",
            )

    # Doctor can access only assigned patients
    elif user.role.lower() == "doctor":

        verify_doctor_patient_access(
            doctor_id=user.id,
            patient_id=prediction.patient_id,
            db=db,
        )

    # Everyone else is denied
    else:

        raise HTTPException(
            status_code=403,
            detail="Access denied",
        )

    # -----------------------------------------------------
    # Get Patient
    # -----------------------------------------------------

    patient = (
        db.query(User)
        .filter(
            User.id == prediction.patient_id
        )
        .first()
    )

    if not patient:
        raise HTTPException(
            status_code=404,
            detail="Patient not found",
        )

    # -----------------------------------------------------
    # Get Symptoms
    # -----------------------------------------------------

    symptom = (
        db.query(Symptom)
        .filter(
            Symptom.id == prediction.symptom_id,
            Symptom.patient_id == prediction.patient_id,
        )
        .first()
    )

    if not symptom:
        raise HTTPException(
            status_code=404,
            detail="Symptoms not found for this prediction",
        )

    cleaned_symptoms = get_stored_symptoms(
        symptom
    )

    if not cleaned_symptoms:
        raise HTTPException(
            status_code=404,
            detail="No symptoms found for this prediction",
        )

    # -----------------------------------------------------
    # AI Prediction
    # -----------------------------------------------------

    ai_result = predict_disease(
        cleaned_symptoms
    )

    disease = ai_result["disease"]

    confidence = ai_result["confidence"]

    top_predictions = ai_result[
        "top_predictions"
    ]

    # -----------------------------------------------------
    # Confidence
    # -----------------------------------------------------

    if confidence >= 90:

        confidence_level = "High"

    elif confidence >= 70:

        confidence_level = "Medium"

    else:

        confidence_level = "Low"

    # -----------------------------------------------------
    # Risk
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
    # Severity
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
    # Recommendations
    # -----------------------------------------------------

    recommendation_result = (
        generate_recommendations(
            disease=disease,
            symptoms=cleaned_symptoms,
            risk_level=risk_level,
            severity_level=severity_level,
        )
    )

    # -----------------------------------------------------
    # Disclaimer
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
    # Return Report
    # -----------------------------------------------------

    return {

        "report_id":
            prediction.id,

        "patient_id":
            prediction.patient_id,

        "generated_at":
            prediction.created_at,

        "symptoms":
            cleaned_symptoms,

        "patient": {

            "id":
                patient.id,

            "full_name":
                patient.full_name,

            "email":
                patient.email,

        },

        "prediction": {

            "disease":
                disease,

            "confidence":
                round(
                    confidence,
                    2
                ),

            "confidence_level":
                confidence_level,

        },

        "top_predictions":
            top_predictions,

        "risk_assessment": {

            "score":
                risk_score,

            "level":
                risk_level,

            "factors":
                risk_factors,

        },

        "severity_analysis": {

            "score":
                severity_score,

            "level":
                severity_level,

            "factors":
                severity_factors,

        },

        "recommendation":
            recommendation_result[
                "advisory"
            ],

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

        "disclaimer":
            disclaimer,
    }