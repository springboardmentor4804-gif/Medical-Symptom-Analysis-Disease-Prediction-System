import os, sys
HERE = os.path.dirname(os.path.dirname(__file__))
if HERE not in sys.path:
    sys.path.insert(0, HERE)

from app.models import ApiToken
from db.connection import get_db_session
from sqlalchemy import select

with get_db_session() as s:
    tokens = s.execute(select(ApiToken)).scalars().all()
    if not tokens:
        print('No tokens found')
    for t in tokens:
        print(t.id, t.user_id, t.token, getattr(t,'created_at',None))
