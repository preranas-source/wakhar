"""Stock Movement model — tracks every stock movement (intake, transfer, dispatch, return)."""

import enum
from sqlalchemy import Column, Integer, String, Numeric, Enum, DateTime, Text, ForeignKey
from sqlalchemy.orm import relationship
from datetime import datetime, timezone

from .base import Base


class MovementType(str, enum.Enum):
    intake = "intake"
    transfer = "transfer"
    dispatch = "dispatch"
    return_ = "return"
    adjustment = "adjustment"


class StockMovement(Base):
    __tablename__ = "stock_movements"

    id = Column(Integer, primary_key=True, autoincrement=True)
    movement_code = Column(String(30), unique=True, nullable=False)

    type = Column(Enum(MovementType), nullable=False)

    lot_id = Column(Integer, ForeignKey("commodity_lots.id"), nullable=False)
    from_warehouse_id = Column(Integer, ForeignKey("warehouses.id"), nullable=True)  # null for intake
    to_warehouse_id = Column(Integer, ForeignKey("warehouses.id"), nullable=True)  # null for outbound dispatch

    quantity_kg = Column(Numeric(12, 2), nullable=False)
    performed_by_id = Column(Integer, ForeignKey("users.id"), nullable=False)
    movement_date = Column(DateTime, nullable=False)

    remarks = Column(Text, nullable=True)
    created_at = Column(
        DateTime,
        default=lambda: datetime.now(timezone.utc),
        nullable=False,
    )

    # Relationships
    lot = relationship("CommodityLot", back_populates="stock_movements")
    from_warehouse = relationship(
        "Warehouse",
        foreign_keys=[from_warehouse_id],
        back_populates="movements_from",
    )
    to_warehouse = relationship(
        "Warehouse",
        foreign_keys=[to_warehouse_id],
        back_populates="movements_to",
    )
    performed_by_user = relationship("User", back_populates="stock_movements")

    def __repr__(self):
        return f"<StockMovement {self.movement_code}: {self.type.value} {self.quantity_kg}kg>"
