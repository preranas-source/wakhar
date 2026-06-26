"""Role model for dynamic RBAC."""

from datetime import datetime, timezone
from sqlalchemy import Column, Integer, String, Boolean, DateTime
from sqlalchemy.orm import relationship

from .base import Base


class Role(Base):
    """Dynamic role — replaces the old UserRole enum."""
    __tablename__ = "roles"

    id = Column(Integer, primary_key=True, autoincrement=True)
    name = Column(String(50), unique=True, nullable=False)  # e.g. farmer, admin
    description = Column(String(255), nullable=True)
    is_superadmin = Column(Boolean, default=False, nullable=False)
    created_at = Column(
        DateTime,
        default=lambda: datetime.now(timezone.utc),
        nullable=False,
    )
    updated_at = Column(
        DateTime,
        default=lambda: datetime.now(timezone.utc),
        onupdate=lambda: datetime.now(timezone.utc),
        nullable=False,
    )

    # Relationships
    users = relationship("User", back_populates="role_rel")
    permissions = relationship("Permission", back_populates="role", cascade="all, delete-orphan")

    def __repr__(self):
        return f"<Role {self.id}: {self.name}>"
