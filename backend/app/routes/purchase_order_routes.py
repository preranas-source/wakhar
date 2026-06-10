from fastapi import APIRouter, Depends, HTTPException, status, Query
from sqlalchemy.orm import Session
from typing import List, Optional

from app.dependencies import get_current_user, RoleChecker
from app.models.user import User
from app.database import get_db
from app.models import PurchaseOrder
from app.schemas.purchase_order import PurchaseOrderCreate, PurchaseOrderResponse

router = APIRouter(prefix="/api/purchase-orders", tags=["Purchase Orders"], dependencies=[Depends(get_current_user)])

@router.get("/", response_model=List[PurchaseOrderResponse])
def list_items(
    skip: int = Query(0, ge=0), limit: int = Query(100, ge=1, le=500),
    po_status: Optional[str] = Query(None, alias="status"), buyer_id: Optional[int] = None,
    db: Session = Depends(get_db)
):
    q = db.query(PurchaseOrder)
    if po_status is not None:
        q = q.filter(PurchaseOrder.status == po_status)
    if buyer_id is not None:
        q = q.filter(PurchaseOrder.buyer_id == buyer_id)
    return q.offset(skip).limit(limit).all()

@router.get("/{item_id}", response_model=PurchaseOrderResponse)
def get_item(item_id: int, db: Session = Depends(get_db)):
    item = db.query(PurchaseOrder).filter(PurchaseOrder.id == item_id).first()
    if not item:
        raise HTTPException(status_code=404, detail="Not found")
    return item

@router.post("/", response_model=PurchaseOrderResponse, status_code=status.HTTP_201_CREATED)
def create_item(data: PurchaseOrderCreate, db: Session = Depends(get_db), current_user: User = Depends(RoleChecker(['admin', 'market_partner', 'fpo_manager']))):
    item = PurchaseOrder(**data.model_dump())
    db.add(item)
    db.commit()
    db.refresh(item)
    return item

@router.put("/{item_id}", response_model=PurchaseOrderResponse)
def update_item(item_id: int, data: PurchaseOrderCreate, db: Session = Depends(get_db), current_user: User = Depends(RoleChecker(['admin', 'market_partner', 'fpo_manager']))):
    item = db.query(PurchaseOrder).filter(PurchaseOrder.id == item_id).first()
    if not item:
        raise HTTPException(status_code=404, detail="Not found")
    for key, value in data.model_dump(exclude_unset=True).items():
        setattr(item, key, value)
    db.commit()
    db.refresh(item)
    return item
