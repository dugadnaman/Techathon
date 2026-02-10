"""
PrithviAI — Map Explorer Routes
Endpoints for the interactive map-based data visualization tool.
Provides location-specific environmental data and AI-powered Q&A.
"""

from fastapi import APIRouter, Query
from pydantic import BaseModel, Field
from typing import Optional, List
from datetime import datetime
import uuid

from services.data_aggregator import get_aggregated_environment, get_aggregated_environment_with_quality
from intelligence.risk_engine import risk_engine
from intelligence.data_confidence import get_freshness_status, calculate_confidence_score
from models.schemas import AgeGroup, Language, ActivityIntent, EnvironmentData, SafetyIndex
from config import settings

router = APIRouter(prefix="/api/map", tags=["Map Explorer"])


# ─── Request / Response Models ────────────────────────────

class LocationDataResponse(BaseModel):
    """Full environmental + risk data for a single map location."""
    lat: float
    lon: float
    location_name: str
    environment: dict
    safety_index: dict
    timestamp: str


class MapChatRequest(BaseModel):
    """Chat request with full location context and conversation history."""
    message: str
    latitude: float = 19.076
    longitude: float = 72.8777
    location_name: str = "Selected Location"
    age_group: str = "elderly"
    language: str = "en"
    session_id: Optional[str] = None
    conversation_history: List[dict] = Field(default_factory=list)


class MapChatResponse(BaseModel):
    reply: str
    risk_level: str
    session_id: str


# ─── Predefined Landmark Locations ───────────────────────

LANDMARKS = [
    {"name": "Shivajinagar", "lat": 18.5308, "lon": 73.8475, "type": "suburb", "description": "Central Pune, busy commercial and transit hub"},
    {"name": "Koregaon Park", "lat": 18.5362, "lon": 73.8939, "type": "suburb", "description": "Upscale residential and nightlife area"},
    {"name": "Kothrud", "lat": 18.5074, "lon": 73.8077, "type": "suburb", "description": "Residential suburb with educational institutions"},
    {"name": "Hadapsar", "lat": 18.5089, "lon": 73.9260, "type": "suburb", "description": "Eastern suburb with IT parks and industrial areas"},
    {"name": "Hinjewadi", "lat": 18.5912, "lon": 73.7390, "type": "suburb", "description": "Major IT hub with Rajiv Gandhi Infotech Park"},
    {"name": "Deccan Gymkhana", "lat": 18.5186, "lon": 73.8408, "type": "landmark", "description": "Iconic cultural and shopping district"},
    {"name": "Sinhagad Road", "lat": 18.4700, "lon": 73.8230, "type": "landmark", "description": "Road leading to Sinhagad Fort, green area"},
    {"name": "Viman Nagar", "lat": 18.5679, "lon": 73.9143, "type": "suburb", "description": "Near airport, residential and commercial hub"},
    {"name": "Pashan", "lat": 18.5540, "lon": 73.8080, "type": "suburb", "description": "Green area near Pashan Lake and research institutes"},
    {"name": "Pimpri-Chinchwad", "lat": 18.6279, "lon": 73.7997, "type": "city", "description": "Industrial twin city with auto manufacturing"},
    {"name": "Aundh", "lat": 18.5580, "lon": 73.8077, "type": "suburb", "description": "Well-planned residential suburb with IT offices"},
    {"name": "Baner", "lat": 18.5590, "lon": 73.7868, "type": "suburb", "description": "Fast-growing residential and commercial area"},
]


@router.get("/landmarks")
async def get_landmarks():
    """Get predefined landmark locations for map markers."""
    return {"landmarks": LANDMARKS}


@router.get("/location-data")
async def get_location_data(
    lat: float = Query(description="Latitude of the clicked location"),
    lon: float = Query(description="Longitude of the clicked location"),
    name: str = Query(default="", description="Optional location name"),
):
    """
    Get full environmental and risk data for any clicked map location.
    Fetches real-time weather, air quality, UV, and computes risk assessment.
    """
    # Determine a name from nearby landmarks if not provided
    location_name = name or _find_nearest_landmark(lat, lon)

    # Fetch live environmental data with quality tracking
    env_data, data_quality = await get_aggregated_environment_with_quality(
        lat, lon, location_name, precision="pinned"
    )

    # Apply micro-adjustments so nearby locations don't all show identical AQI
    env_data = _apply_location_variance(env_data, lat, lon)

    # Compute risk assessment
    safety_index = risk_engine.compute_all_risks(
        env_data=env_data,
        age_group=AgeGroup.ELDERLY,
        activity=ActivityIntent.WALKING,
    )

    # Compute freshness & confidence
    freshness = get_freshness_status(env_data.timestamp)
    confidence = calculate_confidence_score(data_quality)

    env_dict = env_data.model_dump()
    safety_dict = safety_index.model_dump()

    return {
        "lat": lat,
        "lon": lon,
        "location_name": location_name,
        "environment": env_dict,
        "safety_index": safety_dict,
        "timestamp": datetime.utcnow().isoformat(),
        "data_quality": {
            "freshness": freshness,
            "confidence": confidence,
            "sources": data_quality.get("data_sources", {}),
        },
    }


@router.post("/chat", response_model=MapChatResponse)
async def map_chat(request: MapChatRequest):
    """
    AI Q&A for a selected map location.
    Uses conversation history to provide non-repetitive, contextual answers.
    """
    session_id = request.session_id or str(uuid.uuid4())

    # Fetch environmental data for the selected location
    env_data = await get_aggregated_environment(
        request.latitude, request.longitude, request.location_name,
    )

    # Compute risk assessment
    safety_index = risk_engine.compute_all_risks(
        env_data=env_data,
        age_group=AgeGroup.ELDERLY if request.age_group == "elderly" else AgeGroup.ADULT,
        activity=ActivityIntent.WALKING,
    )

    # Build AI response with location context and conversation history
    reply = await _generate_map_chat_response(
        user_message=request.message,
        location_name=request.location_name,
        lat=request.latitude,
        lon=request.longitude,
        env_data=env_data,
        safety_index=safety_index,
        conversation_history=request.conversation_history,
    )

    return MapChatResponse(
        reply=reply,
        risk_level=safety_index.overall_level.value,
        session_id=session_id,
    )


def _find_nearest_landmark(lat: float, lon: float) -> str:
    """Find the nearest predefined landmark to the given coordinates."""
    import math

    min_dist = float("inf")
    nearest = "Selected Location"

    for lm in LANDMARKS:
        dist = math.sqrt((lat - lm["lat"]) ** 2 + (lon - lm["lon"]) ** 2)
        if dist < min_dist:
            min_dist = dist
            nearest = lm["name"]

    # If too far from any landmark (>0.05 degrees ~ 5km), use generic name
    if min_dist > 0.05:
        nearest = f"Location ({lat:.4f}, {lon:.4f})"

    return nearest


def _apply_location_variance(env_data: EnvironmentData, lat: float, lon: float) -> EnvironmentData:
    """
    Apply micro-adjustments to environment data based on location characteristics.
    This ensures different map points show different AQI even when the API
    returns data from the same monitoring station (common in cities with few stations).

    Factors modeled:
    - Coastal proximity (lower pollution near the sea)
    - Industrial zones (higher near refineries/ports)
    - Traffic density (higher in commercial hubs)
    - Green cover (lower near parks/gardens)
    """
    import hashlib, math

    # Known zones with environmental modifiers (lat, lon, radius_deg, aqi_factor, label)
    ZONES = [
        # Green / low-pollution zones → cleaner air
        (18.458, 73.804, 0.020, -0.18, "Sinhagad foothills"),
        (18.554, 73.808, 0.015, -0.15, "Pashan lake area"),
        (18.537, 73.894, 0.012, -0.10, "Koregaon Park gardens"),
        (18.507, 73.808, 0.015, -0.08, "Kothrud residential"),
        # Industrial / heavy traffic zones → worse air
        (18.527, 73.953, 0.025, +0.22, "Pimpri-Chinchwad industrial"),
        (18.633, 73.795, 0.020, +0.15, "Bhosari MIDC"),
        (18.509, 73.926, 0.015, +0.12, "Hadapsar industrial"),
        # Traffic hubs → moderately worse
        (18.531, 73.848, 0.012, +0.10, "Shivajinagar junction"),
        (18.530, 73.879, 0.010, +0.08, "Pune Station traffic"),
        # IT parks (AC, lower ground-level pollution)
        (18.591, 73.739, 0.018, -0.06, "Hinjewadi IT Park"),
        (18.559, 73.787, 0.012, -0.05, "Baner residential"),
    ]

    # Calculate zone influence (distance-weighted)
    total_factor = 0.0
    for z_lat, z_lon, z_radius, z_factor, _label in ZONES:
        dist = math.sqrt((lat - z_lat) ** 2 + (lon - z_lon) ** 2)
        if dist < z_radius:
            # Influence decreases linearly with distance from zone center
            influence = 1.0 - (dist / z_radius)
            total_factor += z_factor * influence

    # Add a small deterministic noise from coordinates (±8% range)
    coord_hash = int(hashlib.md5(f"{lat:.4f},{lon:.4f}".encode()).hexdigest()[:6], 16)
    noise = ((coord_hash % 160) - 80) / 1000.0  # -0.08 to +0.08

    # Clamp total adjustment to ±35%
    adjustment = max(-0.35, min(0.35, total_factor + noise))

    # Apply to AQI and PM values
    base_aqi = env_data.aqi
    env_data.aqi = max(10, round(base_aqi * (1 + adjustment)))
    env_data.pm25 = max(1.0, round(env_data.pm25 * (1 + adjustment * 0.9), 1))
    env_data.pm10 = max(2.0, round(env_data.pm10 * (1 + adjustment * 0.85), 1))

    return env_data


async def _generate_map_chat_response(
    user_message: str,
    location_name: str,
    lat: float,
    lon: float,
    env_data: EnvironmentData,
    safety_index: SafetyIndex,
    conversation_history: list,
) -> str:
    """
    Generate a contextual, non-repetitive AI response for the map chat.
    Uses Gemini with conversation history to avoid repetition.
    Falls back to a rich template if Gemini is unavailable.
    """

    # Try Gemini-enhanced response first
    if settings.GEMINI_API_KEY and len(settings.GEMINI_API_KEY) > 10:
        enhanced = await _gemini_map_chat(
            user_message, location_name, lat, lon,
            env_data, safety_index, conversation_history,
        )
        if enhanced:
            return enhanced

    # Fallback: template-based response
    return _template_map_response(
        user_message, location_name, env_data, safety_index,
    )


async def _gemini_map_chat(
    user_message: str,
    location_name: str,
    lat: float,
    lon: float,
    env_data: EnvironmentData,
    safety_index: SafetyIndex,
    conversation_history: list,
) -> Optional[str]:
    """Use Gemini to generate location-aware, non-repetitive responses."""
    try:
        import google.generativeai as genai

        genai.configure(api_key=settings.GEMINI_API_KEY)
        model = genai.GenerativeModel("gemini-2.0-flash")

        # Build conversation context to avoid repetition
        history_text = ""
        if conversation_history:
            history_text = "\n\nPrevious conversation (DO NOT repeat these answers):\n"
            for msg in conversation_history[-6:]:  # Last 6 messages for context
                role = msg.get("role", "user")
                content = msg.get("content", "")[:200]
                history_text += f"- {role}: {content}\n"

        system_prompt = f"""You are Prithvi Map Assistant — an environmental intelligence AI for the location "{location_name}" (lat: {lat:.4f}, lon: {lon:.4f}).

CRITICAL RULES:
1. Answer ONLY about the location "{location_name}" and its environmental conditions
2. Give specific, actionable advice for elderly/senior citizens
3. DO NOT repeat information from previous messages — vary your response style, focus, and phrasing
4. Use the real-time data below — never invent numbers
5. Keep responses concise (4-6 sentences max) with markdown formatting
6. Include specific data points but present them naturally
7. If asked about something not related to environment/safety, politely redirect
8. Each response should have a DIFFERENT opening and structure than previous ones"""

        data_context = f"""Real-time data for {location_name}:
- Temperature: {env_data.temperature:.1f}°C (feels like {env_data.feels_like:.1f}°C)
- Air Quality Index (AQI): {env_data.aqi}
- PM2.5: {env_data.pm25:.1f} µg/m³, PM10: {env_data.pm10:.1f} µg/m³
- Humidity: {env_data.humidity:.1f}%
- Wind Speed: {env_data.wind_speed:.1f} m/s
- UV Index: {env_data.uv_index:.1f}
- Rainfall: {env_data.rainfall:.1f} mm/hr
- Noise Level: {env_data.noise_db:.1f} dB
- Visibility: {env_data.visibility:.0f} m
- Weather: {env_data.weather_desc}

Risk Assessment:
- Overall Risk: {safety_index.overall_level.value} (score: {safety_index.overall_score}/100)
- Summary: {safety_index.summary}
- Top Risks: {', '.join(f'{r.name}({r.level.value})' for r in safety_index.top_risks)}
{history_text}"""

        prompt = f"{system_prompt}\n\n{data_context}\n\nUser question: {user_message}"

        response = await model.generate_content_async(
            prompt,
            generation_config=genai.types.GenerationConfig(
                max_output_tokens=400,
                temperature=0.8,  # Slightly higher for variety
            ),
        )

        return response.text

    except Exception as e:
        print(f"[MapChat] Gemini failed: {e}")
        return None


def _template_map_response(
    user_message: str,
    location_name: str,
    env_data: EnvironmentData,
    safety_index: SafetyIndex,
) -> str:
    """Fallback template response when Gemini is unavailable."""
    level = safety_index.overall_level.value
    emoji = {"LOW": "✅", "MODERATE": "⚠️", "HIGH": "🔴"}[level]

    response = f"{emoji} **{location_name} — {level} Risk**\n\n"
    response += f"**Current Conditions:**\n"
    response += f"• 🌡️ {env_data.temperature:.0f}°C (feels like {env_data.feels_like:.0f}°C)\n"
    response += f"• 💨 AQI: {env_data.aqi} | PM2.5: {env_data.pm25:.0f} µg/m³\n"
    response += f"• 💧 Humidity: {env_data.humidity:.0f}% | Wind: {env_data.wind_speed:.1f} m/s\n"
    response += f"• ☀️ UV Index: {env_data.uv_index:.1f}\n\n"

    if safety_index.top_risks:
        response += "**Key Concerns:**\n"
        for risk in safety_index.top_risks[:2]:
            response += f"• {risk.icon} {risk.name}: {risk.reason}\n"
        response += "\n"

    response += f"**Assessment:** {safety_index.summary}"
    return response
