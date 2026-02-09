"""
PrithviAI — Short-Term Environmental Forecasting
Generates 24-48 hour predictions and early warnings.
Uses simple trend analysis + rule-based logic (ML-ready scaffold).
"""

from typing import List
from datetime import datetime, timedelta
from models.schemas import (
    EnvironmentData, Forecast, ForecastPoint, RiskLevel, AgeGroup
)
from intelligence.safety_index import compute_safety_index
from intelligence.air_quality_risk import compute_air_quality_risk
from intelligence.thermal_risk import compute_thermal_risk
from intelligence.humidity_risk import compute_humidity_risk
from intelligence.uv_risk import compute_uv_risk
from intelligence.flood_risk import compute_flood_risk
from intelligence.noise_risk import compute_noise_risk


def generate_forecast(
    forecast_data: List[EnvironmentData],
    age_group: AgeGroup = AgeGroup.ELDERLY,
) -> Forecast:
    """
    Generate 24-48 hour environmental forecast with early warnings.
    
    Strategy:
    - Process each forecast time point through the risk engine
    - Identify trend (improving, stable, worsening)
    - Generate early warnings for predicted HIGH risk periods
    
    For hackathon: Uses weather API forecast data directly.
    For production: Would incorporate ML time-series models.
    """
    
    forecast_points: List[ForecastPoint] = []
    early_warnings: List[str] = []
    
    for env_data in forecast_data:
        # Compute risk for each forecast point
        risks = []
        risks.append(compute_air_quality_risk(env_data.pm25, env_data.pm10, env_data.aqi, age_group))
        risks.append(compute_thermal_risk(env_data.temperature, env_data.humidity, env_data.feels_like, env_data.wind_speed, age_group))
        risks.append(compute_humidity_risk(env_data.humidity, env_data.temperature, age_group))
        risks.append(compute_uv_risk(env_data.uv_index, age_group))
        risks.append(compute_flood_risk(env_data.rainfall, env_data.water_level, env_data.wind_speed, age_group))
        risks.append(compute_noise_risk(env_data.noise_db, age_group))
        
        safety = compute_safety_index(risks, age_group)
        
        # Identify top concern
        key_concern = safety.top_risks[0].name if safety.top_risks else "None"
        
        forecast_points.append(ForecastPoint(
            time=env_data.timestamp,
            predicted_level=safety.overall_level,
            predicted_score=safety.overall_score,
            key_concern=key_concern,
        ))
        
        # Generate early warnings for HIGH risk periods
        if safety.overall_level == RiskLevel.HIGH:
            time_str = env_data.timestamp.strftime("%I %p, %b %d")
            early_warnings.append(
                f"⚠️ High risk expected around {time_str} — "
                f"main concern: {key_concern.lower()}. Plan to stay indoors."
            )
    
    # ── Trend Detection ──
    if len(forecast_points) >= 4:
        first_half = sum(p.predicted_score for p in forecast_points[:len(forecast_points)//2])
        second_half = sum(p.predicted_score for p in forecast_points[len(forecast_points)//2:])
        
        half_len = len(forecast_points) // 2
        first_avg = first_half / half_len if half_len > 0 else 0
        second_avg = second_half / (len(forecast_points) - half_len) if (len(forecast_points) - half_len) > 0 else 0
        
        if second_avg > first_avg + 10:
            early_warnings.insert(0, "📈 Conditions are expected to worsen over the next 24 hours.")
        elif second_avg < first_avg - 10:
            early_warnings.insert(0, "📉 Conditions are expected to improve over the next 24 hours.")
        else:
            early_warnings.insert(0, "➡️ Conditions are expected to remain stable over the next 24 hours.")
    
    return Forecast(
        points=forecast_points,
        early_warnings=early_warnings,
    )
