from fastapi import APIRouter, Depends, HTTPException, status, Query, Request, BackgroundTasks
from sqlalchemy.orm import Session, joinedload
from typing import List, Optional
from datetime import datetime, timezone
import uuid

from app.dependencies import get_current_user, RoleChecker, PermissionChecker
from app.models.user import User
from app.database import get_db
from app.models import StockTransfer, CommodityLot, Warehouse, StockMovement
from app.models.stock_transfer import TransferStatus
from app.schemas.stock_transfer import StockTransferCreate, StockTransferResponse
from app.utils.idempotency import get_idempotency_key, check_idempotency, store_idempotency
from app.services.agri_fleet_service import create_transfer_order

router = APIRouter(prefix="/api/stock-transfers", tags=["Stock Transfers"], dependencies=[Depends(get_current_user)])

@router.get("/", response_model=List[StockTransferResponse])
def list_items(skip: int = Query(0, ge=0), limit: int = Query(100, ge=1, le=500), db: Session = Depends(get_db)):
    return db.query(StockTransfer).offset(skip).limit(limit).all()

@router.get("/{item_id}", response_model=StockTransferResponse)
def get_item(item_id: int, db: Session = Depends(get_db)):
    item = db.query(StockTransfer).filter(StockTransfer.id == item_id).first()
    if not item:
        raise HTTPException(status_code=404, detail="Not found")
    return item

@router.post("/", response_model=StockTransferResponse, status_code=status.HTTP_201_CREATED)
def create_item(request: Request, data: StockTransferCreate, background_tasks: BackgroundTasks, db: Session = Depends(get_db), current_user: User = Depends(PermissionChecker("inventory", "can_add"))):
    key = get_idempotency_key(request)
    existing = check_idempotency(key, db)
    if existing:
        return existing

    # Fetch original lot with row-level lock
    original_lot = db.query(CommodityLot).with_for_update().filter(CommodityLot.id == data.lot_id).first()
    if not original_lot:
        raise HTTPException(status_code=404, detail="Lot not found")
        
    if data.quantity_kg > float(original_lot.quantity_kg):
        raise HTTPException(status_code=400, detail="Transfer quantity exceeds available lot quantity")

    stock_transfer = StockTransfer(**data.model_dump(exclude={'client_timestamp'}))

    # Lot Splitting/Transition Logic
    if data.quantity_kg < float(original_lot.quantity_kg):
        # Create a new split lot for transfer
        split_lot = CommodityLot(
            lot_code=f"{original_lot.lot_code}-T{uuid.uuid4().hex[:4].upper()}",
            farmer_id=original_lot.farmer_id,
            commodity_id=original_lot.commodity_id,
            variety=original_lot.variety,
            quantity_kg=data.quantity_kg,
            bag_count=max(1, int(data.quantity_kg / 50)),
            moisture_pct=original_lot.moisture_pct,
            grade=original_lot.grade,
            warehouse_id=original_lot.warehouse_id,
            zone=original_lot.zone,
            status="in_transit",
            intake_type=original_lot.intake_type,
            source_gps_lat=original_lot.source_gps_lat,
            source_gps_lng=original_lot.source_gps_lng,
            intake_date=original_lot.intake_date
        )
        db.add(split_lot)
        
        # Deduct from original lot
        original_lot.quantity_kg = float(original_lot.quantity_kg) - data.quantity_kg
        
        db.commit() # Commit to get split_lot.id
        db.refresh(split_lot)
        
        stock_transfer.lot_id = split_lot.id
    else:
        # Full transfer, mark original lot status as in_transit
        original_lot.status = "in_transit"
        db.commit()

    db.add(stock_transfer)
    db.commit()
    db.refresh(stock_transfer)

    # Deduct from Source Warehouse Capacity
    source_wh = db.query(Warehouse).filter(Warehouse.id == data.source_warehouse_id).first()
    if source_wh:
        source_wh.current_stock_mt = float(source_wh.current_stock_mt) - (data.quantity_kg / 1000.0)
        db.add(source_wh)

    # Register Outbound Stock Movement
    movement = StockMovement(
        movement_code=f"MOV-{uuid.uuid4().hex[:8].upper()}",
        type="transfer",
        lot_id=stock_transfer.lot_id,
        from_warehouse_id=data.source_warehouse_id,
        to_warehouse_id=data.destination_warehouse_id,
        quantity_kg=data.quantity_kg,
        performed_by_id=current_user.id,
        movement_date=data.client_timestamp or datetime.now(timezone.utc),
        remarks=f"Stock Transfer {stock_transfer.trf_code} initiated"
    )
    db.add(movement)
    db.commit()

    store_idempotency(key, 201, StockTransferResponse.model_validate(stock_transfer).model_dump(mode='json'), db)

    # Trigger background task to push to Agri Fleet
    background_tasks.add_task(create_transfer_order, stock_transfer.id)

    return stock_transfer

@router.post("/{item_id}/reconcile", response_model=StockTransferResponse)
def reconcile_grn(item_id: int, db: Session = Depends(get_db), current_user: User = Depends(PermissionChecker("inventory", "can_edit"))):
    transfer = db.query(StockTransfer).filter(StockTransfer.id == item_id).first()
    if not transfer:
        raise HTTPException(status_code=404, detail="Transfer not found")
        
    if transfer.status == TransferStatus.grn_done:
        raise HTTPException(status_code=400, detail="GRN already reconciled for this transfer")

    # Update Transfer Status
    transfer.status = TransferStatus.grn_done
    transfer.arrival_date = datetime.now(timezone.utc)
    db.add(transfer)

    # 1. Update Lot Location and Status
    lot = db.query(CommodityLot).filter(CommodityLot.id == transfer.lot_id).first()
    if lot:
        lot.warehouse_id = transfer.destination_warehouse_id
        lot.status = "Available"
        db.add(lot)

    # 2. Add to Destination Warehouse Capacity
    dest_wh = db.query(Warehouse).filter(Warehouse.id == transfer.destination_warehouse_id).first()
    if dest_wh:
        dest_wh.current_stock_mt = float(dest_wh.current_stock_mt) + (float(transfer.quantity_kg) / 1000.0)
        db.add(dest_wh)

    # 3. Register Inbound Stock Movement
    movement = StockMovement(
        movement_code=f"MOV-{uuid.uuid4().hex[:8].upper()}",
        type="receipt",
        lot_id=transfer.lot_id,
        from_warehouse_id=transfer.source_warehouse_id,
        to_warehouse_id=transfer.destination_warehouse_id,
        quantity_kg=float(transfer.quantity_kg),
        performed_by_id=current_user.id,
        movement_date=datetime.now(timezone.utc),
        remarks=f"Stock Transfer {transfer.trf_code} GRN reconciled"
    )
    db.add(movement)
    
    db.commit()
    db.refresh(transfer)
    return transfer
