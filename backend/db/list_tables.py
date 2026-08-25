from db.connection import engine
from sqlalchemy import text

with engine.connect() as conn:
    rows = conn.execute(text("SELECT table_schema, table_name FROM information_schema.tables WHERE table_schema IN ('medassist','public') ORDER BY table_schema, table_name")).fetchall()
    print('Found', len(rows), 'tables:')
    for schema, name in rows:
        print(f"{schema}.{name}")
