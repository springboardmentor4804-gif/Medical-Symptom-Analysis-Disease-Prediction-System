import json
import urllib.request
import urllib.error
import os
from db.connection import engine, test_connection
from sqlalchemy import text

print('cwd=', os.getcwd())
print('python version OK')
print('db engine:', engine)
print('test_connection:', test_connection())
with engine.connect() as conn:
    result = conn.execute(text('SELECT count(*) FROM medassist.users'))
    print('users count:', result.scalar())
    result = conn.execute(text('SELECT id, email, role FROM medassist.users LIMIT 5'))
    print('users sample:')
    for row in result:
        print(' ', dict(row._mapping))

for endpoint, payload in [
    ('/login', {'email': 'testpatient@example.com', 'password': 'Testpass123'}),
    ('/register', {'full_name': 'Test Patient', 'email': 'testpatient@example.com', 'password': 'Testpass123', 'role': 'patient', 'phone': '1234567890'})
]:
    url = f'http://127.0.0.1:8001{endpoint}'
    data = json.dumps(payload).encode('utf-8')
    headers = {'Content-Type': 'application/json', 'Origin': 'http://127.0.0.1:5175'}
    print('\nREQUEST', endpoint, payload)
    req = urllib.request.Request(url, data=data, headers=headers)
    try:
        with urllib.request.urlopen(req, timeout=10) as resp:
            print('STATUS', resp.status)
            print(resp.read().decode())
    except urllib.error.HTTPError as e:
        body = e.read().decode()
        print('HTTP ERROR', e.code, body)
    except Exception as e:
        print('ERROR', type(e).__name__, e)
