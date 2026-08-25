from db.connection import get_database_url, engine
from sqlalchemy import text

print('DATABASE_URL=', get_database_url())
with engine.connect() as conn:
    print('search_path:')
    result = conn.execute(text("SHOW search_path"))
    print(result.scalar())
    print('\npatient_profile columns:')
    result = conn.execute(text("SELECT table_schema, table_name, column_name, data_type FROM information_schema.columns WHERE table_name='patient_profile' ORDER BY ordinal_position"))
    for row in result:
        print(row)
    print('\npatient_profile table OID:')
    result = conn.execute(text("SELECT oid FROM pg_class WHERE relname='patient_profile'"))
    print(result.fetchone())
    print('\npg_namespace schema names:')
    result = conn.execute(text("SELECT nspname FROM pg_namespace WHERE nspname IN ('medassist', 'public') ORDER BY nspname"))
    for row in result:
        print(row)
