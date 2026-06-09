"""Activity Log model — system-wide audit trail and activity feed."""

import enum
from sqlalchemy import Column, Integer, String, Enum, DateTime, Text, ForeignKey
from sqlalchemy.orm import relationship
from datetime import datetime, timezone

from .base import Base


class ActivityType(str, enum.Enum):
    intake = "intake"
    dispatch = "dispatch"
    qc = "qc"
    market = "market"
    system = "system"


class ActivityLog(Base):
    __tablename__ = "activity_logs"

    id = Column(Integer, primary_key=True, autoincrement=True)
    type = Column(Enum(ActivityType), nullable=False)
    message = Column(Text, nullable=False)  # activity description
    reference = Column(String(50), nullable=True)  # related entity code (LOT, WR, DN, PO)

    user_id = Column(Integer, ForeignKey("users.id"), nullable=True)

    created_at = Column(
        DateTime,
        default=lambda: datetime.now(timezone.utc),
        nullable=False,
    )

    # Relationships
    user = relationship("User", back_populates="activity_logs")

    def __repr__(self):
        return f"<ActivityLog {self.id}: {self.type.value}>"
