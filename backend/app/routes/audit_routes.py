from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from typing import List
from datetime import datetime
from pydantic import BaseModel

from app.dependencies import get_current_user, RoleChecker
from app.models.user import User
from app.database import get_db
from app.models.stock_audit import StockAudit, AuditStatus
from app.models.warehouse import Warehouse

router = APIRouter(prefix="/api/audits", tags=["Audits"], dependencies=[Depends(get_current_user)])

class AuditCreate(BaseModel):
    warehouse_id: int
    actual_stock_mt: float
    remarks: str = ""

from typing import List, Optional

class AuditResponse(BaseModel):
    id: int
    audit_code: str
    warehouse_id: int
    auditor_id: int
    audit_date: datetime
    status: str
    system_stock_mt: float
    actual_stock_mt: float
    variance_mt: float
    remarks: Optional[str] = None

    class Config:
        from_attributes = True

@router.get("/", response_model=List[AuditResponse])
def get_audits(warehouse_id: int = None, db: Session = Depends(get_db)):
    q = db.query(StockAudit)
    if warehouse_id:
        q = q.filter(StockAudit.warehouse_id == warehouse_id)
    return q.order_by(StockAudit.audit_date.desc()).all()

@router.post("/", response_model=AuditResponse, status_code=status.HTTP_201_CREATED)
def create_audit(data: AuditCreate, db: Session = Depends(get_db), current_user: User = Depends(RoleChecker(['admin', 'fpo_manager', 'fpo_staff']))):
    warehouse = db.query(Warehouse).filter(Warehouse.id == data.warehouse_id).first()
    if not warehouse:
        raise HTTPException(status_code=404, detail="Warehouse not found")

    # Calculate actual system stock in MT by summing only active lots (excluding in_transit, delivered, and withdrawn)
    from app.models.commodity_lot import CommodityLot
    from sqlalchemy import func
    total_kg = db.query(func.sum(CommodityLot.quantity_kg)).filter(
        CommodityLot.warehouse_id == warehouse.id,
        CommodityLot.status.not_in(['in_transit', 'delivered', 'withdrawn'])
    ).scalar() or 0.0
    system_stock = float(total_kg) / 1000.0

    variance = data.actual_stock_mt - system_stock

    audit_status = AuditStatus.completed
    if abs(variance) > 0:
        audit_status = AuditStatus.discrepancy

    audit_code = f"AUD-{datetime.now().strftime('%Y%m')}-{str(int(datetime.now().timestamp()))[-4:]}"

    audit = StockAudit(
        audit_code=audit_code,
        warehouse_id=data.warehouse_id,
        auditor_id=current_user.id,
        audit_date=datetime.now(),
        status=audit_status,
        system_stock_mt=system_stock,
        actual_stock_mt=data.actual_stock_mt,
        variance_mt=variance,
        remarks=data.remarks
    )
    
    db.add(audit)
    db.commit()
    db.refresh(audit)
    return audit
