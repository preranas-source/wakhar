"""Commodity master model."""

from sqlalchemy import Column, Integer, String, Numeric, DateTime
from sqlalchemy.orm import relationship
from datetime import datetime, timezone

from .base import Base


class Commodity(Base):
    __tablename__ = "commodities"

    id = Column(Integer, primary_key=True, autoincrement=True)
    name = Column(String(100), unique=True, nullable=False)  # "Rice", "Wheat", etc.
    name_mr = Column(String(100), nullable=True)  # Marathi name
    name_hi = Column(String(100), nullable=True)  # Hindi name
    base_rate = Column(Numeric(10, 2), nullable=False)  # ₹ per kg for valuation
    category = Column(String(50), nullable=True)  # "cereal", "oilseed", "vegetable"
    created_at = Column(
        DateTime,
        default=lambda: datetime.now(timezone.utc),
        nullable=False,
    )

    # Relationships
    commodity_lots = relationship("CommodityLot", back_populates="commodity")
    purchase_orders = relationship("PurchaseOrder", back_populates="commodity")

    def __repr__(self):
        return f"<Commodity {self.id}: {self.name} (₹{self.base_rate}/kg)>"
