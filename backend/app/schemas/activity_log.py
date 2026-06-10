from pydantic import BaseModel, ConfigDict
from typing import Optional
from datetime import datetime

class ActivityLogBase(BaseModel):
    type: str
    message: str
    reference: Optional[str] = None
    user_id: Optional[int] = None

class ActivityLogCreate(ActivityLogBase):
    pass

class ActivityLogResponse(ActivityLogBase):
    id: int
    created_at: datetime
    model_config = ConfigDict(from_attributes=True)
