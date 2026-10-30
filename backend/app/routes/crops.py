from fastapi import APIRouter, HTTPException
from pydantic import BaseModel
from app.services.gemini_service import gemini_service

router = APIRouter()

class CropRecommendationRequest(BaseModel):
    location: str
    land_area: str
    soil_type: str
    water_source: str
    budget: str

@router.post("/recommend")
async def recommend_crops(request: CropRecommendationRequest):
    try:
        recommendation = await gemini_service.get_crop_recommendation(
            location=request.location,
            land_area=request.land_area,
            soil_type=request.soil_type,
            water_source=request.water_source,
            budget=request.budget
        )
        return {
            "status": "success",
            "model": gemini_service.model,
            "recommendation": recommendation
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))
