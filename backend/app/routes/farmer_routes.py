from fastapi import APIRouter, Depends, HTTPException, status, Query
from sqlalchemy.orm import Session
from typing import List, Optional

from app.dependencies import get_current_user, RoleChecker
from app.models.user import User
from app.database import get_db
from app.models import Farmer
from app.schemas.farmer import FarmerCreate, FarmerResponse

router = APIRouter(prefix="/api/farmers", tags=["Farmers"], dependencies=[Depends(get_current_user)])

@router.get("/", response_model=List[FarmerResponse])
def list_items(skip: int = Query(0, ge=0), limit: int = Query(100, ge=1, le=500), fpo_id: Optional[int] = None, db: Session = Depends(get_db)):
    q = db.query(Farmer)
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
def create_item(data: FarmerCreate, db: Session = Depends(get_db), current_user: User = Depends(RoleChecker(['admin', 'fpo_manager', 'fpo_staff']))):
    item = Farmer(**data.model_dump())
    db.add(item)
    db.commit()
    db.refresh(item)
    return item

@router.put("/{item_id}", response_model=FarmerResponse)
def update_item(item_id: int, data: FarmerCreate, db: Session = Depends(get_db), current_user: User = Depends(RoleChecker(['admin', 'fpo_manager', 'fpo_staff']))):
    item = db.query(Farmer).filter(Farmer.id == item_id).first()
    if not item:
        raise HTTPException(status_code=404, detail="Not found")
    for key, value in data.model_dump(exclude_unset=True).items():
        setattr(item, key, value)
    db.commit()
    db.refresh(item)
    return item

@router.delete("/{item_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_item(item_id: int, db: Session = Depends(get_db), current_user: User = Depends(RoleChecker(['admin', 'fpo_manager', 'fpo_staff']))):
    item = db.query(Farmer).filter(Farmer.id == item_id).first()
    if not item:
        raise HTTPException(status_code=404, detail="Not found")
    db.delete(item)
    db.commit()
