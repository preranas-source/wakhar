from fastapi import APIRouter, Depends, HTTPException, status, Query
from sqlalchemy.orm import Session
from typing import List, Optional

from app.dependencies import get_current_user, RoleChecker, PermissionChecker
from app.models.user import User
from app.database import get_db
from app.models import Farmer, Role
from app.schemas.farmer import FarmerCreate, FarmerResponse
from app.utils.auth import hash_password

router = APIRouter(prefix="/api/farmers", tags=["Farmers"], dependencies=[Depends(get_current_user)])

@router.get("/", response_model=List[FarmerResponse])
def list_items(
    skip: int = Query(0, ge=0),
    limit: int = Query(100, ge=1, le=500),
    fpo_id: Optional[int] = None,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    q = db.query(Farmer)
    
    role_name = current_user.role_rel.name if current_user.role_rel else "unassigned"
    
    if role_name == "admin":
        if fpo_id is not None:
            q = q.filter(Farmer.fpo_id == fpo_id)
            
    elif role_name == "aggregator":
        aggregator_fpo_id = current_user.fpo_id
        if aggregator_fpo_id:
            from app.models import FPO
            child_ids = [f.id for f in db.query(FPO.id).filter(FPO.aggregator_id == aggregator_fpo_id).all()]
            allowed_fpo_ids = [aggregator_fpo_id] + child_ids
            if fpo_id is not None:
                if fpo_id in allowed_fpo_ids:
                    q = q.filter(Farmer.fpo_id == fpo_id)
                else:
                    return []
            else:
                q = q.filter(Farmer.fpo_id.in_(allowed_fpo_ids))
        else:
            return []
            
    elif role_name in ("fpo_manager", "fpo_staff"):
        user_fpo_id = current_user.fpo_id
        if user_fpo_id:
            q = q.filter(Farmer.fpo_id == user_fpo_id)
        else:
            return []
            
    elif role_name == "farmer":
        if current_user.farmer_profile:
            q = q.filter(Farmer.id == current_user.farmer_profile.id)
        else:
            return []
            
    else:
        if fpo_id is not None:
            q = q.filter(Farmer.fpo_id == fpo_id)
            
    items = q.offset(skip).limit(limit).all()
    for item in items:
        item.total_deposit_kg = float(sum(lot.quantity_kg for lot in item.commodity_lots))
    return items

@router.get("/{item_id}", response_model=FarmerResponse)
def get_item(item_id: int, db: Session = Depends(get_db)):
    item = db.query(Farmer).filter(Farmer.id == item_id).first()
    if not item:
        raise HTTPException(status_code=404, detail="Not found")
    item.total_deposit_kg = float(sum(lot.quantity_kg for lot in item.commodity_lots))
    return item

@router.post("/", response_model=FarmerResponse, status_code=status.HTTP_201_CREATED)
def create_item(data: FarmerCreate, db: Session = Depends(get_db), current_user: User = Depends(PermissionChecker("farmers", "can_add"))):
    user_phone = data.phone.strip()
    linked_user = db.query(User).filter(User.phone == user_phone).first()
    
    if not linked_user:
        farmer_role = db.query(Role).filter(Role.name == "farmer").first()
        role_id = farmer_role.id if farmer_role else 2
        initials = "".join([n[0] for n in data.name.split() if n]).upper()[:2] if data.name else "FM"
        plain_password = data.password or "123456"
        hashed_pwd = hash_password(plain_password)
        
        linked_user = User(
            full_name=data.name,
            phone=user_phone,
            role_id=role_id,
            password_hash=hashed_pwd,
            fpo_id=data.fpo_id,
            initials=initials,
            is_active=True
        )
        db.add(linked_user)
        db.commit()
        db.refresh(linked_user)
        
    farmer_data = data.model_dump(exclude={'password'})
    farmer_data["user_id"] = linked_user.id
    item = Farmer(**farmer_data)
    db.add(item)
    db.commit()
    db.refresh(item)
    return item

@router.put("/{item_id}", response_model=FarmerResponse)
def update_item(item_id: int, data: FarmerCreate, db: Session = Depends(get_db), current_user: User = Depends(PermissionChecker("farmers", "can_edit"))):
    item = db.query(Farmer).filter(Farmer.id == item_id).first()
    if not item:
        raise HTTPException(status_code=404, detail="Not found")
        
    linked_user = None
    if item.user_id:
        linked_user = db.query(User).filter(User.id == item.user_id).first()
    
    if not linked_user:
        user_phone = data.phone.strip()
        linked_user = db.query(User).filter(User.phone == user_phone).first()
        
    if not linked_user:
        farmer_role = db.query(Role).filter(Role.name == "farmer").first()
        role_id = farmer_role.id if farmer_role else 2
        initials = "".join([n[0] for n in data.name.split() if n]).upper()[:2] if data.name else "FM"
        plain_password = data.password or "123456"
        hashed_pwd = hash_password(plain_password)
        
        linked_user = User(
            full_name=data.name,
            phone=user_phone,
            role_id=role_id,
            password_hash=hashed_pwd,
            fpo_id=data.fpo_id,
            initials=initials,
            is_active=True
        )
        db.add(linked_user)
        db.commit()
        db.refresh(linked_user)
    else:
        linked_user.full_name = data.name
        linked_user.phone = data.phone.strip()
        linked_user.fpo_id = data.fpo_id
        if data.password:
            linked_user.password_hash = hash_password(data.password)
        db.add(linked_user)
        db.commit()
        db.refresh(linked_user)

    farmer_data = data.model_dump(exclude={'password'})
    farmer_data["user_id"] = linked_user.id
    for key, value in farmer_data.items():
        setattr(item, key, value)
    db.commit()
    db.refresh(item)
    return item

@router.delete("/{item_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_item(item_id: int, db: Session = Depends(get_db), current_user: User = Depends(PermissionChecker("farmers", "can_delete"))):
    item = db.query(Farmer).filter(Farmer.id == item_id).first()
    if not item:
        raise HTTPException(status_code=404, detail="Not found")
    
    user_id = item.user_id
    db.delete(item)
    db.commit()
    
    if user_id:
        linked_user = db.query(User).filter(User.id == user_id).first()
        if linked_user:
            db.delete(linked_user)
            db.commit()
