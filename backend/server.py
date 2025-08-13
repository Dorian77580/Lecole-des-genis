#!/usr/bin/env python3
from fastapi import FastAPI, HTTPException, Depends, File, UploadFile, Form, status
from fastapi.middleware.cors import CORSMiddleware
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials
from fastapi.responses import FileResponse
from pydantic import BaseModel, EmailStr
from datetime import datetime, timedelta
from typing import Optional, List
import os
import uuid
import json
import hashlib
import jwt
from motor.motor_asyncio import AsyncIOMotorClient
import asyncio
from passlib.hash import bcrypt

# Initialize FastAPI app
app = FastAPI(title="L'École des Génies API")

# CORS middleware
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Database connection
MONGO_URL = os.getenv("MONGO_URL", "mongodb://localhost:27017")
client = AsyncIOMotorClient(MONGO_URL)
db = client.ecole_des_genies

# JWT Configuration
JWT_SECRET = os.getenv("JWT_SECRET", "your-secret-key-change-in-production")
JWT_ALGORITHM = "HS256"
JWT_EXPIRATION_HOURS = 24 * 7  # 7 days

# Security
security = HTTPBearer()

# Pydantic models
class UserRegister(BaseModel):
    email: EmailStr
    password: str
    first_name: str
    last_name: str
    user_type: str  # "parent", "teacher"

class UserLogin(BaseModel):
    email: EmailStr
    password: str

class User(BaseModel):
    id: str
    email: str
    first_name: str
    last_name: str
    user_type: str
    is_premium: bool = False
    is_verified: bool = False
    is_admin: bool = False
    created_at: datetime

class PedagogicalSheet(BaseModel):
    id: str
    title: str
    description: str
    level: str  # "PS", "MS", "GS", "CP", "CE1", "CE2", "CM1", "CM2", "6e", "5e", "4e", "3e"
    subject: str  # "mathématiques", "français", "sciences", etc.
    is_premium: bool
    is_teacher_only: bool
    file_url: str
    created_at: datetime

class PedagogicalSheetCreate(BaseModel):
    title: str
    description: str
    level: str
    subject: str
    is_premium: bool = False
    is_teacher_only: bool = False

class PedagogicalSheetUpdate(BaseModel):
    title: Optional[str] = None
    description: Optional[str] = None
    level: Optional[str] = None
    subject: Optional[str] = None
    is_premium: Optional[bool] = None
    is_teacher_only: Optional[bool] = None

class TeacherVerification(BaseModel):
    id: str
    user_id: str
    document_url: str
    status: str  # "pending", "approved", "rejected"
    created_at: datetime

async def get_admin_user(credentials: HTTPAuthorizationCredentials = Depends(security)):
    user = await get_current_user(credentials)
    if not user.get("is_admin", False):
        raise HTTPException(status_code=403, detail="Admin access required")
    return user

# Helper functions
def hash_password(password: str) -> str:
    return bcrypt.hash(password)

def verify_password(password: str, hashed: str) -> bool:
    return bcrypt.verify(password, hashed)

def create_jwt_token(user_data: dict) -> str:
    payload = {
        "user_id": user_data["id"],
        "email": user_data["email"],
        "user_type": user_data["user_type"],
        "exp": datetime.utcnow() + timedelta(hours=JWT_EXPIRATION_HOURS)
    }
    return jwt.encode(payload, JWT_SECRET, algorithm=JWT_ALGORITHM)

async def get_current_user(credentials: HTTPAuthorizationCredentials = Depends(security)):
    try:
        payload = jwt.decode(credentials.credentials, JWT_SECRET, algorithms=[JWT_ALGORITHM])
        user_id = payload.get("user_id")
        if user_id is None:
            raise HTTPException(status_code=401, detail="Invalid token")
        
        user = await db.users.find_one({"id": user_id})
        if user is None:
            raise HTTPException(status_code=401, detail="User not found")
        
        return user
    except jwt.ExpiredSignatureError:
        raise HTTPException(status_code=401, detail="Token expired")
    except jwt.JWTError:
        raise HTTPException(status_code=401, detail="Invalid token")

# Initialize sample data
async def init_sample_data():
    # Check if sample data already exists
    existing_sheets = await db.pedagogical_sheets.count_documents({})
    if existing_sheets > 0:
        return
    
    # Sample pedagogical sheets
    sample_sheets = [
        {
            "id": str(uuid.uuid4()),
            "title": "Apprendre les couleurs - Maternelle",
            "description": "Fiche pédagogique pour découvrir et mémoriser les couleurs primaires avec des activités ludiques.",
            "level": "PS",
            "subject": "découverte du monde",
            "is_premium": False,
            "is_teacher_only": False,
            "file_url": "/api/files/sample_couleurs.pdf",
            "created_at": datetime.utcnow()
        },
        {
            "id": str(uuid.uuid4()),
            "title": "Les additions simples - CP",
            "description": "Initiation aux additions avec des exercices progressifs et des supports visuels.",
            "level": "CP",
            "subject": "mathématiques",
            "is_premium": True,
            "is_teacher_only": False,
            "file_url": "/api/files/sample_additions.pdf",
            "created_at": datetime.utcnow()
        },
        {
            "id": str(uuid.uuid4()),
            "title": "Grammaire : Le verbe et le sujet",
            "description": "Exercices pour identifier le verbe et le sujet dans une phrase simple.",
            "level": "CE1",
            "subject": "français",
            "is_premium": False,
            "is_teacher_only": True,
            "file_url": "/api/files/sample_grammaire.pdf",
            "created_at": datetime.utcnow()
        },
        {
            "id": str(uuid.uuid4()),
            "title": "Les fractions - Niveau avancé",
            "description": "Comprendre et manipuler les fractions avec des exemples concrets.",
            "level": "CM2",
            "subject": "mathématiques",
            "is_premium": True,
            "is_teacher_only": True,
            "file_url": "/api/files/sample_fractions.pdf",
            "created_at": datetime.utcnow()
        },
        {
            "id": str(uuid.uuid4()),
            "title": "Sciences : Le cycle de l'eau",
            "description": "Découvrir le cycle de l'eau avec expériences et schémas explicatifs.",
            "level": "CE2",
            "subject": "sciences",
            "is_premium": True,
            "is_teacher_only": False,
            "file_url": "/api/files/sample_eau.pdf",
            "created_at": datetime.utcnow()
        }
    ]
    
    await db.pedagogical_sheets.insert_many(sample_sheets)

# API Routes
@app.on_event("startup")
async def startup_event():
    await init_sample_data()

@app.get("/api/health")
async def health_check():
    return {"status": "healthy", "message": "L'École des Génies API is running"}

@app.post("/api/auth/register")
async def register(user_data: UserRegister):
    # Check if user already exists
    existing_user = await db.users.find_one({"email": user_data.email})
    if existing_user:
        raise HTTPException(status_code=400, detail="Email already registered")
    
    # Create new user
    user_id = str(uuid.uuid4())
    hashed_password = hash_password(user_data.password)
    
    new_user = {
        "id": user_id,
        "email": user_data.email,
        "password": hashed_password,
        "first_name": user_data.first_name,
        "last_name": user_data.last_name,
        "user_type": user_data.user_type,
        "is_premium": False,
        "is_verified": user_data.user_type != "teacher",  # Teachers need verification
        "is_admin": user_data.email == "marine.alves@ecoledesgenies.com",  # Admin account
        "created_at": datetime.utcnow()
    }
    
    await db.users.insert_one(new_user)
    
    # Create JWT token
    token = create_jwt_token(new_user)
    
    return {
        "token": token,
        "user": {
            "id": user_id,
            "email": user_data.email,
            "first_name": user_data.first_name,
            "last_name": user_data.last_name,
            "user_type": user_data.user_type,
            "is_premium": False,
            "is_verified": new_user["is_verified"],
            "is_admin": user_data.email == "marine.alves@ecoledesgenies.com"  # Admin account
        }
    }

@app.post("/api/auth/login")
async def login(login_data: UserLogin):
    # Find user
    user = await db.users.find_one({"email": login_data.email})
    if not user or not verify_password(login_data.password, user["password"]):
        raise HTTPException(status_code=401, detail="Invalid email or password")
    
    # Create JWT token
    token = create_jwt_token(user)
    
    return {
        "token": token,
        "user": {
            "id": user["id"],
            "email": user["email"],
            "first_name": user["first_name"],
            "last_name": user["last_name"],
            "user_type": user["user_type"],
            "is_premium": user["is_premium"],
            "is_verified": user["is_verified"],
            "is_admin": user.get("is_admin", False)
        }
    }

@app.get("/api/user/profile")
async def get_profile(current_user = Depends(get_current_user)):
    return {
        "id": current_user["id"],
        "email": current_user["email"],
        "first_name": current_user["first_name"],
        "last_name": current_user["last_name"],
        "user_type": current_user["user_type"],
        "is_premium": current_user["is_premium"],
        "is_verified": current_user["is_verified"],
        "is_admin": current_user.get("is_admin", False)
    }

@app.get("/api/pedagogical-sheets")
async def get_pedagogical_sheets(
    level: Optional[str] = None,
    subject: Optional[str] = None,
    current_user = Depends(get_current_user)
):
    # Build query based on user permissions
    query = {}
    
    if level:
        query["level"] = level
    if subject:
        query["subject"] = subject
    
    # Filter based on user type and permissions
    if current_user["user_type"] == "parent":
        if current_user["is_premium"]:
            # Premium parents can see all non-teacher-only sheets
            query["is_teacher_only"] = False
        else:
            # Free parents can only see free, non-teacher-only sheets
            query["is_premium"] = False
            query["is_teacher_only"] = False
    elif current_user["user_type"] == "teacher" and current_user["is_verified"]:
        # Verified teachers can see everything
        pass
    else:
        # Unverified teachers see only free, non-teacher-only sheets
        query["is_premium"] = False
        query["is_teacher_only"] = False
    
    sheets = await db.pedagogical_sheets.find(query, {"_id": 0}).to_list(length=100)
    
    return {
        "sheets": sheets,
        "total": len(sheets)
    }

@app.post("/api/teacher/verification")
async def submit_teacher_verification(
    file: UploadFile = File(...),
    current_user = Depends(get_current_user)
):
    if current_user["user_type"] != "teacher":
        raise HTTPException(status_code=403, detail="Only teachers can submit verification documents")
    
    if current_user["is_verified"]:
        raise HTTPException(status_code=400, detail="Teacher already verified")
    
    # Check if verification already pending
    existing_verification = await db.teacher_verifications.find_one({
        "user_id": current_user["id"],
        "status": "pending"
    })
    if existing_verification:
        raise HTTPException(status_code=400, detail="Verification already pending")
    
    # Save uploaded file (in production, use cloud storage)
    file_id = str(uuid.uuid4())
    file_path = f"/tmp/verifications/{file_id}_{file.filename}"
    os.makedirs("/tmp/verifications", exist_ok=True)
    
    with open(file_path, "wb") as buffer:
        content = await file.read()
        buffer.write(content)
    
    # Create verification record
    verification = {
        "id": str(uuid.uuid4()),
        "user_id": current_user["id"],
        "document_url": file_path,
        "status": "pending",
        "created_at": datetime.utcnow()
    }
    
    await db.teacher_verifications.insert_one(verification)
    
    return {"message": "Verification document submitted successfully", "status": "pending"}

@app.post("/api/subscription/simulate")
async def simulate_subscription(current_user = Depends(get_current_user)):
    if current_user["user_type"] != "parent":
        raise HTTPException(status_code=403, detail="Only parents can subscribe to premium")
    
    # Simulate successful payment
    await db.users.update_one(
        {"id": current_user["id"]},
        {"$set": {"is_premium": True}}
    )
    
    return {
        "message": "Subscription successful (simulated)",
        "status": "active",
        "is_premium": True
    }

@app.get("/api/files/{filename}")
async def download_file(filename: str, current_user = Depends(get_current_user)):
    # In a real implementation, check if user has access to this specific file
    file_path = f"/tmp/sample_files/{filename}"
    
    # Create sample file if it doesn't exist
    os.makedirs("/tmp/sample_files", exist_ok=True)
    if not os.path.exists(file_path):
        with open(file_path, "w") as f:
            f.write(f"Sample PDF content for {filename}")
    
    return FileResponse(
        file_path,
        media_type="application/pdf",
        filename=filename
    )

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8001)