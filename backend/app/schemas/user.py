from pydantic import BaseModel, ConfigDict
from typing import Optional
from datetime import datetime

class UserBase(BaseModel):
    email: Optional[str] = None
    phone: str
    full_name: str
    role: str
    initials: Optional[str] = None
    is_active: bool = True
    fpo_id: Optional[int] = None

class UserCreate(UserBase):
    password_hash: str

class UserResponse(UserBase):
    id: int
    created_at: datetime
    updated_at: datetime
    model_config = ConfigDict(from_attributes=True)
