from pydantic import BaseModel, ConfigDict
from typing import Optional
from datetime import datetime, date

class WarehouseReceiptBase(BaseModel):
    wr_code: str
    lot_id: int
    farmer_id: int
    issue_date: date
    expiry_date: date
    quantity_kg: float
    grade: str
    valuation: float
    collateral_status: str = "none"
    pledge_bank: Optional[str] = None
    loan_amount: float = 0.0
    status: str = "active"
    enam_submitted: bool = False

class WarehouseReceiptCreate(WarehouseReceiptBase):
    pass

from .commodity_lot import CommodityLotResponse
from .farmer import FarmerResponse

class WarehouseReceiptResponse(WarehouseReceiptBase):
    id: int
    created_at: datetime
    updated_at: datetime
    lot: Optional[CommodityLotResponse] = None
    farmer: Optional[FarmerResponse] = None
    model_config = ConfigDict(from_attributes=True)
