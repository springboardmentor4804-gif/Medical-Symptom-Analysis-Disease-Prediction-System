import json
import urllib.request
import urllib.error

BASE = 'http://127.0.0.1:8001'
HEADERS = {'Content-Type': 'application/json', 'Origin': 'http://127.0.0.1:5175'}

user = {'full_name':'Test Dashboard','email':'dashboard.test@example.com','password':'Testpass123!','role':'patient','phone':'1234567890'}
print('REGISTER', user['email'])
req = urllib.request.Request(f'{BASE}/register', data=json.dumps(user).encode('utf-8'), headers=HEADERS)
try:
    with urllib.request.urlopen(req, timeout=10) as resp:
        body = resp.read().decode()
        print('REGISTER OK', resp.status, body)
except urllib.error.HTTPError as e:
    print('REGISTER ERROR', e.code, e.read().decode())
except Exception as e:
    print('REGISTER ERROR', type(e).__name__, e)

login_payload = {'email': user['email'], 'password': user['password']}
print('\nLOGIN', login_payload)
req = urllib.request.Request(f'{BASE}/login', data=json.dumps(login_payload).encode('utf-8'), headers=HEADERS)
try:
    with urllib.request.urlopen(req, timeout=10) as resp:
        body = json.loads(resp.read().decode())
        print('LOGIN OK', resp.status, body)
        token = body.get('token')
except urllib.error.HTTPError as e:
    print('LOGIN ERROR', e.code, e.read().decode())
    token = None
except Exception as e:
    print('LOGIN ERROR', type(e).__name__, e)
    token = None

if token:
    print('\nDASHBOARD')
    headers = {'Content-Type': 'application/json', 'Origin': 'http://127.0.0.1:5175', 'Authorization': f'Bearer {token}'}
    req = urllib.request.Request(f'{BASE}/dashboard/patient', headers=headers)
    try:
        with urllib.request.urlopen(req, timeout=10) as resp:
            body = resp.read().decode()
            print('DASHBOARD OK', resp.status, body)
    except urllib.error.HTTPError as e:
        print('DASHBOARD ERROR', e.code, e.read().decode())
    except Exception as e:
        print('DASHBOARD ERROR', type(e).__name__, e)
