"""Idempotency record model for tracking processed requests."""

from datetime import datetime, timezone
from sqlalchemy import Column, String, Integer, Text, DateTime

from .base import Base


class IdempotencyRecord(Base):
    """Stores responses keyed by idempotency key to prevent duplicate processing."""
    __tablename__ = "idempotency_records"

    key = Column(String(100), primary_key=True)
    response_status = Column(Integer, nullable=False)
    response_body = Column(Text, nullable=False)
    created_at = Column(
        DateTime,
        default=lambda: datetime.now(timezone.utc),
        nullable=False,
    )
