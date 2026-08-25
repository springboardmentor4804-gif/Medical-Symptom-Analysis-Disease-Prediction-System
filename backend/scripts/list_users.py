import os
import sys
from sqlalchemy import select

# ensure backend folder is on sys.path
HERE = os.path.dirname(os.path.dirname(__file__))
if HERE not in sys.path:
    sys.path.insert(0, HERE)

from app.models import User
from db.connection import get_db_session

with get_db_session() as s:
    users = s.execute(select(User)).scalars().all()
    if not users:
        print('No users found')
    for u in users:
        print(u.id, getattr(u,'full_name',None), getattr(u,'email',None))
