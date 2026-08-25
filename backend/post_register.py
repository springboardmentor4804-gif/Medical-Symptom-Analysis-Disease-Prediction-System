import json, urllib.request, urllib.error
url='http://127.0.0.1:8000/register'
data={'full_name':'Frontend Test','email':'frontend.test@example.com','password':'Testpass123!','role':'patient','phone':'555-000-1111','height':167.0,'weight':39.0,'age':21,'existing_conditions':'COLD','allergies':'NO'}
req=urllib.request.Request(url, data=json.dumps(data).encode('utf-8'), headers={'Content-Type':'application/json'})
try:
    resp=urllib.request.urlopen(req, timeout=10)
    print('status', resp.status)
    print(resp.read().decode())
except urllib.error.HTTPError as e:
    print('status', e.code)
    print(e.read().decode())
except Exception as ex:
    print('error', ex)
