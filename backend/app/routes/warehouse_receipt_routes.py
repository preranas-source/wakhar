from fastapi import APIRouter, Depends, HTTPException, status, Query
from sqlalchemy.orm import Session
from typing import List, Optional

from app.dependencies import get_current_user, RoleChecker
from app.models.user import User
from app.database import get_db
from app.models import WarehouseReceipt
from app.schemas.warehouse_receipt import WarehouseReceiptCreate, WarehouseReceiptResponse

router = APIRouter(prefix="/api/warehouse-receipts", tags=["Warehouse Receipts"], dependencies=[Depends(get_current_user)])

@router.get("/", response_model=List[WarehouseReceiptResponse])
def list_items(
    skip: int = Query(0, ge=0), limit: int = Query(100, ge=1, le=500),
    farmer_id: Optional[int] = None, lot_id: Optional[int] = None,
    receipt_status: Optional[str] = Query(None, alias="status"),
    db: Session = Depends(get_db)
):
    q = db.query(WarehouseReceipt)
    if farmer_id is not None:
        q = q.filter(WarehouseReceipt.farmer_id == farmer_id)
    if lot_id is not None:
        q = q.filter(WarehouseReceipt.lot_id == lot_id)
    if receipt_status is not None:
        q = q.filter(WarehouseReceipt.status == receipt_status)
    return q.offset(skip).limit(limit).all()

@router.get("/{item_id}", response_model=WarehouseReceiptResponse)
def get_item(item_id: int, db: Session = Depends(get_db)):
    item = db.query(WarehouseReceipt).filter(WarehouseReceipt.id == item_id).first()
    if not item:
        raise HTTPException(status_code=404, detail="Not found")
    return item

from app.models import WarehouseReceipt, CommodityLot, Commodity, Warehouse

@router.post("/", response_model=WarehouseReceiptResponse, status_code=status.HTTP_201_CREATED)
def create_item(data: WarehouseReceiptCreate, db: Session = Depends(get_db), current_user: User = Depends(RoleChecker(['admin', 'fpo_manager', 'fpo_staff']))):
    # Fetch lot and commodity to calculate dynamic valuation
    lot = db.query(CommodityLot).filter(CommodityLot.id == data.lot_id).first()
    if lot:
        commodity = db.query(Commodity).filter(Commodity.id == lot.commodity_id).first()
        if commodity:
            # Valuation = quantity_kg * base_rate
            data.valuation = float(lot.quantity_kg) * float(commodity.base_rate)
            
    item = WarehouseReceipt(**data.model_dump(exclude={'client_timestamp'}))
    db.add(item)
    db.commit()
    db.refresh(item)
    return item

@router.put("/{item_id}", response_model=WarehouseReceiptResponse)
def update_item(item_id: int, data: WarehouseReceiptCreate, db: Session = Depends(get_db), current_user: User = Depends(RoleChecker(['admin', 'fpo_manager', 'fpo_staff', 'farmer']))):
    item = db.query(WarehouseReceipt).filter(WarehouseReceipt.id == item_id).first()
    if not item:
        raise HTTPException(status_code=404, detail="Not found")
    if data.version is not None and data.version != item.version:
        raise HTTPException(status_code=409, detail="Conflict: record has been modified by another user. Please refresh and try again.")
        
    if current_user.role.value == "farmer":
        # Ensure the farmer owns the receipt
        if not current_user.farmer_profile or item.farmer_id != current_user.farmer_profile.id:
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="You do not have permission to modify this receipt"
            )
        # Prevent farmer from modifying core parameters (valuation, grade, quantity, etc.)
        if (item.wr_code != data.wr_code or 
            float(item.quantity_kg) != float(data.quantity_kg) or 
            item.grade != data.grade or 
            float(item.valuation) != float(data.valuation)):
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Farmers can only apply for pledge loans and cannot modify weight, grade, or valuation"
            )
            
    for key, value in data.model_dump(exclude_unset=True, exclude={'client_timestamp', 'version'}).items():
        setattr(item, key, value)
    item.version += 1
    db.commit()
    db.refresh(item)
    return item

from pydantic import BaseModel
class WithdrawRequest(BaseModel):
    withdraw_kg: float

from app.models.stock_movement import StockMovement, MovementType
from datetime import datetime, timezone
import random

@router.post("/{item_id}/withdraw", response_model=WarehouseReceiptResponse)
def withdraw_receipt(item_id: int, data: WithdrawRequest, db: Session = Depends(get_db), current_user: User = Depends(get_current_user)):
    item = db.query(WarehouseReceipt).with_for_update().filter(WarehouseReceipt.id == item_id).first()
    if not item:
        raise HTTPException(status_code=404, detail="Warehouse Receipt not found")

    if item.status != "active":
        raise HTTPException(status_code=400, detail="Cannot withdraw from an inactive receipt")

    if data.withdraw_kg <= 0 or data.withdraw_kg > float(item.quantity_kg):
        raise HTTPException(status_code=400, detail="Invalid withdrawal amount")

    lot = db.query(CommodityLot).with_for_update().filter(CommodityLot.id == item.lot_id).first()
    warehouse = db.query(Warehouse).filter(Warehouse.id == lot.warehouse_id).first() if lot else None

    # Subtract qty
    item.quantity_kg = float(item.quantity_kg) - data.withdraw_kg
    if lot:
        lot.quantity_kg = float(lot.quantity_kg) - data.withdraw_kg
        
        # Adjust warehouse stock
        if warehouse:
            warehouse.current_stock_mt = float(warehouse.current_stock_mt) - (data.withdraw_kg / 1000.0)

        # Record movement
        mov = StockMovement(
            movement_code=f"MOV-W-{datetime.now().strftime('%Y%m')}-{random.randint(1000, 9999)}",
            type=MovementType.dispatch,
            lot_id=lot.id,
            from_warehouse_id=warehouse.id if warehouse else None,
            to_warehouse_id=None,
            quantity_kg=data.withdraw_kg,
            performed_by_id=current_user.id,
            movement_date=datetime.now(timezone.utc),
            remarks="Farmer Withdrawal via Warehouse Receipt"
        )
        db.add(mov)

        # Update valuation
        commodity = db.query(Commodity).filter(Commodity.id == lot.commodity_id).first()
        if commodity:
            item.valuation = float(item.quantity_kg) * float(commodity.base_rate)

        # Status check
        if item.quantity_kg == 0:
            item.status = "withdrawn"
            lot.status = "withdrawn"

    db.commit()
    db.refresh(item)
    return item

@router.delete("/{item_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_item(item_id: int, db: Session = Depends(get_db), current_user: User = Depends(RoleChecker(['admin', 'fpo_manager']))):
    item = db.query(WarehouseReceipt).filter(WarehouseReceipt.id == item_id).first()
    if not item:
        raise HTTPException(status_code=404, detail="Not found")
    db.delete(item)
    db.commit()
