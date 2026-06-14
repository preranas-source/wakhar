from fastapi import APIRouter, Depends, HTTPException, status, Query
from sqlalchemy.orm import Session
from sqlalchemy import func
from typing import List, Optional

from app.dependencies import get_current_user, RoleChecker
from app.models.user import User
from app.database import get_db
from app.models import Warehouse, CommodityLot
from app.schemas.warehouse import WarehouseCreate, WarehouseResponse

router = APIRouter(prefix="/api/warehouses", tags=["Warehouses"], dependencies=[Depends(get_current_user)])

@router.get("/", response_model=List[WarehouseResponse])
def list_items(skip: int = Query(0, ge=0), limit: int = Query(100, ge=1, le=500), fpo_id: Optional[int] = None, db: Session = Depends(get_db)):
    q = db.query(Warehouse)
    if fpo_id is not None:
        q = q.filter(Warehouse.fpo_id == fpo_id)
    warehouses = q.offset(skip).limit(limit).all()
    for w in warehouses:
        total_kg = db.query(func.sum(CommodityLot.quantity_kg)).filter(CommodityLot.warehouse_id == w.id).scalar() or 0.0
        w.current_stock_mt = float(total_kg) / 1000.0
    return warehouses

@router.get("/{item_id}", response_model=WarehouseResponse)
def get_item(item_id: int, db: Session = Depends(get_db)):
    item = db.query(Warehouse).filter(Warehouse.id == item_id).first()
    if not item:
        raise HTTPException(status_code=404, detail="Not found")
    total_kg = db.query(func.sum(CommodityLot.quantity_kg)).filter(CommodityLot.warehouse_id == item.id).scalar() or 0.0
    item.current_stock_mt = float(total_kg) / 1000.0
    return item

@router.post("/", response_model=WarehouseResponse, status_code=status.HTTP_201_CREATED)
def create_item(data: WarehouseCreate, db: Session = Depends(get_db), current_user: User = Depends(RoleChecker(['admin', 'fpo_manager', 'aggregator']))):
    item = Warehouse(**data.model_dump())
    db.add(item)
    db.commit()
    db.refresh(item)
    return item

@router.put("/{item_id}", response_model=WarehouseResponse)
def update_item(item_id: int, data: WarehouseCreate, db: Session = Depends(get_db), current_user: User = Depends(RoleChecker(['admin', 'fpo_manager', 'aggregator']))):
    item = db.query(Warehouse).filter(Warehouse.id == item_id).first()
    if not item:
        raise HTTPException(status_code=404, detail="Not found")
    for key, value in data.model_dump(exclude_unset=True).items():
        setattr(item, key, value)
    db.commit()
    db.refresh(item)
    return item

@router.delete("/{item_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_item(item_id: int, db: Session = Depends(get_db), current_user: User = Depends(RoleChecker(['admin', 'fpo_manager', 'aggregator']))):
    item = db.query(Warehouse).filter(Warehouse.id == item_id).first()
    if not item:
        raise HTTPException(status_code=404, detail="Not found")
    db.delete(item)
    db.commit()
