from fastapi import APIRouter, HTTPException
from pydantic import BaseModel, EmailStr
from typing import Optional, List
from datetime import datetime
import uuid
from app.mongo_database import user_inputs_collection, get_mongo_db

router = APIRouter(prefix="/feedback", tags=["Feedback & Queries"])


class FeedbackCreate(BaseModel):
    name: str
    email: EmailStr
    role: Optional[str] = "Guest"
    category: str  # e.g., 'General Query', 'Symptom Checker Feedback', 'Clinical Inquiry', 'Bug Report', 'Feature Suggestion'
    rating: Optional[int] = 5
    subject: str
    message: str


class FeedbackResponse(BaseModel):
    status: str
    query_id: str
    message: str
    submitted_at: str


@router.post("", response_model=FeedbackResponse)
async def submit_feedback(data: FeedbackCreate):
    """
    Submit user feedback or clinical/technical query from the home page or dashboard.
    Stores entry in MongoDB medassist database and returns a tracking confirmation ID.
    """
    query_id = f"QRY-{datetime.utcnow().strftime('%Y%m%d')}-{uuid.uuid4().hex[:6].upper()}"
    timestamp = datetime.utcnow().strftime("%Y-%m-%d %H:%M:%S UTC")

    feedback_doc = {
        "query_id": query_id,
        "name": data.name,
        "email": data.email,
        "role": data.role,
        "category": data.category,
        "rating": data.rating,
        "subject": data.subject,
        "message": data.message,
        "submitted_at": timestamp,
        "status": "Received",
    }

    # Attempt to log to MongoDB asynchronously
    try:
        db = get_mongo_db()
        await db["feedback"].insert_one(feedback_doc)
        # Mirror to user_inputs generic collection as well
        await user_inputs_collection().insert_one({
            "event_type": "feedback_query_submission",
            "query_id": query_id,
            "email": data.email,
            "category": data.category,
            "timestamp": timestamp,
        })
    except Exception as e:
        # Non-fatal log if MongoDB is offline; fallback to standard execution
        print(f"[Feedback API Warning] Could not persist to MongoDB: {e}")

    return FeedbackResponse(
        status="success",
        query_id=query_id,
        message="Thank you! Your feedback/query has been recorded successfully. Our clinical support team will review your message.",
        submitted_at=timestamp,
    )


@router.get("/list")
async def list_feedback_entries():
    """
    Fetch recent feedback and query entries stored in MongoDB.
    """
    try:
        db = get_mongo_db()
        cursor = db["feedback"].find({}, {"_id": 0}).sort("submitted_at", -1).limit(50)
        feedback_list = await cursor.to_list(length=50)
        return {"status": "success", "count": len(feedback_list), "feedback": feedback_list}
    except Exception as e:
        return {"status": "warning", "count": 0, "feedback": [], "detail": str(e)}
