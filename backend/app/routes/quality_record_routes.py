from fastapi import APIRouter, Depends, HTTPException, status, Query
from sqlalchemy.orm import Session
from typing import List, Optional

from app.dependencies import get_current_user, RoleChecker
from app.models.user import User
from app.database import get_db
from app.models import QualityRecord
from app.schemas.quality_record import QualityRecordCreate, QualityRecordResponse

router = APIRouter(prefix="/api/quality-records", tags=["Quality Records"], dependencies=[Depends(get_current_user)])

@router.get("/", response_model=List[QualityRecordResponse])
def list_items(skip: int = Query(0, ge=0), limit: int = Query(100, ge=1, le=500), lot_id: Optional[int] = None, db: Session = Depends(get_db)):
    q = db.query(QualityRecord)
    if lot_id is not None:
        q = q.filter(QualityRecord.lot_id == lot_id)
    return q.offset(skip).limit(limit).all()

@router.get("/{item_id}", response_model=QualityRecordResponse)
def get_item(item_id: int, db: Session = Depends(get_db)):
    item = db.query(QualityRecord).filter(QualityRecord.id == item_id).first()
    if not item:
        raise HTTPException(status_code=404, detail="Not found")
    return item

@router.post("/", response_model=QualityRecordResponse, status_code=status.HTTP_201_CREATED)
def create_item(data: QualityRecordCreate, db: Session = Depends(get_db), current_user: User = Depends(RoleChecker(['admin', 'fpo_manager', 'fpo_staff']))):
    item = QualityRecord(**data.model_dump(exclude={'client_timestamp'}))
    if data.client_timestamp:
        item.inspection_date = data.client_timestamp
    db.add(item)
    db.commit()
    db.refresh(item)
    return item

@router.put("/{item_id}", response_model=QualityRecordResponse)
def update_item(item_id: int, data: QualityRecordCreate, db: Session = Depends(get_db), current_user: User = Depends(RoleChecker(['admin', 'fpo_manager', 'fpo_staff']))):
    item = db.query(QualityRecord).filter(QualityRecord.id == item_id).first()
    if not item:
        raise HTTPException(status_code=404, detail="Not found")
    for key, value in data.model_dump(exclude_unset=True).items():
        setattr(item, key, value)
    db.commit()
    db.refresh(item)
    return item

@router.delete("/{item_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_item(item_id: int, db: Session = Depends(get_db), current_user: User = Depends(RoleChecker(['admin', 'fpo_manager', 'fpo_staff']))):
    item = db.query(QualityRecord).filter(QualityRecord.id == item_id).first()
    if not item:
        raise HTTPException(status_code=404, detail="Not found")
    db.delete(item)
    db.commit()
