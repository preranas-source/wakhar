from fastapi import Depends, HTTPException, status
from fastapi.security import OAuth2PasswordBearer
from sqlalchemy.orm import Session

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
        user = db.query(User).filter(User.id == user_id_int).first()
    except ValueError:
        pass

    if user is None:
        clean_phone = str(sub_val).replace(" ", "").replace("-", "")
        prefix_phone = "+91" + clean_phone if (len(clean_phone) == 10 and not clean_phone.startswith("+")) else clean_phone
        user = db.query(User).filter(
            (User.phone == str(sub_val)) | 
            (User.phone == clean_phone) |
            (User.phone == prefix_phone)
        ).first()

    if user is None:
        raise credentials_exception
        
    if not user.is_active:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Inactive user account"
        )
        
    return user

class RoleChecker:
    def __init__(self, allowed_roles: list[str]):
        self.allowed_roles = allowed_roles

    def __call__(self, current_user: User = Depends(get_current_user)) -> User:
        if current_user.role not in self.allowed_roles and current_user.role.value not in self.allowed_roles:
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail=f"User role '{current_user.role.value}' does not have permission to access this resource"
            )
        return current_user
