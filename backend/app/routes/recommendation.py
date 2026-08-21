from fastapi import APIRouter
from pydantic import BaseModel

from app.ai.recommendation_engine import (
    generate_recommendations
)


# ============================================================
# Router
# ============================================================

router = APIRouter(
    prefix="/recommendation",
    tags=["Recommendation"]
)


# ============================================================
# Request Schema
# ============================================================

class RecommendationRequest(BaseModel):

    disease: str

    symptoms: list[str]

    risk_level: str

    severity_level: str


# ============================================================
# Generate Recommendation
# ============================================================

@router.post("")
def create_recommendation(
    request: RecommendationRequest
):

    result = generate_recommendations(

        disease=request.disease,

        symptoms=request.symptoms,

        risk_level=request.risk_level,

        severity_level=request.severity_level,
    )

    return {

        "message":
            "Recommendations generated successfully",

        "recommendation":
            result,
    }