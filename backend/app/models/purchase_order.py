"""Purchase Order model — market partner orders (Raigad Mart, etc.)."""

import enum
from sqlalchemy import Column, Integer, String, Numeric, Enum, ForeignKey
from sqlalchemy.orm import relationship

from .base import Base, TimestampMixin


class POStatus(str, enum.Enum):
    pending = "pending"
    accepted = "accepted"
    fulfilled = "fulfilled"
    cancelled = "cancelled"


class PaymentStatus(str, enum.Enum):
    pending = "pending"
    confirmed = "confirmed"
    failed = "failed"


class PurchaseOrder(Base, TimestampMixin):
    __tablename__ = "purchase_orders"

    id = Column(Integer, primary_key=True, autoincrement=True)
    po_code = Column(String(30), unique=True, nullable=False)  # "PO-2026-112"

    buyer_id = Column(Integer, ForeignKey("users.id"), nullable=False)
    commodity_id = Column(Integer, ForeignKey("commodities.id"), nullable=False)

    grade = Column(String(20), nullable=False)
    quantity_kg = Column(Numeric(12, 2), nullable=False)
    price_per_mt = Column(Numeric(14, 2), nullable=False)  # ₹ per metric ton

    warehouse_id = Column(Integer, ForeignKey("warehouses.id"), nullable=False)

    status = Column(Enum(POStatus), nullable=False, default=POStatus.pending)

    grn_id = Column(String(50), nullable=True)  # GRN reference after delivery
    payment_status = Column(
        Enum(PaymentStatus),
        nullable=False,
        default=PaymentStatus.pending,
    )
    payment_ref = Column(String(100), nullable=True)  # Razorpay payment ID

    # Relationships
    buyer = relationship("User", back_populates="purchase_orders")
    commodity = relationship("Commodity", back_populates="purchase_orders")
    warehouse = relationship("Warehouse", back_populates="purchase_orders")

    def __repr__(self):
        return f"<PurchaseOrder {self.po_code}: {self.status.value}>"
