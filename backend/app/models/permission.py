"""Permission model — per-role, per-module access control."""

from sqlalchemy import Column, Integer, String, Boolean, ForeignKey, UniqueConstraint
from sqlalchemy.orm import relationship

from .base import Base


class Permission(Base):
    """Stores can_view / can_add / can_edit / can_delete per (role, module)."""
    __tablename__ = "permissions"
    __table_args__ = (
        UniqueConstraint("role_id", "module_slug", name="uq_role_module"),
    )

    id = Column(Integer, primary_key=True, autoincrement=True)
    role_id = Column(Integer, ForeignKey("roles.id", ondelete="CASCADE"), nullable=False)
    module_slug = Column(String(50), nullable=False)  # e.g. 'dashboard', 'intake'
    can_view = Column(Boolean, default=False, nullable=False)
    can_add = Column(Boolean, default=False, nullable=False)
    can_edit = Column(Boolean, default=False, nullable=False)
    can_delete = Column(Boolean, default=False, nullable=False)

    # Relationships
    role = relationship("Role", back_populates="permissions")

    def __repr__(self):
        return f"<Permission {self.role_id}:{self.module_slug}>"
