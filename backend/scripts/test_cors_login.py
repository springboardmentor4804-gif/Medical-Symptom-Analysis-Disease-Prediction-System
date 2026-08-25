import requests

BASE = 'http://127.0.0.1:8000'
ORIGIN = 'http://127.0.0.1:5173'

print('Sending OPTIONS preflight...')
opts = requests.options(f'{BASE}/login', headers={
    'Origin': ORIGIN,
    'Access-Control-Request-Method': 'POST',
    'Access-Control-Request-Headers': 'content-type',
})
print('OPTIONS status:', opts.status_code)
print('OPTIONS headers:')
for k, v in opts.headers.items():
    print(f'{k}: {v}')

print('\nSending POST with Origin header...')
resp = requests.post(f'{BASE}/login', json={'email':'test.patient@example.com','password':'badpass'}, headers={'Origin': ORIGIN})
print('POST status:', resp.status_code)
print('POST headers:')
for k, v in resp.headers.items():
    print(f'{k}: {v}')
print('\nPOST body:')
print(resp.text)
