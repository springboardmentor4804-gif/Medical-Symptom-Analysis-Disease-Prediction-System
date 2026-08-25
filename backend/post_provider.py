import requests
import uuid
from db.connection import engine
from sqlalchemy import text

data = {
    "full_name": "Frontend HCP Test",
    "email": f"hcp_{uuid.uuid4().hex[:6]}@example.com",
    "password": "Testpass123!",
    "role": "doctor",
    "phone": "1234567890",
    "hospital_name": "Vaishnai Hospital",
    "specialization": "cardiology",
    "license_number": "LIC-987654",
    "years_experience": 7,
    "qualification": "MBBS",
    "department": "Cardiology"
}

resp = requests.post("http://127.0.0.1:8000/register", json=data)
print('HTTP', resp.status_code)
try:
    print(resp.json())
except Exception:
    print(resp.text)

if resp.status_code == 200:
    user = resp.json().get('user') if isinstance(resp.json(), dict) else None
    if user is None:
        # fallback if response shape different
        user = resp.json()
    user_id = user.get('id') if isinstance(user, dict) else None
    print('created_user_id=', user_id)
    if user_id:
        with engine.connect() as conn:
            res = conn.execute(text('SELECT * FROM provider_profile WHERE user_id = :uid'), {'uid': user_id})
            rows = res.fetchall()
            for r in rows:
                print('provider_profile row:', r)
