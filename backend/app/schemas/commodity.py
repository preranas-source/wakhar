from pydantic import BaseModel, ConfigDict
from typing import Optional
from datetime import datetime

class CommodityBase(BaseModel):
    name: str
    name_mr: Optional[str] = None
    name_hi: Optional[str] = None
    base_rate: float
    category: Optional[str] = None

class CommodityCreate(CommodityBase):
    pass

class CommodityResponse(CommodityBase):
    id: int
    created_at: datetime
    model_config = ConfigDict(from_attributes=True)
