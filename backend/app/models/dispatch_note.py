"""Dispatch Note model + Timeline Events — outbound logistics with Fleetbase/Traccar."""

import enum
from sqlalchemy import Column, Integer, String, Boolean, Enum, DateTime, ForeignKey, Numeric
from sqlalchemy.orm import relationship
from datetime import datetime, timezone

from .base import Base, TimestampMixin


class DispatchStatus(str, enum.Enum):
    created = "created"
    in_transit = "in_transit"
    delivered = "delivered"
    cancelled = "cancelled"


class DispatchNote(Base, TimestampMixin):
    __tablename__ = "dispatch_notes"

    id = Column(Integer, primary_key=True, autoincrement=True)
    dn_code = Column(String(30), unique=True, nullable=False)  # "DN-0082"

    lot_id = Column(Integer, ForeignKey("commodity_lots.id"), nullable=False)

    dispatch_quantity_kg = Column(Numeric(12, 2), nullable=False)
    commodity_desc = Column(String(200), nullable=False)  # "Soybean (JS-335)"
    quantity_desc = Column(String(50), nullable=False)  # "12 MT"
    destination = Column(String(200), nullable=False)  # "Satara Aggregator"

    buyer_id = Column(Integer, ForeignKey("users.id"), nullable=True)
    vehicle_reg = Column(String(20), nullable=False)  # "MH-11-AB-4421"

    traccar_device_id = Column(String(50), nullable=True)
    fleetbase_order_id = Column(String(100), nullable=True)

    status = Column(Enum(DispatchStatus), nullable=False, default=DispatchStatus.created)

    e_way_bill_no = Column(String(50), nullable=True)
    delivery_pod_url = Column(String(500), nullable=True)  # e-POD file path

    dispatch_date = Column(DateTime, nullable=False)
    delivery_date = Column(DateTime, nullable=True)

    # Relationships
    lot = relationship("CommodityLot", back_populates="dispatch_notes")
    buyer = relationship("User")
    timeline_events = relationship(
        "DispatchTimelineEvent",
        back_populates="dispatch_note",
        order_by="DispatchTimelineEvent.event_order",
    )

    def __repr__(self):
        return f"<DispatchNote {self.dn_code}: {self.status.value}>"


class DispatchTimelineEvent(Base):
    __tablename__ = "dispatch_timeline_events"

    id = Column(Integer, primary_key=True, autoincrement=True)
    dispatch_note_id = Column(Integer, ForeignKey("dispatch_notes.id"), nullable=False)

    title = Column(String(200), nullable=False)  # "Dispatch Note Created"
    subtitle = Column(String(200), nullable=True)  # "Today, 9:15 AM"
    is_done = Column(Boolean, default=False, nullable=False)
    is_active = Column(Boolean, default=False, nullable=False)
    event_order = Column(Integer, nullable=False)  # 1, 2, 3, 4 for ordering

    event_date = Column(DateTime, nullable=True)
    created_at = Column(
        DateTime,
        default=lambda: datetime.now(timezone.utc),
        nullable=False,
    )

    # Relationships
    dispatch_note = relationship("DispatchNote", back_populates="timeline_events")

    def __repr__(self):
        return f"<DispatchTimelineEvent {self.id}: {self.title} (done={self.is_done})>"
