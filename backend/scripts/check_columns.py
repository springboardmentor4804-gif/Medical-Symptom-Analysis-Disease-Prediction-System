from db.connection import engine
from sqlalchemy import text

with engine.connect() as conn:
    res = conn.execute(text("SELECT column_name FROM information_schema.columns WHERE table_schema='medassist' AND table_name='risk_assessment'"))
    cols = [r[0] for r in res.fetchall()]
    print('risk_assessment columns:', cols)
