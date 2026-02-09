"""
PrithviAI — Risk Assessment Routes
Endpoints for computing risk assessments and safety index.
"""

from fastapi import APIRouter
from models.schemas import (
    RiskAssessmentRequest, SafetyIndex, HealthAlert,
    AgeGroup, ActivityIntent, Language
)
from services.data_aggregator import get_aggregated_environment
from services.weather_service import fetch_weather_forecast, parse_forecast_to_env_list
from intelligence.risk_engine import risk_engine
from chat.language import translate_text
from typing import List

router = APIRouter(prefix="/api/risk", tags=["Risk Assessment"])


@router.post("/assess", response_model=SafetyIndex)
async def assess_risk(request: RiskAssessmentRequest):
    """
    Compute full risk assessment and Senior Environmental Safety Index.
    This is the primary endpoint for the platform.
    """
    # Get aggregated environmental data
    env_data = await get_aggregated_environment(
        lat=request.latitude,
        lon=request.longitude,
        city=request.city,
        sensor_data=request.sensor_data,
    )
    
    # Compute safety index
    safety_index = risk_engine.compute_all_risks(
        env_data=env_data,
        age_group=request.age_group,
        activity=request.activity,
    )
    
    # Translate if needed
    if request.language != Language.ENGLISH:
        safety_index.summary = translate_text(safety_index.summary, request.language)
        for risk in safety_index.all_risks:
            risk.reason = translate_text(risk.reason, request.language)
            risk.recommendation = translate_text(risk.recommendation, request.language)
            risk.name = translate_text(risk.name, request.language)
        safety_index.recommendations = [
            translate_text(r, request.language) for r in safety_index.recommendations
        ]
    
    return safety_index


@router.post("/alerts", response_model=List[HealthAlert])
async def get_alerts(request: RiskAssessmentRequest):
    """Get proactive health alerts based on current conditions."""
    env_data = await get_aggregated_environment(
        lat=request.latitude,
        lon=request.longitude,
        city=request.city,
        sensor_data=request.sensor_data,
    )
    
    safety_index = risk_engine.compute_all_risks(
        env_data=env_data,
        age_group=request.age_group,
        activity=request.activity,
    )
    
    alerts = risk_engine.generate_alerts(safety_index, request.age_group)
    return alerts


@router.post("/daily-summary")
async def get_daily_summary(request: RiskAssessmentRequest):
    """Get the full daily environmental safety summary."""
    env_data = await get_aggregated_environment(
        lat=request.latitude,
        lon=request.longitude,
        city=request.city,
        sensor_data=request.sensor_data,
    )
    
    # Get forecast data
    forecast_raw = await fetch_weather_forecast(request.latitude, request.longitude)
    forecast_env = parse_forecast_to_env_list(forecast_raw)
    
    daily_summary = risk_engine.generate_daily_summary(
        env_data=env_data,
        forecast_data=forecast_env,
        city=request.city,
        age_group=request.age_group,
    )
    
    return daily_summary
