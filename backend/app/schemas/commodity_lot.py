from pydantic import BaseModel, ConfigDict
from typing import Optional
from datetime import datetime, date

class CommodityLotBase(BaseModel):
    lot_code: str
    farmer_id: int
    commodity_id: int
    variety: Optional[str] = None
    quantity_kg: float
    bag_count: int = 1
    moisture_pct: Optional[float] = None
    grade: str = "pending"
    warehouse_id: int
    zone: Optional[str] = None
    status: str = "qc_pending"
    intake_type: str = "walk_in"
    source_gps_lat: Optional[float] = None
    source_gps_lng: Optional[float] = None
    remarks: Optional[str] = None
    intake_date: date

class CommodityLotCreate(CommodityLotBase):
    pass

from .farmer import FarmerResponse
from .commodity import CommodityResponse
from .warehouse import WarehouseResponse

class CommodityLotResponse(CommodityLotBase):
    id: int
    created_at: datetime
    updated_at: datetime
    farmer: Optional[FarmerResponse] = None
    commodity: Optional[CommodityResponse] = None
    warehouse: Optional[WarehouseResponse] = None
    model_config = ConfigDict(from_attributes=True)
