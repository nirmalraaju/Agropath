from fastapi import APIRouter, HTTPException
from app.services.weather_service import weather_service, COIMBATORE_NAME, COIMBATORE_LAT, COIMBATORE_LON

router = APIRouter()

@router.get("/current")
async def current_weather():
    """Returns high-accuracy live agro-meteorological data dedicated to Coimbatore, Tamil Nadu."""
    try:
        data = await weather_service.get_current_weather()
        return {"status": "success", "data": data}
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to fetch Coimbatore weather: {str(e)}")

@router.get("/forecast")
async def forecast_weather():
    """Returns 3-hour precision agro-forecast for Coimbatore."""
    try:
        data = await weather_service.get_forecast()
        return {"status": "success", "data": data}
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to fetch Coimbatore forecast: {str(e)}")

@router.get("/advisory")
async def weather_advisory():
    """Returns specialized Coimbatore agricultural spray and irrigation advisories."""
    try:
        data = await weather_service.get_current_weather()
        return {
            "status": "success",
            "city": COIMBATORE_NAME,
            "coordinates": {"lat": COIMBATORE_LAT, "lon": COIMBATORE_LON},
            "advisory": data.get("advisory"),
            "temperature": data.get("temperature"),
            "humidity": data.get("humidity"),
            "fao_evapotranspiration_mm": data.get("fao_evapotranspiration_mm"),
            "condition": data.get("condition")
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to generate Coimbatore advisory: {str(e)}")
