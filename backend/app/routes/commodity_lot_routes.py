from fastapi import APIRouter, Depends, HTTPException, status, Query
from sqlalchemy.orm import Session
from typing import List, Optional
from datetime import datetime, timezone

from app.dependencies import get_current_user, RoleChecker
from app.models.user import User
from app.database import get_db
from app.models import CommodityLot, ActivityLog, Warehouse, StockMovement
from app.schemas.commodity_lot import CommodityLotCreate, CommodityLotResponse
import uuid

router = APIRouter(prefix="/api/lots", tags=["Commodity Lots"], dependencies=[Depends(get_current_user)])

@router.get("/", response_model=List[CommodityLotResponse])
def list_items(
    skip: int = Query(0, ge=0), limit: int = Query(100, ge=1, le=500),
    warehouse_id: Optional[int] = None, farmer_id: Optional[int] = None,
    lot_status: Optional[str] = Query(None, alias="status"), grade: Optional[str] = None,
    db: Session = Depends(get_db)
):
    q = db.query(CommodityLot)
    if warehouse_id is not None:
        q = q.filter(CommodityLot.warehouse_id == warehouse_id)
    if farmer_id is not None:
        q = q.filter(CommodityLot.farmer_id == farmer_id)
    if lot_status is not None:
        q = q.filter(CommodityLot.status == lot_status)
    if grade is not None:
        q = q.filter(CommodityLot.grade == grade)
    return q.offset(skip).limit(limit).all()

@router.get("/{item_id}", response_model=CommodityLotResponse)
def get_item(item_id: int, db: Session = Depends(get_db)):
    item = db.query(CommodityLot).filter(CommodityLot.id == item_id).first()
    if not item:
        raise HTTPException(status_code=404, detail="Not found")
    return item

@router.post("/", response_model=CommodityLotResponse, status_code=status.HTTP_201_CREATED)
def create_item(data: CommodityLotCreate, db: Session = Depends(get_db), current_user: User = Depends(RoleChecker(['admin', 'fpo_manager', 'fpo_staff']))):
    item = CommodityLot(**data.model_dump())
    db.add(item)
    db.commit()
    db.refresh(item)
    
    # Update Warehouse Capacity
    warehouse = db.query(Warehouse).filter(Warehouse.id == item.warehouse_id).first()
    if warehouse:
        warehouse.current_stock_mt = float(warehouse.current_stock_mt) + (float(item.quantity_kg) / 1000.0)
        db.add(warehouse)

    # Create Stock Movement
    movement = StockMovement(
        movement_code=f"MOV-{uuid.uuid4().hex[:8].upper()}",
        type="intake",
        lot_id=item.id,
        to_warehouse_id=item.warehouse_id,
        quantity_kg=item.quantity_kg,
        performed_by_id=current_user.id,
        movement_date=datetime.now(timezone.utc),
        remarks="Initial Intake"
    )
    db.add(movement)
    
    # Create Activity Log
    log = ActivityLog(
        user_id=current_user.id,
        type="intake",
        message=f"New intake created: Lot {item.lot_code}",
        reference=f"Lot ID: {item.id}"
    )
    db.add(log)
    db.commit()
    
    return item

@router.put("/{item_id}", response_model=CommodityLotResponse)
def update_item(item_id: int, data: CommodityLotCreate, db: Session = Depends(get_db), current_user: User = Depends(RoleChecker(['admin', 'fpo_manager', 'fpo_staff', 'market_partner']))):
    item = db.query(CommodityLot).filter(CommodityLot.id == item_id).first()
    if not item:
        raise HTTPException(status_code=404, detail="Not found")
    for key, value in data.model_dump(exclude_unset=True).items():
        setattr(item, key, value)
    db.commit()
    db.refresh(item)
    return item

@router.delete("/{item_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_item(item_id: int, db: Session = Depends(get_db), current_user: User = Depends(RoleChecker(['admin', 'fpo_manager', 'fpo_staff']))):
    item = db.query(CommodityLot).filter(CommodityLot.id == item_id).first()
    if not item:
        raise HTTPException(status_code=404, detail="Not found")
    db.delete(item)
    db.commit()
