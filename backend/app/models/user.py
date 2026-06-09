"""User model — covers all system roles (farmer, FPO staff, aggregator, market partner)."""

import enum
from sqlalchemy import Column, Integer, String, Boolean, Enum, ForeignKey
from sqlalchemy.orm import relationship

from .base import Base, TimestampMixin


class UserRole(str, enum.Enum):
    farmer = "farmer"
    fpo_staff = "fpo_staff"
    fpo_manager = "fpo_manager"
    aggregator = "aggregator"
    market_partner = "market_partner"
    admin = "admin"


class User(Base, TimestampMixin):
    __tablename__ = "users"

    id = Column(Integer, primary_key=True, autoincrement=True)
    email = Column(String(255), unique=True, nullable=True)
    phone = Column(String(20), unique=True, nullable=False)
    password_hash = Column(String(255), nullable=False)
    full_name = Column(String(150), nullable=False)
    role = Column(Enum(UserRole), nullable=False)
    initials = Column(String(5), nullable=True)
    is_active = Column(Boolean, default=True, nullable=False)

    # An FPO staff / manager belongs to an FPO
    fpo_id = Column(Integer, ForeignKey("fpos.id"), nullable=True)

    # Relationships
    fpo = relationship("FPO", back_populates="users")
    farmer_profile = relationship("Farmer", back_populates="user", uselist=False)
    quality_inspections = relationship("QualityRecord", back_populates="inspector")
    stock_movements = relationship("StockMovement", back_populates="performed_by_user")
    purchase_orders = relationship("PurchaseOrder", back_populates="buyer")
    activity_logs = relationship("ActivityLog", back_populates="user")

    def __repr__(self):
        return f"<User {self.id}: {self.full_name} ({self.role.value})>"
