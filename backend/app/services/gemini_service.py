import os
import json
import httpx
from typing import Dict, Any, List, Optional
from dotenv import load_dotenv

load_dotenv()

GEMINI_API_KEY = os.getenv("GEMINI_API_KEY", "").strip()
GEMINI_MODEL = os.getenv("GEMINI_MODEL", "gemini-2.5-flash").strip()
GEMINI_ENDPOINT = "https://generativelanguage.googleapis.com/v1beta/models"

def calculate_disease_severity(disease_name: str, confidence: float) -> Dict[str, Any]:
    """
    Computes accurate disease severity and score synchronization:
    - Healthy foliage: 'Healthy (None)' severity, 0.0 risk
    - Critical/Aggressive Pathogens (Late Blight, Bacterial Spot, Septoria Spot, Black Rot, Mosaic Virus):
        >= 70% -> High Severity
        45% - 70% -> Moderate Severity
        < 45% -> Low Severity (Early Warning)
    - Mild/Superficial Fungal Pathogens (Powdery Mildew, Rust, Mold, Early Blight):
        >= 75% -> High Severity
        40% - 75% -> Moderate Severity
        < 40% -> Low Severity (Early Warning)
    """
    score = round(confidence * 100, 1)
    d_lower = disease_name.lower().strip()

    # 1. Healthy Foliage Classes (no pathology)
    healthy_classes = [
        "apple leaf", "bell_pepper leaf", "blueberry leaf", "cherry leaf",
        "peach leaf", "raspberry leaf", "soyabean leaf", "strawberry leaf",
        "tomato leaf", "grape leaf"
    ]
    if d_lower in healthy_classes or "healthy" in d_lower or d_lower == "leaf":
        return {
            "level": "Healthy (None)",
            "score": score,
            "badge_color": "green",
            "is_healthy": True,
            "urgency": "No pathogen infection detected. Foliage displays healthy chlorophyll distribution."
        }

    # 2. Critical & Aggressive Pathogens
    critical_keywords = ["late blight", "bacterial spot", "septoria", "black rot", "mosaic", "yellow virus", "scab", "rot"]
    is_critical = any(k in d_lower for k in critical_keywords)

    if is_critical:
        if score >= 70.0:
            level = "High"
            urgency = "Severe active infection. Immediate fungicidal or cultural intervention required."
        elif score >= 45.0:
            level = "Moderate"
            urgency = "Active lesion formation. Prompt therapeutic or bio-control spraying recommended."
        else:
            level = "Low (Early Warning)"
            urgency = "Early stage symptom detected. Inspect nearby foliage and isolate suspect rows."
    else:
        # Mild / Superficial / Fungal spores
        if score >= 75.0:
            level = "High"
            urgency = "Advanced sporulation detected across leaf surface."
        elif score >= 40.0:
            level = "Moderate"
            urgency = "Moderate fungal activity. Apply targeted botanical or organic bio-fungicide."
        else:
            level = "Low (Early Warning)"
            urgency = "Mild or early fungal presence. Monitor closely over 48 hours."

    return {
        "level": level,
        "score": score,
        "badge_color": "red" if "High" in level else "orange" if "Moderate" in level else "blue",
        "is_healthy": False,
        "urgency": urgency
    }

class GeminiService:
    def __init__(self):
        self.api_key = os.getenv("GEMINI_API_KEY", "").strip()
        self.model = os.getenv("GEMINI_MODEL", "gemini-2.5-flash").strip()

    def _get_api_key(self) -> str:
        # Reload dynamically in case .env was edited at runtime
        return os.getenv("GEMINI_API_KEY", self.api_key).strip()

    async def _call_gemini(self, prompt: str, system_instruction: Optional[str] = None) -> Optional[str]:
        api_key = self._get_api_key()
        if not api_key or api_key == "your_gemini_api_key_here":
            return None

        url = f"{GEMINI_ENDPOINT}/{self.model}:generateContent?key={api_key}"
        payload: Dict[str, Any] = {
            "contents": [
                {
                    "parts": [{"text": prompt}]
                }
            ],
            "generationConfig": {
                "temperature": 0.4,
                "topP": 0.9,
                "maxOutputTokens": 2048,
            }
        }
        if system_instruction:
            payload["systemInstruction"] = {
                "parts": [{"text": system_instruction}]
            }

        try:
            async with httpx.AsyncClient(timeout=25.0) as client:
                response = await client.post(url, json=payload)
                if response.status_code == 200:
                    data = response.json()
                    candidates = data.get("candidates", [])
                    if candidates and "content" in candidates[0]:
                        parts = candidates[0]["content"].get("parts", [])
                        if parts:
                            return parts[0].get("text", "")
                else:
                    print(f"[GeminiService] API error {response.status_code}: {response.text}")
                    return None
        except Exception as e:
            print(f"[GeminiService] Call failed: {e}")
            return None

    async def generate_disease_treatment(self, disease_name: str, confidence: float, crop_type: str = "Unknown") -> Dict[str, Any]:
        """Generates treatment guidelines, organic solutions, and preventive advice with matching severity and score."""
        severity_info = calculate_disease_severity(disease_name, confidence)

        if severity_info["is_healthy"]:
            return {
                "disease_name": disease_name,
                "severity_level": severity_info["level"],
                "confidence_score": severity_info["score"],
                "match_score": severity_info["score"],
                "summary": "The plant leaf exhibits healthy cellular structure with no visible pathogen infection.",
                "immediate_actions": [
                    "No chemical or fungicidal treatment is required.",
                    "Maintain standard drip or furrow irrigation schedule.",
                    "Ensure adequate balanced N-P-K soil nutrition."
                ],
                "organic_remedies": [
                    {"name": "Panchagavya or Seaweed Extract", "dosage": "3ml per liter water", "instructions": "Foliar spray in early morning to boost systemic plant immunity and vigor."}
                ],
                "chemical_treatments": [],
                "preventive_practices": [
                    "Keep plot clean and remove weed hosts near borders.",
                    "Ensure good row spacing for sunlight penetration."
                ],
                "prognosis": "Crop is healthy and thriving."
            }

        system_instruction = (
            "You are an expert plant pathologist and agronomist. Provide practical, step-by-step advice for farmers. "
            "Output valid JSON ONLY without any markdown code fences."
        )
        prompt = f"""
Diagnosed Disease: {disease_name}
Calculated Match Score: {severity_info['score']}%
Assigned Severity Level: {severity_info['level']}
Identified Crop: {crop_type}

Provide a comprehensive agricultural treatment plan formatted strictly as JSON with this schema:
{{
  "disease_name": "{disease_name}",
  "severity_level": "{severity_info['level']}",
  "confidence_score": {severity_info['score']},
  "summary": "Short 1-2 sentence overview of the infection",
  "immediate_actions": ["Action 1", "Action 2", "Action 3"],
  "organic_remedies": [
    {{"name": "Remedy name", "dosage": "application rate", "instructions": "how to apply"}}
  ],
  "chemical_treatments": [
    {{"name": "Active chemical or commercial name", "dosage": "application rate", "safety_interval_days": 7}}
  ],
  "preventive_practices": ["Crop rotation", "Drip irrigation adjustment", "Fungicidal seed treatment"],
  "prognosis": "Expected recovery timeline and conditions"
}}
"""
        response_text = await self._call_gemini(prompt, system_instruction)
        if response_text:
            cleaned = response_text.strip()
            if cleaned.startswith("```json"):
                cleaned = cleaned[7:]
            if cleaned.startswith("```"):
                cleaned = cleaned[3:]
            if cleaned.endswith("```"):
                cleaned = cleaned[:-3]
            try:
                parsed = json.loads(cleaned.strip())
                # Enforce synchronized severity level and score
                parsed["severity_level"] = severity_info["level"]
                parsed["confidence_score"] = severity_info["score"]
                parsed["match_score"] = severity_info["score"]
                return parsed
            except Exception:
                pass

        # Offline / Fallback Expert Rule-Based Treatment Database
        return self._fallback_treatment(disease_name, confidence, crop_type, severity_info)

    def _fallback_treatment(self, disease_name: str, confidence: float, crop_type: str, severity_info: Optional[Dict[str, Any]] = None) -> Dict[str, Any]:
        if severity_info is None:
            severity_info = calculate_disease_severity(disease_name, confidence)

        level = severity_info["level"]
        score = severity_info["score"]
        d_lower = disease_name.lower()

        if "pest" in d_lower or "insect" in d_lower:
            return {
                "disease_name": disease_name,
                "severity_level": level,
                "confidence_score": score,
                "match_score": score,
                "summary": f"Detected foliar infestation causing tissue damage on {crop_type} with {score}% diagnostic match.",
                "immediate_actions": [
                    "Isolate heavily damaged leaves by gentle manual pruning.",
                    "Inspect underleaf surfaces for larvae, aphids, or thrips.",
                    "Place yellow/blue sticky traps (15-20 per acre) across field borders."
                ],
                "organic_remedies": [
                    {"name": "Neem Seed Kernel Extract (NSKE 5%)", "dosage": "50ml per 10L water", "instructions": "Spray in early morning or late evening targeting leaf undersides."},
                    {"name": "Beauveria bassiana", "dosage": "5g per liter", "instructions": "Apply during humid conditions to control chewing and sucking pests."}
                ],
                "chemical_treatments": [
                    {"name": "Emamectin Benzoate 5% SG", "dosage": "4g per 10L water", "safety_interval_days": 5},
                    {"name": "Thiamethoxam 25% WG", "dosage": "5g per 15L water", "safety_interval_days": 14}
                ],
                "preventive_practices": [
                    "Maintain field sanitation by destroying alternate weed hosts.",
                    "Intercrop with marigold or coriander to deter harmful pests.",
                    "Monitor regularly at 3-day intervals."
                ],
                "prognosis": "Pest population usually stabilizes within 5 to 7 days after targeted biological or botanical spraying."
            }
        elif "blight" in d_lower or "rot" in d_lower or "spot" in d_lower or "scab" in d_lower or "mosaic" in d_lower:
            return {
                "disease_name": disease_name,
                "severity_level": level,
                "confidence_score": score,
                "match_score": score,
                "summary": f"Fungal/bacterial pathogen affecting leaf cellular structure on {crop_type} with {score}% diagnostic match ({level} severity).",
                "immediate_actions": [
                    "Suspend overhead sprinkler irrigation immediately to keep foliage dry.",
                    "Prune and safely burn or bury infected leaves away from the plot.",
                    "Disinfect pruners with 10% sodium hypochlorite solution between cuts."
                ],
                "organic_remedies": [
                    {"name": "Trichoderma viride / harzianum", "dosage": "10g per liter water", "instructions": "Spray on foliage and drench rhizosphere around root zone."},
                    {"name": "Copper Hydroxide / Bordeaux Mixture (1%)", "dosage": "10g copper sulfate + 10g lime per liter", "instructions": "Prophylactic foliar spray."}
                ],
                "chemical_treatments": [
                    {"name": "Mancozeb 75% WP", "dosage": "2g per liter water", "safety_interval_days": 10},
                    {"name": "Azoxystrobin 18.2% + Difenoconazole 11.4% SC", "dosage": "1ml per liter water", "safety_interval_days": 14}
                ],
                "preventive_practices": [
                    "Ensure adequate row spacing to encourage air circulation.",
                    "Avoid excessive nitrogenous fertilizer application which encourages succulent tender growth.",
                    "Adopt 3-year crop rotation with non-host species."
                ],
                "prognosis": "Arrests spread within 3-4 days; new healthy leaves will emerge within 10-14 days."
            }
        elif "mildew" in d_lower or "mold" in d_lower or "rust" in d_lower:
            return {
                "disease_name": disease_name,
                "severity_level": level,
                "confidence_score": score,
                "match_score": score,
                "summary": f"Superficial fungal spore colonies ({disease_name}) detected with {score}% diagnostic match ({level} severity).",
                "immediate_actions": [
                    "Avoid touching wet foliage to prevent spore distribution.",
                    "Increase spacing or selective thinning to improve canopy ventilation.",
                    "Avoid excessive nitrogen application."
                ],
                "organic_remedies": [
                    {"name": "Wettable Sulphur 80% WP", "dosage": "2g per liter water", "instructions": "Apply in late afternoon when temperature is below 32°C."},
                    {"name": "Baking Soda Spray (0.5%)", "dosage": "5g sodium bicarbonate + 2ml liquid soap per liter", "instructions": "Changes surface pH to inhibit spore germination."}
                ],
                "chemical_treatments": [
                    {"name": "Hexaconazole 5% EC", "dosage": "1ml per liter water", "safety_interval_days": 14}
                ],
                "preventive_practices": [
                    "Promote good soil drainage and sunlight penetration.",
                    "Apply prophylactic bio-fungicide during cloudy/humid weather."
                ],
                "prognosis": "Powdery white/orange patches dry up within 48 to 72 hours following sulfur or bio-fungicide treatment."
            }
        else:
            return {
                "disease_name": disease_name,
                "severity_level": level,
                "confidence_score": score,
                "match_score": score,
                "summary": f"Diagnosed leaf condition ({disease_name}) detected with {score}% confidence ({level} severity).",
                "immediate_actions": [
                    "Conduct field survey to determine spatial distribution (random vs clustered).",
                    "Check soil moisture and nutrient deficiency symptoms.",
                    "Consult local Krishi Vigyan Kendra (KVK) or extension officer with sample."
                ],
                "organic_remedies": [
                    {"name": "Neem Oil 10,000 PPM", "dosage": "3ml per liter + 1ml liquid soap", "instructions": "Spray thoroughly on both leaf surfaces."},
                    {"name": "Pseudomonas fluorescens", "dosage": "10g per liter", "instructions": "Foliar spray to build systemic acquired resistance."}
                ],
                "chemical_treatments": [
                    {"name": "Carbendazim 12% + Mancozeb 63% WP", "dosage": "1.5g per liter water", "safety_interval_days": 14}
                ],
                "preventive_practices": [
                    "Use certified disease-resistant seeds and planting material.",
                    "Balance fertilization with potassium and micronutrients (Zinc, Boron).",
                    "Maintain proper field drainage."
                ],
                "prognosis": "Monitor progress over next 7 days."
            }

    async def get_crop_recommendations(self, location: str, land_area: float, soil_type: str, water_source: str, budget: float) -> List[Dict[str, Any]]:
        """Provides AI-guided crop recommendations based on farmer inputs."""
        system_instruction = (
            "You are an agricultural economist and senior agronomist. Output JSON ONLY as a list of crop recommendations."
        )
        prompt = f"""
Location: {location}
Land Area: {land_area} Acres
Soil Type: {soil_type}
Water Source: {water_source}
Available Budget: ₹{budget:,.0f}

Recommend the top 3-4 optimal crops for this farmer in JSON format:
[
  {{
    "crop_name": "Crop Name",
    "variety": "High-yield variety name",
    "suitability_score": 95,
    "duration_days": "90-120 days",
    "water_requirement": "Low" | "Medium" | "High",
    "estimated_cost_per_acre": 25000,
    "estimated_yield_per_acre": "18-22 Quintals",
    "estimated_net_profit": 55000,
    "season": "Kharif / Rabi / Zaid",
    "key_benefits": "Why this crop fits the soil and water parameters",
    "cultivation_tips": "Key management advice for highest yield"
  }}
]
"""
        response_text = await self._call_gemini(prompt, system_instruction)
        if response_text:
            cleaned = response_text.strip()
            if cleaned.startswith("```json"):
                cleaned = cleaned[7:]
            if cleaned.startswith("```"):
                cleaned = cleaned[3:]
            if cleaned.endswith("```"):
                cleaned = cleaned[:-3]
            try:
                data = json.loads(cleaned.strip())
                if isinstance(data, list) and len(data) > 0:
                    return data
            except Exception:
                pass

        # Offline / Fallback recommendations matrix
        return self._fallback_crop_recommendations(soil_type, water_source, budget, land_area)

    def _fallback_crop_recommendations(self, soil_type: str, water_source: str, budget: float, land_area: float) -> List[Dict[str, Any]]:
        s_lower = soil_type.lower()
        w_lower = water_source.lower()
        is_water_rich = any(w in w_lower for w in ["canal", "borewell", "river", "drip", "tube"])

        if "black" in s_lower or "clay" in s_lower:
            return [
                {
                    "crop_name": "Bt Cotton",
                    "variety": "RCH-659 / Bollgard II",
                    "suitability_score": 94,
                    "duration_days": "150-160 days",
                    "water_requirement": "Medium",
                    "estimated_cost_per_acre": 32000,
                    "estimated_yield_per_acre": "12-15 Quintals",
                    "estimated_net_profit": int(min(budget, land_area * 45000)),
                    "season": "Kharif",
                    "key_benefits": "Black clayey soil has high moisture retentiveness ideal for deep tap roots of cotton.",
                    "cultivation_tips": "Maintain 90x60cm spacing and install pheromone traps for pink bollworm monitoring."
                },
                {
                    "crop_name": "Soybean",
                    "variety": "JS 335 / JS 20-34",
                    "suitability_score": 90,
                    "duration_days": "90-100 days",
                    "water_requirement": "Medium",
                    "estimated_cost_per_acre": 18000,
                    "estimated_yield_per_acre": "8-10 Quintals",
                    "estimated_net_profit": int(min(budget, land_area * 28000)),
                    "season": "Kharif",
                    "key_benefits": "Leguminous crop that fixes atmospheric nitrogen, enriching soil fertility for subsequent crops.",
                    "cultivation_tips": "Treat seed with Rhizobium and PSB culture prior to sowing."
                },
                {
                    "crop_name": "Bengal Gram (Chickpea)",
                    "variety": "JG 11 / JAKI 9218",
                    "suitability_score": 88,
                    "duration_days": "100-110 days",
                    "water_requirement": "Low",
                    "estimated_cost_per_acre": 15000,
                    "estimated_yield_per_acre": "7-9 Quintals",
                    "estimated_net_profit": int(min(budget, land_area * 24000)),
                    "season": "Rabi",
                    "key_benefits": "Excellent residual moisture feeder that excels in heavy soils during winter.",
                    "cultivation_tips": "Avoid waterlogging; single protective irrigation at pod formation stage is optimal."
                }
            ]
        elif "red" in s_lower or "loam" in s_lower or "alluvial" in s_lower:
            return [
                {
                    "crop_name": "Groundnut (Peanut)",
                    "variety": "Kadiri-6 / TAG-24",
                    "suitability_score": 95,
                    "duration_days": "105-115 days",
                    "water_requirement": "Medium" if is_water_rich else "Low",
                    "estimated_cost_per_acre": 24000,
                    "estimated_yield_per_acre": "14-18 Quintals",
                    "estimated_net_profit": int(min(budget, land_area * 38000)),
                    "season": "Kharif / Rabi",
                    "key_benefits": "Friable well-drained loamy soil allows easy peg penetration and pod development.",
                    "cultivation_tips": "Apply Gypsum @ 200kg/acre at 45 DAS during flowering for optimal pod filling."
                },
                {
                    "crop_name": "Maize (Corn)",
                    "variety": "Pioneer 3396 / DKC 9108",
                    "suitability_score": 91,
                    "duration_days": "100-110 days",
                    "water_requirement": "Medium",
                    "estimated_cost_per_acre": 22000,
                    "estimated_yield_per_acre": "25-30 Quintals",
                    "estimated_net_profit": int(min(budget, land_area * 32000)),
                    "season": "Kharif / Rabi",
                    "key_benefits": "High yield potential with strong industrial feed and food market demand.",
                    "cultivation_tips": "Adopt ridge and furrow sowing to avoid water stagnation."
                },
                {
                    "crop_name": "Tomato / Chilli (Hybrid)",
                    "variety": "Shivam / US 440",
                    "suitability_score": 87,
                    "duration_days": "130-150 days",
                    "water_requirement": "Medium to High",
                    "estimated_cost_per_acre": 40000,
                    "estimated_yield_per_acre": "15-20 Tonnes",
                    "estimated_net_profit": int(min(budget, land_area * 70000)),
                    "season": "Year-round",
                    "key_benefits": "High value horticultural return on investment for farmers with drip irrigation.",
                    "cultivation_tips": "Use silver-black mulching sheet and raised beds with trellis staking."
                }
            ]
        else: # Sandy / General
            return [
                {
                    "crop_name": "Pearl Millet (Bajra)",
                    "variety": "HHB 67 Improved / Proagro 9444",
                    "suitability_score": 93,
                    "duration_days": "75-85 days",
                    "water_requirement": "Very Low",
                    "estimated_cost_per_acre": 12000,
                    "estimated_yield_per_acre": "12-14 Quintals",
                    "estimated_net_profit": int(min(budget, land_area * 20000)),
                    "season": "Kharif",
                    "key_benefits": "Drought-hardy cereal with low nutrient requirements and high resilience to heat.",
                    "cultivation_tips": "Ensure shallow sowing depth (2-3 cm) with adequate initial soil moisture."
                },
                {
                    "crop_name": "Cluster Bean (Guar)",
                    "variety": "RGC 936 / HG 365",
                    "suitability_score": 89,
                    "duration_days": "85-95 days",
                    "water_requirement": "Low",
                    "estimated_cost_per_acre": 10000,
                    "estimated_yield_per_acre": "6-8 Quintals",
                    "estimated_net_profit": int(min(budget, land_area * 18000)),
                    "season": "Kharif",
                    "key_benefits": "Ideal for sandy soils; valuable gum content ensures stable market price.",
                    "cultivation_tips": "Seed inoculation with Rhizobium ensures zero chemical nitrogen requirement."
                }
            ]

    async def ask_farming_assistant(self, message: str, chat_history: List[Dict[str, str]] = None) -> str:
        """Answers farmer queries with practical agricultural knowledge."""
        system_instruction = (
            "You are AgroPath AI, an experienced agricultural advisor helping farmers. "
            "Provide direct, clear, actionable, and encouraging agronomic advice. "
            "Use bullet points for steps, mention dosages where appropriate, and keep technical jargon explained."
        )
        context = ""
        if chat_history:
            for turn in chat_history[-6:]:
                role = "Farmer" if turn.get("role") == "user" else "Advisor"
                context += f"{role}: {turn.get('message')}\n"
        context += f"Farmer: {message}\nAdvisor:"

        response = await self._call_gemini(context, system_instruction)
        if response:
            return response.strip()

        # Fallback intelligent responder
        m_lower = message.lower()
        if "fertilizer" in m_lower or "npk" in m_lower or "urea" in m_lower:
            return (
                "🌱 **Fertilizer Guidance:**\n\n"
                "1. **Basal Application:** Apply full recommended phosphorus (DAP/SSP) and potassium (MOP) alongside 25% of nitrogen at sowing.\n"
                "2. **Top Dressing:** Split remaining nitrogen (Urea) into 2 equal splits at 30 and 55 days after sowing.\n"
                "3. **Micro-nutrients:** If zinc deficiency (yellow banding) occurs, foliar spray Zinc Sulphate 0.5% (5g/L) + 2.5g urea in clear morning weather."
            )
        elif "water" in m_lower or "irrigat" in m_lower:
            return (
                "💧 **Irrigation & Water Management:**\n\n"
                "• **Critical Growth Stages:** Ensure moisture during flowering and grain/fruit filling stages; moisture stress now directly lowers yield.\n"
                "• **Drip Efficiency:** If using drip, schedule early morning cycles to minimize evaporative loss.\n"
                "• **Soil Moisture Test:** Take a handful of soil from 6 inches deep; if it forms a ball without crumbling, moisture is adequate."
            )
        elif "pest" in m_lower or "insect" in m_lower or "bug" in m_lower:
            return (
                "🐛 **Pest Management Tips:**\n\n"
                "• **Biological First:** Spray 5% Neem Seed Kernel Extract (NSKE) or 10,000 PPM Neem oil (3ml/L) as first line of defense.\n"
                "• **Traps:** Install 10 pheromone traps or yellow sticky boards per acre to monitor insect influx.\n"
                "• **Chemical Option:** For severe infestation, consult your local agricultural store for specific registered insecticides with minimal pollinator impact."
            )
        else:
            return (
                f"🌾 **AgroPath Assistant:**\n\n"
                f"Regarding '{message}', here are primary agricultural considerations:\n"
                "1. Always check your local seasonal window (Kharif, Rabi, or Zaid).\n"
                "2. Maintain soil organic carbon by incorporating farmyard manure (FYM) or compost (4-5 tonnes/acre).\n"
                "3. Regularly inspect crops for early signs of disease or nutrient chlorosis.\n\n"
                "Feel free to ask about specific crops, diseases, fertilizers, or current weather advisories!"
            )

# Singleton instance
gemini_service = GeminiService()
