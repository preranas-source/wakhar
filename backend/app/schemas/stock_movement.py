from pydantic import BaseModel, ConfigDict
from typing import Optional
from datetime import datetime

class StockMovementBase(BaseModel):
    movement_code: str
    type: str
    lot_id: int
    from_warehouse_id: Optional[int] = None
    to_warehouse_id: Optional[int] = None
    quantity_kg: float
    performed_by_id: int
    movement_date: datetime
    remarks: Optional[str] = None

class StockMovementCreate(StockMovementBase):
    pass

class StockMovementResponse(StockMovementBase):
    id: int
    created_at: datetime
    model_config = ConfigDict(from_attributes=True)
