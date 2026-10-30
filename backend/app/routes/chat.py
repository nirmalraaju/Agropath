from fastapi import APIRouter, HTTPException
from pydantic import BaseModel
from app.services.gemini_service import gemini_service

router = APIRouter()

class ChatRequest(BaseModel):
    message: str

@router.post("/query")
async def chat_query(request: ChatRequest):
    try:
        sys_msg = "You are AgroPath Assistant, a friendly and expert AI farming advisor assisting first-time farmers."
        response = await gemini_service.generate_text(request.message, system_instruction=sys_msg)
        return {
            "status": "success",
            "model": gemini_service.model,
            "response": response
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))
