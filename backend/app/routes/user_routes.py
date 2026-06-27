from fastapi import APIRouter, Depends, HTTPException, status, Query
from sqlalchemy.orm import Session
from typing import List, Optional

from app.dependencies import get_current_user, RoleChecker, PermissionChecker
from app.models.user import User
from app.utils.auth import hash_password
from app.database import get_db
from app.models import User
from app.schemas.user import UserCreate, UserResponse

router = APIRouter(prefix="/api/users", tags=["Users"], dependencies=[Depends(get_current_user)])

@router.get("/", response_model=List[UserResponse])
def list_items(skip: int = Query(0, ge=0), limit: int = Query(100, ge=1, le=500), role: Optional[str] = None, fpo_id: Optional[int] = None, db: Session = Depends(get_db)):
    q = db.query(User)
    if role is not None:
        from app.models.role import Role
        q = q.filter(User.role_rel.has(Role.name == role))
    if fpo_id is not None:
        q = q.filter(User.fpo_id == fpo_id)
    return q.offset(skip).limit(limit).all()

@router.get("/{item_id}", response_model=UserResponse)
def get_item(item_id: int, db: Session = Depends(get_db)):
    item = db.query(User).filter(User.id == item_id).first()
    if not item:
        raise HTTPException(status_code=404, detail="Not found")
    return item

@router.post("/", response_model=UserResponse, status_code=status.HTTP_201_CREATED)
def create_item(data: UserCreate, db: Session = Depends(get_db), current_user: User = Depends(PermissionChecker("users", "can_add"))):
    hashed_pwd = hash_password(data.password_hash)
    item_data = data.model_dump()
    item_data["password_hash"] = hashed_pwd
    item = User(**item_data)
    db.add(item)
    db.commit()
    db.refresh(item)
    return item

@router.put("/{item_id}", response_model=UserResponse)
def update_item(item_id: int, data: UserCreate, db: Session = Depends(get_db), current_user: User = Depends(PermissionChecker("users", "can_edit"))):
    item = db.query(User).filter(User.id == item_id).first()
    if not item:
        raise HTTPException(status_code=404, detail="Not found")
    item_data = data.model_dump(exclude_unset=True)
    if "password_hash" in item_data:
        item_data["password_hash"] = hash_password(item_data["password_hash"])
    for key, value in item_data.items():
        setattr(item, key, value)
    db.commit()
    db.refresh(item)
    return item

@router.delete("/{item_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_item(item_id: int, db: Session = Depends(get_db), current_user: User = Depends(PermissionChecker("users", "can_delete"))):
    item = db.query(User).filter(User.id == item_id).first()
    if not item:
        raise HTTPException(status_code=404, detail="Not found")
    db.delete(item)
    db.commit()
