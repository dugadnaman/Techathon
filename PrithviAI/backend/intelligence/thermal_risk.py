"""
PrithviAI — Thermal Comfort / Heat Stress Risk
Computes heat stress risk using temperature, humidity, and feels-like temperature.
Uses simplified Heat Index approach adapted for senior safety.
"""

from models.schemas import RiskFactor, RiskLevel, AgeGroup, ActivityIntent


def compute_thermal_risk(
    temperature: float,
    humidity: float,
    feels_like: float,
    wind_speed: float = 0,
    age_group: AgeGroup = AgeGroup.ELDERLY,
    activity: ActivityIntent = ActivityIntent.WALKING,
) -> RiskFactor:
    """
    Compute heat stress / thermal discomfort risk.
    
    Decision Logic:
    - Feels-like temperature is the primary metric (combines temp + humidity)
    - Seniors have impaired thermoregulation: narrower comfort zone
    - Physical activity increases metabolic heat generation
    - Wind provides cooling — reduces effective thermal stress
    - Both extreme heat AND cold are dangerous for seniors
    """
    
    # ── Effective temperature accounting for activity ──
    activity_heat_addition = {
        ActivityIntent.REST: 0,
        ActivityIntent.WALKING: 2,
        ActivityIntent.COMMUTE: 1,
        ActivityIntent.OUTDOOR_WORK: 4,
        ActivityIntent.EXERCISE: 5,
    }
    heat_addition = activity_heat_addition.get(activity, 0)
    
    # Wind chill factor: wind reduces perceived temperature
    wind_cooling = min(wind_speed * 0.5, 3)  # Cap at 3°C cooling
    
    effective_temp = feels_like + heat_addition - wind_cooling
    
    # ── Senior-adjusted comfort zone ──
    if age_group == AgeGroup.ELDERLY:
        comfort_low = 22.0   # Seniors feel cold faster
        comfort_high = 32.0  # Seniors overheat faster
        danger_high = 38.0
        danger_low = 12.0
    else:
        comfort_low = 18.0
        comfort_high = 35.0
        danger_high = 42.0
        danger_low = 8.0
    
    # ── Compute Score ──
    if comfort_low <= effective_temp <= comfort_high:
        # Comfortable zone
        mid = (comfort_low + comfort_high) / 2
        deviation = abs(effective_temp - mid) / ((comfort_high - comfort_low) / 2)
        score = deviation * 25  # 0-25 range
    elif effective_temp > comfort_high:
        # Heat stress zone
        if effective_temp >= danger_high:
            score = 80 + min((effective_temp - danger_high) * 4, 20)  # 80-100
        else:
            ratio = (effective_temp - comfort_high) / (danger_high - comfort_high)
            score = 25 + ratio * 55  # 25-80
    else:
        # Cold stress zone
        if effective_temp <= danger_low:
            score = 80 + min((danger_low - effective_temp) * 4, 20)  # 80-100
        else:
            ratio = (comfort_low - effective_temp) / (comfort_low - danger_low)
            score = 25 + ratio * 55  # 25-80
    
    # ── Humidity compound effect ──
    # High humidity + high temp = much worse for thermoregulation
    if effective_temp > 30 and humidity > 70:
        humidity_penalty = ((humidity - 70) / 30) * 15  # Up to 15 extra points
        score = min(score + humidity_penalty, 100)
    
    score = min(max(score, 0), 100)
    
    # ── Risk Level ──
    if score < 30:
        level = RiskLevel.LOW
    elif score < 60:
        level = RiskLevel.MODERATE
    else:
        level = RiskLevel.HIGH
    
    # ── Human-Readable Output ──
    if effective_temp > comfort_high:
        # Heat risk
        if level == RiskLevel.LOW:
            reason = f"Temperature ({temperature:.0f}°C) is within comfortable range."
            recommendation = "Safe for outdoor activities. Stay hydrated."
            icon = "🟢"
        elif level == RiskLevel.MODERATE:
            reason = f"It feels like {feels_like:.0f}°C — warm enough to cause discomfort for seniors."
            recommendation = "Avoid direct sun between 11 AM–4 PM. Drink water every 30 minutes."
            icon = "🟡"
        else:
            reason = f"Dangerously hot — feels like {feels_like:.0f}°C. High risk of heat stroke for elderly."
            recommendation = "Stay indoors in cool areas. Do not go outside. Drink plenty of fluids."
            icon = "🔴"
    elif effective_temp < comfort_low:
        # Cold risk
        if level == RiskLevel.LOW:
            reason = f"Mildly cool at {temperature:.0f}°C."
            recommendation = "Wear a light jacket if going out."
            icon = "🟢"
        elif level == RiskLevel.MODERATE:
            reason = f"Cold at {temperature:.0f}°C — may cause joint stiffness and discomfort."
            recommendation = "Wear warm layers. Limit time outdoors."
            icon = "🟡"
        else:
            reason = f"Very cold at {temperature:.0f}°C — risk of hypothermia for seniors."
            recommendation = "Stay indoors. Use room heating. Wear warm clothes even inside."
            icon = "🔴"
    else:
        reason = f"Temperature ({temperature:.0f}°C) is comfortable."
        recommendation = "Good conditions for outdoor activity."
        icon = "🟢"
    
    return RiskFactor(
        name="Thermal Comfort",
        level=level,
        score=round(score, 1),
        reason=reason,
        recommendation=recommendation,
        icon=icon,
    )
