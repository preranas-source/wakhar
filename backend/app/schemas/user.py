from pydantic import BaseModel, ConfigDict, field_validator
from typing import Optional
from datetime import datetime


class UserBase(BaseModel):
    email: Optional[str] = None
    phone: str
    full_name: str
    role: Optional[str] = None
    role_id: Optional[int] = None
    initials: Optional[str] = None
    is_active: bool = True
    fpo_id: Optional[int] = None


class UserCreate(UserBase):
    password_hash: str


class UserUpdate(UserBase):
    password_hash: Optional[str] = None


class UserResponse(UserBase):
    id: int
    fpo_name: Optional[str] = None
    created_at: datetime
    updated_at: datetime
    model_config = ConfigDict(from_attributes=True)

    @field_validator("role", mode="before")
    @classmethod
    def extract_role_name(cls, v):
        if v is None:
            return None
        if isinstance(v, str):
            return v
        return getattr(v, "name", str(v))
