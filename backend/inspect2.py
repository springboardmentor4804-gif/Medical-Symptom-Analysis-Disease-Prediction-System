from db.connection import engine
from sqlalchemy import text
with engine.connect() as conn:
    r=conn.execute(text('SHOW search_path'))
    print('search_path=', r.scalar())
    r=conn.execute(text("SELECT table_schema, column_name FROM information_schema.columns WHERE table_name='patient_profile' ORDER BY table_schema, ordinal_position"))
    print('\ncolumns:')
    for row in r:
        print(row)
