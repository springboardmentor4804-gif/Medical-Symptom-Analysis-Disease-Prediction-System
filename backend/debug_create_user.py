import traceback
from app.schemas import UserCreate
from app.crud import create_user

data = {
    'full_name': 'Direct Test',
    'email': 'direct.test@example.com',
    'password': 'Testpass123!',
    'role': 'patient',
    'phone': '555-222-3333',
    'height':167.0,
    'weight':39.0,
    'age':21,
    'existing_conditions':'COLD',
    'allergies':'NO'
}
try:
    u = UserCreate(**data)
    print('UserCreate ok')
    user, token = create_user(u)
    print('created', user.id, token)
except Exception:
    traceback.print_exc()
