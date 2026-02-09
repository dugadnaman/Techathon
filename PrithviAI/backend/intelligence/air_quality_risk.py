"""
PrithviAI — Air Quality Risk Assessment
Computes respiratory risk from PM2.5, PM10, and AQI data.
Senior citizens have significantly lower tolerance thresholds.
"""

from models.schemas import RiskFactor, RiskLevel, AgeGroup, ActivityIntent


def compute_air_quality_risk(
    pm25: float,
    pm10: float,
    aqi: int,
    age_group: AgeGroup = AgeGroup.ELDERLY,
    activity: ActivityIntent = ActivityIntent.WALKING,
) -> RiskFactor:
    """
    Compute respiratory risk from air quality data.
    
    Decision Logic:
    - PM2.5 is the primary indicator (most dangerous for lungs)
    - Seniors have ~30% lower threshold than adults
    - Active activities (walking, exercise) increase exposure risk
    - AQI used as secondary confirmation
    """
    
    # ── Threshold adjustment for age group ──
    # Seniors are more vulnerable: lower thresholds by 30%
    age_factor = 0.7 if age_group == AgeGroup.ELDERLY else 1.0
    
    # Activity multiplier: higher exposure during physical activity
    activity_multipliers = {
        ActivityIntent.REST: 0.6,
        ActivityIntent.WALKING: 1.0,
        ActivityIntent.COMMUTE: 0.8,
        ActivityIntent.OUTDOOR_WORK: 1.3,
        ActivityIntent.EXERCISE: 1.5,
    }
    activity_factor = activity_multipliers.get(activity, 1.0)
    
    # ── PM2.5 Risk Score (0-100) ──
    # WHO guideline: 15 µg/m³ annual, 45 µg/m³ 24-hr
    # Indian NAAQS: 60 µg/m³ 24-hr, 40 µg/m³ annual
    effective_pm25 = pm25 * activity_factor / age_factor
    
    if effective_pm25 <= 30:
        pm25_score = effective_pm25 * (20 / 30)  # 0-20
    elif effective_pm25 <= 60:
        pm25_score = 20 + (effective_pm25 - 30) * (30 / 30)  # 20-50
    elif effective_pm25 <= 90:
        pm25_score = 50 + (effective_pm25 - 60) * (25 / 30)  # 50-75
    elif effective_pm25 <= 150:
        pm25_score = 75 + (effective_pm25 - 90) * (15 / 60)  # 75-90
    else:
        pm25_score = min(90 + (effective_pm25 - 150) * (10 / 100), 100)  # 90-100
    
    # ── PM10 Risk Score (0-100) ──
    effective_pm10 = pm10 * activity_factor / age_factor
    
    if effective_pm10 <= 50:
        pm10_score = effective_pm10 * (15 / 50)
    elif effective_pm10 <= 100:
        pm10_score = 15 + (effective_pm10 - 50) * (25 / 50)
    elif effective_pm10 <= 200:
        pm10_score = 40 + (effective_pm10 - 100) * (30 / 100)
    else:
        pm10_score = min(70 + (effective_pm10 - 200) * (30 / 200), 100)
    
    # ── AQI Risk Score ──
    if aqi <= 50:
        aqi_score = aqi * (15 / 50)
    elif aqi <= 100:
        aqi_score = 15 + (aqi - 50) * (25 / 50)
    elif aqi <= 200:
        aqi_score = 40 + (aqi - 100) * (35 / 100)
    else:
        aqi_score = min(75 + (aqi - 200) * (25 / 300), 100)
    
    # ── Combined Score ──
    # Weighted: PM2.5 most important, then AQI, then PM10
    score = (pm25_score * 0.50) + (aqi_score * 0.30) + (pm10_score * 0.20)
    score = min(max(score, 0), 100)
    
    # ── Determine Risk Level ──
    if score < 30:
        level = RiskLevel.LOW
    elif score < 60:
        level = RiskLevel.MODERATE
    else:
        level = RiskLevel.HIGH
    
    # ── Generate Human-Readable Reason ──
    if level == RiskLevel.LOW:
        reason = "Air quality is good for outdoor activities."
        recommendation = "Safe to go outside. Enjoy fresh air."
        icon = "🟢"
    elif level == RiskLevel.MODERATE:
        reason = f"Air quality is moderate. PM2.5 is {pm25:.0f} µg/m³ which may affect sensitive individuals."
        recommendation = "Limit prolonged outdoor activity. Use a mask if you have respiratory conditions."
        icon = "🟡"
    else:
        reason = f"Air quality is poor. PM2.5 is {pm25:.0f} µg/m³ — harmful for elderly and those with lung/heart conditions."
        recommendation = "Stay indoors. Keep windows closed. Use air purifier if available."
        icon = "🔴"
    
    return RiskFactor(
        name="Air Quality",
        level=level,
        score=round(score, 1),
        reason=reason,
        recommendation=recommendation,
        icon=icon,
    )
