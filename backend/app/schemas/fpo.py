from pydantic import BaseModel, ConfigDict
from typing import Optional
from datetime import datetime

class FPOBase(BaseModel):
    name: str
    code: str
    region: Optional[str] = None
    district: Optional[str] = None
    state: str = "Maharashtra"
    contact_phone: Optional[str] = None
    contact_email: Optional[str] = None
    aggregator_id: Optional[int] = None

class FPOCreate(FPOBase):
    pass

class FPOResponse(FPOBase):
    id: int
    created_at: datetime
    updated_at: datetime
    model_config = ConfigDict(from_attributes=True)
