import requests
BASE='http://127.0.0.1:8000'
# token from db/list_tokens output
token='eVZvP_114_60zKS0XrjU51bNsGjSu-FDGQ4vvS9h1wM'
headers={'Authorization':f'Bearer {token}'}
try:
    resp = requests.get(f'{BASE}/dashboard/patient', headers=headers, timeout=5)
except Exception as e:
    print('request error:', e)
    raise
print(resp.status_code)
try:
    print(resp.json())
except Exception:
    print(resp.text)
