import os
from datetime import datetime, timezone
from typing import Any, Dict, List, Optional
from motor.motor_asyncio import AsyncIOMotorClient
from dotenv import load_dotenv

load_dotenv()

# MongoDB Local Configuration
MONGODB_URI = os.getenv("MONGODB_URI", "mongodb://localhost:27017/agropath").strip()
DB_NAME = os.getenv("MONGODB_DB_NAME", "agropath").strip()

client: Optional[AsyncIOMotorClient] = None
db = None

def get_database():
    """Returns the active MongoDB database instance."""
    global client, db
    if client is None:
        client = AsyncIOMotorClient(MONGODB_URI, serverSelectionTimeoutMS=5000)
        db = client[DB_NAME]
    return db

async def init_db():
    """Initializes MongoDB indexes for performance and unique constraints."""
    database = get_database()
    try:
        # Check connection
        await database.command("ping")
        print(f"[Database] Connected successfully to local MongoDB at: {MONGODB_URI}")

        # Unique indexes for user accounts
        await database.users.create_index("username", unique=True)
        await database.users.create_index("email", unique=True)

        # Query indexes
        await database.disease_history.create_index([("created_at", -1)])
        await database.disease_history.create_index("user_id")

        await database.crop_recommendations.create_index([("created_at", -1)])
        await database.crop_recommendations.create_index("user_id")

        await database.chat_history.create_index("session_id")
        await database.chat_history.create_index([("created_at", 1)])

        print("[Database] MongoDB indexes initialized successfully.")
    except Exception as e:
        print(f"[Database] MongoDB connection warning: {e}")

def _serialize_mongo_doc(doc: Dict[str, Any]) -> Dict[str, Any]:
    """Helper to convert MongoDB ObjectId and datetimes to serializable types."""
    if not doc:
        return doc
    doc_copy = dict(doc)
    if "_id" in doc_copy:
        doc_copy["id"] = str(doc_copy.pop("_id"))
    if "created_at" in doc_copy and isinstance(doc_copy["created_at"], datetime):
        doc_copy["created_at"] = doc_copy["created_at"].isoformat()
    return doc_copy

# 1. Disease Detection History
async def save_disease_record(
    filename: str,
    detected_class: str,
    confidence: float,
    predictions: list,
    treatment_plan: dict,
    user_id: Optional[str] = None,
    embedding: Optional[List[float]] = None
) -> str:
    database = get_database()
    doc = {
        "user_id": str(user_id) if user_id else None,
        "filename": filename,
        "detected_class": detected_class,
        "confidence": confidence,
        "predictions": predictions,
        "treatment_plan": treatment_plan,
        "embedding": embedding,
        "created_at": datetime.now(timezone.utc)
    }
    result = await database.disease_history.insert_one(doc)
    return str(result.inserted_id)

async def search_similar_disease_cases(
    query_vector: List[float],
    limit: int = 5,
    min_score: float = 0.5
) -> List[Dict[str, Any]]:
    """Performs vector cosine similarity search across diagnosed disease cases in MongoDB."""
    from app.services.embedding_service import embedding_service
    database = get_database()
    cursor = database.disease_history.find({"embedding": {"$ne": None}}).limit(100)
    
    scored_results = []
    async for doc in cursor:
        stored_vec = doc.get("embedding")
        if stored_vec and len(stored_vec) == len(query_vector):
            score = embedding_service.cosine_similarity(query_vector, stored_vec)
            if score >= min_score:
                serialized = _serialize_mongo_doc(doc)
                serialized.pop("embedding", None) # Omit heavy raw vector from API output
                serialized["similarity_score"] = round(score, 4)
                scored_results.append(serialized)

    scored_results.sort(key=lambda x: x["similarity_score"], reverse=True)
    return scored_results[:limit]

async def get_disease_history(limit: int = 50, user_id: Optional[str] = None) -> List[Dict[str, Any]]:
    database = get_database()
    query = {"user_id": str(user_id)} if user_id else {}
    cursor = database.disease_history.find(query).sort("created_at", -1).limit(limit)
    records = []
    async for doc in cursor:
        records.append(_serialize_mongo_doc(doc))
    return records

# 2. Crop Recommendations
async def save_crop_recommendation(
    data: dict,
    recommendations: list,
    user_id: Optional[str] = None
) -> str:
    database = get_database()
    doc = {
        "user_id": str(user_id) if user_id else None,
        "location": data.get("location", "Unknown"),
        "land_area": float(data.get("land_area", 0.0)),
        "soil_type": data.get("soil_type", "Unknown"),
        "water_source": data.get("water_source", "Unknown"),
        "budget": float(data.get("budget", 0.0)),
        "recommended_crops": recommendations,
        "created_at": datetime.now(timezone.utc)
    }
    result = await database.crop_recommendations.insert_one(doc)
    return str(result.inserted_id)

async def get_crop_history(limit: int = 20, user_id: Optional[str] = None) -> List[Dict[str, Any]]:
    database = get_database()
    query = {"user_id": str(user_id)} if user_id else {}
    cursor = database.crop_recommendations.find(query).sort("created_at", -1).limit(limit)
    records = []
    async for doc in cursor:
        records.append(_serialize_mongo_doc(doc))
    return records

# 3. Chat Messages
async def save_chat_message(
    session_id: str,
    role: str,
    message: str,
    user_id: Optional[str] = None
) -> str:
    database = get_database()
    doc = {
        "session_id": session_id,
        "user_id": str(user_id) if user_id else None,
        "role": role,
        "message": message,
        "created_at": datetime.now(timezone.utc)
    }
    result = await database.chat_history.insert_one(doc)
    return str(result.inserted_id)

async def get_chat_history(session_id: str, limit: int = 50) -> List[Dict[str, Any]]:
    database = get_database()
    cursor = database.chat_history.find({"session_id": session_id}).sort("created_at", 1).limit(limit)
    messages = []
    async for doc in cursor:
        msg = _serialize_mongo_doc(doc)
        messages.append({
            "role": msg.get("role"),
            "message": msg.get("message"),
            "created_at": msg.get("created_at")
        })
    return messages

async def clear_chat_history(session_id: str):
    database = get_database()
    await database.chat_history.delete_many({"session_id": session_id})

# 4. User Accounts
async def get_user_by_email(email: str) -> Optional[Dict[str, Any]]:
    database = get_database()
    user = await database.users.find_one({"email": email})
    return _serialize_mongo_doc(user) if user else None

async def get_user_by_username(username: str) -> Optional[Dict[str, Any]]:
    database = get_database()
    user = await database.users.find_one({"username": username})
    return _serialize_mongo_doc(user) if user else None

async def create_user(username: str, email: str, password_hash: str, full_name: Optional[str] = None) -> str:
    database = get_database()
    doc = {
        "username": username,
        "email": email,
        "password_hash": password_hash,
        "full_name": full_name,
        "created_at": datetime.now(timezone.utc)
    }
    result = await database.users.insert_one(doc)
    return str(result.inserted_id)
