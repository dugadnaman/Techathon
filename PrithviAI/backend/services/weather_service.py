"""
PrithviAI — Weather Service
Fetches weather data from OpenWeatherMap API.
Provides current conditions and 48-hour forecast.
"""

import httpx
from typing import List, Optional, Tuple
from datetime import datetime, timedelta
from cachetools import TTLCache
from config import settings
from models.schemas import EnvironmentData

# Cache weather data for 10 minutes to avoid API rate limits
_weather_cache = TTLCache(maxsize=100, ttl=600)


async def fetch_current_weather(
    lat: float = None,
    lon: float = None,
    city: str = None,
) -> dict:
    """
    Fetch current weather data from OpenWeatherMap.
    Returns raw API response dict.
    """
    lat = lat or settings.DEFAULT_LAT
    lon = lon or settings.DEFAULT_LON
    
    cache_key = f"current_{lat:.2f}_{lon:.2f}"
    if cache_key in _weather_cache:
        return _weather_cache[cache_key]
    
    if not settings.OPENWEATHER_API_KEY:
        return _get_demo_weather(lat, lon)
    
    url = "https://api.openweathermap.org/data/2.5/weather"
    params = {
        "lat": lat,
        "lon": lon,
        "appid": settings.OPENWEATHER_API_KEY,
        "units": "metric",
    }
    
    try:
        async with httpx.AsyncClient(timeout=10) as client:
            response = await client.get(url, params=params)
            response.raise_for_status()
            data = response.json()
            _weather_cache[cache_key] = data
            return data
    except Exception as e:
        print(f"[Weather] API error: {e}. Using demo data.")
        return _get_demo_weather(lat, lon)


async def fetch_weather_forecast(
    lat: float = None,
    lon: float = None,
) -> List[dict]:
    """
    Fetch 48-hour weather forecast from OpenWeatherMap.
    Returns list of forecast time points.
    """
    lat = lat or settings.DEFAULT_LAT
    lon = lon or settings.DEFAULT_LON
    
    cache_key = f"forecast_{lat:.2f}_{lon:.2f}"
    if cache_key in _weather_cache:
        return _weather_cache[cache_key]
    
    if not settings.OPENWEATHER_API_KEY:
        return _get_demo_forecast(lat, lon)
    
    url = "https://api.openweathermap.org/data/2.5/forecast"
    params = {
        "lat": lat,
        "lon": lon,
        "appid": settings.OPENWEATHER_API_KEY,
        "units": "metric",
        "cnt": 16,  # 16 x 3hr = 48 hours
    }
    
    try:
        async with httpx.AsyncClient(timeout=10) as client:
            response = await client.get(url, params=params)
            response.raise_for_status()
            data = response.json()
            forecasts = data.get("list", [])
            _weather_cache[cache_key] = forecasts
            return forecasts
    except Exception as e:
        print(f"[Weather] Forecast API error: {e}. Using demo data.")
        return _get_demo_forecast(lat, lon)


def parse_weather_to_env(weather_data: dict) -> EnvironmentData:
    """Convert OpenWeatherMap API response to our EnvironmentData model."""
    
    main = weather_data.get("main", {})
    wind = weather_data.get("wind", {})
    rain = weather_data.get("rain", {})
    weather_list = weather_data.get("weather", [{}])
    
    return EnvironmentData(
        temperature=main.get("temp", 0),
        feels_like=main.get("feels_like", 0),
        humidity=main.get("humidity", 0),
        wind_speed=wind.get("speed", 0),
        rainfall=rain.get("1h", rain.get("3h", 0)) if rain else 0,
        visibility=weather_data.get("visibility", 10000) / 1000,  # Convert m to km
        weather_desc=weather_list[0].get("description", "") if weather_list else "",
        timestamp=datetime.utcnow(),
    )


def parse_forecast_to_env_list(forecast_list: List[dict]) -> List[EnvironmentData]:
    """Convert forecast API response to list of EnvironmentData."""
    result = []
    for item in forecast_list:
        main = item.get("main", {})
        wind = item.get("wind", {})
        rain = item.get("rain", {})
        weather_list = item.get("weather", [{}])
        
        timestamp = datetime.fromtimestamp(item.get("dt", 0)) if "dt" in item else datetime.utcnow()
        
        env = EnvironmentData(
            temperature=main.get("temp", 0),
            feels_like=main.get("feels_like", 0),
            humidity=main.get("humidity", 0),
            wind_speed=wind.get("speed", 0),
            rainfall=rain.get("3h", 0) if rain else 0,
            weather_desc=weather_list[0].get("description", "") if weather_list else "",
            timestamp=timestamp,
        )
        result.append(env)
    
    return result


# ── Demo Data (when API keys not configured) ──

def _get_demo_weather(lat: float, lon: float) -> dict:
    """Realistic demo weather data for Mumbai-like conditions."""
    return {
        "main": {
            "temp": 33.5,
            "feels_like": 37.2,
            "humidity": 72,
            "pressure": 1008,
        },
        "wind": {"speed": 4.2, "deg": 230},
        "rain": {"1h": 0},
        "weather": [{"description": "hazy", "icon": "50d"}],
        "visibility": 4000,
    }


def _get_demo_forecast(lat: float, lon: float) -> List[dict]:
    """Generate 48 hours of demo forecast data."""
    forecasts = []
    base_time = datetime.utcnow()
    
    for i in range(16):
        hour = (base_time + timedelta(hours=i * 3)).hour
        
        # Simulate temperature curve (peak at 2 PM, low at 4 AM)
        temp_base = 28 + 7 * max(0, 1 - abs(hour - 14) / 10)
        humidity_base = 65 + 15 * max(0, 1 - abs(hour - 4) / 8)
        
        forecasts.append({
            "dt": int((base_time + timedelta(hours=i * 3)).timestamp()),
            "main": {
                "temp": round(temp_base + (i % 3) * 0.5, 1),
                "feels_like": round(temp_base + 3 + (i % 3), 1),
                "humidity": round(min(humidity_base, 95)),
            },
            "wind": {"speed": 3 + (i % 4)},
            "rain": {"3h": 0.5 if i in [6, 7, 8] else 0},
            "weather": [{"description": "partly cloudy" if i < 10 else "light rain"}],
        })
    
    return forecasts
