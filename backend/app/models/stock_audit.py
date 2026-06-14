"""Stock Audit model for physical cycle counts."""

import enum
from sqlalchemy import Column, Integer, String, Enum, Date, Text, Numeric, ForeignKey
from sqlalchemy.orm import relationship

from .base import Base, TimestampMixin

class AuditStatus(str, enum.Enum):
    pending = "pending"
    completed = "completed"
    discrepancy = "discrepancy"

class StockAudit(Base, TimestampMixin):
    __tablename__ = "stock_audits"

    id = Column(Integer, primary_key=True, autoincrement=True)
    audit_code = Column(String(50), unique=True, nullable=False)
    
    warehouse_id = Column(Integer, ForeignKey("warehouses.id"), nullable=False)
    auditor_id = Column(Integer, ForeignKey("users.id"), nullable=False)
    
    audit_date = Column(Date, nullable=False)
    status = Column(Enum(AuditStatus), nullable=False, default=AuditStatus.pending)
    
    system_stock_mt = Column(Numeric(10, 2), nullable=False)
    actual_stock_mt = Column(Numeric(10, 2), nullable=False)
    variance_mt = Column(Numeric(10, 2), nullable=False)
    
    remarks = Column(Text, nullable=True)

    warehouse = relationship("Warehouse")
    auditor = relationship("User")

    def __repr__(self):
        return f"<StockAudit {self.audit_code}: {self.status.value}>"
