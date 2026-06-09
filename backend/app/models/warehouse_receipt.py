"""Warehouse Receipt (e-WR) model — digital tokens with collateral support."""

import enum
from sqlalchemy import Column, Integer, String, Numeric, Boolean, Enum, Date, ForeignKey
from sqlalchemy.orm import relationship

from .base import Base, TimestampMixin


class CollateralStatus(str, enum.Enum):
    none = "none"
    applied = "applied"
    disbursed = "disbursed"
    released = "released"


class WRStatus(str, enum.Enum):
    active = "active"
    amended = "amended"
    withdrawn = "withdrawn"
    expired = "expired"


class WarehouseReceipt(Base, TimestampMixin):
    __tablename__ = "warehouse_receipts"

    id = Column(Integer, primary_key=True, autoincrement=True)
    wr_code = Column(String(30), unique=True, nullable=False)  # "WR-2026-0347"

    lot_id = Column(Integer, ForeignKey("commodity_lots.id"), nullable=False)
    farmer_id = Column(Integer, ForeignKey("farmers.id"), nullable=False)

    issue_date = Column(Date, nullable=False)
    expiry_date = Column(Date, nullable=False)  # typically +3 months

    quantity_kg = Column(Numeric(12, 2), nullable=False)
    grade = Column(String(20), nullable=False)
    valuation = Column(Numeric(14, 2), nullable=False)  # face value in ₹

    collateral_status = Column(
        Enum(CollateralStatus),
        nullable=False,
        default=CollateralStatus.none,
    )
    pledge_bank = Column(String(100), nullable=True)  # "NABARD", etc.
    loan_amount = Column(Numeric(14, 2), default=0, nullable=False)

    status = Column(Enum(WRStatus), nullable=False, default=WRStatus.active)
    enam_submitted = Column(Boolean, default=False, nullable=False)

    # Relationships
    lot = relationship("CommodityLot", back_populates="warehouse_receipt")
    farmer = relationship("Farmer", back_populates="warehouse_receipts")

    def __repr__(self):
        return f"<WarehouseReceipt {self.wr_code}: ₹{self.valuation}>"
