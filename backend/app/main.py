import os
from contextlib import asynccontextmanager
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from dotenv import load_dotenv

# Load environment variables
load_dotenv()

from app.database import init_db
from app.routes import disease, auth, crops, weather, chat
from app.services.yolo_service import detector

@asynccontextmanager
async def lifespan(app: FastAPI):
    # Startup: connect to local MongoDB and prepare models
    print("[AgroPath] Starting backend services...")
    await init_db()
    if detector.model is None:
        detector._load_model()
    yield
    # Shutdown
    print("[AgroPath] Shutting down backend.")

app = FastAPI(
    title="AgroPath Intelligent Agricultural API",
    description="AI-powered plant disease detection, crop recommendation, weather intelligence, and farming assistant with local MongoDB.",
    version="1.0.0",
    lifespan=lifespan
)

# CORS configuration
origins_env = os.getenv("CORS_ORIGINS", "http://localhost:5173,http://localhost:3000")
origins = [origin.strip() for origin in origins_env.split(",") if origin.strip()]

app.add_middleware(
    CORSMiddleware,
    allow_origins=origins if origins else ["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

@app.get("/health")
async def health_check():
    return {
        "status": "healthy",
        "service": "AgroPath API",
        "version": "1.0.0",
        "yolo_loaded": detector.model is not None,
        "database": "MongoDB (local: localhost:27017)",
        "features": {
            "disease_detection": True,
            "crop_recommendation": True,
            "weather_intelligence": True,
            "ai_assistant": True,
            "authentication": True
        }
    }

# Register all modular routers
app.include_router(disease.router, prefix="/disease", tags=["Disease Detection"])
app.include_router(auth.router, prefix="/auth", tags=["Authentication"])
app.include_router(crops.router, prefix="/crops", tags=["Crop Recommendation"])
app.include_router(weather.router, prefix="/weather", tags=["Weather Intelligence"])
app.include_router(chat.router, prefix="/chat", tags=["Farming Assistant Chat"])
