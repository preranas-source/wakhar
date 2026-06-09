"""Commodity Lot model — represents each intake/deposit of produce."""

import enum
from sqlalchemy import Column, Integer, String, Numeric, Enum, Date, Text, ForeignKey
from sqlalchemy.orm import relationship

from .base import Base, TimestampMixin


class GradeEnum(str, enum.Enum):
    grade_a = "grade_a"
    grade_b = "grade_b"
    grade_c = "grade_c"
    rejected = "rejected"
    pending = "pending"


class LotStatus(str, enum.Enum):
    available = "available"
    reserved = "reserved"
    qc_pending = "qc_pending"
    in_transit = "in_transit"
    delivered = "delivered"
    returned = "returned"


class IntakeType(str, enum.Enum):
    walk_in = "walk_in"
    pre_registered = "pre_registered"


class CommodityLot(Base, TimestampMixin):
    __tablename__ = "commodity_lots"

    id = Column(Integer, primary_key=True, autoincrement=True)
    lot_code = Column(String(30), unique=True, nullable=False)  # "LOT-2026-091"

    farmer_id = Column(Integer, ForeignKey("farmers.id"), nullable=False)
    commodity_id = Column(Integer, ForeignKey("commodities.id"), nullable=False)

    variety = Column(String(100), nullable=True)  # "Basmati", "Lokwan", "JS-335"
    quantity_kg = Column(Numeric(12, 2), nullable=False)
    bag_count = Column(Integer, nullable=False, default=1)
    moisture_pct = Column(Numeric(5, 2), nullable=True)
    grade = Column(Enum(GradeEnum), nullable=False, default=GradeEnum.pending)

    warehouse_id = Column(Integer, ForeignKey("warehouses.id"), nullable=False)
    zone = Column(String(100), nullable=True)  # "Zone A — Rack 3"

    status = Column(Enum(LotStatus), nullable=False, default=LotStatus.qc_pending)
    intake_type = Column(Enum(IntakeType), nullable=False, default=IntakeType.walk_in)

    source_gps_lat = Column(Numeric(10, 7), nullable=True)
    source_gps_lng = Column(Numeric(10, 7), nullable=True)

    remarks = Column(Text, nullable=True)
    intake_date = Column(Date, nullable=False)

    # Relationships
    farmer = relationship("Farmer", back_populates="commodity_lots")
    commodity = relationship("Commodity", back_populates="commodity_lots")
    warehouse = relationship("Warehouse", back_populates="commodity_lots")
    quality_records = relationship("QualityRecord", back_populates="lot")
    warehouse_receipt = relationship("WarehouseReceipt", back_populates="lot", uselist=False)
    stock_movements = relationship("StockMovement", back_populates="lot")
    dispatch_notes = relationship("DispatchNote", back_populates="lot")

    def __repr__(self):
        return f"<CommodityLot {self.lot_code}: {self.quantity_kg}kg ({self.status.value})>"
