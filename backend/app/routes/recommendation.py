from fastapi import APIRouter, Depends
from pydantic import BaseModel

from app.ai.recommendation_engine import (
    generate_recommendations
)

from app.dependencies import get_current_user


router = APIRouter(
    prefix="/recommendation",
    tags=["Recommendation"]
)


class RecommendationRequest(BaseModel):
    disease: str
    symptoms: list[str]
    risk_level: str
    severity_level: str


@router.post("")
def create_recommendation(
    request: RecommendationRequest,
    current_user=Depends(get_current_user),
):
    result = generate_recommendations(
        disease=request.disease,
        symptoms=request.symptoms,
        risk_level=request.risk_level,
        severity_level=request.severity_level,
    )

    return {
        "message": "Recommendations generated successfully",
        "recommendation": result,
    }