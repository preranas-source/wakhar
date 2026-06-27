from fastapi import APIRouter, Depends, HTTPException, status, Query, Request
from sqlalchemy.orm import Session
from typing import List, Optional
from datetime import datetime, timezone

from app.dependencies import get_current_user, RoleChecker, PermissionChecker
from app.models.user import User
from app.database import get_db
from app.models import CommodityLot, ActivityLog, Warehouse, StockMovement
from app.schemas.commodity_lot import CommodityLotCreate, CommodityLotResponse
from app.utils.idempotency import get_idempotency_key, check_idempotency, store_idempotency
import uuid

router = APIRouter(prefix="/api/lots", tags=["Commodity Lots"], dependencies=[Depends(get_current_user)])

@router.get("/", response_model=List[CommodityLotResponse])
def list_items(
    skip: int = Query(0, ge=0), limit: int = Query(100, ge=1, le=500),
    warehouse_id: Optional[int] = None, farmer_id: Optional[int] = None,
    lot_status: Optional[str] = Query(None, alias="status"), grade: Optional[str] = None,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    q = db.query(CommodityLot)
    
    role_name = current_user.role_rel.name if current_user.role_rel else "unassigned"
    
    if role_name == "admin":
        pass
        
    elif role_name == "aggregator":
        aggregator_fpo_id = current_user.fpo_id
        if aggregator_fpo_id:
            from app.models import FPO
            child_ids = [f.id for f in db.query(FPO.id).filter(FPO.aggregator_id == aggregator_fpo_id).all()]
            allowed_fpo_ids = [aggregator_fpo_id] + child_ids
            q = q.filter(CommodityLot.warehouse.has(Warehouse.fpo_id.in_(allowed_fpo_ids)))
        else:
            return []
            
    elif role_name in ("fpo_manager", "fpo_staff"):
        user_fpo_id = current_user.fpo_id
        if user_fpo_id:
            q = q.filter(CommodityLot.warehouse.has(Warehouse.fpo_id == user_fpo_id))
        else:
            return []
            
    elif role_name == "farmer":
        if current_user.farmer_profile:
            q = q.filter(CommodityLot.farmer_id == current_user.farmer_profile.id)
        else:
            return []
            
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
def create_item(request: Request, data: CommodityLotCreate, db: Session = Depends(get_db), current_user: User = Depends(PermissionChecker("intake", "can_add"))):
    key = get_idempotency_key(request)
    existing = check_idempotency(key, db)
    if existing:
        return existing

    # Auto-increment unique lot_code if client-submitted code already exists
    lot_code = data.lot_code
    while True:
        existing_code = db.query(CommodityLot).filter(CommodityLot.lot_code == lot_code).first()
        if not existing_code:
            break
        max_lot = db.query(CommodityLot).filter(CommodityLot.lot_code.like("LOT-2026-%")).order_by(CommodityLot.lot_code.desc()).first()
        if max_lot:
            try:
                parts = max_lot.lot_code.split("-")
                num = int(parts[-1])
                lot_code = f"LOT-2026-{num + 1:04d}"
            except Exception:
                lot_code = f"LOT-2026-{uuid.uuid4().hex[:4].upper()}"
        else:
            lot_code = f"LOT-2026-{uuid.uuid4().hex[:4].upper()}"
    data.lot_code = lot_code

    item = CommodityLot(**data.model_dump(exclude={'client_timestamp'}))
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
        movement_date=data.client_timestamp or datetime.now(timezone.utc),
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

    store_idempotency(key, 201, CommodityLotResponse.model_validate(item).model_dump(mode='json'), db)
    
    return item

@router.put("/{item_id}", response_model=CommodityLotResponse)
def update_item(item_id: int, data: CommodityLotCreate, db: Session = Depends(get_db), current_user: User = Depends(PermissionChecker("intake", "can_edit"))):
    item = db.query(CommodityLot).filter(CommodityLot.id == item_id).first()
    if not item:
        raise HTTPException(status_code=404, detail="Not found")
    if data.version is not None and data.version != item.version:
        raise HTTPException(status_code=409, detail="Conflict: record has been modified by another user. Please refresh and try again.")
    for key, value in data.model_dump(exclude_unset=True, exclude={'client_timestamp', 'version'}).items():
        setattr(item, key, value)
    item.version += 1
    db.commit()
    db.refresh(item)
    return item

@router.delete("/{item_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_item(item_id: int, db: Session = Depends(get_db), current_user: User = Depends(PermissionChecker("intake", "can_delete"))):
    item = db.query(CommodityLot).filter(CommodityLot.id == item_id).first()
    if not item:
        raise HTTPException(status_code=404, detail="Not found")
    db.delete(item)
    db.commit()
