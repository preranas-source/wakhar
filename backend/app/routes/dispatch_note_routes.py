from fastapi import APIRouter, Depends, HTTPException, status, Query
from sqlalchemy.orm import Session, joinedload
from typing import List, Optional
from datetime import datetime, timezone

from app.dependencies import get_current_user, RoleChecker
from app.models.user import User
from app.database import get_db
from app.models import DispatchNote, DispatchTimelineEvent, CommodityLot, Warehouse, StockMovement
from app.schemas.dispatch_note import (
    DispatchNoteCreate, DispatchNoteResponse,
    DispatchTimelineEventCreate, DispatchTimelineEventResponse
)

router = APIRouter(prefix="/api/dispatch-notes", tags=["Dispatch Notes"], dependencies=[Depends(get_current_user)])

@router.get("/", response_model=List[DispatchNoteResponse])
def list_items(skip: int = Query(0, ge=0), limit: int = Query(100, ge=1, le=500), db: Session = Depends(get_db)):
    return db.query(DispatchNote).options(joinedload(DispatchNote.timeline_events)).offset(skip).limit(limit).all()

@router.get("/{item_id}", response_model=DispatchNoteResponse)
def get_item(item_id: int, db: Session = Depends(get_db)):
    item = db.query(DispatchNote).options(joinedload(DispatchNote.timeline_events)).filter(DispatchNote.id == item_id).first()
    if not item:
        raise HTTPException(status_code=404, detail="Not found")
    return item

import uuid

@router.post("/", response_model=DispatchNoteResponse, status_code=status.HTTP_201_CREATED)
def create_item(data: DispatchNoteCreate, db: Session = Depends(get_db), current_user: User = Depends(RoleChecker(['admin', 'fpo_manager', 'fpo_staff', 'aggregator']))):
    # Fetch original lot
    original_lot = db.query(CommodityLot).filter(CommodityLot.id == data.lot_id).first()
    if not original_lot:
        raise HTTPException(status_code=404, detail="Lot not found")
        
    if data.dispatch_quantity_kg > float(original_lot.quantity_kg):
        raise HTTPException(status_code=400, detail="Dispatch quantity exceeds available lot quantity")

    dispatch_note = DispatchNote(**data.model_dump())

    # Lot Splitting Logic
    if data.dispatch_quantity_kg < float(original_lot.quantity_kg):
        # Create a new split lot for dispatch
        split_lot = CommodityLot(
            lot_code=f"{original_lot.lot_code}-S{uuid.uuid4().hex[:4].upper()}",
            farmer_id=original_lot.farmer_id,
            commodity_id=original_lot.commodity_id,
            variety=original_lot.variety,
            quantity_kg=data.dispatch_quantity_kg,
            bag_count=max(1, int(data.dispatch_quantity_kg / 50)),
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
        original_lot.quantity_kg = float(original_lot.quantity_kg) - data.dispatch_quantity_kg
        
        db.commit() # Commit to get split_lot.id
        db.refresh(split_lot)
        
        dispatch_note.lot_id = split_lot.id
    else:
        # Full dispatch, just update the original lot status
        original_lot.status = "in_transit"
        db.commit()

    db.add(dispatch_note)
    db.commit()
    db.refresh(dispatch_note)

    # Update Warehouse Capacity
    warehouse = db.query(Warehouse).filter(Warehouse.id == original_lot.warehouse_id).first()
    if warehouse:
        warehouse.current_stock_mt = float(warehouse.current_stock_mt) - (data.dispatch_quantity_kg / 1000.0)
        db.add(warehouse)

    # Create Stock Movement
    movement = StockMovement(
        movement_code=f"MOV-{uuid.uuid4().hex[:8].upper()}",
        type="dispatch",
        lot_id=dispatch_note.lot_id,
        from_warehouse_id=original_lot.warehouse_id,
        quantity_kg=data.dispatch_quantity_kg,
        performed_by_id=current_user.id,
        movement_date=datetime.now(timezone.utc),
        remarks=f"Dispatched via {dispatch_note.dn_code}"
    )
    db.add(movement)
    
    db.commit()
    return dispatch_note

@router.put("/{item_id}", response_model=DispatchNoteResponse)
def update_item(item_id: int, data: DispatchNoteCreate, db: Session = Depends(get_db), current_user: User = Depends(RoleChecker(['admin', 'fpo_manager', 'fpo_staff', 'aggregator']))):
    item = db.query(DispatchNote).filter(DispatchNote.id == item_id).first()
    if not item:
        raise HTTPException(status_code=404, detail="Not found")
    for key, value in data.model_dump(exclude_unset=True).items():
        setattr(item, key, value)
    db.commit()
    db.refresh(item)
    return item

@router.get("/{item_id}/timeline", response_model=List[DispatchTimelineEventResponse])
def get_timeline(item_id: int, db: Session = Depends(get_db)):
    events = db.query(DispatchTimelineEvent).filter(DispatchTimelineEvent.dispatch_note_id == item_id).order_by(DispatchTimelineEvent.event_order).all()
    return events

@router.post("/{item_id}/timeline", response_model=DispatchTimelineEventResponse, status_code=status.HTTP_201_CREATED)
def add_timeline_event(item_id: int, data: DispatchTimelineEventCreate, db: Session = Depends(get_db), current_user: User = Depends(RoleChecker(['admin', 'fpo_manager', 'fpo_staff', 'aggregator']))):
    if data.dispatch_note_id != item_id:
        raise HTTPException(status_code=400, detail="Path id and body dispatch_note_id mismatch")
    event = DispatchTimelineEvent(**data.model_dump())
    db.add(event)
    db.commit()
    db.refresh(event)
    return event
