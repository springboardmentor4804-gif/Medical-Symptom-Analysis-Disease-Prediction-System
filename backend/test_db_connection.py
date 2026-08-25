import psycopg
from psycopg import OperationalError

candidates = [
    ('postgres', 'root123'),
    ('postgres', 'root@123'),
    ('postgres', 'postgres'),
    ('postgres', 'password'),
    ('postgres', 'root'),
    ('postgres', '123456'),
    ('postgres', ''),
]

for user, pwd in candidates:
    try:
        conn = psycopg.connect(host='127.0.0.1', port=5432, dbname='medassist', user=user, password=pwd, connect_timeout=5)
        print('SUCCESS', user, pwd)
        conn.close()
        break
    except OperationalError as e:
        print('FAIL', user, pwd, type(e).__name__, e)
    except Exception as e:
        print('ERROR', user, pwd, type(e).__name__, e)
