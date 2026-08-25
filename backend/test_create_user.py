import traceback
from app.schemas import UserCreate
from app.crud import create_user

data = {
    'full_name': 'Test User',
    'email': 'testuser2@example.com',
    'password': 'Testpass123!',
    'role': 'patient',
    'phone': '555-123-4567',
    'dob': '1990-01-01',
    'gender': 'female',
    'blood_group': 'O+',
    'height': 170.0,
    'weight': 65.5,
    'age': 30,
    'emergency_contact': '555-987-6543',
    'existing_conditions': 'none',
    'allergies': 'none'
}

try:
    u = UserCreate(**data)
    print('UserCreate ok:', u)
    user, token = create_user(u)
    print('created', user.id, token)
except Exception:
    traceback.print_exc()
