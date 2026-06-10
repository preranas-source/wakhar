from pydantic import BaseModel, ConfigDict
from typing import Optional
from datetime import datetime

class PurchaseOrderBase(BaseModel):
    po_code: str
    buyer_id: int
    commodity_id: int
    grade: str
    quantity_kg: float
    price_per_mt: float
    warehouse_id: int
    status: str = "pending"
    grn_id: Optional[str] = None
    payment_status: str = "pending"
    payment_ref: Optional[str] = None

class PurchaseOrderCreate(PurchaseOrderBase):
    pass

class PurchaseOrderResponse(PurchaseOrderBase):
    id: int
    created_at: datetime
    updated_at: datetime
    model_config = ConfigDict(from_attributes=True)
