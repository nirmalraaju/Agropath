from typing import Optional, List
from fastapi import APIRouter, HTTPException, Depends
from pydantic import BaseModel, Field
from app.services.gemini_service import gemini_service
from app.database import save_crop_recommendation, get_crop_history
from app.routes.auth import get_current_user

router = APIRouter()

class CropRecommendationRequest(BaseModel):
    location: str = Field(..., example="Coimbatore, Tamil Nadu")
    land_area: float = Field(..., gt=0, example=2.5, description="Land area in acres")
    soil_type: str = Field(..., example="Red Sandy Loam")
    water_source: str = Field(..., example="Borewell with Drip")
    budget: float = Field(..., gt=0, example=50000, description="Budget in INR")

@router.post("/recommend")
async def get_recommendations(req: CropRecommendationRequest, user: Optional[dict] = Depends(get_current_user)):
    user_id = user["id"] if user else None

    try:
        recommendations = await gemini_service.get_crop_recommendations(
            location=req.location,
            land_area=req.land_area,
            soil_type=req.soil_type,
            water_source=req.water_source,
            budget=req.budget
        )

        record_id = await save_crop_recommendation(req.model_dump(), recommendations, user_id=user_id)

        return {
            "status": "success",
            "record_id": record_id,
            "inputs": req.model_dump(),
            "recommendations": recommendations
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to generate crop recommendations: {str(e)}")

@router.get("/history")
async def fetch_crop_history(user: Optional[dict] = Depends(get_current_user)):
    user_id = user["id"] if user else None
    history = await get_crop_history(limit=20, user_id=user_id)
    return {"status": "success", "history": history}

@router.get("/soil-types")
async def list_soil_types():
    return {
        "soil_types": [
            {
                "name": "Alluvial Soil",
                "characteristics": "Rich in potash and humus; highly fertile; ideal for paddy, wheat, sugarcane, and pulses.",
                "drainage": "Moderate to Good"
            },
            {
                "name": "Black Cotton Soil (Regur)",
                "characteristics": "High clay content; self-ploughing moisture retention; ideal for cotton, soybean, and millets.",
                "drainage": "Slow / High water retention"
            },
            {
                "name": "Red & Yellow Soil",
                "characteristics": "Porous, friable structure rich in iron; ideal for groundnuts, millets, maize, and pulses.",
                "drainage": "High / Requires balanced irrigation"
            },
            {
                "name": "Laterite Soil",
                "characteristics": "Intensely leached by heavy rainfall; acidic; ideal for cashew, plantation crops, tea, and coffee.",
                "drainage": "Rapid"
            },
            {
                "name": "Sandy Loam",
                "characteristics": "Warm, light texture, low moisture retention; great for carrots, potatoes, watermelon, and bajra.",
                "drainage": "Very Fast"
            },
            {
                "name": "Clay Loam",
                "characteristics": "Balanced aggregate mix of sand, silt, and clay; high cation exchange; suits wide vegetable range.",
                "drainage": "Good"
            }
        ]
    }
