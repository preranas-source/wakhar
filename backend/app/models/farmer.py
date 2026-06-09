"""Farmer account model."""

from sqlalchemy import Column, Integer, String, Numeric, ForeignKey
from sqlalchemy.orm import relationship

from .base import Base, TimestampMixin


class Farmer(Base, TimestampMixin):
    __tablename__ = "farmers"

    id = Column(Integer, primary_key=True, autoincrement=True)
    farmer_code = Column(String(20), unique=True, nullable=False)  # "FM-00412"
    name = Column(String(150), nullable=False)
    phone = Column(String(20), nullable=False)
    aadhaar = Column(String(20), nullable=True)  # masked/encrypted
    village = Column(String(100), nullable=True)
    bank_account = Column(String(30), nullable=True)
    bank_ifsc = Column(String(20), nullable=True)

    fpo_id = Column(Integer, ForeignKey("fpos.id"), nullable=False)
    total_deposit_kg = Column(Numeric(12, 2), default=0, nullable=False)

    # Optional linked user login
    user_id = Column(Integer, ForeignKey("users.id"), nullable=True, unique=True)

    # Relationships
    fpo = relationship("FPO", back_populates="farmers")
    user = relationship("User", back_populates="farmer_profile")
    commodity_lots = relationship("CommodityLot", back_populates="farmer")
    warehouse_receipts = relationship("WarehouseReceipt", back_populates="farmer")

    def __repr__(self):
        return f"<Farmer {self.farmer_code}: {self.name}>"
