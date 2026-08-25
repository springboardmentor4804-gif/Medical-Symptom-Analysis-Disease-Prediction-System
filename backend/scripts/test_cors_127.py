import requests
BASE='http://127.0.0.1:8000'
ORIGIN='http://127.0.0.1:5173'
print('OPTIONS')
opts = requests.options(f'{BASE}/login', headers={'Origin':ORIGIN,'Access-Control-Request-Method':'POST','Access-Control-Request-Headers':'content-type'})
print(opts.status_code)
print('allow-origin:', opts.headers.get('access-control-allow-origin'))
print('\nPOST')
resp = requests.post(f'{BASE}/login', json={'email':'test.patient@example.com','password':'badpass'}, headers={'Origin':ORIGIN})
print(resp.status_code)
print('allow-origin:', resp.headers.get('access-control-allow-origin'))
print(resp.text)
