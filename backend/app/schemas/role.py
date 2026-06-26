"""Pydantic schemas for Role & Permission CRUD."""

from pydantic import BaseModel, ConfigDict
from typing import Optional, List
from datetime import datetime


# ── Permission schemas ──────────────────────────────────────────────

class PermissionResponse(BaseModel):
    id: int
    role_id: int
    module_slug: str
    can_view: bool
    can_add: bool
    can_edit: bool
    can_delete: bool
    model_config = ConfigDict(from_attributes=True)


class PermissionUpdate(BaseModel):
    module_slug: str
    can_view: bool = False
    can_add: bool = False
    can_edit: bool = False
    can_delete: bool = False


class PermissionMatrixUpdate(BaseModel):
    """Bulk-update all permissions for a role."""
    permissions: List[PermissionUpdate]


# ── Role schemas ────────────────────────────────────────────────────

class RoleCreate(BaseModel):
    name: str
    description: Optional[str] = None
    is_superadmin: bool = False


class RoleUpdate(BaseModel):
    name: Optional[str] = None
    description: Optional[str] = None
    is_superadmin: Optional[bool] = None


class RoleResponse(BaseModel):
    id: int
    name: str
    description: Optional[str] = None
    is_superadmin: bool
    created_at: datetime
    updated_at: datetime
    permissions: List[PermissionResponse] = []
    model_config = ConfigDict(from_attributes=True)


class RoleBrief(BaseModel):
    """Lightweight role info embedded in user responses."""
    id: int
    name: str
    is_superadmin: bool
    model_config = ConfigDict(from_attributes=True)


# ── User-role assignment ────────────────────────────────────────────

class AssignRoleRequest(BaseModel):
    role_id: int
