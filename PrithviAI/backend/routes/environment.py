"""
PrithviAI — Environment Data Routes
Endpoints for fetching current environmental data and forecasts.
"""

from fastapi import APIRouter, Query
from typing import Optional
from services.data_aggregator import get_aggregated_environment
from services.weather_service import fetch_weather_forecast, parse_forecast_to_env_list
from models.schemas import EnvironmentData, SensorData

router = APIRouter(prefix="/api/environment", tags=["Environment"])


@router.get("/current", response_model=EnvironmentData)
async def get_current_environment(
    lat: float = Query(default=19.076, description="Latitude"),
    lon: float = Query(default=72.8777, description="Longitude"),
    city: str = Query(default="Mumbai", description="City name"),
):
    """
    Get current environmental data from all sources.
    Combines weather API, air quality, UV, and sensor data.
    """
    env_data = await get_aggregated_environment(lat, lon, city)
    return env_data


@router.get("/forecast")
async def get_forecast(
    lat: float = Query(default=19.076, description="Latitude"),
    lon: float = Query(default=72.8777, description="Longitude"),
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
