from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from app.routes import disease

app = FastAPI(title="AgroPath API")

# Configure CORS so the React frontend can communicate with the backend
app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:5173"], # Default Vite port
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

@app.get("/health")
async def health_check():
    return {"status": "healthy", "message": "FastAPI backend is connected and running!"}

# Include routes
app.include_router(disease.router, prefix="/disease", tags=["Disease Detection"])
