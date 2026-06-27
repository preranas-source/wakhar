from pydantic import BaseModel, ConfigDict
from typing import Optional
from datetime import datetime

class FarmerBase(BaseModel):
    farmer_code: str
    name: str
    phone: str
    aadhaar: Optional[str] = None
    village: Optional[str] = None
    bank_account: Optional[str] = None
    bank_ifsc: Optional[str] = None
    fpo_id: int
    total_deposit_kg: float = 0.0
    user_id: Optional[int] = None

class FarmerCreate(FarmerBase):
    password: Optional[str] = None

class FarmerResponse(FarmerBase):
    id: int
    created_at: datetime
    updated_at: datetime
    model_config = ConfigDict(from_attributes=True)
