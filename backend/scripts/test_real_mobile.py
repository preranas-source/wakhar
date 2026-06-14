import urllib.request
import urllib.parse
import json
import random

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

# Step 2: Fetch Lot 21
lot_url = f"{url}/api/lots/21"
req_get = urllib.request.Request(
    lot_url,
    headers={"Authorization": f"Bearer {token}"}
)

try:
    with urllib.request.urlopen(req_get) as res:
        lot = json.loads(res.read().decode('utf-8'))
        print("Fetched Lot 21:", lot)
except Exception as e:
    print("Fetch lot failed:", e)
    exit()

# Step 3: Create Dispatch Note for Lot 21
dn_code = f"DN-2026-{random.randint(1000, 9999)}"
dispatch_payload = {
    "dn_code": dn_code,
    "lot_id": 21,
    "commodity_desc": "Wheat (Lokwan)",
    "quantity_desc": "2 bags / 100 kg",
    "destination": "Test Pune",
    "vehicle_reg": "MH-12-PQ-9080",
    "traccar_device_id": None,
    "e_way_bill_no": None,
    "status": "created",
    "dispatch_date": "2026-06-14T05:40:00.000Z"
}

dispatch_url = f"{url}/api/dispatch-notes/"
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
        print("Success POST:", res.read().decode('utf-8'))
except urllib.error.HTTPError as e:
    print("HTTP Error POST:", e.code)
    print("Response Content POST:", e.read().decode('utf-8'))
    exit()
except Exception as e:
    print("Error POST:", e)
    exit()

# Step 4: PUT Lot 21 back with status: in_transit
lot_update = lot.copy()
lot_update["status"] = "in_transit"

req_put = urllib.request.Request(
    lot_url,
    data=json.dumps(lot_update).encode('utf-8'),
    headers={
        "Authorization": f"Bearer {token}",
        "Content-Type": "application/json"
    },
    method="PUT"
)

try:
    with urllib.request.urlopen(req_put) as res:
        print("Success PUT:", res.read().decode('utf-8'))
except urllib.error.HTTPError as e:
    print("HTTP Error PUT:", e.code)
    print("Response Content PUT:", e.read().decode('utf-8'))
except Exception as e:
    print("Error PUT:", e)
