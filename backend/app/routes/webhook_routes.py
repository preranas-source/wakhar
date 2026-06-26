from fastapi import APIRouter, Depends, HTTPException, status, Request, Header
from sqlalchemy.orm import Session
from datetime import datetime, timezone
import os

from app.database import get_db
from app.models import DispatchNote, DispatchTimelineEvent, StockTransfer

router = APIRouter(prefix="/api/webhooks/agri-fleet", tags=["Webhooks"])

AGRI_FLEET_WEBHOOK_SECRET = os.getenv("AGRI_FLEET_WEBHOOK_SECRET", "secret")

@router.post("/dispatch-update")
async def handle_dispatch_update(request: Request, x_webhook_secret: str = Header(None), db: Session = Depends(get_db)):
    if x_webhook_secret != AGRI_FLEET_WEBHOOK_SECRET:
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Invalid Webhook Secret")
        
    data = await request.json()
    wms_dispatch_id = data.get("wms_dispatch_id")
    
    if not wms_dispatch_id:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Missing WMS Dispatch ID")
        
    # Check if this is a Stock Transfer or a regular Dispatch Note
    wms_dispatch_id_str = str(wms_dispatch_id)
    if wms_dispatch_id_str.startswith("TRF-"):
        # Stock Transfer flow
        trf_id = int(wms_dispatch_id_str.replace("TRF-", ""))
        transfer = db.query(StockTransfer).filter(StockTransfer.id == trf_id).first()
        if not transfer:
            raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Stock Transfer not found")
            
        agri_status = data.get("status")
        assigned_vehicle = data.get("assigned_vehicle")
        
        if assigned_vehicle:
            transfer.vehicle_reg = assigned_vehicle
            if transfer.status == "GRN Pending":
                transfer.status = "In Transit"
                
        if agri_status == "Delivered" and transfer.status != "GRN Done":
            transfer.status = "GRN Pending"
            transfer.arrival_date = datetime.now(timezone.utc)
            
        db.add(transfer)
        db.commit()
        return {"status": "success"}

    # Regular Dispatch Note flow
    if wms_dispatch_id_str.startswith("DN-"):
        dispatch_id = int(wms_dispatch_id_str.replace("DN-", ""))
    else:
        try:
            dispatch_id = int(wms_dispatch_id_str)
        except ValueError:
            raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Invalid WMS Dispatch ID format")

    dispatch_note = db.query(DispatchNote).filter(DispatchNote.id == dispatch_id).first()
    if not dispatch_note:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Dispatch Note not found")
        
    agri_status = data.get("status")
    assigned_vehicle = data.get("assigned_vehicle")
    assigned_driver = data.get("assigned_driver")
    
    events_to_add = []
    
    # Workflow B: Assignment Update
    if assigned_vehicle and dispatch_note.vehicle_reg != assigned_vehicle:
        dispatch_note.vehicle_reg = assigned_vehicle
        events_to_add.append(
            DispatchTimelineEvent(
                dispatch_note_id=dispatch_note.id,
                title="Vehicle Assigned",
                subtitle=f"Vehicle {assigned_vehicle} assigned via Agri Fleet.",
                is_done=True,
                is_active=True,
                event_order=20,
                event_date=datetime.now(timezone.utc)
            )
        )
        dispatch_note.status = "assigned"

    # Workflow D: Delivered Status
    if agri_status == "Delivered" and dispatch_note.status != "delivered":
        dispatch_note.status = "delivered"
        
        actual_delivery_time = data.get("actual_delivery_time")
        if actual_delivery_time:
            try:
                dispatch_note.delivery_date = datetime.fromisoformat(actual_delivery_time)
            except:
                dispatch_note.delivery_date = datetime.now(timezone.utc)
        else:
            dispatch_note.delivery_date = datetime.now(timezone.utc)
            
        events_to_add.append(
            DispatchTimelineEvent(
                dispatch_note_id=dispatch_note.id,
                title="Delivered",
                subtitle="Delivery confirmed by Agri Fleet.",
                is_done=True,
                is_active=False,
                event_order=100,
                event_date=dispatch_note.delivery_date
            )
        )
        
    for ev in events_to_add:
        db.add(ev)
        
    db.commit()
    return {"status": "success"}
