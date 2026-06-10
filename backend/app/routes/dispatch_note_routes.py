from fastapi import APIRouter, Depends, HTTPException, status, Query
from sqlalchemy.orm import Session, joinedload
from typing import List, Optional

from app.dependencies import get_current_user, RoleChecker
from app.models.user import User
from app.database import get_db
from app.models import DispatchNote, DispatchTimelineEvent
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

@router.post("/", response_model=DispatchNoteResponse, status_code=status.HTTP_201_CREATED)
def create_item(data: DispatchNoteCreate, db: Session = Depends(get_db), current_user: User = Depends(RoleChecker(['admin', 'fpo_manager', 'fpo_staff', 'aggregator']))):
    item = DispatchNote(**data.model_dump())
    db.add(item)
    db.commit()
    db.refresh(item)
    return item

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
