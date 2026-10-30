from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from app.routes import disease, crops, chat

app = FastAPI(title="AgroPath API")

# Configure CORS so the React frontend can communicate with the backend
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"], # Vite port & general access
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

@app.get("/health")
async def health_check():
    return {"status": "healthy", "message": "FastAPI backend is connected and running!"}

# Include routes
app.include_router(disease.router, prefix="/disease", tags=["Disease Detection"])
app.include_router(crops.router, prefix="/crops", tags=["Crop Recommendation"])
app.include_router(chat.router, prefix="/chat", tags=["AI Farming Assistant"])

