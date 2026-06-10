from fastapi import APIRouter, Depends, HTTPException, status, Query
from sqlalchemy.orm import Session
from typing import List, Optional

from app.dependencies import get_current_user, RoleChecker
from app.models.user import User
from app.database import get_db
from app.models import ActivityLog
from app.schemas.activity_log import ActivityLogCreate, ActivityLogResponse

router = APIRouter(prefix="/api/activity-logs", tags=["Activity Logs"], dependencies=[Depends(get_current_user)])

@router.get("/", response_model=List[ActivityLogResponse])
def list_items(
    skip: int = Query(0, ge=0), limit: int = Query(100, ge=1, le=500),
    log_type: Optional[str] = Query(None, alias="type"),
    db: Session = Depends(get_db)
):
    q = db.query(ActivityLog).order_by(ActivityLog.created_at.desc())
    if log_type is not None:
        q = q.filter(ActivityLog.type == log_type)
    return q.offset(skip).limit(limit).all()

@router.post("/", response_model=ActivityLogResponse, status_code=status.HTTP_201_CREATED)
def create_item(data: ActivityLogCreate, db: Session = Depends(get_db), current_user: User = Depends(RoleChecker(['admin', 'fpo_manager', 'fpo_staff', 'aggregator']))):
    item = ActivityLog(**data.model_dump())
    db.add(item)
    db.commit()
    db.refresh(item)
    return item
