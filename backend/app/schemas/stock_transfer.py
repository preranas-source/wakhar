from pydantic import BaseModel, ConfigDict
from typing import Optional
from datetime import datetime

class StockTransferBase(BaseModel):
    trf_code: str
    lot_id: int
    quantity_kg: float
    source_warehouse_id: int
    destination_warehouse_id: int
    vehicle_reg: Optional[str] = None
    status: str = "GRN Pending"
    variance_kg: Optional[float] = 0.0
    variance_reason: Optional[str] = None
    notes: Optional[str] = None
    dispatch_date: datetime
    arrival_date: Optional[datetime] = None

class StockTransferCreate(StockTransferBase):
    client_timestamp: Optional[datetime] = None

class StockTransferResponse(StockTransferBase):
    id: int
    created_at: datetime
    updated_at: datetime
    model_config = ConfigDict(from_attributes=True)
