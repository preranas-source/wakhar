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

# Step 2: Fetch Lot 20
lot_url = f"{url}/api/lots/24"
req_get = urllib.request.Request(
    lot_url,
    headers={"Authorization": f"Bearer {token}"}
)

try:
    with urllib.request.urlopen(req_get) as res:
        lot = json.loads(res.read().decode('utf-8'))
        print("Fetched Lot:", lot)
except Exception as e:
    print("Fetch lot failed:", e)
    exit()

# Step 3: PUT Lot 20 back with status: in_transit (simulating the mobile app's payload)
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
