import os
import hashlib
import secrets
from datetime import datetime, timedelta, timezone
from typing import Optional
from fastapi import APIRouter, HTTPException, Depends, status
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials
from pydantic import BaseModel, EmailStr
import jwt
from app.database import (
    get_user_by_email,
    get_user_by_username,
    create_user
)

router = APIRouter()
security = HTTPBearer(auto_error=False)

SECRET_KEY = os.getenv("SECRET_KEY", "agropath-super-secret-key-2026")
ALGORITHM = os.getenv("ALGORITHM", "HS256")
ACCESS_TOKEN_EXPIRE_MINUTES = int(os.getenv("ACCESS_TOKEN_EXPIRE_MINUTES", "1440"))

# Helpers for secure password hashing without external binary dependencies
def hash_password(password: str) -> str:
    salt = secrets.token_hex(16)
    key = hashlib.pbkdf2_hmac('sha256', password.encode('utf-8'), salt.encode('utf-8'), 100000)
    return f"{salt}${key.hex()}"

def verify_password(plain_password: str, hashed_password: str) -> bool:
    try:
        salt, stored_hash = hashed_password.split('$')
        key = hashlib.pbkdf2_hmac('sha256', plain_password.encode('utf-8'), salt.encode('utf-8'), 100000)
        return secrets.compare_digest(key.hex(), stored_hash)
    except Exception:
        return False

def create_access_token(data: dict, expires_delta: Optional[timedelta] = None) -> str:
    to_encode = data.copy()
    expire = datetime.now(timezone.utc) + (expires_delta or timedelta(minutes=ACCESS_TOKEN_EXPIRE_MINUTES))
    to_encode.update({"exp": expire})
    return jwt.encode(to_encode, SECRET_KEY, algorithm=ALGORITHM)

async def get_current_user(credentials: Optional[HTTPAuthorizationCredentials] = Depends(security)):
    if not credentials:
        return None
    try:
        payload = jwt.decode(credentials.credentials, SECRET_KEY, algorithms=[ALGORITHM])
        user_id = payload.get("sub")
        if not user_id:
            return None
        return {"id": str(user_id), "username": payload.get("username"), "email": payload.get("email")}
    except Exception:
        return None

# Schemas
class RegisterSchema(BaseModel):
    username: str
    email: EmailStr
    password: str
    full_name: Optional[str] = None

class LoginSchema(BaseModel):
    email: EmailStr
    password: str

class AuthResponse(BaseModel):
    access_token: str
    token_type: str = "bearer"
    user: dict

@router.post("/register", response_model=AuthResponse)
async def register(req: RegisterSchema):
    if len(req.password) < 6:
        raise HTTPException(status_code=400, detail="Password must be at least 6 characters.")

    existing_email = await get_user_by_email(req.email)
    if existing_email:
        raise HTTPException(status_code=400, detail="Email is already registered.")

    existing_user = await get_user_by_username(req.username)
    if existing_user:
        raise HTTPException(status_code=400, detail="Username is already taken.")

    pwd_hash = hash_password(req.password)
    user_id = await create_user(req.username, req.email, pwd_hash, req.full_name)

    token = create_access_token({"sub": str(user_id), "username": req.username, "email": req.email})
    return {
        "access_token": token,
        "token_type": "bearer",
        "user": {
            "id": user_id,
            "username": req.username,
            "email": req.email,
            "full_name": req.full_name
        }
    }

@router.post("/login", response_model=AuthResponse)
async def login(req: LoginSchema):
    user = await get_user_by_email(req.email)
    if not user or not verify_password(req.password, user["password_hash"]):
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Invalid email or password.")

    token = create_access_token({"sub": str(user["id"]), "username": user["username"], "email": user["email"]})
    return {
        "access_token": token,
        "token_type": "bearer",
        "user": {
            "id": user["id"],
            "username": user["username"],
            "email": user["email"],
            "full_name": user.get("full_name")
        }
    }

@router.get("/me")
async def get_me(user: Optional[dict] = Depends(get_current_user)):
    if not user:
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Not authenticated.")
    return user

@router.post("/guest")
async def create_guest_session():
    """Provides an instant guest session for farmers who want to test the app without signing up."""
    guest_id = secrets.randbelow(900000) + 100000
    guest_username = f"farmer_{guest_id}"
    token = create_access_token({"sub": str(guest_id), "username": guest_username, "email": f"{guest_username}@agropath.local"})
    return {
        "access_token": token,
        "token_type": "bearer",
        "user": {
            "id": guest_id,
            "username": guest_username,
            "email": f"{guest_username}@agropath.local",
            "is_guest": True
        }
    }
