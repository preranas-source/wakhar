"""User model — covers all system roles (farmer, FPO staff, aggregator, market partner)."""

from sqlalchemy import Column, Integer, String, Boolean, ForeignKey
from sqlalchemy.orm import relationship

from .base import Base, TimestampMixin


class User(Base, TimestampMixin):
    __tablename__ = "users"

    id = Column(Integer, primary_key=True, autoincrement=True)
    email = Column(String(255), unique=True, nullable=True)
    phone = Column(String(20), unique=True, nullable=False)
    password_hash = Column(String(255), nullable=False)
    full_name = Column(String(150), nullable=False)
    initials = Column(String(5), nullable=True)
    is_active = Column(Boolean, default=True, nullable=False)

    # Dynamic role via FK
    role_id = Column(Integer, ForeignKey("roles.id", ondelete="SET NULL"), nullable=True)

    # An FPO staff / manager belongs to an FPO
    fpo_id = Column(Integer, ForeignKey("fpos.id"), nullable=True)

    # Relationships
    role_rel = relationship("Role", back_populates="users")
    fpo = relationship("FPO", back_populates="users")
    farmer_profile = relationship("Farmer", back_populates="user", uselist=False)
    quality_inspections = relationship("QualityRecord", back_populates="inspector")
    stock_movements = relationship("StockMovement", back_populates="performed_by_user")
    purchase_orders = relationship("PurchaseOrder", back_populates="buyer")
    activity_logs = relationship("ActivityLog", back_populates="user")

    @property
    def role(self):
        """Backward-compatible property: returns the Role object.
        Code that used user.role.value now uses user.role.name.
        """
        return self.role_rel

    def __repr__(self):
        role_name = self.role_rel.name if self.role_rel else "unassigned"
        return f"<User {self.id}: {self.full_name} ({role_name})>"
