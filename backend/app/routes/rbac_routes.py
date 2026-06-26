"""RBAC management endpoints — roles, permissions, user-role assignment."""

from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session, joinedload
from typing import List

from app.database import get_db
from app.dependencies import get_current_user, RoleChecker
from app.models.user import User
from app.models.role import Role
from app.models.permission import Permission
from app.models.activity_log import ActivityLog, ActivityType
from app.schemas.role import (
    RoleCreate, RoleUpdate, RoleResponse, RoleBrief,
    PermissionResponse, PermissionMatrixUpdate, AssignRoleRequest,
)

router = APIRouter(prefix="/api/rbac", tags=["RBAC"])

admin_only = RoleChecker(["admin"])

# ── Module registry (used for seeding default permissions) ──────────
MODULE_SLUGS = [
    "dashboard",
    "intake",
    "inventory",
    "warehouse_receipts",
    "dispatch",
    "market",
    "farmers",
    "users",
    "warehouses",
    "reports",
    "settings",
]


# ════════════════════════════════════════════════════════════════════
#  ROLES CRUD
# ════════════════════════════════════════════════════════════════════

@router.get("/roles", response_model=List[RoleResponse])
def list_roles(db: Session = Depends(get_db), current_user: User = Depends(get_current_user)):
    """Return every role with its permission matrix."""
    return (
        db.query(Role)
        .options(joinedload(Role.permissions))
        .order_by(Role.id)
        .all()
    )


@router.get("/roles/{role_id}", response_model=RoleResponse)
def get_role(role_id: int, db: Session = Depends(get_db), current_user: User = Depends(get_current_user)):
    role = (
        db.query(Role)
        .options(joinedload(Role.permissions))
        .filter(Role.id == role_id)
        .first()
    )
    if not role:
        raise HTTPException(status_code=404, detail="Role not found")
    return role


@router.post("/roles", response_model=RoleResponse, status_code=status.HTTP_201_CREATED)
def create_role(
    data: RoleCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(admin_only),
):
    if db.query(Role).filter(Role.name == data.name).first():
        raise HTTPException(status_code=400, detail="Role name already exists")

    role = Role(name=data.name, description=data.description, is_superadmin=data.is_superadmin)
    db.add(role)
    db.flush()

    # Seed default permissions (all False)
    for slug in MODULE_SLUGS:
        db.add(Permission(role_id=role.id, module_slug=slug))

    # Audit log
    db.add(ActivityLog(
        user_id=current_user.id,
        type=ActivityType.system,
        message=f"Created role '{data.name}'",
    ))

    db.commit()
    db.refresh(role)
    return role


@router.put("/roles/{role_id}", response_model=RoleResponse)
def update_role(
    role_id: int,
    data: RoleUpdate,
    db: Session = Depends(get_db),
    current_user: User = Depends(admin_only),
):
    role = db.query(Role).filter(Role.id == role_id).first()
    if not role:
        raise HTTPException(status_code=404, detail="Role not found")

    if data.name is not None:
        dup = db.query(Role).filter(Role.name == data.name, Role.id != role_id).first()
        if dup:
            raise HTTPException(status_code=400, detail="Role name already exists")
        role.name = data.name
    if data.description is not None:
        role.description = data.description
    if data.is_superadmin is not None:
        role.is_superadmin = data.is_superadmin

    db.add(ActivityLog(
        user_id=current_user.id,
        type=ActivityType.system,
        message=f"Updated role '{role.name}'",
    ))

    db.commit()
    db.refresh(role)
    return role


@router.delete("/roles/{role_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_role(
    role_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(admin_only),
):
    role = db.query(Role).filter(Role.id == role_id).first()
    if not role:
        raise HTTPException(status_code=404, detail="Role not found")

    # Prevent deleting a role that still has users
    user_count = db.query(User).filter(User.role_id == role_id).count()
    if user_count:
        raise HTTPException(
            status_code=400,
            detail=f"Cannot delete role — {user_count} user(s) still assigned",
        )

    db.add(ActivityLog(
        user_id=current_user.id,
        type=ActivityType.system,
        message=f"Deleted role '{role.name}'",
    ))
    db.delete(role)
    db.commit()


# ════════════════════════════════════════════════════════════════════
#  PERMISSIONS
# ════════════════════════════════════════════════════════════════════

@router.get("/roles/{role_id}/permissions", response_model=List[PermissionResponse])
def get_permissions(
    role_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    role = db.query(Role).filter(Role.id == role_id).first()
    if not role:
        raise HTTPException(status_code=404, detail="Role not found")
    return db.query(Permission).filter(Permission.role_id == role_id).order_by(Permission.module_slug).all()


@router.put("/roles/{role_id}/permissions", response_model=List[PermissionResponse])
def update_permissions(
    role_id: int,
    data: PermissionMatrixUpdate,
    db: Session = Depends(get_db),
    current_user: User = Depends(admin_only),
):
    role = db.query(Role).filter(Role.id == role_id).first()
    if not role:
        raise HTTPException(status_code=404, detail="Role not found")

    for p in data.permissions:
        perm = (
            db.query(Permission)
            .filter(Permission.role_id == role_id, Permission.module_slug == p.module_slug)
            .first()
        )
        if perm:
            perm.can_view = p.can_view
            perm.can_add = p.can_add
            perm.can_edit = p.can_edit
            perm.can_delete = p.can_delete
        else:
            db.add(Permission(
                role_id=role_id,
                module_slug=p.module_slug,
                can_view=p.can_view,
                can_add=p.can_add,
                can_edit=p.can_edit,
                can_delete=p.can_delete,
            ))

    db.add(ActivityLog(
        user_id=current_user.id,
        type=ActivityType.system,
        message=f"Updated permissions for role '{role.name}'",
    ))

    db.commit()
    return db.query(Permission).filter(Permission.role_id == role_id).order_by(Permission.module_slug).all()


# ════════════════════════════════════════════════════════════════════
#  USER ↔ ROLE ASSIGNMENT
# ════════════════════════════════════════════════════════════════════

@router.put("/users/{user_id}/role", response_model=dict)
def assign_role(
    user_id: int,
    data: AssignRoleRequest,
    db: Session = Depends(get_db),
    current_user: User = Depends(admin_only),
):
    user = db.query(User).filter(User.id == user_id).first()
    if not user:
        raise HTTPException(status_code=404, detail="User not found")

    role = db.query(Role).filter(Role.id == data.role_id).first()
    if not role:
        raise HTTPException(status_code=404, detail="Role not found")

    old_role_name = user.role.name if user.role else "none"
    user.role_id = data.role_id

    db.add(ActivityLog(
        user_id=current_user.id,
        type=ActivityType.system,
        message=f"Changed user '{user.full_name}' role from '{old_role_name}' to '{role.name}'",
    ))

    db.commit()
    return {"message": f"User '{user.full_name}' assigned to role '{role.name}'"}


# ── Available modules list (for UI) ─────────────────────────────────

@router.get("/modules", response_model=List[str])
def list_modules(current_user: User = Depends(get_current_user)):
    return MODULE_SLUGS
