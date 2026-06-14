from pydantic import BaseModel, Field
from typing import Optional
from datetime import datetime
from app.models.user import UserRole

class LoginRequest(BaseModel):
    phone: str = Field(..., description="Registered phone number of the user")
    password: str = Field(..., description="Cleartext password")

class UserResponse(BaseModel):
    id: int
    email: Optional[str] = None
    phone: str
    full_name: str
    role: UserRole
    initials: Optional[str] = None
    is_active: bool
    fpo_id: Optional[int] = None
    created_at: datetime
    updated_at: datetime

    class Config:
        from_attributes = True

class TokenResponse(BaseModel):
    access_token: str
    token_type: str = "bearer"
    user: UserResponse

class RegisterRequest(BaseModel):
    phone: str = Field(..., description="Phone number")
    password: str = Field(..., description="Cleartext password")
    full_name: str = Field(..., description="User full name")
    email: Optional[str] = Field(None, description="Optional email address")
    role: UserRole = Field(..., description="User access role")
    fpo_id: Optional[int] = Field(None, description="Optional associated FPO ID")

class FPOResponse(BaseModel):
    id: int
    name: str
    code: str

    class Config:
        from_attributes = True
