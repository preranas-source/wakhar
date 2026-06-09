"""Warehouse master data model."""

import enum
from sqlalchemy import Column, Integer, String, Boolean, Enum, Numeric, ForeignKey, Text
from sqlalchemy.orm import relationship

from .base import Base, TimestampMixin


class WarehouseType(str, enum.Enum):
    fpo = "fpo"
    aggregator = "aggregator"
    cold_storage = "cold_storage"


class Warehouse(Base, TimestampMixin):
    __tablename__ = "warehouses"

    id = Column(Integer, primary_key=True, autoincrement=True)
    name = Column(String(200), nullable=False)
    code = Column(String(50), unique=True, nullable=False)
    type = Column(Enum(WarehouseType), nullable=False, default=WarehouseType.fpo)

    fpo_id = Column(Integer, ForeignKey("fpos.id"), nullable=False)

    geo_lat = Column(Numeric(10, 7), nullable=True)
    geo_lng = Column(Numeric(10, 7), nullable=True)
    capacity_mt = Column(Numeric(10, 2), nullable=False, default=0)
    current_stock_mt = Column(Numeric(10, 2), nullable=False, default=0)

    address = Column(Text, nullable=True)
    contact_person = Column(String(150), nullable=True)
    contact_phone = Column(String(20), nullable=True)
    operating_hours = Column(String(100), nullable=True)
    permitted_commodities = Column(Text, nullable=True)  # JSON or comma-separated

    is_active = Column(Boolean, default=True, nullable=False)

    # Relationships
    fpo = relationship("FPO", back_populates="warehouses")
    commodity_lots = relationship("CommodityLot", back_populates="warehouse")
    movements_from = relationship(
        "StockMovement",
        foreign_keys="StockMovement.from_warehouse_id",
        back_populates="from_warehouse",
    )
    movements_to = relationship(
        "StockMovement",
        foreign_keys="StockMovement.to_warehouse_id",
        back_populates="to_warehouse",
    )
    purchase_orders = relationship("PurchaseOrder", back_populates="warehouse")

    def __repr__(self):
        return f"<Warehouse {self.id}: {self.name} ({self.type.value})>"
