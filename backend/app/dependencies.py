from fastapi import Depends, HTTPException, status
from fastapi.security import OAuth2PasswordBearer
from sqlalchemy.orm import Session, joinedload

from app.database import get_db
from app.models.user import User
from app.utils.auth import decode_access_token

oauth2_scheme = OAuth2PasswordBearer(tokenUrl="api/auth/token")


def get_current_user(token: str = Depends(oauth2_scheme), db: Session = Depends(get_db)) -> User:
    credentials_exception = HTTPException(
        status_code=status.HTTP_401_UNAUTHORIZED,
        detail="Could not validate credentials",
        headers={"WWW-Authenticate": "Bearer"},
    )

    payload = decode_access_token(token)
    if payload is None:
        raise credentials_exception

    sub_val = payload.get("sub")
    if sub_val is None:
        raise credentials_exception

    user = None
    try:
        user_id_int = int(sub_val)
        user = (
            db.query(User)
            .options(joinedload(User.role_rel))
            .filter(User.id == user_id_int)
            .first()
        )
    except ValueError:
        pass

    if user is None:
        clean_phone = str(sub_val).replace(" ", "").replace("-", "")
        prefix_phone = "+91" + clean_phone if (len(clean_phone) == 10 and not clean_phone.startswith("+")) else clean_phone
        user = (
            db.query(User)
            .options(joinedload(User.role_rel))
            .filter(
                (User.phone == str(sub_val)) |
                (User.phone == clean_phone) |
                (User.phone == prefix_phone)
            )
            .first()
        )

    if user is None:
        raise credentials_exception

    if not user.is_active:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Inactive user account"
        )

    return user


class RoleChecker:
    """Check that the current user's role name is in the allowed list."""

    def __init__(self, allowed_roles: list[str]):
        self.allowed_roles = allowed_roles

    def __call__(self, current_user: User = Depends(get_current_user)) -> User:
        role_name = current_user.role.name if current_user.role else None
        # Map 'Superadmin' to 'admin' for backward compatibility with existing route checks
        effective_name = "admin" if (current_user.role and current_user.role.is_superadmin) else role_name
        if role_name not in self.allowed_roles and effective_name not in self.allowed_roles:
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail=f"User role '{role_name}' does not have permission to access this resource"
            )
        return current_user


class PermissionChecker:
    """Check that the current user's role has a specific permission on a module."""

    def __init__(self, module_slug: str, action: str = "can_view"):
        self.module_slug = module_slug
        self.action = action

    def __call__(self, current_user: User = Depends(get_current_user)) -> User:
        role = current_user.role
        if role and role.is_superadmin:
            return current_user  # superadmin bypasses all checks

        if not role or not role.permissions:
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="No permissions assigned"
            )

        for perm in role.permissions:
            if perm.module_slug == self.module_slug and getattr(perm, self.action, False):
                return current_user

        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail=f"Missing '{self.action}' permission on '{self.module_slug}'"
        )
