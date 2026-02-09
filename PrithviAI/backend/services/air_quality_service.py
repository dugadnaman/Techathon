"""
PrithviAI — Air Quality Service
Fetches air quality data from AQICN API and OpenWeatherMap Air Pollution API.
Uses geo-based lookups so each location gets its own AQI.
"""

import httpx
from cachetools import TTLCache
from config import settings

# Cache AQI data for 15 minutes — keyed by rounded lat/lon
_aqi_cache = TTLCache(maxsize=200, ttl=900)


async def fetch_air_quality(
    lat: float = None,
    lon: float = None,
    city: str = None,
) -> dict:
    """
    Fetch air quality data. Tries AQICN geo-based first, falls back to
    OpenWeatherMap. Returns dict with pm25, pm10, aqi fields.
    """
    lat = lat or settings.DEFAULT_LAT
    lon = lon or settings.DEFAULT_LON

    # Use 3-decimal cache key (~111m precision) so nearby clicks share cache
    cache_key = f"aqi_{lat:.3f}_{lon:.3f}"
    if cache_key in _aqi_cache:
        return _aqi_cache[cache_key]

    # Try AQICN geo-based API first (returns nearest station to coordinates)
    if settings.AQICN_API_KEY:
        data = await _fetch_from_aqicn_geo(lat, lon)
        if data:
            _aqi_cache[cache_key] = data
            return data

    # Fall back to OpenWeatherMap Air Pollution API
    if settings.OPENWEATHER_API_KEY:
        data = await _fetch_from_openweather(lat, lon)
        if data:
            _aqi_cache[cache_key] = data
            return data

    # Demo data fallback — varies by lat/lon
    demo = _get_demo_aqi(lat, lon)
    _aqi_cache[cache_key] = demo
    return demo


async def _fetch_from_aqicn_geo(lat: float, lon: float) -> dict:
    """Fetch from AQICN using geo-coordinates (nearest monitoring station)."""
    url = f"https://api.waqi.info/feed/geo:{lat};{lon}/"
    params = {"token": settings.AQICN_API_KEY}

    try:
        async with httpx.AsyncClient(timeout=10) as client:
            response = await client.get(url, params=params)
            response.raise_for_status()
            data = response.json()

            if data.get("status") == "ok":
                aqi_data = data.get("data", {})
                iaqi = aqi_data.get("iaqi", {})
                station = aqi_data.get("city", {}).get("name", "unknown")

                print(f"[AQI] AQICN geo hit: station={station}, aqi={aqi_data.get('aqi')}")

                return {
                    "aqi": aqi_data.get("aqi", 0),
                    "pm25": iaqi.get("pm25", {}).get("v", 0),
                    "pm10": iaqi.get("pm10", {}).get("v", 0),
                    "no2": iaqi.get("no2", {}).get("v", 0),
                    "so2": iaqi.get("so2", {}).get("v", 0),
                    "co": iaqi.get("co", {}).get("v", 0),
                    "o3": iaqi.get("o3", {}).get("v", 0),
                    "station": station,
                    "source": "aqicn",
                }
    except Exception as e:
        print(f"[AQI] AQICN geo API error: {e}")

    return None


async def _fetch_from_openweather(lat: float, lon: float) -> dict:
    """Fetch from OpenWeatherMap Air Pollution API and compute real AQI from PM2.5."""
    url = "http://api.openweathermap.org/data/2.5/air_pollution"
    params = {
        "lat": lat,
        "lon": lon,
        "appid": settings.OPENWEATHER_API_KEY,
    }

    try:
        async with httpx.AsyncClient(timeout=10) as client:
            response = await client.get(url, params=params)
            response.raise_for_status()
            data = response.json()

            components = data.get("list", [{}])[0].get("components", {})
            pm25 = components.get("pm2_5", 0)
            pm10 = components.get("pm10", 0)

            # Compute US EPA AQI from PM2.5 concentration (µg/m³)
            aqi = _compute_aqi_from_pm25(pm25)

            print(f"[AQI] OWM fallback: pm2.5={pm25}, computed_aqi={aqi}")

            return {
                "aqi": aqi,
                "pm25": pm25,
                "pm10": pm10,
                "no2": components.get("no2", 0),
                "so2": components.get("so2", 0),
                "co": components.get("co", 0),
                "o3": components.get("o3", 0),
                "source": "openweathermap",
            }
    except Exception as e:
        print(f"[AQI] OpenWeatherMap Air Pollution API error: {e}")

    return None


def _compute_aqi_from_pm25(pm25: float) -> int:
    """
    Convert PM2.5 concentration (µg/m³) to US EPA AQI using standard breakpoints.
    This gives a proper 0-500 AQI scale instead of the coarse 1-5 OWM scale.
    """
    breakpoints = [
        # (pm25_lo, pm25_hi, aqi_lo, aqi_hi)
        (0.0,   12.0,    0,  50),
        (12.1,  35.4,   51, 100),
        (35.5,  55.4,  101, 150),
        (55.5, 150.4,  151, 200),
        (150.5, 250.4, 201, 300),
        (250.5, 350.4, 301, 400),
        (350.5, 500.4, 401, 500),
    ]

    for pm_lo, pm_hi, aqi_lo, aqi_hi in breakpoints:
        if pm25 <= pm_hi:
            aqi = ((aqi_hi - aqi_lo) / (pm_hi - pm_lo)) * (pm25 - pm_lo) + aqi_lo
            return round(aqi)

    return 500  # Beyond scale


def _get_demo_aqi(lat: float = 19.076, lon: float = 72.878) -> dict:
    """
    Location-aware demo AQI data. Uses coordinate hash to produce varied
    but deterministic values so each location feels unique.
    """
    import hashlib

    # Create a deterministic seed from coordinates (rounded to ~1km)
    coord_str = f"{lat:.3f},{lon:.3f}"
    seed = int(hashlib.md5(coord_str.encode()).hexdigest()[:8], 16)

    # Generate varied AQI in realistic Indian metro range (60-220)
    base_aqi = 60 + (seed % 161)  # 60 to 220
    pm25 = round(base_aqi * 0.45 + (seed % 20), 1)  # Correlated with AQI
    pm10 = round(pm25 * 1.6 + (seed % 30), 1)

    return {
        "aqi": base_aqi,
        "pm25": pm25,
        "pm10": pm10,
        "no2": round(10 + (seed % 40), 1),
        "so2": round(3 + (seed % 15), 1),
        "co": round(0.3 + (seed % 10) * 0.1, 2),
        "o3": round(15 + (seed % 45), 1),
        "source": "demo",
    }
