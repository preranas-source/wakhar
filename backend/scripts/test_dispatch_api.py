import urllib.request
import urllib.parse
import json

url = "http://localhost:8000"

# Step 1: Login
login_url = f"{url}/api/auth/login"
login_payload = {
    "phone": "+919876500001",
    "password": "123456"
}

req = urllib.request.Request(
    login_url,
    data=json.dumps(login_payload).encode('utf-8'),
    headers={"Content-Type": "application/json"}
)

try:
    with urllib.request.urlopen(req) as res:
        login_res = json.loads(res.read().decode('utf-8'))
        token = login_res["access_token"]
except Exception as e:
    print("Login failed:", e)
    exit()

# Step 2: Post dispatch
dispatch_url = f"{url}/api/dispatch-notes/"
dispatch_payload = {
    "dn_code": "DN-2026-7777",
    "lot_id": 20,
    "commodity_desc": "Onion (Grade C)",
    "quantity_desc": "40 bags / 400.00 kg",
    "destination": "Test Pune",
    "vehicle_reg": "MH-12-PQ-9080",
    "status": "created",
    "dispatch_date": "2026-06-14T05:34:15.123Z"
}

req_dispatch = urllib.request.Request(
    dispatch_url,
    data=json.dumps(dispatch_payload).encode('utf-8'),
    headers={
        "Authorization": f"Bearer {token}",
        "Content-Type": "application/json"
    }
)

try:
    with urllib.request.urlopen(req_dispatch) as res:
        print("Success:", res.read().decode('utf-8'))
except urllib.error.HTTPError as e:
    print("HTTP Error:", e.code)
    print("Response Content:", e.read().decode('utf-8'))
except Exception as e:
    print("Error:", e)
