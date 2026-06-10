from fastapi import APIRouter, Depends, HTTPException, status, Query
from sqlalchemy.orm import Session
from typing import List, Optional

from app.dependencies import get_current_user, RoleChecker
from app.models.user import User
from app.database import get_db
from app.models import Commodity
from app.schemas.commodity import CommodityCreate, CommodityResponse

router = APIRouter(prefix="/api/commodities", tags=["Commodities"], dependencies=[Depends(get_current_user)])

@router.get("/", response_model=List[CommodityResponse])
def list_items(skip: int = Query(0, ge=0), limit: int = Query(100, ge=1, le=500), category: Optional[str] = None, db: Session = Depends(get_db)):
    q = db.query(Commodity)
    if category is not None:
        q = q.filter(Commodity.category == category)
    return q.offset(skip).limit(limit).all()

@router.get("/{item_id}", response_model=CommodityResponse)
def get_item(item_id: int, db: Session = Depends(get_db)):
    item = db.query(Commodity).filter(Commodity.id == item_id).first()
    if not item:
        raise HTTPException(status_code=404, detail="Not found")
    return item

@router.post("/", response_model=CommodityResponse, status_code=status.HTTP_201_CREATED)
def create_item(data: CommodityCreate, db: Session = Depends(get_db), current_user: User = Depends(RoleChecker(['admin', 'fpo_manager']))):
    item = Commodity(**data.model_dump())
    db.add(item)
    db.commit()
    db.refresh(item)
    return item

@router.put("/{item_id}", response_model=CommodityResponse)
def update_item(item_id: int, data: CommodityCreate, db: Session = Depends(get_db), current_user: User = Depends(RoleChecker(['admin', 'fpo_manager']))):
    item = db.query(Commodity).filter(Commodity.id == item_id).first()
    if not item:
        raise HTTPException(status_code=404, detail="Not found")
    for key, value in data.model_dump(exclude_unset=True).items():
        setattr(item, key, value)
    db.commit()
    db.refresh(item)
    return item

@router.delete("/{item_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_item(item_id: int, db: Session = Depends(get_db), current_user: User = Depends(RoleChecker(['admin', 'fpo_manager']))):
    item = db.query(Commodity).filter(Commodity.id == item_id).first()
    if not item:
        raise HTTPException(status_code=404, detail="Not found")
    db.delete(item)
    db.commit()
