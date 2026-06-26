import enum
from sqlalchemy import Column, Integer, String, Numeric, DateTime, ForeignKey, Enum
from sqlalchemy.orm import relationship
from .base import Base, TimestampMixin

class TransferStatus(str, enum.Enum):
    grn_pending = "GRN Pending"
    grn_done = "GRN Done"
    in_transit = "In Transit"

class StockTransfer(Base, TimestampMixin):
    __tablename__ = "stock_transfers"

    id = Column(Integer, primary_key=True, autoincrement=True)
    trf_code = Column(String(30), unique=True, nullable=False) # e.g. "TRF-2026-018"
    lot_id = Column(Integer, ForeignKey("commodity_lots.id"), nullable=False)
    quantity_kg = Column(Numeric(12, 2), nullable=False)
    
    source_warehouse_id = Column(Integer, ForeignKey("warehouses.id"), nullable=False)
    destination_warehouse_id = Column(Integer, ForeignKey("warehouses.id"), nullable=False)
    
    vehicle_reg = Column(String(50), nullable=True)
    status = Column(Enum(TransferStatus), nullable=False, default=TransferStatus.grn_pending)
    
    variance_kg = Column(Numeric(12, 2), nullable=True, default=0.0)
    variance_reason = Column(String(200), nullable=True)
    notes = Column(String(500), nullable=True)
    
    dispatch_date = Column(DateTime, nullable=False)
    arrival_date = Column(DateTime, nullable=True)

    # Relationships
    lot = relationship("CommodityLot")
    source_warehouse = relationship("Warehouse", foreign_keys=[source_warehouse_id])
    destination_warehouse = relationship("Warehouse", foreign_keys=[destination_warehouse_id])
