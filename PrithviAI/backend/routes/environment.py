"""
PrithviAI — Environment Data Routes
Endpoints for fetching current environmental data and forecasts.
"""

from fastapi import APIRouter, Query
from typing import Optional
from services.data_aggregator import get_aggregated_environment_with_quality
from services.weather_service import fetch_weather_forecast, parse_forecast_to_env_list
from intelligence.data_confidence import get_freshness_status, calculate_confidence_score
from models.schemas import EnvironmentData, SensorData

router = APIRouter(prefix="/api/environment", tags=["Environment"])


@router.get("/current")
async def get_current_environment(
    lat: float = Query(default=18.5204, description="Latitude"),
    lon: float = Query(default=73.8567, description="Longitude"),
    city: str = Query(default="Pune", description="City name"),
):
    """
    Get current environmental data from all sources.
    Includes data freshness and confidence metadata.
    """
    env_data, data_quality = await get_aggregated_environment_with_quality(lat, lon, city)

    # Compute freshness and confidence
    freshness = get_freshness_status(env_data.timestamp)
    confidence = calculate_confidence_score(data_quality)

    # Return env data + quality metadata (backward-compatible: extra keys ignored by old clients)
    result = env_data.model_dump()
    result["timestamp"] = env_data.timestamp.isoformat() + "Z" if env_data.timestamp else None
    result["data_quality"] = {
        "freshness": freshness,
        "confidence": confidence,
        "sources": data_quality.get("data_sources", {}),
    }
    return result


@router.get("/forecast")
async def get_forecast(
    lat: float = Query(default=18.5204, description="Latitude"),
    lon: float = Query(default=73.8567, description="Longitude"),
):
    """Get 48-hour environmental forecast data."""
    forecast_raw = await fetch_weather_forecast(lat, lon)
    forecast_data = parse_forecast_to_env_list(forecast_raw)
    return {"forecast": [f.model_dump() for f in forecast_data]}


@router.post("/sensor")
async def submit_sensor_data(sensor_data: SensorData):
    """
    Receive data from hardware sensors.
    Data is validated, smoothed, and merged with API data.
    """
    from services.sensor_service import sensor_manager
    
    smoothed = sensor_manager.ingest(sensor_data)
    return {
        "status": "received",
        "smoothed": smoothed.model_dump(),
    }
