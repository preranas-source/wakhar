from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session
from sqlalchemy import func

from app.dependencies import get_current_user, RoleChecker
from app.models.user import User
from app.database import get_db
from app.models import CommodityLot, Farmer, Warehouse, ActivityLog

router = APIRouter(prefix="/api/dashboard", tags=["Dashboard"], dependencies=[Depends(get_current_user)])

@router.get("/stats")
def get_dashboard_stats(db: Session = Depends(get_db), current_user: User = Depends(get_current_user)):
    # Base queries
    q_lots = db.query(CommodityLot)
    q_farmers = db.query(Farmer)
    q_warehouses = db.query(Warehouse)
    q_activities = db.query(ActivityLog)
    
    role_name = current_user.role_rel.name if current_user.role_rel else "unassigned"
    
    if role_name == "admin":
        pass  # admin sees all globally
        
    elif role_name == "aggregator":
        aggregator_fpo_id = current_user.fpo_id
        if aggregator_fpo_id:
            from app.models import FPO
            child_ids = [f.id for f in db.query(FPO.id).filter(FPO.aggregator_id == aggregator_fpo_id).all()]
            allowed_fpo_ids = [aggregator_fpo_id] + child_ids
            
            q_lots = q_lots.filter(CommodityLot.warehouse.has(Warehouse.fpo_id.in_(allowed_fpo_ids)))
            q_farmers = q_farmers.filter(Farmer.fpo_id.in_(allowed_fpo_ids))
            q_warehouses = q_warehouses.filter(Warehouse.fpo_id.in_(allowed_fpo_ids))
            
            user_ids = [u.id for u in db.query(User.id).filter(User.fpo_id.in_(allowed_fpo_ids)).all()]
            if user_ids:
                q_activities = q_activities.filter(ActivityLog.user_id.in_(user_ids))
            else:
                q_activities = q_activities.filter(ActivityLog.user_id == current_user.id)
        else:
            q_lots = q_lots.filter(False)
            q_farmers = q_farmers.filter(False)
            q_warehouses = q_warehouses.filter(False)
            q_activities = q_activities.filter(False)
            
    elif role_name in ("fpo_manager", "fpo_staff"):
        user_fpo_id = current_user.fpo_id
        if user_fpo_id:
            q_lots = q_lots.filter(CommodityLot.warehouse.has(Warehouse.fpo_id == user_fpo_id))
            q_farmers = q_farmers.filter(Farmer.fpo_id == user_fpo_id)
            q_warehouses = q_warehouses.filter(Warehouse.fpo_id == user_fpo_id)
            
            user_ids = [u.id for u in db.query(User.id).filter(User.fpo_id == user_fpo_id).all()]
            if user_ids:
                q_activities = q_activities.filter(ActivityLog.user_id.in_(user_ids))
            else:
                q_activities = q_activities.filter(ActivityLog.user_id == current_user.id)
        else:
            q_lots = q_lots.filter(False)
            q_farmers = q_farmers.filter(False)
            q_warehouses = q_warehouses.filter(False)
            q_activities = q_activities.filter(False)
            
    elif role_name == "farmer":
        if current_user.farmer_profile:
            q_lots = q_lots.filter(CommodityLot.farmer_id == current_user.farmer_profile.id)
            q_farmers = q_farmers.filter(Farmer.id == current_user.farmer_profile.id)
            q_warehouses = q_warehouses.filter(Warehouse.fpo_id == current_user.farmer_profile.fpo_id)
            q_activities = q_activities.filter(ActivityLog.user_id == current_user.id)
        else:
            q_lots = q_lots.filter(False)
            q_farmers = q_farmers.filter(False)
            q_warehouses = q_warehouses.filter(False)
            q_activities = q_activities.filter(False)

    total_lots = q_lots.count()
    total_farmers = q_farmers.count()
    total_warehouses = q_warehouses.count()
    
    # Calculate stock in MT from CommodityLots (excluding dispatched/withdrawn)
    active_lots_query = q_lots.filter(CommodityLot.status.not_in(['in_transit', 'delivered', 'withdrawn']))
    total_kg = active_lots_query.with_entities(func.sum(CommodityLot.quantity_kg)).scalar() or 0.0
    total_stock_mt = float(total_kg) / 1000.0

    lots_by_status = {}
    for status, count in q_lots.with_entities(CommodityLot.status, func.count(CommodityLot.id)).group_by(CommodityLot.status).all():
        lots_by_status[status] = count

    lots_by_grade = {}
    for grade, count in q_lots.with_entities(CommodityLot.grade, func.count(CommodityLot.id)).group_by(CommodityLot.grade).all():
        lots_by_grade[grade] = count

    recent_activity = []
    for log in q_activities.order_by(ActivityLog.created_at.desc()).limit(10).all():
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
