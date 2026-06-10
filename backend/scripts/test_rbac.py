import sys
import os
sys.path.insert(0, os.path.join(os.path.dirname(__file__), ".."))

from fastapi import HTTPException
from app.database import SessionLocal
from app.routes.auth_routes import login_json, LoginRequest
from app.utils.auth import decode_access_token
from app.dependencies import RoleChecker, get_current_user
from app.models.user import User

def test_auth():
    print("🧪 Starting RBAC and Auth Verification Tests...")
    db = SessionLocal()
    
    # 1. Test Login with Correct Credentials
    print("\n1. Testing correct login for FPO Manager (Rajesh Bhosale)...")
    try:
        login_data = LoginRequest(phone="+919876500001", password="123456")
        response = login_json(login_data, db=db)
        print("✅ Login successful!")
        print(f"   Token Type: {response['token_type']}")
        print(f"   Returned User: {response['user'].full_name} ({response['user'].role})")
        token = response["access_token"]
    except Exception as e:
        print(f"❌ Login failed: {e}")
        return

    # 2. Test Token Decoding
    print("\n2. Testing token decoding...")
    payload = decode_access_token(token)
    if payload and payload.get("sub") == str(response["user"].id):
        print(f"✅ Token decoded successfully. User ID in sub: {payload['sub']}")
    else:
        print("❌ Token decoding failed or mismatched user ID.")
        return

    # 3. Test Login with Incorrect Credentials
    print("\n3. Testing incorrect password login...")
    try:
        bad_login_data = LoginRequest(phone="+919876500001", password="wrongpassword")
        login_json(bad_login_data, db=db)
        print("❌ Login with bad password did not raise an exception!")
    except HTTPException as e:
        if e.status_code == 401:
            print("✅ Login failed with expected 401 Unauthorized status.")
        else:
            print(f"❌ Login failed with unexpected status code: {e.status_code}")
    except Exception as e:
        print(f"❌ Login raised unexpected exception: {e}")

    # 4. Fetch the User via get_current_user dependency
    print("\n4. Testing get_current_user dependency...")
    try:
        current_user = get_current_user(token=token, db=db)
        print(f"✅ Current user fetched: {current_user.full_name} ({current_user.role.value})")
    except Exception as e:
        print(f"❌ get_current_user failed: {e}")
        return

    # 5. Test RoleChecker
    print("\n5. Testing RoleChecker...")
    # Manager role is fpo_manager
    manager_checker = RoleChecker(allowed_roles=["fpo_manager", "admin"])
    staff_checker = RoleChecker(allowed_roles=["fpo_staff"])
    
    # Rajesh (fpo_manager) should pass manager checker
    try:
        manager_checker(current_user=current_user)
        print("✅ Manager allowed (fpo_manager) - Passed.")
    except HTTPException:
        print("❌ Manager allowed (fpo_manager) - Blocked unexpectedly!")
        
    # Rajesh (fpo_manager) should be blocked by staff checker
    try:
        staff_checker(current_user=current_user)
        print("❌ Manager blocked (fpo_staff) - Allowed unexpectedly!")
    except HTTPException as e:
        if e.status_code == 403:
            print("✅ Manager blocked (fpo_staff) - Blocked correctly with 403 Forbidden.")
        else:
            print(f"❌ Manager blocked (fpo_staff) - Returned unexpected status code: {e.status_code}")
            
    db.close()
    print("\n🎉 All RBAC and Auth tests completed successfully!")

if __name__ == "__main__":
    test_auth()
