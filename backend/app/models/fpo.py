"""FPO (Farmer Producer Organization) model."""

from sqlalchemy import Column, Integer, String, ForeignKey
from sqlalchemy.orm import relationship

from .base import Base, TimestampMixin


class FPO(Base, TimestampMixin):
    __tablename__ = "fpos"

    id = Column(Integer, primary_key=True, autoincrement=True)
    name = Column(String(200), nullable=False)
    code = Column(String(50), unique=True, nullable=False)
    region = Column(String(100), nullable=True)
    district = Column(String(100), nullable=True)
    state = Column(String(100), default="Maharashtra", nullable=False)
    contact_phone = Column(String(20), nullable=True)
    contact_email = Column(String(255), nullable=True)

    # Self-referential: an FPO can be linked to a parent aggregator FPO
    aggregator_id = Column(Integer, ForeignKey("fpos.id"), nullable=True)

    # Relationships
    parent_aggregator = relationship("FPO", remote_side=[id], backref="child_fpos")
    warehouses = relationship("Warehouse", back_populates="fpo")
    farmers = relationship("Farmer", back_populates="fpo")
    users = relationship("User", back_populates="fpo")

    def __repr__(self):
        return f"<FPO {self.id}: {self.name}>"
