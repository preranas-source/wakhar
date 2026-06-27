"""Quality Record model — grading & QC inspection results."""

import enum
from sqlalchemy import Column, Integer, String, Numeric, Enum, DateTime, Text, ForeignKey
from sqlalchemy.orm import relationship
from datetime import datetime, timezone

from .base import Base


class QCGrade(str, enum.Enum):
    grade_a = "grade_a"
    grade_b = "grade_b"
    grade_c = "grade_c"
    rejected = "rejected"


class QualityRecord(Base):
    __tablename__ = "quality_records"

    id = Column(Integer, primary_key=True, autoincrement=True)
    qc_code = Column(String(30), unique=True, nullable=False)  # "QC-2026-001"

    lot_id = Column(Integer, ForeignKey("commodity_lots.id"), nullable=False)

    moisture_pct = Column(Numeric(5, 2), nullable=False)
    foreign_matter_pct = Column(Numeric(5, 2), nullable=True)
    broken_grain_pct = Column(Numeric(5, 2), nullable=True)
    protein_pct = Column(Numeric(5, 2), nullable=True)

    grade_awarded = Column(Enum(QCGrade), nullable=False)

    inspected_by = Column(Integer, ForeignKey("users.id"), nullable=False)
    inspection_date = Column(DateTime, nullable=False)

    certificate_url = Column(String(500), nullable=True)  # PDF path
    remarks = Column(Text, nullable=True)

    created_at = Column(
        DateTime,
        default=lambda: datetime.now(timezone.utc),
        nullable=False,
    )

    # Relationships
    lot = relationship("CommodityLot", back_populates="quality_records")
    inspector = relationship("User", back_populates="quality_inspections")

    @property
    def inspector_name(self):
        return self.inspector.full_name if self.inspector else "Govt Lab Officer"

    def __repr__(self):
        return f"<QualityRecord {self.qc_code}: {self.grade_awarded.value}>"
