from fastapi import FastAPI, APIRouter, HTTPException, Depends, Request, Response, UploadFile, File, Form
from fastapi.responses import JSONResponse
from dotenv import load_dotenv
from starlette.middleware.cors import CORSMiddleware
from motor.motor_asyncio import AsyncIOMotorClient
import os
import logging
from pathlib import Path
from pydantic import BaseModel, Field, EmailStr
from typing import List, Optional, Literal
import uuid
from datetime import datetime, timezone, timedelta
import httpx
from passlib.context import CryptContext
import base64

ROOT_DIR = Path(__file__).parent
load_dotenv(ROOT_DIR / '.env')

# Ligação MongoDB
mongo_url = os.environ['MONGO_URL']
client = AsyncIOMotorClient(mongo_url)
db = client[os.environ.get('DB_NAME', 'servicos_angola')]

# Configurações JWT
SECRET_KEY = os.environ.get('JWT_SECRET_KEY', 'servicos-angola-secret-key-2024')
ALGORITHM = "HS256"
ACCESS_TOKEN_EXPIRE_DAYS = 7

# Encriptação de senhas
pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto")

# Criar aplicação principal
app = FastAPI(title="Serviços Angola API")

# Criar router com prefixo /api
api_router = APIRouter(prefix="/api")

# Configurar logging
logging.basicConfig(level=logging.INFO, format='%(asctime)s - %(name)s - %(levelname)s - %(message)s')
logger = logging.getLogger(__name__)

# ==================== CONSTANTES ====================

# Províncias de Angola
ANGOLA_PROVINCES = [
    "Bengo", "Benguela", "Bié", "Cabinda", "Cuando Cubango", 
    "Cuanza Norte", "Cuanza Sul", "Cunene", "Huambo", "Huíla", 
    "Luanda", "Lunda Norte", "Lunda Sul", "Malanje", "Moxico", 
    "Namibe", "Uíge", "Zaire"
]

# Categorias de Serviços
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
    {"id": "consultoria", "name": "Consultoria", "icon": "briefcase"},
    {"id": "transporte", "name": "Transporte/Logística", "icon": "cube"},
    {"id": "construcao", "name": "Construção Civil", "icon": "business"},
    {"id": "design", "name": "Design/Criativo", "icon": "color-wand"},
    {"id": "marketing", "name": "Marketing", "icon": "megaphone"},
    {"id": "juridico", "name": "Serviços Jurídicos", "icon": "document-text"},
]

# Planos de subscrição
SUBSCRIPTION_PLANS = [
    {
        "id": "gratuito",
        "name": "Gratuito",
        "price": 0,
        "features": ["Perfil básico", "Até 3 propostas/mês", "Visibilidade normal"],
        "max_proposals_month": 3,
        "featured": False
    },
    {
        "id": "profissional",
        "name": "Profissional",
        "price": 5000,  # 5.000 Kz/mês
        "features": ["Perfil verificado", "Propostas ilimitadas", "Destaque nas buscas", "Selo de confiança"],
        "max_proposals_month": -1,
        "featured": True
    },
    {
        "id": "empresa",
        "name": "Empresa",
        "price": 15000,  # 15.000 Kz/mês
        "features": ["Tudo do Profissional", "Múltiplos funcionários", "Painel de gestão", "Suporte prioritário"],
        "max_proposals_month": -1,
        "featured": True
    }
]

# ==================== MODELOS ====================

# Tipos de utilizador
UserType = Literal["cliente", "profissional", "empresa", "admin"]
VerificationStatus = Literal["pendente", "verificado", "rejeitado"]

# Modelo base de utilizador
class UserBase(BaseModel):
    email: str
    name: str
    phone: Optional[str] = None

# Criar utilizador
class UserCreate(BaseModel):
    email: EmailStr
    password: str
    name: str
    phone: str
    user_type: UserType = "cliente"
    # Para empresas
    company_name: Optional[str] = None
    nif: Optional[str] = None  # Número de Identificação Fiscal

# Login
class UserLogin(BaseModel):
    email: EmailStr
    password: str

# Utilizador completo
class User(BaseModel):
    user_id: str
    email: str
    name: str
    phone: Optional[str] = None
    photo: Optional[str] = None  # Foto de perfil (base64)
    bi_photo: Optional[str] = None  # Foto do BI (base64)
    bi_number: Optional[str] = None  # Número do BI
    user_type: UserType = "cliente"
    # Verificação
    verification_status: VerificationStatus = "pendente"
    verified_at: Optional[datetime] = None
    # Dados de empresa
    company_name: Optional[str] = None
    nif: Optional[str] = None
    company_logo: Optional[str] = None
    # Localização
    province: Optional[str] = None
    city: Optional[str] = None
    # Subscrição
    subscription_plan: str = "gratuito"
    subscription_expires: Optional[datetime] = None
    # Estatísticas
    rating: float = 0.0
    total_reviews: int = 0
    total_jobs_completed: int = 0
    # Datas
    created_at: datetime
    is_active: bool = True

# Resposta de utilizador (sem dados sensíveis)
class UserResponse(BaseModel):
    user_id: str
    email: str
    name: str
    phone: Optional[str] = None
    photo: Optional[str] = None
    user_type: UserType
    verification_status: VerificationStatus
    company_name: Optional[str] = None
    company_logo: Optional[str] = None
    province: Optional[str] = None
    city: Optional[str] = None
    subscription_plan: str
    rating: float
    total_reviews: int
    total_jobs_completed: int
    is_active: bool

# Perfil de profissional/empresa
class ProfessionalProfile(BaseModel):
    user_id: str
    name: str
    email: str
    phone: str
    photo: Optional[str] = None
    company_name: Optional[str] = None
    company_logo: Optional[str] = None
    user_type: UserType
    bio: str
    categories: List[str]
    province: str
    city: str
    experience_years: int = 0
    verification_status: VerificationStatus
    subscription_plan: str
    rating: float = 0.0
    total_reviews: int = 0
    total_jobs_completed: int = 0
    created_at: datetime
    is_active: bool = True

class ProfessionalProfileCreate(BaseModel):
    bio: str
    categories: List[str]
    province: str
    city: str
    experience_years: int = 0

# Pedido de serviço (Cliente publica o que precisa)
class ServiceRequestCreate(BaseModel):
    title: str
    description: str
    category: str
    province: str
    city: str
    budget_min: Optional[float] = None
    budget_max: Optional[float] = None
    urgency: Literal["normal", "urgente", "muito_urgente"] = "normal"
    deadline: Optional[str] = None

class ServiceRequest(BaseModel):
    request_id: str
    client_id: str
    client_name: str
    client_photo: Optional[str] = None
    client_type: UserType
    client_verified: bool
    title: str
    description: str
    category: str
    province: str
    city: str
    budget_min: Optional[float] = None
    budget_max: Optional[float] = None
    urgency: str
    deadline: Optional[str] = None
    status: str = "aberto"  # aberto, em_andamento, concluido, cancelado
    total_proposals: int = 0
    created_at: datetime

# Proposta de profissional
class ProposalCreate(BaseModel):
    request_id: str
    price: float
    description: str
    estimated_days: int

class Proposal(BaseModel):
    proposal_id: str
    request_id: str
    professional_id: str
    professional_name: str
    professional_photo: Optional[str] = None
    professional_type: UserType
    professional_verified: bool
    professional_rating: float
    professional_reviews: int
    price: float
    description: str
    estimated_days: int
    status: str = "pendente"  # pendente, aceite, rejeitada
    created_at: datetime

# Avaliação
class ReviewCreate(BaseModel):
    reviewed_user_id: str
    job_id: str
    rating: int = Field(ge=1, le=5)
    comment: str

class Review(BaseModel):
    review_id: str
    reviewer_id: str
    reviewer_name: str
    reviewer_photo: Optional[str] = None
    reviewed_user_id: str
    job_id: str
    rating: int
    comment: str
    created_at: datetime

# Mensagens
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
    participant_photos: dict
    participant_types: dict
    last_message: Optional[str] = None
    last_message_time: Optional[datetime] = None
    unread_count: int = 0

# Transação/Pagamento
class Transaction(BaseModel):
    transaction_id: str
    user_id: str
    type: str  # subscription, commission, featured
    amount: float
    description: str
    status: str  # pendente, pago, cancelado
    created_at: datetime

# Admin - Estatísticas
class AdminStats(BaseModel):
    total_users: int
    total_clients: int
    total_professionals: int
    total_companies: int
    pending_verifications: int
    total_service_requests: int
    total_proposals: int
    total_jobs_completed: int
    total_revenue: float

# ==================== FUNÇÕES AUXILIARES ====================

def hash_password(password: str) -> str:
    return pwd_context.hash(password)

def verify_password(plain_password: str, hashed_password: str) -> bool:
    return pwd_context.verify(plain_password, hashed_password)

async def get_session_token(request: Request) -> Optional[str]:
    # Verificar cookie primeiro
    session_token = request.cookies.get("session_token")
    if session_token:
        return session_token
    # Depois verificar header Authorization
    auth_header = request.headers.get("Authorization")
    if auth_header and auth_header.startswith("Bearer "):
        return auth_header.split(" ")[1]
    return None

async def get_current_user(request: Request) -> User:
    session_token = await get_session_token(request)
    if not session_token:
        raise HTTPException(status_code=401, detail="Não autenticado")
    
    # Verificar sessão na base de dados
    session = await db.user_sessions.find_one({"session_token": session_token}, {"_id": 0})
    if not session:
        raise HTTPException(status_code=401, detail="Sessão inválida")
    
    # Verificar expiração
    expires_at = session["expires_at"]
    if expires_at.tzinfo is None:
        expires_at = expires_at.replace(tzinfo=timezone.utc)
    if expires_at < datetime.now(timezone.utc):
        raise HTTPException(status_code=401, detail="Sessão expirada")
    
    # Obter utilizador
    user_doc = await db.users.find_one({"user_id": session["user_id"]}, {"_id": 0})
    if not user_doc:
        raise HTTPException(status_code=401, detail="Utilizador não encontrado")
    
    return User(**user_doc)

async def get_optional_user(request: Request) -> Optional[User]:
    try:
        return await get_current_user(request)
    except:
        return None

async def require_admin(request: Request) -> User:
    user = await get_current_user(request)
    if user.user_type != "admin":
        raise HTTPException(status_code=403, detail="Acesso restrito a administradores")
    return user

async def require_professional_or_company(request: Request) -> User:
    user = await get_current_user(request)
    if user.user_type not in ["profissional", "empresa"]:
        raise HTTPException(status_code=403, detail="Acesso restrito a profissionais ou empresas")
    return user

# ==================== ROTAS DE AUTENTICAÇÃO ====================

@api_router.post("/auth/register")
async def register(user_data: UserCreate, response: Response):
    # Verificar se email já existe
    existing = await db.users.find_one({"email": user_data.email}, {"_id": 0})
    if existing:
        raise HTTPException(status_code=400, detail="Email já registado")
    
    # Criar utilizador
    user_id = f"user_{uuid.uuid4().hex[:12]}"
    hashed_password = hash_password(user_data.password)
    
    user_doc = {
        "user_id": user_id,
        "email": user_data.email,
        "name": user_data.name,
        "phone": user_data.phone,
        "photo": None,
        "bi_photo": None,
        "bi_number": None,
        "password_hash": hashed_password,
        "user_type": user_data.user_type,
        "verification_status": "pendente",
        "verified_at": None,
        "company_name": user_data.company_name if user_data.user_type == "empresa" else None,
        "nif": user_data.nif if user_data.user_type == "empresa" else None,
        "company_logo": None,
        "province": None,
        "city": None,
        "subscription_plan": "gratuito",
        "subscription_expires": None,
        "rating": 0.0,
        "total_reviews": 0,
        "total_jobs_completed": 0,
        "created_at": datetime.now(timezone.utc),
        "is_active": True
    }
    
    await db.users.insert_one(user_doc)
    
    # Criar sessão
    session_token = f"jwt_{uuid.uuid4().hex}"
    await db.user_sessions.insert_one({
        "user_id": user_id,
        "session_token": session_token,
        "expires_at": datetime.now(timezone.utc) + timedelta(days=ACCESS_TOKEN_EXPIRE_DAYS),
        "created_at": datetime.now(timezone.utc)
    })
    
    # Definir cookie
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
            photo=None,
            user_type=user_data.user_type,
            verification_status="pendente",
            company_name=user_data.company_name if user_data.user_type == "empresa" else None,
            company_logo=None,
            province=None,
            city=None,
            subscription_plan="gratuito",
            rating=0.0,
            total_reviews=0,
            total_jobs_completed=0,
            is_active=True
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
    
    # Criar sessão
    session_token = f"jwt_{uuid.uuid4().hex}"
    await db.user_sessions.insert_one({
        "user_id": user_doc["user_id"],
        "session_token": session_token,
        "expires_at": datetime.now(timezone.utc) + timedelta(days=ACCESS_TOKEN_EXPIRE_DAYS),
        "created_at": datetime.now(timezone.utc)
    })
    
    # Definir cookie
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
            photo=user_doc.get("photo"),
            user_type=user_doc.get("user_type", "cliente"),
            verification_status=user_doc.get("verification_status", "pendente"),
            company_name=user_doc.get("company_name"),
            company_logo=user_doc.get("company_logo"),
            province=user_doc.get("province"),
            city=user_doc.get("city"),
            subscription_plan=user_doc.get("subscription_plan", "gratuito"),
            rating=user_doc.get("rating", 0.0),
            total_reviews=user_doc.get("total_reviews", 0),
            total_jobs_completed=user_doc.get("total_jobs_completed", 0),
            is_active=user_doc.get("is_active", True)
        ),
        "session_token": session_token
    }

@api_router.post("/auth/google/callback")
async def google_callback(request: Request, response: Response):
    body = await request.json()
    session_id = body.get("session_id")
    
    if not session_id:
        raise HTTPException(status_code=400, detail="Session ID necessário")
    
    # Trocar session_id por dados do utilizador
    async with httpx.AsyncClient() as client_http:
        resp = await client_http.get(
            "https://demobackend.emergentagent.com/auth/v1/env/oauth/session-data",
            headers={"X-Session-ID": session_id}
        )
        if resp.status_code != 200:
            raise HTTPException(status_code=401, detail="Sessão inválida")
        
        user_data = resp.json()
    
    # Verificar se utilizador existe
    existing_user = await db.users.find_one({"email": user_data["email"]}, {"_id": 0})
    
    if existing_user:
        user_id = existing_user["user_id"]
    else:
        # Criar novo utilizador
        user_id = f"user_{uuid.uuid4().hex[:12]}"
        await db.users.insert_one({
            "user_id": user_id,
            "email": user_data["email"],
            "name": user_data["name"],
            "phone": None,
            "photo": user_data.get("picture"),
            "bi_photo": None,
            "bi_number": None,
            "password_hash": None,
            "user_type": "cliente",
            "verification_status": "pendente",
            "verified_at": None,
            "company_name": None,
            "nif": None,
            "company_logo": None,
            "province": None,
            "city": None,
            "subscription_plan": "gratuito",
            "subscription_expires": None,
            "rating": 0.0,
            "total_reviews": 0,
            "total_jobs_completed": 0,
            "created_at": datetime.now(timezone.utc),
            "is_active": True
        })
    
    # Guardar sessão
    session_token = user_data.get("session_token", f"google_{uuid.uuid4().hex}")
    await db.user_sessions.insert_one({
        "user_id": user_id,
        "session_token": session_token,
        "expires_at": datetime.now(timezone.utc) + timedelta(days=7),
        "created_at": datetime.now(timezone.utc)
    })
    
    # Definir cookie
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
            photo=user_doc.get("photo"),
            user_type=user_doc.get("user_type", "cliente"),
            verification_status=user_doc.get("verification_status", "pendente"),
            company_name=user_doc.get("company_name"),
            company_logo=user_doc.get("company_logo"),
            province=user_doc.get("province"),
            city=user_doc.get("city"),
            subscription_plan=user_doc.get("subscription_plan", "gratuito"),
            rating=user_doc.get("rating", 0.0),
            total_reviews=user_doc.get("total_reviews", 0),
            total_jobs_completed=user_doc.get("total_jobs_completed", 0),
            is_active=user_doc.get("is_active", True)
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
        photo=current_user.photo,
        user_type=current_user.user_type,
        verification_status=current_user.verification_status,
        company_name=current_user.company_name,
        company_logo=current_user.company_logo,
        province=current_user.province,
        city=current_user.city,
        subscription_plan=current_user.subscription_plan,
        rating=current_user.rating,
        total_reviews=current_user.total_reviews,
        total_jobs_completed=current_user.total_jobs_completed,
        is_active=current_user.is_active
    )

@api_router.post("/auth/logout")
async def logout(request: Request, response: Response):
    session_token = await get_session_token(request)
    if session_token:
        await db.user_sessions.delete_one({"session_token": session_token})
    response.delete_cookie("session_token", path="/")
    return {"message": "Sessão terminada com sucesso"}

# ==================== ROTAS DE PERFIL ====================

@api_router.put("/users/profile")
async def update_profile(request: Request, current_user: User = Depends(get_current_user)):
    body = await request.json()
    update_data = {}
    
    allowed_fields = ["name", "phone", "province", "city", "photo", "bi_photo", "bi_number", "bio"]
    for field in allowed_fields:
        if field in body:
            update_data[field] = body[field]
    
    # Para empresas, permitir actualizar dados da empresa
    if current_user.user_type == "empresa":
        if "company_name" in body:
            update_data["company_name"] = body["company_name"]
        if "company_logo" in body:
            update_data["company_logo"] = body["company_logo"]
        if "nif" in body:
            update_data["nif"] = body["nif"]
    
    if update_data:
        await db.users.update_one(
            {"user_id": current_user.user_id},
            {"$set": update_data}
        )
        
        # Se actualizou BI, marcar verificação como pendente
        if "bi_photo" in update_data or "bi_number" in update_data:
            await db.users.update_one(
                {"user_id": current_user.user_id},
                {"$set": {"verification_status": "pendente"}}
            )
    
    user_doc = await db.users.find_one({"user_id": current_user.user_id}, {"_id": 0})
    return UserResponse(**{k: v for k, v in user_doc.items() if k in UserResponse.__fields__})

@api_router.post("/users/upload-verification")
async def upload_verification_documents(request: Request, current_user: User = Depends(get_current_user)):
    """Enviar documentos de verificação (foto e BI)"""
    body = await request.json()
    
    update_data = {"verification_status": "pendente"}
    
    if "photo" in body:
        update_data["photo"] = body["photo"]
    if "bi_photo" in body:
        update_data["bi_photo"] = body["bi_photo"]
    if "bi_number" in body:
        update_data["bi_number"] = body["bi_number"]
    
    await db.users.update_one(
        {"user_id": current_user.user_id},
        {"$set": update_data}
    )
    
    return {"message": "Documentos enviados para verificação", "status": "pendente"}

# ==================== ROTAS DE PERFIL PROFISSIONAL ====================

@api_router.post("/professionals/profile")
async def create_professional_profile(
    profile_data: ProfessionalProfileCreate,
    current_user: User = Depends(get_current_user)
):
    """Criar ou actualizar perfil de profissional/empresa"""
    if current_user.user_type not in ["profissional", "empresa"]:
        raise HTTPException(status_code=400, detail="Apenas profissionais ou empresas podem criar perfil")
    
    # Actualizar dados do utilizador
    await db.users.update_one(
        {"user_id": current_user.user_id},
        {"$set": {
            "bio": profile_data.bio,
            "categories": profile_data.categories,
            "province": profile_data.province,
            "city": profile_data.city,
            "experience_years": profile_data.experience_years
        }}
    )
    
    user_doc = await db.users.find_one({"user_id": current_user.user_id}, {"_id": 0})
    return ProfessionalProfile(**{k: v for k, v in user_doc.items() if k in ProfessionalProfile.__fields__})

@api_router.get("/professionals")
async def get_professionals(
    category: Optional[str] = None,
    province: Optional[str] = None,
    search: Optional[str] = None,
    verified_only: bool = False,
    limit: int = 50,
    skip: int = 0
):
    """Listar profissionais e empresas"""
    query = {
        "user_type": {"$in": ["profissional", "empresa"]},
        "is_active": True,
        "bio": {"$exists": True, "$ne": None}
    }
    
    if category:
        query["categories"] = category
    if province:
        query["province"] = province
    if verified_only:
        query["verification_status"] = "verificado"
    if search:
        query["$or"] = [
            {"name": {"$regex": search, "$options": "i"}},
            {"bio": {"$regex": search, "$options": "i"}},
            {"company_name": {"$regex": search, "$options": "i"}}
        ]
    
    professionals = await db.users.find(query, {"_id": 0, "password_hash": 0, "bi_photo": 0}).sort("rating", -1).skip(skip).limit(limit).to_list(limit)
    return professionals

@api_router.get("/professionals/featured")
async def get_featured_professionals(limit: int = 10):
    """Listar profissionais em destaque (com subscrição paga)"""
    professionals = await db.users.find(
        {
            "user_type": {"$in": ["profissional", "empresa"]},
            "is_active": True,
            "subscription_plan": {"$in": ["profissional", "empresa"]},
            "bio": {"$exists": True, "$ne": None}
        },
        {"_id": 0, "password_hash": 0, "bi_photo": 0}
    ).sort("rating", -1).limit(limit).to_list(limit)
    return professionals

@api_router.get("/professionals/{user_id}")
async def get_professional(user_id: str):
    """Obter perfil de um profissional"""
    professional = await db.users.find_one(
        {"user_id": user_id, "user_type": {"$in": ["profissional", "empresa"]}},
        {"_id": 0, "password_hash": 0, "bi_photo": 0}
    )
    if not professional:
        raise HTTPException(status_code=404, detail="Profissional não encontrado")
    return professional

# ==================== ROTAS DE PEDIDOS DE SERVIÇO ====================

@api_router.post("/service-requests")
async def create_service_request(
    request_data: ServiceRequestCreate,
    current_user: User = Depends(get_current_user)
):
    """Cliente cria pedido de serviço"""
    request_id = f"req_{uuid.uuid4().hex[:12]}"
    
    request_doc = {
        "request_id": request_id,
        "client_id": current_user.user_id,
        "client_name": current_user.company_name if current_user.user_type == "empresa" else current_user.name,
        "client_photo": current_user.company_logo if current_user.user_type == "empresa" else current_user.photo,
        "client_type": current_user.user_type,
        "client_verified": current_user.verification_status == "verificado",
        "title": request_data.title,
        "description": request_data.description,
        "category": request_data.category,
        "province": request_data.province,
        "city": request_data.city,
        "budget_min": request_data.budget_min,
        "budget_max": request_data.budget_max,
        "urgency": request_data.urgency,
        "deadline": request_data.deadline,
        "status": "aberto",
        "total_proposals": 0,
        "created_at": datetime.now(timezone.utc)
    }
    
    await db.service_requests.insert_one(request_doc)
    return ServiceRequest(**request_doc)

@api_router.get("/service-requests")
async def get_service_requests(
    category: Optional[str] = None,
    province: Optional[str] = None,
    urgency: Optional[str] = None,
    status: str = "aberto",
    limit: int = 50,
    skip: int = 0
):
    """Listar pedidos de serviço (para profissionais verem)"""
    query = {"status": status}
    
    if category:
        query["category"] = category
    if province:
        query["province"] = province
    if urgency:
        query["urgency"] = urgency
    
    requests = await db.service_requests.find(query, {"_id": 0}).sort("created_at", -1).skip(skip).limit(limit).to_list(limit)
    return requests

@api_router.get("/service-requests/my")
async def get_my_service_requests(current_user: User = Depends(get_current_user)):
    """Obter meus pedidos de serviço (como cliente)"""
    requests = await db.service_requests.find(
        {"client_id": current_user.user_id},
        {"_id": 0}
    ).sort("created_at", -1).to_list(100)
    return requests

@api_router.get("/service-requests/{request_id}")
async def get_service_request(request_id: str):
    """Obter detalhes de um pedido de serviço"""
    request = await db.service_requests.find_one({"request_id": request_id}, {"_id": 0})
    if not request:
        raise HTTPException(status_code=404, detail="Pedido não encontrado")
    return request

# ==================== ROTAS DE PROPOSTAS ====================

@api_router.post("/proposals")
async def create_proposal(
    proposal_data: ProposalCreate,
    current_user: User = Depends(require_professional_or_company)
):
    """Profissional envia proposta para um pedido de serviço"""
    # Verificar se pedido existe
    request = await db.service_requests.find_one({"request_id": proposal_data.request_id}, {"_id": 0})
    if not request:
        raise HTTPException(status_code=404, detail="Pedido não encontrado")
    
    if request["status"] != "aberto":
        raise HTTPException(status_code=400, detail="Este pedido já não aceita propostas")
    
    # Verificar limite de propostas do plano
    if current_user.subscription_plan == "gratuito":
        # Contar propostas do mês
        start_of_month = datetime.now(timezone.utc).replace(day=1, hour=0, minute=0, second=0, microsecond=0)
        proposals_count = await db.proposals.count_documents({
            "professional_id": current_user.user_id,
            "created_at": {"$gte": start_of_month}
        })
        if proposals_count >= 3:
            raise HTTPException(status_code=400, detail="Limite de propostas do plano gratuito atingido. Actualize para o plano Profissional.")
    
    # Verificar se já enviou proposta
    existing = await db.proposals.find_one({
        "request_id": proposal_data.request_id,
        "professional_id": current_user.user_id
    })
    if existing:
        raise HTTPException(status_code=400, detail="Já enviou uma proposta para este pedido")
    
    proposal_id = f"prop_{uuid.uuid4().hex[:12]}"
    
    proposal_doc = {
        "proposal_id": proposal_id,
        "request_id": proposal_data.request_id,
        "professional_id": current_user.user_id,
        "professional_name": current_user.company_name if current_user.user_type == "empresa" else current_user.name,
        "professional_photo": current_user.company_logo if current_user.user_type == "empresa" else current_user.photo,
        "professional_type": current_user.user_type,
        "professional_verified": current_user.verification_status == "verificado",
        "professional_rating": current_user.rating,
        "professional_reviews": current_user.total_reviews,
        "price": proposal_data.price,
        "description": proposal_data.description,
        "estimated_days": proposal_data.estimated_days,
        "status": "pendente",
        "created_at": datetime.now(timezone.utc)
    }
    
    await db.proposals.insert_one(proposal_doc)
    
    # Actualizar contador de propostas
    await db.service_requests.update_one(
        {"request_id": proposal_data.request_id},
        {"$inc": {"total_proposals": 1}}
    )
    
    return Proposal(**proposal_doc)

@api_router.get("/proposals/request/{request_id}")
async def get_proposals_for_request(
    request_id: str,
    current_user: User = Depends(get_current_user)
):
    """Obter propostas para um pedido (apenas o dono do pedido pode ver)"""
    request = await db.service_requests.find_one({"request_id": request_id}, {"_id": 0})
    if not request:
        raise HTTPException(status_code=404, detail="Pedido não encontrado")
    
    if request["client_id"] != current_user.user_id:
        raise HTTPException(status_code=403, detail="Não autorizado")
    
    proposals = await db.proposals.find(
        {"request_id": request_id},
        {"_id": 0}
    ).sort("created_at", -1).to_list(100)
    return proposals

@api_router.get("/proposals/my")
async def get_my_proposals(current_user: User = Depends(require_professional_or_company)):
    """Obter minhas propostas (como profissional)"""
    proposals = await db.proposals.find(
        {"professional_id": current_user.user_id},
        {"_id": 0}
    ).sort("created_at", -1).to_list(100)
    return proposals

@api_router.put("/proposals/{proposal_id}/accept")
async def accept_proposal(
    proposal_id: str,
    current_user: User = Depends(get_current_user)
):
    """Cliente aceita uma proposta"""
    proposal = await db.proposals.find_one({"proposal_id": proposal_id}, {"_id": 0})
    if not proposal:
        raise HTTPException(status_code=404, detail="Proposta não encontrada")
    
    request = await db.service_requests.find_one({"request_id": proposal["request_id"]}, {"_id": 0})
    if request["client_id"] != current_user.user_id:
        raise HTTPException(status_code=403, detail="Não autorizado")
    
    # Aceitar proposta
    await db.proposals.update_one(
        {"proposal_id": proposal_id},
        {"$set": {"status": "aceite"}}
    )
    
    # Rejeitar outras propostas
    await db.proposals.update_many(
        {"request_id": proposal["request_id"], "proposal_id": {"$ne": proposal_id}},
        {"$set": {"status": "rejeitada"}}
    )
    
    # Actualizar pedido
    await db.service_requests.update_one(
        {"request_id": proposal["request_id"]},
        {"$set": {"status": "em_andamento"}}
    )
    
    # Criar trabalho/contrato
    job_id = f"job_{uuid.uuid4().hex[:12]}"
    await db.jobs.insert_one({
        "job_id": job_id,
        "request_id": proposal["request_id"],
        "proposal_id": proposal_id,
        "client_id": current_user.user_id,
        "professional_id": proposal["professional_id"],
        "price": proposal["price"],
        "status": "em_andamento",
        "created_at": datetime.now(timezone.utc)
    })
    
    return {"message": "Proposta aceite", "job_id": job_id}

@api_router.put("/jobs/{job_id}/complete")
async def complete_job(
    job_id: str,
    current_user: User = Depends(get_current_user)
):
    """Marcar trabalho como concluído"""
    job = await db.jobs.find_one({"job_id": job_id}, {"_id": 0})
    if not job:
        raise HTTPException(status_code=404, detail="Trabalho não encontrado")
    
    if job["client_id"] != current_user.user_id:
        raise HTTPException(status_code=403, detail="Não autorizado")
    
    await db.jobs.update_one(
        {"job_id": job_id},
        {"$set": {"status": "concluido", "completed_at": datetime.now(timezone.utc)}}
    )
    
    # Actualizar pedido
    await db.service_requests.update_one(
        {"request_id": job["request_id"]},
        {"$set": {"status": "concluido"}}
    )
    
    # Actualizar contador do profissional
    await db.users.update_one(
        {"user_id": job["professional_id"]},
        {"$inc": {"total_jobs_completed": 1}}
    )
    
    # Registar comissão (10% do valor)
    commission = job["price"] * 0.10
    await db.transactions.insert_one({
        "transaction_id": f"txn_{uuid.uuid4().hex[:12]}",
        "user_id": job["professional_id"],
        "job_id": job_id,
        "type": "commission",
        "amount": commission,
        "description": f"Comissão de serviço - {job_id}",
        "status": "pendente",
        "created_at": datetime.now(timezone.utc)
    })
    
    return {"message": "Trabalho concluído", "commission": commission}

# ==================== ROTAS DE AVALIAÇÕES ====================

@api_router.post("/reviews")
async def create_review(
    review_data: ReviewCreate,
    current_user: User = Depends(get_current_user)
):
    """Avaliar um utilizador após trabalho concluído"""
    # Verificar se o trabalho existe e está concluído
    job = await db.jobs.find_one({"job_id": review_data.job_id}, {"_id": 0})
    if not job:
        raise HTTPException(status_code=404, detail="Trabalho não encontrado")
    
    if job["status"] != "concluido":
        raise HTTPException(status_code=400, detail="Só pode avaliar após conclusão do trabalho")
    
    # Verificar se utilizador faz parte do trabalho
    if current_user.user_id not in [job["client_id"], job["professional_id"]]:
        raise HTTPException(status_code=403, detail="Não autorizado")
    
    # Verificar se já avaliou
    existing = await db.reviews.find_one({
        "job_id": review_data.job_id,
        "reviewer_id": current_user.user_id
    })
    if existing:
        raise HTTPException(status_code=400, detail="Já avaliou este trabalho")
    
    review_id = f"rev_{uuid.uuid4().hex[:12]}"
    
    review_doc = {
        "review_id": review_id,
        "reviewer_id": current_user.user_id,
        "reviewer_name": current_user.name,
        "reviewer_photo": current_user.photo,
        "reviewed_user_id": review_data.reviewed_user_id,
        "job_id": review_data.job_id,
        "rating": review_data.rating,
        "comment": review_data.comment,
        "created_at": datetime.now(timezone.utc)
    }
    
    await db.reviews.insert_one(review_doc)
    
    # Actualizar média de avaliação
    all_reviews = await db.reviews.find({"reviewed_user_id": review_data.reviewed_user_id}, {"_id": 0}).to_list(1000)
    avg_rating = sum(r["rating"] for r in all_reviews) / len(all_reviews)
    
    await db.users.update_one(
        {"user_id": review_data.reviewed_user_id},
        {"$set": {"rating": round(avg_rating, 1), "total_reviews": len(all_reviews)}}
    )
    
    return Review(**review_doc)

@api_router.get("/reviews/{user_id}")
async def get_user_reviews(user_id: str, limit: int = 50):
    """Obter avaliações de um utilizador"""
    reviews = await db.reviews.find(
        {"reviewed_user_id": user_id},
        {"_id": 0}
    ).sort("created_at", -1).limit(limit).to_list(limit)
    return reviews

# ==================== ROTAS DE MENSAGENS ====================

@api_router.post("/messages")
async def send_message(
    message_data: MessageCreate,
    current_user: User = Depends(get_current_user)
):
    """Enviar mensagem"""
    # Obter ou criar conversa
    participants = sorted([current_user.user_id, message_data.receiver_id])
    conversation_id = f"conv_{'_'.join(participants)}"
    
    conversation = await db.conversations.find_one({"conversation_id": conversation_id}, {"_id": 0})
    
    if not conversation:
        receiver = await db.users.find_one({"user_id": message_data.receiver_id}, {"_id": 0})
        if not receiver:
            raise HTTPException(status_code=404, detail="Destinatário não encontrado")
        
        conversation = {
            "conversation_id": conversation_id,
            "participants": participants,
            "participant_names": {
                current_user.user_id: current_user.company_name or current_user.name,
                message_data.receiver_id: receiver.get("company_name") or receiver["name"]
            },
            "participant_photos": {
                current_user.user_id: current_user.company_logo or current_user.photo,
                message_data.receiver_id: receiver.get("company_logo") or receiver.get("photo")
            },
            "participant_types": {
                current_user.user_id: current_user.user_type,
                message_data.receiver_id: receiver.get("user_type", "cliente")
            },
            "last_message": None,
            "last_message_time": None,
            "unread_count": 0,
            "created_at": datetime.now(timezone.utc)
        }
        await db.conversations.insert_one(conversation)
    
    # Criar mensagem
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
    
    # Actualizar conversa
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

@api_router.get("/conversations")
async def get_conversations(current_user: User = Depends(get_current_user)):
    """Obter conversas"""
    conversations = await db.conversations.find(
        {"participants": current_user.user_id},
        {"_id": 0}
    ).sort("last_message_time", -1).to_list(100)
    return conversations

@api_router.get("/messages/{conversation_id}")
async def get_messages(
    conversation_id: str,
    current_user: User = Depends(get_current_user),
    limit: int = 100
):
    """Obter mensagens de uma conversa"""
    conversation = await db.conversations.find_one({"conversation_id": conversation_id}, {"_id": 0})
    if not conversation or current_user.user_id not in conversation["participants"]:
        raise HTTPException(status_code=403, detail="Não autorizado")
    
    messages = await db.messages.find(
        {"conversation_id": conversation_id},
        {"_id": 0}
    ).sort("created_at", 1).limit(limit).to_list(limit)
    
    # Marcar como lidas
    await db.messages.update_many(
        {"conversation_id": conversation_id, "receiver_id": current_user.user_id, "is_read": False},
        {"$set": {"is_read": True}}
    )
    
    await db.conversations.update_one(
        {"conversation_id": conversation_id},
        {"$set": {"unread_count": 0}}
    )
    
    return messages

# ==================== ROTAS DE SUBSCRIÇÃO ====================

@api_router.get("/subscriptions/plans")
async def get_subscription_plans():
    """Obter planos de subscrição"""
    return SUBSCRIPTION_PLANS

@api_router.post("/subscriptions/subscribe")
async def subscribe(request: Request, current_user: User = Depends(get_current_user)):
    """Subscrever um plano"""
    body = await request.json()
    plan_id = body.get("plan_id")
    
    plan = next((p for p in SUBSCRIPTION_PLANS if p["id"] == plan_id), None)
    if not plan:
        raise HTTPException(status_code=404, detail="Plano não encontrado")
    
    # Criar transacção
    transaction_id = f"txn_{uuid.uuid4().hex[:12]}"
    await db.transactions.insert_one({
        "transaction_id": transaction_id,
        "user_id": current_user.user_id,
        "type": "subscription",
        "amount": plan["price"],
        "description": f"Subscrição plano {plan['name']}",
        "plan_id": plan_id,
        "status": "pendente",  # Em produção, integraria com sistema de pagamento
        "created_at": datetime.now(timezone.utc)
    })
    
    # Por agora, activar imediatamente (em produção, só após confirmação de pagamento)
    expires_at = datetime.now(timezone.utc) + timedelta(days=30)
    await db.users.update_one(
        {"user_id": current_user.user_id},
        {"$set": {
            "subscription_plan": plan_id,
            "subscription_expires": expires_at
        }}
    )
    
    await db.transactions.update_one(
        {"transaction_id": transaction_id},
        {"$set": {"status": "pago"}}
    )
    
    return {
        "message": f"Plano {plan['name']} activado",
        "expires_at": expires_at.isoformat(),
        "transaction_id": transaction_id
    }

# ==================== ROTAS DE ADMIN ====================

@api_router.get("/admin/stats")
async def get_admin_stats(admin_user: User = Depends(require_admin)):
    """Obter estatísticas do admin"""
    total_users = await db.users.count_documents({})
    total_clients = await db.users.count_documents({"user_type": "cliente"})
    total_professionals = await db.users.count_documents({"user_type": "profissional"})
    total_companies = await db.users.count_documents({"user_type": "empresa"})
    pending_verifications = await db.users.count_documents({"verification_status": "pendente", "bi_photo": {"$ne": None}})
    total_service_requests = await db.service_requests.count_documents({})
    total_proposals = await db.proposals.count_documents({})
    total_jobs_completed = await db.jobs.count_documents({"status": "concluido"})
    
    # Calcular receita total
    revenue_pipeline = [
        {"$match": {"status": "pago"}},
        {"$group": {"_id": None, "total": {"$sum": "$amount"}}}
    ]
    revenue_result = await db.transactions.aggregate(revenue_pipeline).to_list(1)
    total_revenue = revenue_result[0]["total"] if revenue_result else 0
    
    return AdminStats(
        total_users=total_users,
        total_clients=total_clients,
        total_professionals=total_professionals,
        total_companies=total_companies,
        pending_verifications=pending_verifications,
        total_service_requests=total_service_requests,
        total_proposals=total_proposals,
        total_jobs_completed=total_jobs_completed,
        total_revenue=total_revenue
    )

@api_router.get("/admin/users")
async def get_admin_users(
    admin_user: User = Depends(require_admin),
    user_type: Optional[str] = None,
    verification_status: Optional[str] = None,
    limit: int = 50,
    skip: int = 0
):
    """Listar utilizadores (admin)"""
    query = {}
    if user_type:
        query["user_type"] = user_type
    if verification_status:
        query["verification_status"] = verification_status
    
    users = await db.users.find(query, {"_id": 0, "password_hash": 0}).skip(skip).limit(limit).to_list(limit)
    return users

@api_router.get("/admin/pending-verifications")
async def get_pending_verifications(admin_user: User = Depends(require_admin)):
    """Obter utilizadores pendentes de verificação"""
    users = await db.users.find(
        {"verification_status": "pendente", "bi_photo": {"$ne": None}},
        {"_id": 0, "password_hash": 0}
    ).to_list(100)
    return users

@api_router.put("/admin/verify-user/{user_id}")
async def verify_user(
    user_id: str,
    request: Request,
    admin_user: User = Depends(require_admin)
):
    """Verificar ou rejeitar utilizador"""
    body = await request.json()
    action = body.get("action")  # "verificar" ou "rejeitar"
    reason = body.get("reason", "")
    
    if action not in ["verificar", "rejeitar"]:
        raise HTTPException(status_code=400, detail="Acção inválida")
    
    new_status = "verificado" if action == "verificar" else "rejeitado"
    
    update_data = {"verification_status": new_status}
    if action == "verificar":
        update_data["verified_at"] = datetime.now(timezone.utc)
    
    await db.users.update_one({"user_id": user_id}, {"$set": update_data})
    
    # Registar acção
    await db.admin_actions.insert_one({
        "action_id": f"act_{uuid.uuid4().hex[:12]}",
        "admin_id": admin_user.user_id,
        "user_id": user_id,
        "action": action,
        "reason": reason,
        "created_at": datetime.now(timezone.utc)
    })
    
    return {"message": f"Utilizador {new_status}"}

@api_router.put("/admin/toggle-user/{user_id}")
async def toggle_user_status(
    user_id: str,
    admin_user: User = Depends(require_admin)
):
    """Activar/desactivar utilizador"""
    user = await db.users.find_one({"user_id": user_id}, {"_id": 0})
    if not user:
        raise HTTPException(status_code=404, detail="Utilizador não encontrado")
    
    new_status = not user.get("is_active", True)
    await db.users.update_one({"user_id": user_id}, {"$set": {"is_active": new_status}})
    
    return {"message": f"Utilizador {'activado' if new_status else 'desactivado'}"}

@api_router.get("/admin/transactions")
async def get_admin_transactions(
    admin_user: User = Depends(require_admin),
    type: Optional[str] = None,
    status: Optional[str] = None,
    limit: int = 50,
    skip: int = 0
):
    """Listar transacções (admin)"""
    query = {}
    if type:
        query["type"] = type
    if status:
        query["status"] = status
    
    transactions = await db.transactions.find(query, {"_id": 0}).sort("created_at", -1).skip(skip).limit(limit).to_list(limit)
    return transactions

# ==================== ROTAS ESTÁTICAS ====================

@api_router.get("/categories")
async def get_categories():
    return SERVICE_CATEGORIES

@api_router.get("/provinces")
async def get_provinces():
    return ANGOLA_PROVINCES

@api_router.get("/")
async def root():
    return {"message": "Serviços Angola API", "version": "2.0.0"}

# ==================== DADOS DE TESTE ====================

@api_router.post("/seed")
async def seed_data():
    """Criar dados iniciais para teste"""
    
    # Limpar dados existentes
    await db.users.delete_many({"user_type": {"$ne": "admin"}})
    await db.service_requests.delete_many({})
    await db.proposals.delete_many({})
    await db.jobs.delete_many({})
    
    # Criar admin
    admin_exists = await db.users.find_one({"user_type": "admin"})
    if not admin_exists:
        await db.users.insert_one({
            "user_id": "admin_001",
            "email": "admin@servicosangola.ao",
            "name": "Administrador",
            "phone": "+244 900 000 000",
            "photo": None,
            "bi_photo": None,
            "bi_number": None,
            "password_hash": hash_password("admin123"),
            "user_type": "admin",
            "verification_status": "verificado",
            "verified_at": datetime.now(timezone.utc),
            "company_name": None,
            "nif": None,
            "company_logo": None,
            "province": "Luanda",
            "city": "Luanda",
            "subscription_plan": "empresa",
            "subscription_expires": None,
            "rating": 0.0,
            "total_reviews": 0,
            "total_jobs_completed": 0,
            "created_at": datetime.now(timezone.utc),
            "is_active": True
        })
    
    # Criar profissionais
    profissionais = [
        {
            "user_id": "prof_001",
            "email": "joao@email.com",
            "name": "João Manuel",
            "phone": "+244 923 111 111",
            "photo": None,
            "bi_photo": None,
            "bi_number": "000123456LA789",
            "password_hash": hash_password("123456"),
            "user_type": "profissional",
            "verification_status": "verificado",
            "verified_at": datetime.now(timezone.utc),
            "company_name": None,
            "nif": None,
            "company_logo": None,
            "province": "Luanda",
            "city": "Talatona",
            "bio": "Eletricista certificado com mais de 10 anos de experiência. Especializado em instalações residenciais e comerciais.",
            "categories": ["eletricista"],
            "experience_years": 10,
            "subscription_plan": "profissional",
            "subscription_expires": datetime.now(timezone.utc) + timedelta(days=30),
            "rating": 4.8,
            "total_reviews": 25,
            "total_jobs_completed": 45,
            "created_at": datetime.now(timezone.utc),
            "is_active": True
        },
        {
            "user_id": "prof_002",
            "email": "maria@email.com",
            "name": "Maria Santos",
            "phone": "+244 924 222 222",
            "photo": None,
            "bi_photo": None,
            "bi_number": "000456789LA123",
            "password_hash": hash_password("123456"),
            "user_type": "profissional",
            "verification_status": "verificado",
            "verified_at": datetime.now(timezone.utc),
            "company_name": None,
            "nif": None,
            "company_logo": None,
            "province": "Luanda",
            "city": "Morro Bento",
            "bio": "Contabilista formada com experiência em pequenas e médias empresas. Serviços de contabilidade, impostos e consultoria financeira.",
            "categories": ["contabilista"],
            "experience_years": 8,
            "subscription_plan": "profissional",
            "subscription_expires": datetime.now(timezone.utc) + timedelta(days=30),
            "rating": 4.9,
            "total_reviews": 18,
            "total_jobs_completed": 30,
            "created_at": datetime.now(timezone.utc),
            "is_active": True
        },
        {
            "user_id": "prof_003",
            "email": "pedro@email.com",
            "name": "Pedro Domingos",
            "phone": "+244 925 333 333",
            "photo": None,
            "bi_photo": None,
            "bi_number": "000789123BE456",
            "password_hash": hash_password("123456"),
            "user_type": "profissional",
            "verification_status": "pendente",
            "verified_at": None,
            "company_name": None,
            "nif": None,
            "company_logo": None,
            "province": "Benguela",
            "city": "Benguela",
            "bio": "Pintor profissional. Trabalho com tintas de qualidade e atenção aos detalhes. Residencial e comercial.",
            "categories": ["pintor"],
            "experience_years": 5,
            "subscription_plan": "gratuito",
            "subscription_expires": None,
            "rating": 4.5,
            "total_reviews": 12,
            "total_jobs_completed": 20,
            "created_at": datetime.now(timezone.utc),
            "is_active": True
        }
    ]
    
    for prof in profissionais:
        await db.users.insert_one(prof)
    
    # Criar empresas
    empresas = [
        {
            "user_id": "emp_001",
            "email": "techsolutions@email.com",
            "name": "Gestor TechSolutions",
            "phone": "+244 926 444 444",
            "photo": None,
            "bi_photo": None,
            "bi_number": None,
            "password_hash": hash_password("123456"),
            "user_type": "empresa",
            "verification_status": "verificado",
            "verified_at": datetime.now(timezone.utc),
            "company_name": "TechSolutions Angola",
            "nif": "5000123456",
            "company_logo": None,
            "province": "Luanda",
            "city": "Luanda",
            "bio": "Empresa de TI especializada em suporte técnico, redes e desenvolvimento de software para empresas.",
            "categories": ["informatico", "consultoria"],
            "experience_years": 6,
            "subscription_plan": "empresa",
            "subscription_expires": datetime.now(timezone.utc) + timedelta(days=30),
            "rating": 4.7,
            "total_reviews": 35,
            "total_jobs_completed": 60,
            "created_at": datetime.now(timezone.utc),
            "is_active": True
        },
        {
            "user_id": "emp_002",
            "email": "construcoes@email.com",
            "name": "Gestor Construções",
            "phone": "+244 927 555 555",
            "photo": None,
            "bi_photo": None,
            "bi_number": None,
            "password_hash": hash_password("123456"),
            "user_type": "empresa",
            "verification_status": "verificado",
            "verified_at": datetime.now(timezone.utc),
            "company_name": "Construções Angola Lda",
            "nif": "5000789012",
            "company_logo": None,
            "province": "Luanda",
            "city": "Viana",
            "bio": "Empresa de construção civil com vasta experiência em obras residenciais e comerciais.",
            "categories": ["construcao", "pedreiro", "pintor"],
            "experience_years": 15,
            "subscription_plan": "empresa",
            "subscription_expires": datetime.now(timezone.utc) + timedelta(days=30),
            "rating": 4.6,
            "total_reviews": 42,
            "total_jobs_completed": 80,
            "created_at": datetime.now(timezone.utc),
            "is_active": True
        }
    ]
    
    for emp in empresas:
        await db.users.insert_one(emp)
    
    # Criar pedidos de serviço de exemplo
    pedidos = [
        {
            "request_id": "req_001",
            "client_id": "admin_001",
            "client_name": "Administrador",
            "client_photo": None,
            "client_type": "admin",
            "client_verified": True,
            "title": "Instalação eléctrica para escritório",
            "description": "Preciso de um eletricista para fazer a instalação elétrica completa de um escritório de 100m². Aproximadamente 20 pontos de tomada e 15 pontos de luz.",
            "category": "eletricista",
            "province": "Luanda",
            "city": "Talatona",
            "budget_min": 50000,
            "budget_max": 150000,
            "urgency": "normal",
            "deadline": "Próximas 2 semanas",
            "status": "aberto",
            "total_proposals": 0,
            "created_at": datetime.now(timezone.utc)
        },
        {
            "request_id": "req_002",
            "client_id": "emp_001",
            "client_name": "TechSolutions Angola",
            "client_photo": None,
            "client_type": "empresa",
            "client_verified": True,
            "title": "Serviços de contabilidade mensal",
            "description": "Procuramos contabilista para fazer gestão contabilística mensal da nossa empresa. Cerca de 50 facturas por mês.",
            "category": "contabilista",
            "province": "Luanda",
            "city": "Luanda",
            "budget_min": None,
            "budget_max": None,
            "urgency": "normal",
            "deadline": None,
            "status": "aberto",
            "total_proposals": 0,
            "created_at": datetime.now(timezone.utc)
        }
    ]
    
    for pedido in pedidos:
        await db.service_requests.insert_one(pedido)
    
    return {
        "message": "Dados iniciais criados com sucesso",
        "admin": {"email": "admin@servicosangola.ao", "password": "admin123"},
        "profissionais": 3,
        "empresas": 2,
        "pedidos": 2
    }

# Incluir router na aplicação principal
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
