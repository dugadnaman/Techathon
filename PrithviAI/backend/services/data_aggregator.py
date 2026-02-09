"""
PrithviAI — Environment Data Aggregator
Combines all data sources (weather API, AQI API, UV API, sensors)
into a unified EnvironmentData object for risk computation.
"""

from models.schemas import EnvironmentData, SensorData
from services.weather_service import fetch_current_weather, parse_weather_to_env
from services.air_quality_service import fetch_air_quality
from services.uv_service import fetch_uv_index
from services.sensor_service import sensor_manager
from datetime import datetime
from typing import Optional


async def get_aggregated_environment(
    lat: float,
    lon: float,
    city: str,
    sensor_data: Optional[SensorData] = None,
) -> EnvironmentData:
    """
    Aggregate data from all sources into a single EnvironmentData.
    
    Priority Logic:
    - Sensor data (if available) takes precedence for: PM2.5, PM10, temp, humidity, noise
    - API data fills in gaps and provides: AQI, UV, forecast, wind, visibility
    - Demo data used as last resort for any missing field
    """
    
    # ── Fetch from external APIs ──
    weather_raw = await fetch_current_weather(lat, lon, city)
    aqi_data = await fetch_air_quality(lat, lon, city)
    uv_index = await fetch_uv_index(lat, lon)
    
    # ── Parse weather to base environment data ──
    env = parse_weather_to_env(weather_raw)
    
    # ── Overlay AQI data ──
    env.aqi = aqi_data.get("aqi", 0)
    env.pm25 = aqi_data.get("pm25", 0)
    env.pm10 = aqi_data.get("pm10", 0)
    
    # ── Overlay UV data ──
    env.uv_index = uv_index
    
    # ── Overlay sensor data (if provided, takes priority) ──
    if sensor_data:
        smoothed = sensor_manager.ingest(sensor_data)
        
        if smoothed.pm25 is not None:
            env.pm25 = smoothed.pm25
        if smoothed.pm10 is not None:
            env.pm10 = smoothed.pm10
        if smoothed.temperature is not None:
            env.temperature = smoothed.temperature
            # Adjust feels_like based on sensor temperature
            temp_diff = smoothed.temperature - env.temperature
            env.feels_like += temp_diff
        if smoothed.humidity is not None:
            env.humidity = smoothed.humidity
        if smoothed.noise_db is not None:
            env.noise_db = smoothed.noise_db
        if smoothed.water_level is not None:
            env.water_level = smoothed.water_level
    else:
        # Use location-aware noise estimation (no real sensor available)
        demo = sensor_manager.get_demo_sensor_data(lat, lon)
        if env.noise_db == 0:
            env.noise_db = demo.noise_db
    
    env.timestamp = datetime.utcnow()
    return env
