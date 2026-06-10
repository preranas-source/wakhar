from fastapi import APIRouter, Depends, HTTPException, status, Query
from sqlalchemy.orm import Session
from typing import List, Optional

from app.dependencies import get_current_user, RoleChecker
from app.models.user import User
from app.database import get_db
from app.models import StockMovement
from app.schemas.stock_movement import StockMovementCreate, StockMovementResponse

router = APIRouter(prefix="/api/stock-movements", tags=["Stock Movements"], dependencies=[Depends(get_current_user)])

@router.get("/", response_model=List[StockMovementResponse])
def list_items(
    skip: int = Query(0, ge=0), limit: int = Query(100, ge=1, le=500),
    lot_id: Optional[int] = None, movement_type: Optional[str] = Query(None, alias="type"),
    db: Session = Depends(get_db)
):
    q = db.query(StockMovement)
    if lot_id is not None:
        q = q.filter(StockMovement.lot_id == lot_id)
    if movement_type is not None:
        q = q.filter(StockMovement.type == movement_type)
    return q.offset(skip).limit(limit).all()

@router.get("/{item_id}", response_model=StockMovementResponse)
def get_item(item_id: int, db: Session = Depends(get_db)):
    item = db.query(StockMovement).filter(StockMovement.id == item_id).first()
    if not item:
        raise HTTPException(status_code=404, detail="Not found")
    return item

@router.post("/", response_model=StockMovementResponse, status_code=status.HTTP_201_CREATED)
def create_item(data: StockMovementCreate, db: Session = Depends(get_db), current_user: User = Depends(RoleChecker(['admin', 'fpo_manager', 'fpo_staff', 'aggregator']))):
    item = StockMovement(**data.model_dump())
    db.add(item)
    db.commit()
    db.refresh(item)
    return item
