"""
Read-only API routes for inspecting data stored in MongoDB.

Prefix : /mongo
Tags   : MongoDB

These endpoints are useful for:
  - Admin dashboards to view raw input logs
  - Debugging / verifying that data mirroring is working
  - Analytics on user-submitted data

All endpoints require admin authentication.
"""

from datetime import datetime
from typing import Any, Dict, List, Optional

from fastapi import APIRouter, Depends, HTTPException, Query, status
from app.dependencies import RoleChecker
from app.mongo_database import (
    users_collection,
    patients_collection,
    symptoms_collection,
    user_inputs_collection,
)

router = APIRouter(prefix="/mongo", tags=["MongoDB"])

# ── Helper ─────────────────────────────────────────────────────────

def _strip_id(doc: dict) -> dict:
    """Remove MongoDB's ObjectId (`_id`) field — it is not JSON-serialisable."""
    doc.pop("_id", None)
    return doc


# ── Users ──────────────────────────────────────────────────────────

@router.get("/users", summary="List all users stored in MongoDB")
async def list_mongo_users(
    limit: int = Query(50, ge=1, le=500, description="Max records to return"),
    skip: int = Query(0, ge=0, description="Number of records to skip"),
    current_user=Depends(RoleChecker(["admin"])),
) -> List[Dict[str, Any]]:
    """
    Returns all documents from the MongoDB `users` collection.
    Password hashes are included — restrict to admin role only.
    """
    cursor = users_collection().find({}, {"password_hash": 0}).skip(skip).limit(limit)
    docs = await cursor.to_list(length=limit)
    return [_strip_id(d) for d in docs]


# ── Patients ───────────────────────────────────────────────────────

@router.get("/patients", summary="List all patients stored in MongoDB")
async def list_mongo_patients(
    limit: int = Query(50, ge=1, le=500),
    skip: int = Query(0, ge=0),
    current_user=Depends(RoleChecker(["admin"])),
) -> List[Dict[str, Any]]:
    """Returns all documents from the MongoDB `patients` collection."""
    cursor = patients_collection().find({}).skip(skip).limit(limit)
    docs = await cursor.to_list(length=limit)
    return [_strip_id(d) for d in docs]


# ── Symptoms ───────────────────────────────────────────────────────

@router.get("/symptoms", summary="List all symptom submissions stored in MongoDB")
async def list_mongo_symptoms(
    limit: int = Query(50, ge=1, le=500),
    skip: int = Query(0, ge=0),
    user_email: Optional[str] = Query(None, description="Filter by user email"),
    current_user=Depends(RoleChecker(["admin"])),
) -> List[Dict[str, Any]]:
    """Returns documents from the MongoDB `symptoms` collection, optionally filtered by email."""
    query: Dict[str, Any] = {}
    if user_email:
        query["user_email"] = user_email
    cursor = symptoms_collection().find(query).sort("submitted_at", -1).skip(skip).limit(limit)
    docs = await cursor.to_list(length=limit)
    return [_strip_id(d) for d in docs]


# ── User Inputs (generic log) ──────────────────────────────────────

@router.get("/inputs", summary="List all raw user input logs from MongoDB")
async def list_mongo_inputs(
    limit: int = Query(50, ge=1, le=500),
    skip: int = Query(0, ge=0),
    input_type: Optional[str] = Query(
        None,
        description="Filter by type: 'registration' | 'patient_profile_update' | 'symptom_submission'",
    ),
    user_email: Optional[str] = Query(None, description="Filter by user email"),
    current_user=Depends(RoleChecker(["admin"])),
) -> List[Dict[str, Any]]:
    """
    Returns documents from the MongoDB `user_inputs` collection.
    This is the catch-all log of every form submission with its raw payload and timestamp.
    """
    query: Dict[str, Any] = {}
    if input_type:
        query["input_type"] = input_type
    if user_email:
        query["user_email"] = user_email
    cursor = (
        user_inputs_collection()
        .find(query)
        .sort("timestamp", -1)
        .skip(skip)
        .limit(limit)
    )
    docs = await cursor.to_list(length=limit)
    return [_strip_id(d) for d in docs]


# ── Health / Stats ─────────────────────────────────────────────────

@router.get("/stats", summary="MongoDB collection counts summary")
async def mongo_stats(
    current_user=Depends(RoleChecker(["admin"])),
) -> Dict[str, int]:
    """Returns document counts for all MongoDB collections in the medassist database."""
    users_count = await users_collection().count_documents({})
    patients_count = await patients_collection().count_documents({})
    symptoms_count = await symptoms_collection().count_documents({})
    inputs_count = await user_inputs_collection().count_documents({})
    return {
        "users": users_count,
        "patients": patients_count,
        "symptoms": symptoms_count,
        "user_inputs": inputs_count,
    }
