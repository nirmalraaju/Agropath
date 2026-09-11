from fastapi import APIRouter, File, UploadFile, HTTPException
from app.services.yolo_service import detector
import shutil
import os
import uuid

router = APIRouter()

# Temporary directory to store uploaded images for inference
UPLOAD_DIR = os.path.join(os.path.dirname(os.path.dirname(os.path.abspath(__file__))), "uploads")
os.makedirs(UPLOAD_DIR, exist_ok=True)

@router.post("/detect")
async def detect_disease(file: UploadFile = File(...)):
    if not file.content_type.startswith("image/"):
        raise HTTPException(status_code=400, detail="File provided is not an image.")

    # Save uploaded file temporarily
    file_extension = os.path.splitext(file.filename)[1]
    temp_filename = f"{uuid.uuid4()}{file_extension}"
    temp_filepath = os.path.join(UPLOAD_DIR, temp_filename)
    
    try:
        with open(temp_filepath, "wb") as buffer:
            shutil.copyfileobj(file.file, buffer)
            
        # Run YOLO inference
        if detector.model is None:
            raise HTTPException(status_code=503, detail="YOLO Model is not loaded. Ensure best.pt is valid.")
            
        result = detector.predict(temp_filepath)
        return result
        
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))
    finally:
        # Cleanup temporary file
        if os.path.exists(temp_filepath):
            os.remove(temp_filepath)
