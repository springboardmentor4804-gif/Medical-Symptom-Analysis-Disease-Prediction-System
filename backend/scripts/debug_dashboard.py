from db.connection import SessionLocal
from app.main import get_patient_dashboard, get_authenticated_user
import traceback

session = SessionLocal()
try:
    token = 'GaJmcO911Vsuo4blMLrNxAWVqXh6hFLKhE-CogC-5x0'
    user = get_authenticated_user(token, session)
    print('Authenticated user:', user.id, user.email, user.role)
    result = get_patient_dashboard(authorization=f'Bearer {token}', session=session)
    print('Result:', result)
except Exception:
    traceback.print_exc()
finally:
    session.close()
