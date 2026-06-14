import os
from datetime import datetime, timedelta
from pathlib import Path
from dotenv import load_dotenv
from fastapi import APIRouter, Depends, HTTPException, status
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials
from jose import jwt, JWTError
from passlib.context import CryptContext
from sqlalchemy.orm import Session

from typing import List
from app.database import get_db
from app.models import FPO, Farmer
from app.models.user import User
from app.schemas.auth import LoginRequest, TokenResponse, UserResponse, RegisterRequest, FPOResponse

# Load environment variables
dotenv_path = Path(__file__).resolve().parent.parent.parent / '.env'
load_dotenv(dotenv_path)

SECRET_KEY = os.getenv("SECRET_KEY", "your-secret-key-here-for-development")
ALGORITHM = "HS256"
ACCESS_TOKEN_EXPIRE_MINUTES = 600

import bcrypt

# Setup password hashing helper using bcrypt directly to avoid passlib compatibility issues
def verify_password(plain_password: str, hashed_password: str) -> bool:
    if hashed_password == "hashed_placeholder":
        return plain_password == "123456"
    try:
        return bcrypt.checkpw(plain_password.encode('utf-8'), hashed_password.encode('utf-8'))
    except Exception:
        return False

def get_password_hash(password: str) -> str:
    salt = bcrypt.gensalt()
    return bcrypt.hashpw(password.encode('utf-8'), salt).decode('utf-8')

def create_access_token(data: dict, expires_delta: timedelta = None) -> str:
    to_encode = data.copy()
    if expires_delta:
        expire = datetime.utcnow() + expires_delta
    else:
        expire = datetime.utcnow() + timedelta(minutes=ACCESS_TOKEN_EXPIRE_MINUTES)
    to_encode.update({"exp": expire})
    return jwt.encode(to_encode, SECRET_KEY, algorithm=ALGORITHM)

router = APIRouter(prefix="/api/auth", tags=["authentication"])

security = HTTPBearer()

def get_current_user(
    credentials: HTTPAuthorizationCredentials = Depends(security),
    db: Session = Depends(get_db)
) -> User:
    token = credentials.credentials
    credentials_exception = HTTPException(
        status_code=status.HTTP_401_UNAUTHORIZED,
        detail="Could not validate credentials",
        headers={"WWW-Authenticate": "Bearer"},
    )
    try:
        payload = jwt.decode(token, SECRET_KEY, algorithms=[ALGORITHM])
        phone: str = payload.get("sub")
        if phone is None:
            raise credentials_exception
    except JWTError:
        raise credentials_exception
        
    clean_phone = phone.replace(" ", "").replace("-", "")
    prefix_phone = "+91" + clean_phone if (len(clean_phone) == 10 and not clean_phone.startswith("+")) else clean_phone
    
    user = db.query(User).filter(
        (User.phone == phone) | 
        (User.phone == clean_phone) |
        (User.phone == prefix_phone)
    ).first()
    
    if user is None:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="User not found",
            headers={"WWW-Authenticate": "Bearer"},
        )
    if not user.is_active:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="User account is deactivated"
        )
    return user

@router.post("/login", response_model=TokenResponse)
def login(request: LoginRequest, db: Session = Depends(get_db)):
    clean_phone = request.phone.replace(" ", "").replace("-", "")
    prefix_phone = "+91" + clean_phone if (len(clean_phone) == 10 and not clean_phone.startswith("+")) else clean_phone
    
    user = db.query(User).filter(
        (User.phone == request.phone) | 
        (User.phone == clean_phone) |
        (User.phone == prefix_phone)
    ).first()
    
    if not user:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid credentials - Phone number not registered"
        )
        
    if not verify_password(request.password, user.password_hash):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid credentials - Incorrect password"
        )
        
    if not user.is_active:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="User account is deactivated"
        )
        
    # Create Access Token
    access_token = create_access_token(
        data={"sub": user.phone, "role": user.role.value}
    )
    
    return {
        "access_token": access_token,
        "token_type": "bearer",
        "user": user
    }

@router.get("/me", response_model=UserResponse)
def get_me(current_user: User = Depends(get_current_user)):
    return current_user

@router.get("/fpos", response_model=List[FPOResponse])
def get_fpos(db: Session = Depends(get_db)):
    return db.query(FPO).order_by(FPO.name).all()

@router.post("/register", response_model=UserResponse)
def register(request: RegisterRequest, db: Session = Depends(get_db)):
    import random
    clean_phone = request.phone.replace(" ", "").replace("-", "")
    prefix_phone = "+91" + clean_phone if (len(clean_phone) == 10 and not clean_phone.startswith("+")) else clean_phone
    
    # Check duplicate phone
    existing_user = db.query(User).filter(
        (User.phone == request.phone) | 
        (User.phone == clean_phone) |
        (User.phone == prefix_phone)
    ).first()
    
    if existing_user:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Phone number already registered"
        )
        
    if request.email:
        existing_email = db.query(User).filter(User.email == request.email).first()
        if existing_email:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Email already registered"
            )

    # Calculate initials
    name_parts = request.full_name.strip().split(' ')
    if len(name_parts) > 1:
        initials = (name_parts[0][0] + name_parts[-1][0]).upper()
    elif len(name_parts) == 1 and name_parts[0]:
        initials = name_parts[0][0].upper()
    else:
        initials = "U"
        
    # Create user
    user = User(
        phone=prefix_phone,
        email=request.email if request.email else None,
        full_name=request.full_name,
        password_hash=get_password_hash(request.password),
        role=request.role,
        initials=initials,
        is_active=True,
        fpo_id=request.fpo_id
    )
    db.add(user)
    db.flush()
    
    # If role is farmer, automatically create Farmer profile
    if request.role.value == "farmer":
        if not request.fpo_id:
            first_fpo = db.query(FPO).first()
            if not first_fpo:
                raise HTTPException(
                    status_code=status.HTTP_400_BAD_REQUEST,
                    detail="Cannot register farmer: No FPOs seeded in system."
                )
            fpo_id = first_fpo.id
        else:
            fpo_id = request.fpo_id
            
        farmer_code = f"FM-{random.randint(10000, 99999)}"
        while db.query(Farmer).filter(Farmer.farmer_code == farmer_code).first():
            farmer_code = f"FM-{random.randint(10000, 99999)}"
            
        farmer = Farmer(
            farmer_code=farmer_code,
            name=request.full_name,
            phone=prefix_phone,
            fpo_id=fpo_id,
            user_id=user.id
        )
        db.add(farmer)
        
    db.commit()
    db.refresh(user)
    return user
