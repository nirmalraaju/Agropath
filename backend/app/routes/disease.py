import os
import shutil
import uuid
from typing import Optional
from fastapi import APIRouter, File, UploadFile, HTTPException, Depends, Query
from app.services.yolo_service import detector
from app.services.gemini_service import gemini_service
from app.services.embedding_service import embedding_service
from app.database import save_disease_record, get_disease_history, search_similar_disease_cases
from app.routes.auth import get_current_user

router = APIRouter()

UPLOAD_DIR = os.path.join(os.path.dirname(os.path.dirname(os.path.abspath(__file__))), "uploads")
os.makedirs(UPLOAD_DIR, exist_ok=True)

@router.post("/detect")
async def detect_disease(file: UploadFile = File(...), user: Optional[dict] = Depends(get_current_user)):
    if not file.content_type.startswith("image/"):
        raise HTTPException(status_code=400, detail="Provided file is not an image.")

    file_extension = os.path.splitext(file.filename)[1] or ".png"
    temp_filename = f"{uuid.uuid4()}{file_extension}"
    temp_filepath = os.path.join(UPLOAD_DIR, temp_filename)

    try:
        # Read image bytes for inference and multimodal embedding
        content_bytes = await file.read()
        with open(temp_filepath, "wb") as buffer:
            buffer.write(content_bytes)

        # 1. Run YOLO inference
        if detector.model is None:
            detector._load_model()
            if detector.model is None:
                raise HTTPException(status_code=503, detail="YOLO Model not loaded. Verify backend/models/best.pt exists.")

        inference_result = detector.predict(temp_filepath)
        predictions = inference_result.get("predictions", [])

        # 2. Extract top detected disease
        top_disease = "Healthy Plant"
        top_confidence = 0.95
        if predictions:
            sorted_preds = sorted(predictions, key=lambda x: x.get("confidence", 0), reverse=True)
            top_disease = sorted_preds[0].get("class", "Unknown Disease")
            top_confidence = sorted_preds[0].get("confidence", 0.0)

        # 3. Generate Multimodal Embedding with gemini-embedding-2
        leaf_embedding = embedding_service.embed_multimodal(
            text=f"Plant leaf displaying symptoms of {top_disease}",
            image_bytes=content_bytes,
            mime_type=file.content_type or "image/png"
        )

        # 4. Generate Actionable Agronomic Treatment Plan using Gemini
        treatment_plan = await gemini_service.generate_disease_treatment(
            disease_name=top_disease,
            confidence=top_confidence,
            crop_type="Detected Crop"
        )

        # 5. Save record and embedding vector to local MongoDB
        user_id = user["id"] if user else None
        record_id = await save_disease_record(
            filename=file.filename or temp_filename,
            detected_class=top_disease,
            confidence=top_confidence,
            predictions=predictions,
            treatment_plan=treatment_plan,
            user_id=user_id,
            embedding=leaf_embedding
        )

        return {
            "status": "success",
            "record_id": record_id,
            "filename": file.filename,
            "predictions": predictions,
            "top_detection": {
                "class": top_disease,
                "confidence": top_confidence
            },
            "uncertainty_analysis": inference_result.get("uncertainty_analysis"),
            "embedding_dimensions": len(leaf_embedding),
            "treatment_plan": treatment_plan
        }

    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Inference error: {str(e)}")
    finally:
        if os.path.exists(temp_filepath):
            try:
                os.remove(temp_filepath)
            except Exception:
                pass

@router.post("/semantic-search")
async def semantic_search(
    query: Optional[str] = Query(None, description="Natural language search query (e.g. 'yellow spots on tomato')"),
    file: Optional[UploadFile] = File(None, description="Optional leaf image to search by visual similarity")
):
    """
    Multimodal Semantic Search powered by gemini-embedding-2:
    Finds the closest past diagnosed cases in your MongoDB database using text or image vectors.
    """
    if not query and not file:
        raise HTTPException(status_code=400, detail="Provide either a text query or a leaf image.")

    if file:
        image_bytes = await file.read()
        query_vector = embedding_service.embed_image(image_bytes, mime_type=file.content_type or "image/png")
    else:
        query_vector = embedding_service.embed_text(query, is_query=True, task="search result")

    similar_cases = await search_similar_disease_cases(query_vector, limit=5, min_score=0.3)
    return {
        "status": "success",
        "query": query,
        "search_type": "image_vector" if file else "text_vector",
        "matches_found": len(similar_cases),
        "results": similar_cases
    }

@router.get("/history")
async def history(user: Optional[dict] = Depends(get_current_user)):
    user_id = user["id"] if user else None
    records = await get_disease_history(limit=50, user_id=user_id)
    return {"status": "success", "history": records}

@router.get("/benchmarks")
async def model_benchmarks():
    """
    Experimental Model Evaluation & Calibration Benchmark Suite:
    Returns quantitative research benchmarks comparing AgroPath-YOLO11 against
    ResNet-50, MobileNetV3, and Vision Transformer (ViT-B), with ECE, MCE, and Brier scores.
    """
    from app.services.evaluation_service import evaluation_service
    return evaluation_service.get_benchmark_results()

@router.get("/status")
async def detector_status():
    return {
        "model_loaded": detector.model is not None,
        "model_path": detector.model_path if hasattr(detector, 'model_path') else None
    }
