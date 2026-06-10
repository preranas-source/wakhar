import os
import re

routes_dir = "/home/atharv/wakhar-wms/backend/app/routes"
files = [f for f in os.listdir(routes_dir) if f.endswith(".py") and f not in ("__init__.py", "auth_routes.py")]

roles_mapping = {
    "fpo_routes.py": ["admin", "aggregator"],
    "warehouse_routes.py": ["admin", "fpo_manager", "aggregator"],
    "user_routes.py": ["admin", "fpo_manager"],
    "farmer_routes.py": ["admin", "fpo_manager", "fpo_staff"],
    "commodity_routes.py": ["admin", "fpo_manager"],
    "commodity_lot_routes.py": ["admin", "fpo_manager", "fpo_staff"],
    "quality_record_routes.py": ["admin", "fpo_manager", "fpo_staff"],
    "warehouse_receipt_routes.py": ["admin", "fpo_manager"],
    "stock_movement_routes.py": ["admin", "fpo_manager", "fpo_staff", "aggregator"],
    "dispatch_note_routes.py": ["admin", "fpo_manager", "fpo_staff", "aggregator"],
    "purchase_order_routes.py": ["admin", "market_partner", "fpo_manager"],
    "activity_log_routes.py": ["admin", "fpo_manager", "fpo_staff", "aggregator"],
}

for filename in files:
    filepath = os.path.join(routes_dir, filename)
    with open(filepath, "r", encoding="utf-8") as f:
        content = f.read()

    # Skip if already modified
    if "get_current_user" in content:
        print(f"Skipping {filename} - already modified")
        continue

    # Add imports
    import_deps = "from app.dependencies import get_current_user, RoleChecker\nfrom app.models.user import User\n"
    if filename == "user_routes.py":
        import_deps += "from app.utils.auth import hash_password\n"
        
    # Inject imports after standard fastapi imports
    content = content.replace("from app.database import get_db", import_deps + "from app.database import get_db")

    # Update APIRouter definition
    content = re.sub(
        r'router = APIRouter\(prefix="([^"]+)", tags=\["([^"]+)"\]\)',
        r'router = APIRouter(prefix="\1", tags=["\2"], dependencies=[Depends(get_current_user)])',
        content
    )

    # Get allowed roles
    roles = roles_mapping.get(filename, ["admin"])
    roles_str = str(roles)

    # Replace write endpoints signatures
    # 1. create_item
    content = re.sub(
        r'def create_item\((data: [A-Za-z0-9_]+, db: Session = Depends\(get_db\))\):',
        rf'def create_item(\1, current_user: User = Depends(RoleChecker({roles_str}))):',
        content
    )
    # 2. update_item
    content = re.sub(
        r'def update_item\((item_id: int, data: [A-Za-z0-9_]+, db: Session = Depends\(get_db\))\):',
        rf'def update_item(\1, current_user: User = Depends(RoleChecker({roles_str}))):',
        content
    )
    # 3. delete_item
    content = re.sub(
        r'def delete_item\((item_id: int, db: Session = Depends\(get_db\))\):',
        rf'def delete_item(\1, current_user: User = Depends(RoleChecker({roles_str}))):',
        content
    )

    # Special handling for dispatch timeline event
    if filename == "dispatch_note_routes.py":
        content = re.sub(
            r'def add_timeline_event\((item_id: int, data: DispatchTimelineEventCreate, db: Session = Depends\(get_db\))\):',
            rf'def add_timeline_event(\1, current_user: User = Depends(RoleChecker({roles_str}))):',
            content
        )

    # Special handling for hashing password in user_routes.py
    if filename == "user_routes.py":
        # Modify create_item inside user_routes.py
        target_create = '    item = User(**data.model_dump())\n    db.add(item)'
        replacement_create = '    hashed_pwd = hash_password(data.password_hash)\n    item_data = data.model_dump()\n    item_data["password_hash"] = hashed_pwd\n    item = User(**item_data)\n    db.add(item)'
        content = content.replace(target_create, replacement_create)

        # Modify update_item inside user_routes.py
        target_update = '    for key, value in data.model_dump(exclude_unset=True).items():\n        setattr(item, key, value)'
        replacement_update = '    item_data = data.model_dump(exclude_unset=True)\n    if "password_hash" in item_data:\n        item_data["password_hash"] = hash_password(item_data["password_hash"])\n    for key, value in item_data.items():\n        setattr(item, key, value)'
        content = content.replace(target_update, replacement_update)

    with open(filepath, "w", encoding="utf-8") as f:
        f.write(content)

    print(f"Secured routes in {filename}")
