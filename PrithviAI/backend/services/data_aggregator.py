"""
PrithviAI — Environment Data Aggregator
Combines all data sources (weather API, AQI API, UV API, sensors)
into a unified EnvironmentData object for risk computation.
All data is fetched from real-time APIs in parallel.
"""

from models.schemas import EnvironmentData, SensorData
from services.weather_service import fetch_current_weather, parse_weather_to_env
from services.air_quality_service import fetch_air_quality
from services.uv_service import fetch_uv_index
from services.sensor_service import sensor_manager
from datetime import datetime
from typing import Optional
import asyncio


async def get_aggregated_environment(
    lat: float,
    lon: float,
    city: str,
    sensor_data: Optional[SensorData] = None,
) -> EnvironmentData:
    """
    Aggregate data from all real-time sources into a single EnvironmentData.
    
    Data sources (ALL real-time APIs):
    - OpenWeatherMap: temperature, humidity, wind, visibility, weather description
    - AQICN + OpenWeatherMap Air Pollution: AQI, PM2.5, PM10 (cross-validated)
    - Open-Meteo: UV index (satellite-derived, accurate)
    - Noise: time + location model (no free real-time noise API exists)
    """
    
    # ── Fetch ALL external APIs in parallel for speed ──
    weather_task = fetch_current_weather(lat, lon, city)
    aqi_task = fetch_air_quality(lat, lon, city)
    uv_task = fetch_uv_index(lat, lon)
    
    weather_raw, aqi_data, uv_index = await asyncio.gather(
        weather_task, aqi_task, uv_task,
        return_exceptions=True
    )
    
    # Handle exceptions gracefully
    if isinstance(weather_raw, Exception):
        print(f"[Aggregator] Weather fetch failed: {weather_raw}")
        weather_raw = {"main": {}, "wind": {}, "weather": [{}], "visibility": 10000}
    if isinstance(aqi_data, Exception):
        print(f"[Aggregator] AQI fetch failed: {aqi_data}")
        aqi_data = {"aqi": 0, "pm25": 0, "pm10": 0}
    if isinstance(uv_index, Exception):
        print(f"[Aggregator] UV fetch failed: {uv_index}")
        uv_index = 0.0
    
    # ── Parse weather to base environment data ──
    env = parse_weather_to_env(weather_raw)
    
    # ── Overlay AQI data (cross-validated from dual sources) ──
    env.aqi = aqi_data.get("aqi", 0)
    env.pm25 = aqi_data.get("pm25", 0)
    env.pm10 = aqi_data.get("pm10", 0)
    
    # ── Overlay UV data (from Open-Meteo satellite data) ──
    env.uv_index = uv_index
    
    # ── Overlay sensor data (if hardware sensor connected, takes priority) ──
    if sensor_data:
        smoothed = sensor_manager.ingest(sensor_data)
        
        if smoothed.pm25 is not None:
            env.pm25 = smoothed.pm25
        if smoothed.pm10 is not None:
            env.pm10 = smoothed.pm10
        if smoothed.temperature is not None:
            env.temperature = smoothed.temperature
            temp_diff = smoothed.temperature - env.temperature
            env.feels_like += temp_diff
        if smoothed.humidity is not None:
            env.humidity = smoothed.humidity
        if smoothed.noise_db is not None:
            env.noise_db = smoothed.noise_db
        if smoothed.water_level is not None:
            env.water_level = smoothed.water_level
    else:
        # Use time + location noise model (no free real-time noise API exists globally)
        demo = sensor_manager.get_demo_sensor_data(lat, lon)
        if env.noise_db == 0:
            env.noise_db = demo.noise_db
    
    env.timestamp = datetime.utcnow()
    return env
