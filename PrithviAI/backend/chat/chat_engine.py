"""
PrithviAI — AI Chat Engine (Gemini-First)
Processes ANY natural language query about environmental safety using Google Gemini.
Provides accurate, data-rich, fully custom responses — not pre-decided templates.
Template responses are ONLY used as a last-resort fallback when Gemini is unavailable.
"""

import uuid
import asyncio
from typing import Optional, List
from datetime import datetime

from models.schemas import (
    ChatRequest, ChatResponse, SafetyIndex, RiskLevel,
    AgeGroup, Language, EnvironmentData, ActivityIntent
)
from chat.language import translate_text, translate_risk_level, get_chat_template
from intelligence.risk_engine import risk_engine
from services.data_aggregator import get_aggregated_environment
from config import settings


# In-memory conversation store (session_id → list of messages)
_conversation_store: dict = {}
MAX_HISTORY = 20  # Keep last 20 messages per session

# Gemini client singleton (new google-genai SDK)
_genai_client = None


async def process_chat(request: ChatRequest) -> ChatResponse:
    """
    Process a user's natural language query about environmental safety.
    
    Gemini-first approach:
    1. Fetch real-time environmental data
    2. Compute risk assessment
    3. Send EVERYTHING to Gemini with full context + conversation history
    4. Only fall back to templates if Gemini is completely unavailable
    """
    
    session_id = request.session_id or str(uuid.uuid4())
    
    # ── Step 1: Get Environmental Data ──
    env_data = await get_aggregated_environment(
        lat=request.latitude,
        lon=request.longitude,
        city=request.city,
    )
    
    # ── Step 2: Compute Risk Assessment ──
    activity = _infer_activity(request.message)
    safety_index = risk_engine.compute_all_risks(
        env_data=env_data,
        age_group=request.age_group,
        activity=activity,
    )
    
    # ── Step 3: Retrieve conversation history ──
    history = _conversation_store.get(session_id, [])
    
    # ── Step 4: Generate response (Gemini-first) ──
    response_text = None
    
    if settings.GEMINI_API_KEY and len(settings.GEMINI_API_KEY) > 10:
        response_text = await _gemini_chat(
            user_message=request.message,
            safety_index=safety_index,
            env_data=env_data,
            age_group=request.age_group,
            activity=activity,
            city=request.city,
            conversation_history=history,
        )
    
    # Fallback to template ONLY if Gemini completely fails
    if not response_text:
        intent = detect_intent(request.message)
        response_text = _generate_response(
            intent=intent,
            safety_index=safety_index,
            env_data=env_data,
            message=request.message,
            age_group=request.age_group,
        )
    
    # ── Step 5: Store conversation history ──
    history.append({"role": "user", "content": request.message})
    history.append({"role": "assistant", "content": response_text})
    if len(history) > MAX_HISTORY * 2:
        history = history[-(MAX_HISTORY * 2):]
    _conversation_store[session_id] = history
    
    # ── Step 6: Translate ──
    if request.language != Language.ENGLISH:
        response_text = translate_text(response_text, request.language)
    
    return ChatResponse(
        reply=response_text,
        risk_level=safety_index.overall_level,
        safety_index=safety_index,
        session_id=session_id,
    )


async def _gemini_chat(
    user_message: str,
    safety_index: SafetyIndex,
    env_data: EnvironmentData,
    age_group: AgeGroup,
    activity: ActivityIntent,
    city: str,
    conversation_history: List[dict],
) -> Optional[str]:
    """
    Primary AI response using Google Gemini (new google-genai SDK).
    Capable of answering ANY custom question — not limited to predefined intents.
    Includes retry-after logic and multi-model fallback.
    """
    global _genai_client
    
    try:
        from google import genai as genai_new
        
        if _genai_client is None:
            _genai_client = genai_new.Client(api_key=settings.GEMINI_API_KEY)
        
        # Try multiple models in priority order (different quota buckets)
        MODELS = ["gemini-2.5-flash", "gemini-2.0-flash", "gemini-2.0-flash-lite"]
        
        target = "senior citizen (elderly)" if age_group == AgeGroup.ELDERLY else "adult"
        activity_name = activity.value if hasattr(activity, 'value') else str(activity)
        
        risk_details = ""
        for r in safety_index.all_risks:
            risk_details += f"  - {r.name}: {r.level.value} (score {r.score}/100) — {r.reason}\n"

        system_prompt = f"""You are Prithvi, an advanced environmental intelligence AI assistant built to protect senior citizens from environmental health hazards in India.

YOUR CAPABILITIES:
- You have access to REAL-TIME environmental data for {city} (provided below)
- You can analyze air quality, temperature, UV, humidity, noise, rainfall, and flood risks
- You provide personalized advice based on age group ({target}) and activity ({activity_name})
- You can answer ANY question about environment, weather, health safety, outdoor planning, and senior care

CRITICAL RULES:
1. ALWAYS use the EXACT real-time data provided below — never make up or estimate numbers
2. When the user asks for specific data (AQI, temperature, etc.), INCLUDE the actual numbers
3. Give practical, actionable advice tailored for {target}
4. Be conversational, warm, and caring — but also precise and data-driven
5. You CAN show raw data, metrics, and numbers when the user asks for them
6. Format your responses with markdown: use **bold** for important info, bullet points for lists
7. If the user asks something unrelated to environment/health/safety, politely redirect
8. Never repeat the same phrasing from previous conversation messages
9. For each response, consider the specific risks currently active and relevant
10. If multiple risks exist, prioritize the most dangerous ones"""

        data_context = f"""═══ REAL-TIME ENVIRONMENTAL DATA FOR {city.upper()} ═══
📍 Location: {city} ({env_data.timestamp.strftime('%Y-%m-%d %H:%M UTC') if env_data.timestamp else 'now'})

🌡️ Temperature: {env_data.temperature:.1f}°C (feels like {env_data.feels_like:.1f}°C)
💨 Wind Speed: {env_data.wind_speed:.1f} m/s
👁️ Visibility: {env_data.visibility:.1f} km
🌧️ Rainfall: {env_data.rainfall:.1f} mm/hr
☁️ Weather: {env_data.weather_desc}

🏭 Air Quality Index (AQI): {env_data.aqi}
   PM2.5: {env_data.pm25:.1f} µg/m³
   PM10: {env_data.pm10:.1f} µg/m³

💧 Humidity: {env_data.humidity:.0f}%
☀️ UV Index: {env_data.uv_index:.1f}
🔊 Noise Level: {env_data.noise_db:.0f} dB

═══ RISK ASSESSMENT (for {target}, {activity_name}) ═══
Overall Safety: {safety_index.overall_level.value} (score: {safety_index.overall_score}/100)
Summary: {safety_index.summary}

Individual Risk Breakdown:
{risk_details}
Top Recommendations:
{chr(10).join('  • ' + r for r in safety_index.recommendations[:5])}"""

        # Build message list with conversation history
        full_prompt = f"{system_prompt}\n\n{data_context}\n\n"
        
        if conversation_history:
            full_prompt += "═══ CONVERSATION HISTORY (do NOT repeat previous answers) ═══\n"
            for msg in conversation_history[-12:]:  # Last 12 messages (6 turns)
                role = msg.get("role", "user")
                content = msg.get("content", "")[:500]
                full_prompt += f"{role.upper()}: {content}\n"
            full_prompt += "\n"
        
        full_prompt += f"USER'S NEW QUESTION: {user_message}"

        # Try each model until one works (with retry-after support)
        for model_name in MODELS:
            try:
                # Use new google-genai async API
                response = await _genai_client.aio.models.generate_content(
                    model=model_name,
                    contents=full_prompt,
                    config={
                        "max_output_tokens": 1024,
                        "temperature": 0.75,
                    },
                )

                reply = response.text
                if reply and len(reply.strip()) > 10:
                    print(f"[Chat] Gemini success with model: {model_name}")
                    return reply.strip()
            except Exception as model_err:
                err_str = str(model_err)
                print(f"[Chat] Model {model_name} failed: {err_str}")
                
                # If rate limited with retry-after, wait and retry once
                if "429" in err_str or "ResourceExhausted" in err_str:
                    # Extract retry delay if present
                    import re
                    retry_match = re.search(r'retry.*?(\d+\.?\d*)\s*s', err_str, re.IGNORECASE)
                    if retry_match:
                        wait_time = min(float(retry_match.group(1)), 5)  # Max 5s wait
                        if wait_time <= 5:
                            print(f"[Chat] Waiting {wait_time}s for rate limit on {model_name}...")
                            await asyncio.sleep(wait_time)
                            try:
                                response = await _genai_client.aio.models.generate_content(
                                    model=model_name,
                                    contents=full_prompt,
                                    config={
                                        "max_output_tokens": 1024,
                                        "temperature": 0.75,
                                    },
                                )
                                reply = response.text
                                if reply and len(reply.strip()) > 10:
                                    print(f"[Chat] Gemini success after retry with: {model_name}")
                                    return reply.strip()
                            except Exception:
                                pass
                continue

    except Exception as e:
        print(f"[Chat] Gemini error: {e}")
    
    return None


def _infer_activity(message: str) -> ActivityIntent:
    """Infer intended activity from message."""
    message_lower = message.lower()
    
    if any(w in message_lower for w in ["walk", "walking", "stroll", "morning walk"]):
        return ActivityIntent.WALKING
    elif any(w in message_lower for w in ["exercise", "jog", "run", "yoga", "gym"]):
        return ActivityIntent.EXERCISE
    elif any(w in message_lower for w in ["work", "garden", "outdoor work"]):
        return ActivityIntent.OUTDOOR_WORK
    elif any(w in message_lower for w in ["commute", "travel", "office", "bus", "train", "auto", "cab"]):
        return ActivityIntent.COMMUTE
    elif any(w in message_lower for w in ["rest", "sleep", "home", "indoor"]):
        return ActivityIntent.REST
    
    return ActivityIntent.WALKING  # Default


# ── Intent Detection (for template fallback only) ──

INTENT_KEYWORDS = {
    "safety_check": [
        "safe", "safety", "risk", "go out", "walk", "outside", "outdoor",
        "okay to go", "should i go", "can i go", "is it safe",
        "parents", "mother", "father", "grandfather", "grandmother",
        "elderly", "senior", "old", "aged",
    ],
    "air_quality": [
        "air", "pollution", "aqi", "pm2.5", "smog", "breathe", "breathing",
        "lungs", "respiratory", "mask", "smoke",
    ],
    "heat_check": [
        "hot", "heat", "temperature", "heatwave", "heat stroke", "sunstroke",
        "warm", "burning", "dehydration",
    ],
    "rain_flood": [
        "rain", "flood", "waterlogging", "umbrella", "wet", "water",
        "monsoon", "storm", "drainage",
    ],
    "uv_check": [
        "sun", "uv", "sunburn", "ultraviolet", "sunscreen", "tan",
    ],
    "noise_check": [
        "noise", "loud", "sound", "sleep", "quiet", "noisy",
    ],
    "humidity_check": [
        "humid", "humidity", "muggy", "sticky", "joint", "arthritis",
    ],
    "summary": [
        "summary", "today", "overall", "report", "daily", "conditions",
        "weather", "how is", "what is",
    ],
}


def detect_intent(message: str) -> str:
    """Detect user's intent from their message."""
    message_lower = message.lower()
    
    scores = {}
    for intent, keywords in INTENT_KEYWORDS.items():
        score = sum(1 for kw in keywords if kw in message_lower)
        if score > 0:
            scores[intent] = score
    
    if not scores:
        return "summary"
    
    return max(scores, key=scores.get)


def _generate_response(
    intent: str,
    safety_index: SafetyIndex,
    env_data: EnvironmentData,
    message: str,
    age_group: AgeGroup,
) -> str:
    """Generate a contextual, data-rich, conversational template response (fallback only).
    
    Made to feel natural and AI-like even when Gemini is unavailable.
    Includes real data values, senior-specific advice, and actionable guidance.
    """
    from datetime import datetime, timezone, timedelta
    
    IST = timezone(timedelta(hours=5, minutes=30))
    now_ist = datetime.now(IST)
    hour = now_ist.hour
    time_of_day = "morning" if 5 <= hour < 12 else "afternoon" if 12 <= hour < 17 else "evening" if 17 <= hour < 21 else "night"
    
    level = safety_index.overall_level.value
    level_emoji = {"LOW": "✅", "MODERATE": "⚠️", "HIGH": "🔴"}.get(level, "ℹ️")
    
    target = "senior citizens" if age_group == AgeGroup.ELDERLY else "adults"
    is_elderly = age_group == AgeGroup.ELDERLY
    
    # Helper: AQI category
    aqi = env_data.aqi
    if aqi <= 50:
        aqi_cat = "Good"
    elif aqi <= 100:
        aqi_cat = "Moderate"
    elif aqi <= 150:
        aqi_cat = "Unhealthy for Sensitive Groups"
    elif aqi <= 200:
        aqi_cat = "Unhealthy"
    elif aqi <= 300:
        aqi_cat = "Very Unhealthy"
    else:
        aqi_cat = "Hazardous"
    
    # Helper: UV category
    uv = env_data.uv_index
    if uv <= 2:
        uv_cat = "Low"
    elif uv <= 5:
        uv_cat = "Moderate"
    elif uv <= 7:
        uv_cat = "High"
    elif uv <= 10:
        uv_cat = "Very High"
    else:
        uv_cat = "Extreme"
    
    if intent == "safety_check":
        response = f"Good {time_of_day}! Here's the current safety assessment for {target}:\n\n"
        response += f"{level_emoji} **Overall Risk: {level}** (Score: {safety_index.overall_score}/100)\n\n"
        response += f"{safety_index.summary}\n\n"
        
        if safety_index.top_risks:
            response += "**⚡ Key Risks Right Now:**\n"
            for risk in safety_index.top_risks:
                response += f"  • {risk.icon} **{risk.name}** ({risk.level.value}) — {risk.reason}\n"
            response += "\n"
        
        # Personalized senior advice
        if is_elderly:
            if level == "HIGH":
                response += "🛑 **Strong recommendation:** Stay indoors if possible. "
                response += "If you must go outside, keep it brief (under 15 minutes) and carry water, phone, and any medications.\n\n"
            elif level == "MODERATE":
                response += "⚠️ **Moderate caution advised.** Short outdoor activities are okay, "
                response += "but avoid prolonged exposure. Carry water and take breaks in shade.\n\n"
            else:
                response += "✅ **Conditions look favorable** for outdoor activities. "
                response += "Still wise to carry water and avoid the hottest part of the day.\n\n"
        
        response += "**📋 Recommendations:**\n"
        for i, rec in enumerate(safety_index.recommendations[:4], 1):
            response += f"  {i}. {rec}\n"

    elif intent == "air_quality":
        aqi_risk = next((r for r in safety_index.all_risks if r.name == "Air Quality"), None)
        response = f"🏭 **Air Quality Report**\n\n"
        response += f"The current air quality in your area is **{aqi_cat}**.\n\n"
        response += f"| Metric | Value | Status |\n|--------|-------|--------|\n"
        response += f"| AQI | **{aqi}** | {aqi_cat} |\n"
        response += f"| PM2.5 | **{env_data.pm25:.1f}** µg/m³ | {'⚠️ Above WHO limit' if env_data.pm25 > 15 else '✅ Within safe range'} |\n"
        response += f"| PM10 | **{env_data.pm10:.1f}** µg/m³ | {'⚠️ Elevated' if env_data.pm10 > 45 else '✅ Acceptable'} |\n\n"
        
        if aqi_risk:
            response += f"{aqi_risk.reason}\n\n"
        
        if is_elderly:
            if aqi > 150:
                response += "**🚨 Senior Advisory:** AQI above 150 is particularly harmful for {target}. "
                response += "Avoid outdoor activity entirely. If indoors, close windows and use an air purifier if available. "
                response += "N95 masks are essential if you must step outside.\n"
            elif aqi > 100:
                response += "**⚠️ Senior Advisory:** With AQI at {aqi}, limit outdoor exposure to under 30 minutes. "
                response += "A standard mask can help. Morning walks should be shifted to early hours (before 7 AM).\n"
            else:
                response += f"**✅ Safe for outside activities.** AQI at {aqi} is within acceptable range for {target}.\n"
        
        if aqi_risk and aqi_risk.recommendation:
            response += f"\n**Recommendation:** {aqi_risk.recommendation}"
    
    elif intent == "heat_check":
        thermal_risk = next((r for r in safety_index.all_risks if r.name == "Thermal Comfort"), None)
        temp = env_data.temperature
        feels = env_data.feels_like
        
        response = f"🌡️ **Temperature & Heat Analysis**\n\n"
        response += f"| Metric | Value |\n|--------|-------|\n"
        response += f"| Temperature | **{temp:.1f}°C** |\n"
        response += f"| Feels Like | **{feels:.1f}°C** |\n"
        response += f"| Humidity | **{env_data.humidity:.0f}%** |\n"
        response += f"| Wind | **{env_data.wind_speed:.1f} m/s** |\n\n"
        
        if thermal_risk:
            response += f"**Risk Level:** {thermal_risk.level.value} — {thermal_risk.reason}\n\n"
        
        if is_elderly:
            if feels > 35:
                response += "🔴 **Heat Danger for Seniors:** Feels-like temperature above 35°C poses serious heat stroke risk. "
                response += "Stay indoors with cooling. Drink water every 20 minutes even without feeling thirsty.\n"
            elif feels > 30:
                response += "⚠️ **Warm conditions.** For seniors, limit outdoor time to early morning (before 9 AM) or late evening (after 6 PM). "
                response += "Wear light, loose cotton clothing. Carry oral rehydration solution.\n"
            elif feels < 15:
                response += "🧣 **Cold conditions.** Dress in warm layers. Cold air can trigger respiratory issues and joint pain in seniors.\n"
            else:
                response += f"✅ **Comfortable range** for seniors. Temperature at {temp:.1f}°C is within the ideal outdoor comfort zone.\n"
        
        if thermal_risk and thermal_risk.recommendation:
            response += f"\n**Recommendation:** {thermal_risk.recommendation}"
    
    elif intent == "rain_flood":
        flood_risk = next((r for r in safety_index.all_risks if r.name == "Flood / Waterlogging"), None)
        rainfall = env_data.rainfall
        
        response = f"🌧️ **Rainfall & Flood Analysis**\n\n"
        response += f"Current Rainfall: **{rainfall:.1f} mm/hr**"
        if rainfall == 0:
            response += " (No rain currently)\n\n"
        elif rainfall < 2.5:
            response += " (Light rain)\n\n"
        elif rainfall < 7.5:
            response += " (Moderate rain)\n\n"
        else:
            response += " (Heavy rain — exercise caution)\n\n"
        
        response += f"Visibility: **{env_data.visibility:.1f} km** | Wind: **{env_data.wind_speed:.1f} m/s**\n\n"
        
        if flood_risk:
            response += f"**Flood Risk:** {flood_risk.level.value} — {flood_risk.reason}\n\n"
        
        if is_elderly and rainfall > 2:
            response += "**🚶 Senior Fall Risk:** Wet surfaces increase fall risk significantly for seniors. "
            response += "Use non-slip footwear, carry an umbrella, and avoid waterlogged areas. "
            response += "If possible, postpone outdoor activities until the rain stops.\n"
        elif is_elderly:
            response += "✅ No significant rainfall hazard currently. Roads should be dry.\n"
        
        if flood_risk and flood_risk.recommendation:
            response += f"\n**Recommendation:** {flood_risk.recommendation}"
    
    elif intent == "uv_check":
        uv_risk = next((r for r in safety_index.all_risks if r.name == "UV Exposure"), None)
        
        response = f"☀️ **UV Exposure Report**\n\n"
        response += f"UV Index: **{uv:.1f}** ({uv_cat})\n\n"
        
        if uv == 0:
            response += "The UV index is currently **0** — this is expected "
            response += f"{'at nighttime' if hour < 6 or hour > 19 else 'with heavy cloud cover'}. "
            response += "No UV protection needed right now.\n"
        elif uv <= 2:
            response += "UV levels are **low** — safe for outdoor activities without special protection.\n"
        elif uv <= 5:
            response += "UV levels are **moderate** — wear sunglasses and apply SPF 30+ sunscreen.\n"
        elif uv <= 7:
            response += "UV levels are **high** — limit midday sun exposure. Use SPF 50+, hat, and sunglasses.\n"
        else:
            response += "UV levels are **very high to extreme** — avoid direct sun exposure between 10 AM and 4 PM.\n"
        
        if is_elderly and uv > 3:
            response += f"\n**👴 Senior Skin Advisory:** Elderly skin is 30% more vulnerable to UV damage. "
            response += "Apply broad-spectrum SPF 50 sunscreen 20 minutes before going out. "
            response += "Wear a wide-brimmed hat and full-sleeve light clothing.\n"
        
        if uv_risk and uv_risk.recommendation:
            response += f"\n**Recommendation:** {uv_risk.recommendation}"
    
    elif intent == "noise_check":
        noise_risk = next((r for r in safety_index.all_risks if r.name == "Noise Pollution"), None)
        noise = env_data.noise_db
        
        response = f"🔊 **Noise Level Analysis**\n\n"
        response += f"Current noise level: **{noise:.0f} dB**\n\n"
        
        if noise < 50:
            response += "🟢 **Quiet environment** — comfortable for rest, conversation, and sleep.\n"
        elif noise < 65:
            response += "🟡 **Moderate noise** — acceptable for daytime activities but may be distracting.\n"
        elif noise < 75:
            response += "🟠 **Elevated noise** — prolonged exposure may cause stress and hearing fatigue.\n"
        else:
            response += "🔴 **High noise** — can cause hearing damage with prolonged exposure. Use ear protection.\n"
        
        if is_elderly:
            response += f"\n**Senior Impact:** Noise above 60 dB can elevate blood pressure and increase anxiety in seniors. "
            if noise > 65:
                response += "Consider using noise-cancelling headphones or earplugs during outdoor activities.\n"
            else:
                response += "Current levels are within acceptable range.\n"
        
        if noise_risk and noise_risk.recommendation:
            response += f"\n**Recommendation:** {noise_risk.recommendation}"
    
    elif intent == "humidity_check":
        hum_risk = next((r for r in safety_index.all_risks if r.name == "Humidity"), None)
        humidity = env_data.humidity
        
        response = f"💧 **Humidity Analysis**\n\n"
        response += f"Current humidity: **{humidity:.0f}%** | Temperature: **{env_data.temperature:.1f}°C**\n\n"
        
        if humidity < 30:
            response += "🟡 **Low humidity** — dry air can cause skin cracking, nasal irritation, and dehydration.\n"
        elif humidity <= 60:
            response += "🟢 **Comfortable humidity** — within the ideal 30-60% range.\n"
        elif humidity <= 80:
            response += "🟡 **High humidity** — can feel muggy and uncomfortable. Sweat evaporation is reduced.\n"
        else:
            response += "🔴 **Very high humidity** — heat stress risk increases significantly. Body's cooling system is impaired.\n"
        
        if is_elderly:
            response += f"\n**Senior Health Notes:**\n"
            if humidity > 70:
                response += "• High humidity + heat compounds dehydration risk for seniors\n"
                response += "• Joint pain and arthritis symptoms may worsen\n"
                response += "• Stay in air-conditioned spaces when possible\n"
            elif humidity < 35:
                response += "• Dry air worsens respiratory conditions common in elderly\n"
                response += "• Use a humidifier indoors and drink warm fluids\n"
                response += "• Apply moisturizer to prevent skin cracking\n"
            else:
                response += "• Humidity levels are comfortable for seniors\n"
                response += "• Good conditions for outdoor activities with normal precautions\n"
        
        if hum_risk and hum_risk.recommendation:
            response += f"\n**Recommendation:** {hum_risk.recommendation}"
    
    else:  # summary / general
        response = f"Good {time_of_day}! Here's your comprehensive environmental briefing:\n\n"
        response += f"{level_emoji} **Overall Safety: {level}** (Score: {safety_index.overall_score}/100)\n\n"
        response += f"_{safety_index.summary}_\n\n"
        
        response += "**📊 Live Environmental Data:**\n\n"
        response += f"| Parameter | Value | Status |\n|-----------|-------|--------|\n"
        response += f"| 🌡️ Temperature | {env_data.temperature:.1f}°C (feels {env_data.feels_like:.1f}°C) | {'✅' if 18 <= env_data.feels_like <= 32 else '⚠️'} |\n"
        response += f"| 🏭 Air Quality | AQI {aqi} ({aqi_cat}) | {'✅' if aqi <= 100 else '⚠️' if aqi <= 150 else '🔴'} |\n"
        response += f"| 💧 Humidity | {env_data.humidity:.0f}% | {'✅' if 30 <= env_data.humidity <= 60 else '⚠️'} |\n"
        response += f"| ☀️ UV Index | {uv:.1f} ({uv_cat}) | {'✅' if uv <= 3 else '⚠️' if uv <= 6 else '🔴'} |\n"
        response += f"| 🌧️ Rainfall | {env_data.rainfall:.1f} mm/hr | {'✅' if env_data.rainfall < 2.5 else '⚠️'} |\n"
        response += f"| 💨 Wind | {env_data.wind_speed:.1f} m/s | {'✅' if env_data.wind_speed < 8 else '⚠️'} |\n"
        response += f"| 👁️ Visibility | {env_data.visibility:.1f} km | {'✅' if env_data.visibility > 5 else '⚠️'} |\n"
        response += f"| 🔊 Noise | {env_data.noise_db:.0f} dB | {'✅' if env_data.noise_db < 65 else '⚠️'} |\n\n"
        
        # Add risk breakdown
        if safety_index.top_risks:
            response += "**⚡ Active Risk Alerts:**\n"
            for risk in safety_index.top_risks:
                response += f"  • {risk.icon} **{risk.name}**: {risk.reason}\n"
            response += "\n"
        
        response += "**📋 Top Recommendations:**\n"
        for i, rec in enumerate(safety_index.recommendations[:4], 1):
            response += f"  {i}. {rec}\n"
        
        if is_elderly:
            response += f"\n_This assessment is optimized for senior citizen safety._"
    
    return response
