#!/usr/bin/env python3
"""Test script with better error handling"""

import requests
import json

# Get a valid token
from db.connection import SessionLocal
from app.models import User, ApiToken, PatientProfile
from sqlalchemy import select

session = SessionLocal()

# Find a patient with a token
result = session.execute(
    select(ApiToken, User, PatientProfile).join(
        User, ApiToken.user_id == User.id
    ).join(
        PatientProfile, PatientProfile.user_id == User.id, isouter=True
    ).where(User.role == 'patient')
).first()

if result:
    token_obj, user, profile = result
    print(f"Testing with patient: {user.email}")
    print(f"  Token: {token_obj.token[:20]}...")
    print(f"  Patient Profile: {profile}")
    
    # Make the API call
    print("\nCalling /patient/risk endpoint...")
    try:
        response = requests.post(
            'http://127.0.0.1:8000/patient/risk',
            json={'notes': ''},
            headers={'Authorization': f'Bearer {token_obj.token}'},
            timeout=5
        )
        print(f"Status: {response.status_code}")
        print(f"Headers: {dict(response.headers)}")
        print(f"Response: {response.text[:500]}")
    except Exception as e:
        print(f"Error: {e}")
else:
    print("No patient token found with profile")

session.close()
