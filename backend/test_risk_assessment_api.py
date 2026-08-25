#!/usr/bin/env python3
"""Test script to debug risk assessment API"""

import requests
import json

# Test 1: Check if backend is running
print("=" * 60)
print("TEST 1: Checking if backend is running...")
print("=" * 60)
try:
    response = requests.get('http://127.0.0.1:8000/docs', timeout=5)
    print(f"✓ Backend is running (status: {response.status_code})")
except Exception as e:
    print(f"✗ Backend error: {e}")
    exit(1)

# Test 2: Try to call risk assessment without token
print("\n" + "=" * 60)
print("TEST 2: Call /patient/risk without token...")
print("=" * 60)
try:
    response = requests.post(
        'http://127.0.0.1:8000/patient/risk',
        json={'notes': 'test'},
        timeout=5
    )
    print(f"Status: {response.status_code}")
    print(f"Response: {response.text}")
except Exception as e:
    print(f"Request error: {e}")

# Test 3: Get a list of users to find a valid token
print("\n" + "=" * 60)
print("TEST 3: Checking database connection and users...")
print("=" * 60)
try:
    from db.connection import SessionLocal
    session = SessionLocal()
    from app.models import User, ApiToken
    from sqlalchemy import select
    
    users = session.execute(select(User)).scalars().all()
    print(f"Found {len(users)} users in database")
    
    for user in users[:5]:  # Show first 5
        print(f"  - ID: {user.id}, Email: {user.email}, Role: {user.role}")
    
    tokens = session.execute(select(ApiToken)).scalars().all()
    print(f"Found {len(tokens)} API tokens in database")
    
    if tokens:
        test_token = tokens[0].token
        test_user_id = tokens[0].user_id
        user = session.execute(select(User).where(User.id == test_user_id)).scalar()
        print(f"\nUsing token for user: {user.email} (role: {user.role})")
        
        # Test 4: Call risk assessment with a valid token
        print("\n" + "=" * 60)
        print("TEST 4: Call /patient/risk with valid token...")
        print("=" * 60)
        try:
            response = requests.post(
                'http://127.0.0.1:8000/patient/risk',
                json={'notes': 'test risk assessment'},
                headers={'Authorization': f'Bearer {test_token}'},
                timeout=5
            )
            print(f"Status: {response.status_code}")
            print(f"Response:\n{json.dumps(response.json(), indent=2)}")
        except Exception as e:
            print(f"Request error: {e}")
            print(f"Response text: {response.text if 'response' in locals() else 'N/A'}")
    
    session.close()
except Exception as e:
    print(f"Error: {e}")
    import traceback
    traceback.print_exc()

print("\n" + "=" * 60)
print("Testing complete")
print("=" * 60)
