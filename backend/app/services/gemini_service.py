import os
import httpx
from dotenv import load_dotenv

load_dotenv()

GEMINI_API_KEY = os.getenv("GEMINI_API_KEY")
DEFAULT_MODEL = os.getenv("GEMINI_MODEL", "gemini-3.7-flash")

class GeminiService:
    def __init__(self, api_key: str = GEMINI_API_KEY, model: str = DEFAULT_MODEL):
        self.api_key = api_key
        self.primary_model = model
        self.fallback_models = ["gemini-2.5-flash", "gemini-3.5-flash", "gemini-flash-latest"]
        self.base_url = "https://generativelanguage.googleapis.com/v1beta/models"

    async def generate_text(self, prompt: str, system_instruction: str = None) -> str:
        """
        Generate text response from Gemini model (primary gemini-3.7-flash with auto fallback).
        """
        contents = []
        if system_instruction:
            contents.append({
                "role": "user",
                "parts": [{"text": f"System Instruction: {system_instruction}"}]
            })
            contents.append({
                "role": "model",
                "parts": [{"text": "Understood. I will follow these instructions."}]
            })
        
        contents.append({
            "role": "user",
            "parts": [{"text": prompt}]
        })

        payload = {"contents": contents}

        models_to_try = [self.primary_model] + [m for m in self.fallback_models if m != self.primary_model]

        async with httpx.AsyncClient(timeout=30.0) as client:
            last_error = None
            for model_name in models_to_try:
                url = f"{self.base_url}/{model_name}:generateContent?key={self.api_key}"
                try:
                    response = await client.post(url, json=payload)
                    if response.status_code == 200:
                        data = response.json()
                        return data['candidates'][0]['content']['parts'][0]['text']
                    else:
                        last_error = f"Model {model_name} HTTP {response.status_code}: {response.text}"
                except Exception as e:
                    last_error = f"Model {model_name} Exception: {str(e)}"
            
            raise Exception(f"All Gemini models failed. Last error: {last_error}")

    async def get_crop_recommendation(self, location: str, land_area: str, soil_type: str, water_source: str, budget: str) -> str:
        prompt = (
            f"Provide crop recommendations for a farm with details:\n"
            f"- Location: {location}\n"
            f"- Land Area: {land_area}\n"
            f"- Soil Type: {soil_type}\n"
            f"- Water Source: {water_source}\n"
            f"- Budget: {budget}\n\n"
            f"Suggest top suitable crops, expected yield, estimated cost breakdown, and step-by-step planting guidelines."
        )
        sys_msg = "You are AgroPath AI, an expert agricultural scientist advising first-time farmers."
        return await self.generate_text(prompt, system_instruction=sys_msg)

    @property
    def model(self):
        return self.primary_model

gemini_service = GeminiService()
