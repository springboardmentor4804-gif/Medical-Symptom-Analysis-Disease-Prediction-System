#!/usr/bin/env python3
"""Test script with longer timeout"""

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
    
    # Make the API call with longer timeout
    print("\nCalling /patient/risk endpoint...")
    try:
        response = requests.post(
            'http://127.0.0.1:8000/patient/risk',
            json={'notes': ''},
            headers={'Authorization': f'Bearer {token_obj.token}'},
            timeout=30  # Longer timeout
        )
        print(f"Status: {response.status_code}")
        print(f"Response:\n{json.dumps(response.json(), indent=2)}")
    except Exception as e:
        print(f"Error: {e}")
else:
    print("No patient token found with profile")

session.close()
