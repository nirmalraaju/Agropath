import uuid
from typing import Optional
from fastapi import APIRouter, HTTPException, Depends
from pydantic import BaseModel
from app.services.gemini_service import gemini_service
from app.services.embedding_service import embedding_service
from app.database import save_chat_message, get_chat_history, clear_chat_history, search_similar_disease_cases
from app.routes.auth import get_current_user

router = APIRouter()

class ChatRequest(BaseModel):
    message: str
    session_id: Optional[str] = None

@router.post("/message")
async def send_chat_message(req: ChatRequest, user: Optional[dict] = Depends(get_current_user)):
    user_id = user["id"] if user else None
    session_id = req.session_id or str(uuid.uuid4())

    try:
        # 1. RAG Retrieval via gemini-embedding-2:
        # Embed user question and find matching agricultural knowledge from MongoDB
        q_vector = embedding_service.embed_text(req.message, is_query=True, task="question answering")
        similar_records = await search_similar_disease_cases(q_vector, limit=2, min_score=0.45)
        
        # Build RAG knowledge context
        rag_context = ""
        if similar_records:
            rag_context = "\n[Relevant Diagnosed Farm Case Studies from Database]:\n"
            for rec in similar_records:
                diag = rec.get("detected_class")
                treat = rec.get("treatment_plan", {}).get("summary", "")
                rag_context += f"- Case: {diag}. Proven Treatment: {treat}\n"

        # 2. Load conversation context
        history = await get_chat_history(session_id, limit=8)

        # 3. Save farmer message to MongoDB
        await save_chat_message(session_id=session_id, role="user", message=req.message, user_id=user_id)

        # 4. Get AI Agronomist response (with RAG augmentation)
        augmented_prompt = req.message
        if rag_context:
            augmented_prompt = f"{req.message}\n{rag_context}"

        reply = await gemini_service.ask_farming_assistant(augmented_prompt, chat_history=history)

        # 5. Save assistant reply to MongoDB
        await save_chat_message(session_id=session_id, role="assistant", message=reply, user_id=user_id)

        return {
            "status": "success",
            "session_id": session_id,
            "rag_matches": len(similar_records),
            "reply": reply
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Chat processing failed: {str(e)}")

@router.get("/history/{session_id}")
async def fetch_chat_history(session_id: str):
    try:
        history = await get_chat_history(session_id, limit=50)
        return {"status": "success", "session_id": session_id, "messages": history}
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to fetch chat history: {str(e)}")

@router.delete("/history/{session_id}")
async def delete_chat_history(session_id: str):
    try:
        await clear_chat_history(session_id)
        return {"status": "success", "message": "Conversation history cleared from MongoDB."}
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to clear chat history: {str(e)}")
