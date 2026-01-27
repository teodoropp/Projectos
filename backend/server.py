from fastapi import FastAPI, APIRouter, HTTPException, Depends, Request, Response, UploadFile, File
from fastapi.responses import JSONResponse
from dotenv import load_dotenv
from starlette.middleware.cors import CORSMiddleware
from motor.motor_asyncio import AsyncIOMotorClient
import os
import logging
from pathlib import Path
from pydantic import BaseModel, Field, EmailStr
from typing import List, Optional
import uuid
from datetime import datetime, timezone, timedelta
import httpx
from passlib.context import CryptContext
from jose import JWTError, jwt
import base64

ROOT_DIR = Path(__file__).parent
load_dotenv(ROOT_DIR / '.env')

# MongoDB connection
mongo_url = os.environ['MONGO_URL']
client = AsyncIOMotorClient(mongo_url)
db = client[os.environ.get('DB_NAME', 'servicos_angola')]

# JWT Settings
SECRET_KEY = os.environ.get('JWT_SECRET_KEY', 'servicos-angola-secret-key-2024')
ALGORITHM = "HS256"
ACCESS_TOKEN_EXPIRE_DAYS = 7

# Password hashing
pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto")

# Create the main app
app = FastAPI(title="Serviços Angola API")

# Create a router with the /api prefix
api_router = APIRouter(prefix="/api")

# Configure logging
logging.basicConfig(level=logging.INFO, format='%(asctime)s - %(name)s - %(levelname)s - %(message)s')
logger = logging.getLogger(__name__)

# ==================== MODELS ====================

# Angola Provinces
ANGOLA_PROVINCES = [
    "Bengo", "Benguela", "Bié", "Cabinda", "Cuando Cubango", 
    "Cuanza Norte", "Cuanza Sul", "Cunene", "Huambo", "Huíla", 
    "Luanda", "Lunda Norte", "Lunda Sul", "Malanje", "Moxico", 
    "Namibe", "Uíge", "Zaire"
]

# Service Categories
SERVICE_CATEGORIES = [
    {"id": "eletricista", "name": "Eletricista", "icon": "flash"},
    {"id": "canalizador", "name": "Canalizador", "icon": "water"},
    {"id": "pedreiro", "name": "Pedreiro", "icon": "construct"},
    {"id": "pintor", "name": "Pintor", "icon": "color-palette"},
    {"id": "informatico", "name": "Informático/TI", "icon": "laptop"},
    {"id": "contabilista", "name": "Contabilista", "icon": "calculator"},
    {"id": "carpinteiro", "name": "Carpinteiro", "icon": "hammer"},
    {"id": "serralheiro", "name": "Serralheiro", "icon": "build"},
    {"id": "mecanico", "name": "Mecânico", "icon": "car"},
    {"id": "jardineiro", "name": "Jardineiro", "icon": "leaf"},
    {"id": "limpeza", "name": "Limpeza", "icon": "sparkles"},
    {"id": "seguranca", "name": "Segurança", "icon": "shield"},
    {"id": "cozinheiro", "name": "Cozinheiro/Chef", "icon": "restaurant"},
    {"id": "motorista", "name": "Motorista", "icon": "car-sport"},
    {"id": "costureira", "name": "Costureira", "icon": "shirt"},
    {"id": "cabeleireiro", "name": "Cabeleireiro", "icon": "cut"},
]

# User Models
class UserBase(BaseModel):
    email: str
    name: str
    phone: Optional[str] = None
    picture: Optional[str] = None

class UserCreate(BaseModel):
    email: EmailStr
    password: str
    name: str
    phone: Optional[str] = None

class UserLogin(BaseModel):
    email: EmailStr
    password: str

class User(BaseModel):
    user_id: str
    email: str
    name: str
    phone: Optional[str] = None
    picture: Optional[str] = None
    role: str = "client"  # client or provider
    is_provider: bool = False
    created_at: datetime
    province: Optional[str] = None

class UserResponse(BaseModel):
    user_id: str
    email: str
    name: str
    phone: Optional[str] = None
    picture: Optional[str] = None
    role: str
    is_provider: bool
    province: Optional[str] = None

# Provider Profile Models
class ProviderProfileCreate(BaseModel):
    bio: str
    categories: List[str]
    province: str
    city: str
    experience_years: int = 0
    hourly_rate: Optional[float] = None
    phone: str
    whatsapp: Optional[str] = None

class ProviderProfile(BaseModel):
    provider_id: str
    user_id: str
    name: str
    email: str
    phone: str
    whatsapp: Optional[str] = None
    picture: Optional[str] = None
    bio: str
    categories: List[str]
    province: str
    city: str
    experience_years: int = 0
    hourly_rate: Optional[float] = None
    rating: float = 0.0
    total_reviews: int = 0
    is_certified: bool = False
    training_center: Optional[str] = None
    created_at: datetime
    is_active: bool = True

# Review Models
class ReviewCreate(BaseModel):
    provider_id: str
    rating: int = Field(ge=1, le=5)
    comment: str

class Review(BaseModel):
    review_id: str
    provider_id: str
    user_id: str
    user_name: str
    rating: int
    comment: str
    created_at: datetime

# Quote Request Models
class QuoteRequestCreate(BaseModel):
    provider_id: str
    service_description: str
    preferred_date: Optional[str] = None

class QuoteRequest(BaseModel):
    quote_id: str
    client_id: str
    client_name: str
    provider_id: str
    provider_name: str
    service_description: str
    preferred_date: Optional[str] = None
    status: str = "pending"  # pending, accepted, declined, completed
    response: Optional[str] = None
    price: Optional[float] = None
    created_at: datetime

# Message Models
class MessageCreate(BaseModel):
    receiver_id: str
    content: str

class Message(BaseModel):
    message_id: str
    conversation_id: str
    sender_id: str
    receiver_id: str
    content: str
    is_read: bool = False
    created_at: datetime

class Conversation(BaseModel):
    conversation_id: str
    participants: List[str]
    participant_names: dict
    participant_pictures: dict
    last_message: Optional[str] = None
    last_message_time: Optional[datetime] = None
    unread_count: int = 0

# Training Center Models
class TrainingCenterCreate(BaseModel):
    name: str
    description: str
    province: str
    city: str
    phone: str
    email: str
    website: Optional[str] = None
    courses: List[str]

class TrainingCenter(BaseModel):
    center_id: str
    name: str
    description: str
    province: str
    city: str
    phone: str
    email: str
    website: Optional[str] = None
    logo: Optional[str] = None
    courses: List[str]
    is_verified: bool = False
    created_at: datetime

# ==================== AUTH HELPERS ====================

def hash_password(password: str) -> str:
    return pwd_context.hash(password)

def verify_password(plain_password: str, hashed_password: str) -> bool:
    return pwd_context.verify(plain_password, hashed_password)

def create_access_token(data: dict) -> str:
    to_encode = data.copy()
    expire = datetime.now(timezone.utc) + timedelta(days=ACCESS_TOKEN_EXPIRE_DAYS)
    to_encode.update({"exp": expire})
    encoded_jwt = jwt.encode(to_encode, SECRET_KEY, algorithm=ALGORITHM)
    return encoded_jwt

async def get_session_token(request: Request) -> Optional[str]:
    # Check cookie first
    session_token = request.cookies.get("session_token")
    if session_token:
        return session_token
    # Then check Authorization header
    auth_header = request.headers.get("Authorization")
    if auth_header and auth_header.startswith("Bearer "):
        return auth_header.split(" ")[1]
    return None

async def get_current_user(request: Request) -> User:
    session_token = await get_session_token(request)
    if not session_token:
        raise HTTPException(status_code=401, detail="Not authenticated")
    
    # Check session in database
    session = await db.user_sessions.find_one({"session_token": session_token}, {"_id": 0})
    if not session:
        raise HTTPException(status_code=401, detail="Invalid session")
    
    # Check expiry
    expires_at = session["expires_at"]
    if expires_at.tzinfo is None:
        expires_at = expires_at.replace(tzinfo=timezone.utc)
    if expires_at < datetime.now(timezone.utc):
        raise HTTPException(status_code=401, detail="Session expired")
    
    # Get user
    user_doc = await db.users.find_one({"user_id": session["user_id"]}, {"_id": 0})
    if not user_doc:
        raise HTTPException(status_code=401, detail="User not found")
    
    return User(**user_doc)

async def get_optional_user(request: Request) -> Optional[User]:
    try:
        return await get_current_user(request)
    except:
        return None

# ==================== AUTH ROUTES ====================

@api_router.post("/auth/register")
async def register(user_data: UserCreate, response: Response):
    # Check if user exists
    existing = await db.users.find_one({"email": user_data.email}, {"_id": 0})
    if existing:
        raise HTTPException(status_code=400, detail="Email já registado")
    
    # Create user
    user_id = f"user_{uuid.uuid4().hex[:12]}"
    hashed_password = hash_password(user_data.password)
    
    user_doc = {
        "user_id": user_id,
        "email": user_data.email,
        "name": user_data.name,
        "phone": user_data.phone,
        "picture": None,
        "password_hash": hashed_password,
        "role": "client",
        "is_provider": False,
        "province": None,
        "created_at": datetime.now(timezone.utc)
    }
    
    await db.users.insert_one(user_doc)
    
    # Create session
    session_token = f"jwt_{uuid.uuid4().hex}"
    await db.user_sessions.insert_one({
        "user_id": user_id,
        "session_token": session_token,
        "expires_at": datetime.now(timezone.utc) + timedelta(days=ACCESS_TOKEN_EXPIRE_DAYS),
        "created_at": datetime.now(timezone.utc)
    })
    
    # Set cookie
    response.set_cookie(
        key="session_token",
        value=session_token,
        httponly=True,
        secure=True,
        samesite="none",
        max_age=ACCESS_TOKEN_EXPIRE_DAYS * 24 * 60 * 60,
        path="/"
    )
    
    return {
        "user": UserResponse(
            user_id=user_id,
            email=user_data.email,
            name=user_data.name,
            phone=user_data.phone,
            picture=None,
            role="client",
            is_provider=False,
            province=None
        ),
        "session_token": session_token
    }

@api_router.post("/auth/login")
async def login(user_data: UserLogin, response: Response):
    user_doc = await db.users.find_one({"email": user_data.email}, {"_id": 0})
    if not user_doc:
        raise HTTPException(status_code=401, detail="Email ou senha inválidos")
    
    if not verify_password(user_data.password, user_doc.get("password_hash", "")):
        raise HTTPException(status_code=401, detail="Email ou senha inválidos")
    
    # Create session
    session_token = f"jwt_{uuid.uuid4().hex}"
    await db.user_sessions.insert_one({
        "user_id": user_doc["user_id"],
        "session_token": session_token,
        "expires_at": datetime.now(timezone.utc) + timedelta(days=ACCESS_TOKEN_EXPIRE_DAYS),
        "created_at": datetime.now(timezone.utc)
    })
    
    # Set cookie
    response.set_cookie(
        key="session_token",
        value=session_token,
        httponly=True,
        secure=True,
        samesite="none",
        max_age=ACCESS_TOKEN_EXPIRE_DAYS * 24 * 60 * 60,
        path="/"
    )
    
    return {
        "user": UserResponse(
            user_id=user_doc["user_id"],
            email=user_doc["email"],
            name=user_doc["name"],
            phone=user_doc.get("phone"),
            picture=user_doc.get("picture"),
            role=user_doc.get("role", "client"),
            is_provider=user_doc.get("is_provider", False),
            province=user_doc.get("province")
        ),
        "session_token": session_token
    }

@api_router.post("/auth/google/callback")
async def google_callback(request: Request, response: Response):
    body = await request.json()
    session_id = body.get("session_id")
    
    if not session_id:
        raise HTTPException(status_code=400, detail="Session ID required")
    
    # Exchange session_id for user data
    async with httpx.AsyncClient() as client_http:
        resp = await client_http.get(
            "https://demobackend.emergentagent.com/auth/v1/env/oauth/session-data",
            headers={"X-Session-ID": session_id}
        )
        if resp.status_code != 200:
            raise HTTPException(status_code=401, detail="Invalid session")
        
        user_data = resp.json()
    
    # Check if user exists
    existing_user = await db.users.find_one({"email": user_data["email"]}, {"_id": 0})
    
    if existing_user:
        user_id = existing_user["user_id"]
    else:
        # Create new user
        user_id = f"user_{uuid.uuid4().hex[:12]}"
        await db.users.insert_one({
            "user_id": user_id,
            "email": user_data["email"],
            "name": user_data["name"],
            "phone": None,
            "picture": user_data.get("picture"),
            "password_hash": None,
            "role": "client",
            "is_provider": False,
            "province": None,
            "created_at": datetime.now(timezone.utc)
        })
    
    # Store session
    session_token = user_data.get("session_token", f"google_{uuid.uuid4().hex}")
    await db.user_sessions.insert_one({
        "user_id": user_id,
        "session_token": session_token,
        "expires_at": datetime.now(timezone.utc) + timedelta(days=7),
        "created_at": datetime.now(timezone.utc)
    })
    
    # Set cookie
    response.set_cookie(
        key="session_token",
        value=session_token,
        httponly=True,
        secure=True,
        samesite="none",
        max_age=7 * 24 * 60 * 60,
        path="/"
    )
    
    user_doc = await db.users.find_one({"user_id": user_id}, {"_id": 0})
    
    return {
        "user": UserResponse(
            user_id=user_doc["user_id"],
            email=user_doc["email"],
            name=user_doc["name"],
            phone=user_doc.get("phone"),
            picture=user_doc.get("picture"),
            role=user_doc.get("role", "client"),
            is_provider=user_doc.get("is_provider", False),
            province=user_doc.get("province")
        ),
        "session_token": session_token
    }

@api_router.get("/auth/me")
async def get_me(current_user: User = Depends(get_current_user)):
    return UserResponse(
        user_id=current_user.user_id,
        email=current_user.email,
        name=current_user.name,
        phone=current_user.phone,
        picture=current_user.picture,
        role=current_user.role,
        is_provider=current_user.is_provider,
        province=current_user.province
    )

@api_router.post("/auth/logout")
async def logout(request: Request, response: Response):
    session_token = await get_session_token(request)
    if session_token:
        await db.user_sessions.delete_one({"session_token": session_token})
    response.delete_cookie("session_token", path="/")
    return {"message": "Logout successful"}

# ==================== USER PROFILE ROUTES ====================

@api_router.put("/users/profile")
async def update_profile(
    request: Request,
    current_user: User = Depends(get_current_user)
):
    body = await request.json()
    update_data = {}
    
    if "name" in body:
        update_data["name"] = body["name"]
    if "phone" in body:
        update_data["phone"] = body["phone"]
    if "province" in body:
        update_data["province"] = body["province"]
    if "picture" in body:
        update_data["picture"] = body["picture"]
    
    if update_data:
        await db.users.update_one(
            {"user_id": current_user.user_id},
            {"$set": update_data}
        )
    
    user_doc = await db.users.find_one({"user_id": current_user.user_id}, {"_id": 0})
    return UserResponse(**user_doc)

# ==================== PROVIDER ROUTES ====================

@api_router.post("/providers/register")
async def register_as_provider(
    profile_data: ProviderProfileCreate,
    current_user: User = Depends(get_current_user)
):
    # Check if already a provider
    existing = await db.providers.find_one({"user_id": current_user.user_id}, {"_id": 0})
    if existing:
        raise HTTPException(status_code=400, detail="Já está registado como prestador")
    
    provider_id = f"provider_{uuid.uuid4().hex[:12]}"
    
    provider_doc = {
        "provider_id": provider_id,
        "user_id": current_user.user_id,
        "name": current_user.name,
        "email": current_user.email,
        "phone": profile_data.phone,
        "whatsapp": profile_data.whatsapp,
        "picture": current_user.picture,
        "bio": profile_data.bio,
        "categories": profile_data.categories,
        "province": profile_data.province,
        "city": profile_data.city,
        "experience_years": profile_data.experience_years,
        "hourly_rate": profile_data.hourly_rate,
        "rating": 0.0,
        "total_reviews": 0,
        "is_certified": False,
        "training_center": None,
        "created_at": datetime.now(timezone.utc),
        "is_active": True
    }
    
    await db.providers.insert_one(provider_doc)
    
    # Update user role
    await db.users.update_one(
        {"user_id": current_user.user_id},
        {"$set": {"is_provider": True, "role": "provider", "province": profile_data.province}}
    )
    
    return ProviderProfile(**provider_doc)

@api_router.get("/providers", response_model=List[ProviderProfile])
async def get_providers(
    category: Optional[str] = None,
    province: Optional[str] = None,
    search: Optional[str] = None,
    limit: int = 50,
    skip: int = 0
):
    query = {"is_active": True}
    
    if category:
        query["categories"] = category
    if province:
        query["province"] = province
    if search:
        query["$or"] = [
            {"name": {"$regex": search, "$options": "i"}},
            {"bio": {"$regex": search, "$options": "i"}}
        ]
    
    providers = await db.providers.find(query, {"_id": 0}).skip(skip).limit(limit).to_list(limit)
    return [ProviderProfile(**p) for p in providers]

@api_router.get("/providers/featured", response_model=List[ProviderProfile])
async def get_featured_providers(limit: int = 10):
    providers = await db.providers.find(
        {"is_active": True},
        {"_id": 0}
    ).sort("rating", -1).limit(limit).to_list(limit)
    return [ProviderProfile(**p) for p in providers]

@api_router.get("/providers/{provider_id}")
async def get_provider(provider_id: str):
    provider = await db.providers.find_one({"provider_id": provider_id}, {"_id": 0})
    if not provider:
        raise HTTPException(status_code=404, detail="Prestador não encontrado")
    return ProviderProfile(**provider)

@api_router.put("/providers/profile")
async def update_provider_profile(
    request: Request,
    current_user: User = Depends(get_current_user)
):
    provider = await db.providers.find_one({"user_id": current_user.user_id}, {"_id": 0})
    if not provider:
        raise HTTPException(status_code=404, detail="Perfil de prestador não encontrado")
    
    body = await request.json()
    update_data = {}
    
    allowed_fields = ["bio", "categories", "province", "city", "experience_years", 
                      "hourly_rate", "phone", "whatsapp", "is_active", "picture"]
    
    for field in allowed_fields:
        if field in body:
            update_data[field] = body[field]
    
    if update_data:
        await db.providers.update_one(
            {"user_id": current_user.user_id},
            {"$set": update_data}
        )
    
    provider = await db.providers.find_one({"user_id": current_user.user_id}, {"_id": 0})
    return ProviderProfile(**provider)

@api_router.get("/providers/me/profile")
async def get_my_provider_profile(current_user: User = Depends(get_current_user)):
    provider = await db.providers.find_one({"user_id": current_user.user_id}, {"_id": 0})
    if not provider:
        raise HTTPException(status_code=404, detail="Perfil de prestador não encontrado")
    return ProviderProfile(**provider)

# ==================== REVIEW ROUTES ====================

@api_router.post("/reviews")
async def create_review(
    review_data: ReviewCreate,
    current_user: User = Depends(get_current_user)
):
    # Check if provider exists
    provider = await db.providers.find_one({"provider_id": review_data.provider_id}, {"_id": 0})
    if not provider:
        raise HTTPException(status_code=404, detail="Prestador não encontrado")
    
    # Check if user already reviewed this provider
    existing = await db.reviews.find_one({
        "provider_id": review_data.provider_id,
        "user_id": current_user.user_id
    }, {"_id": 0})
    
    if existing:
        raise HTTPException(status_code=400, detail="Já avaliou este prestador")
    
    review_id = f"review_{uuid.uuid4().hex[:12]}"
    
    review_doc = {
        "review_id": review_id,
        "provider_id": review_data.provider_id,
        "user_id": current_user.user_id,
        "user_name": current_user.name,
        "rating": review_data.rating,
        "comment": review_data.comment,
        "created_at": datetime.now(timezone.utc)
    }
    
    await db.reviews.insert_one(review_doc)
    
    # Update provider rating
    all_reviews = await db.reviews.find({"provider_id": review_data.provider_id}, {"_id": 0}).to_list(1000)
    avg_rating = sum(r["rating"] for r in all_reviews) / len(all_reviews)
    
    await db.providers.update_one(
        {"provider_id": review_data.provider_id},
        {"$set": {"rating": round(avg_rating, 1), "total_reviews": len(all_reviews)}}
    )
    
    return Review(**review_doc)

@api_router.get("/reviews/{provider_id}", response_model=List[Review])
async def get_provider_reviews(provider_id: str, limit: int = 50):
    reviews = await db.reviews.find(
        {"provider_id": provider_id},
        {"_id": 0}
    ).sort("created_at", -1).limit(limit).to_list(limit)
    return [Review(**r) for r in reviews]

# ==================== QUOTE REQUEST ROUTES ====================

@api_router.post("/quotes")
async def create_quote_request(
    quote_data: QuoteRequestCreate,
    current_user: User = Depends(get_current_user)
):
    # Check if provider exists
    provider = await db.providers.find_one({"provider_id": quote_data.provider_id}, {"_id": 0})
    if not provider:
        raise HTTPException(status_code=404, detail="Prestador não encontrado")
    
    quote_id = f"quote_{uuid.uuid4().hex[:12]}"
    
    quote_doc = {
        "quote_id": quote_id,
        "client_id": current_user.user_id,
        "client_name": current_user.name,
        "provider_id": quote_data.provider_id,
        "provider_name": provider["name"],
        "service_description": quote_data.service_description,
        "preferred_date": quote_data.preferred_date,
        "status": "pending",
        "response": None,
        "price": None,
        "created_at": datetime.now(timezone.utc)
    }
    
    await db.quotes.insert_one(quote_doc)
    return QuoteRequest(**quote_doc)

@api_router.get("/quotes/sent", response_model=List[QuoteRequest])
async def get_sent_quotes(current_user: User = Depends(get_current_user)):
    quotes = await db.quotes.find(
        {"client_id": current_user.user_id},
        {"_id": 0}
    ).sort("created_at", -1).to_list(100)
    return [QuoteRequest(**q) for q in quotes]

@api_router.get("/quotes/received", response_model=List[QuoteRequest])
async def get_received_quotes(current_user: User = Depends(get_current_user)):
    # Get provider profile
    provider = await db.providers.find_one({"user_id": current_user.user_id}, {"_id": 0})
    if not provider:
        raise HTTPException(status_code=404, detail="Não é prestador")
    
    quotes = await db.quotes.find(
        {"provider_id": provider["provider_id"]},
        {"_id": 0}
    ).sort("created_at", -1).to_list(100)
    return [QuoteRequest(**q) for q in quotes]

@api_router.put("/quotes/{quote_id}/respond")
async def respond_to_quote(
    quote_id: str,
    request: Request,
    current_user: User = Depends(get_current_user)
):
    body = await request.json()
    
    quote = await db.quotes.find_one({"quote_id": quote_id}, {"_id": 0})
    if not quote:
        raise HTTPException(status_code=404, detail="Orçamento não encontrado")
    
    # Verify provider owns this quote
    provider = await db.providers.find_one({"user_id": current_user.user_id}, {"_id": 0})
    if not provider or provider["provider_id"] != quote["provider_id"]:
        raise HTTPException(status_code=403, detail="Não autorizado")
    
    update_data = {
        "status": body.get("status", "accepted"),
        "response": body.get("response"),
        "price": body.get("price")
    }
    
    await db.quotes.update_one({"quote_id": quote_id}, {"$set": update_data})
    
    quote = await db.quotes.find_one({"quote_id": quote_id}, {"_id": 0})
    return QuoteRequest(**quote)

# ==================== MESSAGE ROUTES ====================

@api_router.post("/messages")
async def send_message(
    message_data: MessageCreate,
    current_user: User = Depends(get_current_user)
):
    # Get or create conversation
    participants = sorted([current_user.user_id, message_data.receiver_id])
    conversation_id = f"conv_{'_'.join(participants)}"
    
    conversation = await db.conversations.find_one({"conversation_id": conversation_id}, {"_id": 0})
    
    if not conversation:
        # Get receiver info
        receiver = await db.users.find_one({"user_id": message_data.receiver_id}, {"_id": 0})
        if not receiver:
            raise HTTPException(status_code=404, detail="Destinatário não encontrado")
        
        conversation = {
            "conversation_id": conversation_id,
            "participants": participants,
            "participant_names": {
                current_user.user_id: current_user.name,
                message_data.receiver_id: receiver["name"]
            },
            "participant_pictures": {
                current_user.user_id: current_user.picture,
                message_data.receiver_id: receiver.get("picture")
            },
            "last_message": None,
            "last_message_time": None,
            "unread_count": 0,
            "created_at": datetime.now(timezone.utc)
        }
        await db.conversations.insert_one(conversation)
    
    # Create message
    message_id = f"msg_{uuid.uuid4().hex[:12]}"
    
    message_doc = {
        "message_id": message_id,
        "conversation_id": conversation_id,
        "sender_id": current_user.user_id,
        "receiver_id": message_data.receiver_id,
        "content": message_data.content,
        "is_read": False,
        "created_at": datetime.now(timezone.utc)
    }
    
    await db.messages.insert_one(message_doc)
    
    # Update conversation
    await db.conversations.update_one(
        {"conversation_id": conversation_id},
        {
            "$set": {
                "last_message": message_data.content,
                "last_message_time": datetime.now(timezone.utc)
            },
            "$inc": {"unread_count": 1}
        }
    )
    
    return Message(**message_doc)

@api_router.get("/conversations", response_model=List[Conversation])
async def get_conversations(current_user: User = Depends(get_current_user)):
    conversations = await db.conversations.find(
        {"participants": current_user.user_id},
        {"_id": 0}
    ).sort("last_message_time", -1).to_list(100)
    return [Conversation(**c) for c in conversations]

@api_router.get("/messages/{conversation_id}", response_model=List[Message])
async def get_messages(
    conversation_id: str,
    current_user: User = Depends(get_current_user),
    limit: int = 100
):
    # Verify user is part of conversation
    conversation = await db.conversations.find_one({"conversation_id": conversation_id}, {"_id": 0})
    if not conversation or current_user.user_id not in conversation["participants"]:
        raise HTTPException(status_code=403, detail="Não autorizado")
    
    messages = await db.messages.find(
        {"conversation_id": conversation_id},
        {"_id": 0}
    ).sort("created_at", 1).limit(limit).to_list(limit)
    
    # Mark messages as read
    await db.messages.update_many(
        {"conversation_id": conversation_id, "receiver_id": current_user.user_id, "is_read": False},
        {"$set": {"is_read": True}}
    )
    
    # Reset unread count
    await db.conversations.update_one(
        {"conversation_id": conversation_id},
        {"$set": {"unread_count": 0}}
    )
    
    return [Message(**m) for m in messages]

# ==================== TRAINING CENTER ROUTES ====================

@api_router.get("/training-centers", response_model=List[TrainingCenter])
async def get_training_centers(
    province: Optional[str] = None,
    limit: int = 50
):
    query = {}
    if province:
        query["province"] = province
    
    centers = await db.training_centers.find(query, {"_id": 0}).limit(limit).to_list(limit)
    return [TrainingCenter(**c) for c in centers]

@api_router.get("/training-centers/{center_id}")
async def get_training_center(center_id: str):
    center = await db.training_centers.find_one({"center_id": center_id}, {"_id": 0})
    if not center:
        raise HTTPException(status_code=404, detail="Centro não encontrado")
    return TrainingCenter(**center)

@api_router.get("/training-centers/{center_id}/graduates", response_model=List[ProviderProfile])
async def get_center_graduates(center_id: str, limit: int = 50):
    providers = await db.providers.find(
        {"training_center": center_id, "is_active": True},
        {"_id": 0}
    ).limit(limit).to_list(limit)
    return [ProviderProfile(**p) for p in providers]

# ==================== STATIC DATA ROUTES ====================

@api_router.get("/categories")
async def get_categories():
    return SERVICE_CATEGORIES

@api_router.get("/provinces")
async def get_provinces():
    return ANGOLA_PROVINCES

@api_router.get("/")
async def root():
    return {"message": "Serviços Angola API", "version": "1.0.0"}

# ==================== SEED DATA ====================

@api_router.post("/seed")
async def seed_data():
    """Seed initial data for testing"""
    
    # Clear existing data
    await db.providers.delete_many({})
    await db.training_centers.delete_many({})
    await db.reviews.delete_many({})
    
    # Seed training centers
    training_centers = [
        {
            "center_id": "center_cfp_luanda",
            "name": "Centro de Formação Profissional de Luanda",
            "description": "Centro de excelência em formação técnica e profissional",
            "province": "Luanda",
            "city": "Luanda",
            "phone": "+244 923 456 789",
            "email": "info@cfpluanda.ao",
            "website": "https://cfpluanda.ao",
            "logo": None,
            "courses": ["eletricista", "canalizador", "pedreiro", "carpinteiro"],
            "is_verified": True,
            "created_at": datetime.now(timezone.utc)
        },
        {
            "center_id": "center_inefop",
            "name": "INEFOP - Instituto Nacional de Emprego",
            "description": "Formação profissional para o mercado angolano",
            "province": "Luanda",
            "city": "Luanda",
            "phone": "+244 922 111 222",
            "email": "formacao@inefop.gov.ao",
            "website": "https://inefop.gov.ao",
            "logo": None,
            "courses": ["informatico", "contabilista", "seguranca"],
            "is_verified": True,
            "created_at": datetime.now(timezone.utc)
        }
    ]
    
    for center in training_centers:
        await db.training_centers.insert_one(center)
    
    # Seed sample providers
    sample_providers = [
        {
            "provider_id": "provider_001",
            "user_id": "demo_user_001",
            "name": "João Manuel",
            "email": "joao@email.com",
            "phone": "+244 923 111 111",
            "whatsapp": "+244 923 111 111",
            "picture": None,
            "bio": "Eletricista certificado com mais de 10 anos de experiência. Especializado em instalações residenciais e comerciais.",
            "categories": ["eletricista"],
            "province": "Luanda",
            "city": "Talatona",
            "experience_years": 10,
            "hourly_rate": 5000,
            "rating": 4.8,
            "total_reviews": 25,
            "is_certified": True,
            "training_center": "center_cfp_luanda",
            "created_at": datetime.now(timezone.utc),
            "is_active": True
        },
        {
            "provider_id": "provider_002",
            "user_id": "demo_user_002",
            "name": "Maria Santos",
            "email": "maria@email.com",
            "phone": "+244 924 222 222",
            "whatsapp": "+244 924 222 222",
            "picture": None,
            "bio": "Contabilista formada com experiência em pequenas e médias empresas. Serviços de contabilidade, impostos e consultoria financeira.",
            "categories": ["contabilista"],
            "province": "Luanda",
            "city": "Morro Bento",
            "experience_years": 8,
            "hourly_rate": 8000,
            "rating": 4.9,
            "total_reviews": 18,
            "is_certified": True,
            "training_center": "center_inefop",
            "created_at": datetime.now(timezone.utc),
            "is_active": True
        },
        {
            "provider_id": "provider_003",
            "user_id": "demo_user_003",
            "name": "Pedro Domingos",
            "email": "pedro@email.com",
            "phone": "+244 925 333 333",
            "whatsapp": None,
            "picture": None,
            "bio": "Pintor profissional. Trabalho com tintas de qualidade e atenção aos detalhes. Residencial e comercial.",
            "categories": ["pintor"],
            "province": "Benguela",
            "city": "Benguela",
            "experience_years": 5,
            "hourly_rate": 3500,
            "rating": 4.5,
            "total_reviews": 12,
            "is_certified": False,
            "training_center": None,
            "created_at": datetime.now(timezone.utc),
            "is_active": True
        },
        {
            "provider_id": "provider_004",
            "user_id": "demo_user_004",
            "name": "Ana Fernandes",
            "email": "ana@email.com",
            "phone": "+244 926 444 444",
            "whatsapp": "+244 926 444 444",
            "picture": None,
            "bio": "Técnica de informática especializada em reparação de computadores, redes e suporte técnico.",
            "categories": ["informatico"],
            "province": "Huambo",
            "city": "Huambo",
            "experience_years": 6,
            "hourly_rate": 6000,
            "rating": 4.7,
            "total_reviews": 20,
            "is_certified": True,
            "training_center": "center_inefop",
            "created_at": datetime.now(timezone.utc),
            "is_active": True
        },
        {
            "provider_id": "provider_005",
            "user_id": "demo_user_005",
            "name": "Carlos Alberto",
            "email": "carlos@email.com",
            "phone": "+244 927 555 555",
            "whatsapp": "+244 927 555 555",
            "picture": None,
            "bio": "Canalizador experiente. Instalações, reparações e manutenção de sistemas de água e esgoto.",
            "categories": ["canalizador"],
            "province": "Luanda",
            "city": "Viana",
            "experience_years": 12,
            "hourly_rate": 4500,
            "rating": 4.6,
            "total_reviews": 30,
            "is_certified": True,
            "training_center": "center_cfp_luanda",
            "created_at": datetime.now(timezone.utc),
            "is_active": True
        }
    ]
    
    for provider in sample_providers:
        await db.providers.insert_one(provider)
    
    return {"message": "Dados iniciais criados com sucesso", "providers": 5, "training_centers": 2}

# Include the router in the main app
app.include_router(api_router)

app.add_middleware(
    CORSMiddleware,
    allow_credentials=True,
    allow_origins=["*"],
    allow_methods=["*"],
    allow_headers=["*"],
)

@app.on_event("shutdown")
async def shutdown_db_client():
    client.close()
