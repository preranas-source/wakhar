from pydantic import BaseModel, ConfigDict
from typing import Optional
from datetime import datetime

class WarehouseBase(BaseModel):
    name: str
    code: str
    type: str = "fpo"
    fpo_id: int
    geo_lat: Optional[float] = None
    geo_lng: Optional[float] = None
    capacity_mt: float
    current_stock_mt: float = 0.0
    address: Optional[str] = None
    contact_person: Optional[str] = None
    contact_phone: Optional[str] = None
    operating_hours: Optional[str] = None
    permitted_commodities: Optional[str] = None
    is_active: bool = True

class WarehouseCreate(WarehouseBase):
    pass

class WarehouseResponse(WarehouseBase):
    id: int
    created_at: datetime
    updated_at: datetime
    model_config = ConfigDict(from_attributes=True)
