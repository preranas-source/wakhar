from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session
from sqlalchemy import func

from app.dependencies import get_current_user, RoleChecker
from app.models.user import User
from app.database import get_db
from app.models import CommodityLot, Farmer, Warehouse, ActivityLog

router = APIRouter(prefix="/api/dashboard", tags=["Dashboard"], dependencies=[Depends(get_current_user)])

@router.get("/stats")
def get_dashboard_stats(db: Session = Depends(get_db)):
    total_lots = db.query(CommodityLot).count()
    total_farmers = db.query(Farmer).count()
    total_warehouses = db.query(Warehouse).count()
    
    total_stock_mt = db.query(func.sum(Warehouse.current_stock_mt)).scalar() or 0.0

    lots_by_status = {}
    for status, count in db.query(CommodityLot.status, func.count(CommodityLot.id)).group_by(CommodityLot.status).all():
        lots_by_status[status] = count

    lots_by_grade = {}
    for grade, count in db.query(CommodityLot.grade, func.count(CommodityLot.id)).group_by(CommodityLot.grade).all():
        lots_by_grade[grade] = count

    recent_activity = []
    for log in db.query(ActivityLog).order_by(ActivityLog.created_at.desc()).limit(10).all():
        recent_activity.append({
            "id": log.id,
            "type": log.type,
            "message": log.message,
            "reference": log.reference,
            "created_at": log.created_at.isoformat(),
        })

    return {
        "total_lots": total_lots,
        "total_farmers": total_farmers,
        "total_warehouses": total_warehouses,
        "total_stock_mt": float(total_stock_mt),
        "lots_by_status": lots_by_status,
        "lots_by_grade": lots_by_grade,
        "recent_activity": recent_activity
    }
