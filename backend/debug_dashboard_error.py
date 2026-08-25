from app.main import get_patient_dashboard, get_authenticated_user
from db.connection import get_db_session
from sqlalchemy import select
from app.models import ApiToken, User

# Find a valid patient token from the DB
with get_db_session() as session:
    token_row = session.execute(select(ApiToken, User).join(User, ApiToken.user_id == User.id).where(User.role == 'patient')).first()
    if not token_row:
        raise SystemExit('No patient API token found in DB')
    api_token, user = token_row
    token = api_token.token
    print('found patient token for user', user.email, 'token', token)

with get_db_session() as session:
    try:
        result = get_patient_dashboard(authorization=f'Bearer {token}', session=session)
        print('dashboard result:', result)
    except Exception as e:
        import traceback
        traceback.print_exc()
