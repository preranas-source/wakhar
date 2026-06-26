from pydantic import BaseModel, Field, field_validator
from typing import Optional
from datetime import datetime


class LoginRequest(BaseModel):
    phone: str = Field(..., description="Registered phone number of the user")
    password: str = Field(..., description="Cleartext password")


class UserResponse(BaseModel):
    id: int
    email: Optional[str] = None
    phone: str
    full_name: str
    role: Optional[str] = None
    role_id: Optional[int] = None
    initials: Optional[str] = None
    is_active: bool
    fpo_id: Optional[int] = None
    created_at: datetime
    updated_at: datetime

    class Config:
        from_attributes = True

    @field_validator("role", mode="before")
    @classmethod
    def extract_role_name(cls, v):
        """Convert Role ORM object to its name string."""
        if v is None:
            return None
        if isinstance(v, str):
            return v
        # ORM Role object
        return getattr(v, "name", str(v))


class TokenResponse(BaseModel):
    access_token: str
    token_type: str = "bearer"
    user: UserResponse


class RegisterRequest(BaseModel):
    phone: str = Field(..., description="Phone number")
    password: str = Field(..., description="Cleartext password")
    full_name: str = Field(..., description="User full name")
    email: Optional[str] = Field(None, description="Optional email address")
    role: str = Field(..., description="Role name, e.g. farmer, admin")
    fpo_id: Optional[int] = Field(None, description="Optional associated FPO ID")
    aadhaar: Optional[str] = Field(None, description="Aadhar number")
    village: Optional[str] = Field(None, description="Farmer village")
    bank_account: Optional[str] = Field(None, description="Bank account number")
    bank_ifsc: Optional[str] = Field(None, description="Bank IFSC code")


class FPOResponse(BaseModel):
    id: int
    name: str
    code: str

    class Config:
        from_attributes = True


class ChangePasswordRequest(BaseModel):
    old_password: str
    new_password: str
