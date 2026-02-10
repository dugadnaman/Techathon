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
from typing import Optional, Tuple, List
import asyncio


async def get_aggregated_environment(
    lat: float,
    lon: float,
    city: str,
    sensor_data: Optional[SensorData] = None,
) -> EnvironmentData:
    """
    Aggregate data from all real-time sources into a single EnvironmentData.
    Backward-compatible: returns only EnvironmentData.
    """
    env, _ = await get_aggregated_environment_with_quality(lat, lon, city, sensor_data)
    return env


async def get_aggregated_environment_with_quality(
    lat: float,
    lon: float,
    city: str,
    sensor_data: Optional[SensorData] = None,
    precision: str = "city-level",
) -> Tuple[EnvironmentData, dict]:
    """
    Aggregate data from all real-time sources into EnvironmentData + data quality metadata.
    
    Returns:
        (EnvironmentData, data_quality_context) where data_quality_context contains:
        - api_errors: list of API names that failed
        - missing_metrics: list of metric names with no data
        - is_cached: bool
        - precision: "pinned" | "city-level" | "fallback"
        - data_age_minutes: int
    """

    api_errors: List[str] = []
    missing_metrics: List[str] = []
    is_cached = False

    # ── Fetch ALL external APIs in parallel for speed ──
    weather_task = fetch_current_weather(lat, lon, city)
    aqi_task = fetch_air_quality(lat, lon, city)
    uv_task = fetch_uv_index(lat, lon)
    
    weather_raw, aqi_data, uv_index = await asyncio.gather(
        weather_task, aqi_task, uv_task,
        return_exceptions=True
    )
    
    # Handle exceptions gracefully, track failures for confidence
    if isinstance(weather_raw, Exception):
        print(f"[Aggregator] Weather fetch failed: {weather_raw}")
        weather_raw = {"main": {}, "wind": {}, "weather": [{}], "visibility": 10000}
        api_errors.append("weather")
        missing_metrics.extend(["temperature", "humidity", "wind"])
    if isinstance(aqi_data, Exception):
        print(f"[Aggregator] AQI fetch failed: {aqi_data}")
        aqi_data = {"aqi": 0, "pm25": 0, "pm10": 0}
        api_errors.append("air_quality")
        missing_metrics.extend(["aqi", "pm25"])
    if isinstance(uv_index, Exception):
        print(f"[Aggregator] UV fetch failed: {uv_index}")
        uv_index = 0.0
        api_errors.append("uv")
        missing_metrics.append("uv_index")
    
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

    # ── Build data quality context for confidence calculation ──
    data_quality = {
        "api_errors": api_errors,
        "missing_metrics": missing_metrics,
        "is_cached": is_cached,
        "precision": precision,
        "data_age_minutes": 0,  # freshly fetched
        "is_forecast_based": False,
        "data_sources": {
            "weather": "OpenWeatherMap" if "weather" not in api_errors else "fallback",
            "air_quality": "AQICN+OWM" if "air_quality" not in api_errors else "fallback",
            "uv": "Open-Meteo" if "uv" not in api_errors else "fallback",
            "noise": "sensor" if (sensor_data and sensor_data.noise_db) else "model",
        },
    }

    return env, data_quality
