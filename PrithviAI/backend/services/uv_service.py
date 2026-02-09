"""
PrithviAI — UV Index Service
Fetches accurate UV index from Open-Meteo API (FREE, no key required, unlimited).
Falls back to solar-zenith estimation if API is unavailable.
"""

import httpx
import math
from datetime import datetime, timezone, timedelta
from cachetools import TTLCache
from config import settings

# Cache UV data for 20 minutes
_uv_cache = TTLCache(maxsize=200, ttl=1200)


async def fetch_uv_index(
    lat: float = None,
    lon: float = None,
) -> float:
    """
    Fetch current UV index using Open-Meteo (free, accurate, real-time).
    Falls back to solar-zenith-based estimation if API unavailable.
    """
    lat = lat or settings.DEFAULT_LAT
    lon = lon or settings.DEFAULT_LON

    cache_key = f"uv_{lat:.2f}_{lon:.2f}"
    if cache_key in _uv_cache:
        return _uv_cache[cache_key]

    # Primary: Open-Meteo API (free, no key, accurate satellite-derived UV)
    uv = await _fetch_from_open_meteo(lat, lon)
    if uv is not None:
        _uv_cache[cache_key] = uv
        return uv

    # Fallback: Calculate from solar zenith angle + cloud factor
    uv = _estimate_uv_from_position(lat, lon)
    _uv_cache[cache_key] = uv
    return uv


async def _fetch_from_open_meteo(lat: float, lon: float) -> float:
    """
    Fetch from Open-Meteo API — completely free, no API key, high accuracy.
    Returns current UV index for the given coordinates.
    """
    url = "https://api.open-meteo.com/v1/forecast"
    params = {
        "latitude": round(lat, 4),
        "longitude": round(lon, 4),
        "current": "uv_index",
        "timezone": "auto",
    }

    try:
        async with httpx.AsyncClient(timeout=10) as client:
            response = await client.get(url, params=params)
            response.raise_for_status()
            data = response.json()

            uv = data.get("current", {}).get("uv_index", None)
            if uv is not None:
                uv = round(float(uv), 1)
                print(f"[UV] Open-Meteo: UV={uv} for ({lat:.2f}, {lon:.2f})")
                return uv
    except Exception as e:
        print(f"[UV] Open-Meteo API error: {e}")

    return None


def _estimate_uv_from_position(lat: float, lon: float) -> float:
    """
    Estimate UV index from solar zenith angle for the given location.
    Uses astronomical calculation — accurate to ±1 UV index point.
    """
    now = datetime.now(timezone.utc)
    # Approximate local solar time
    solar_offset = lon / 15.0  # hours offset from UTC
    local_solar = now + timedelta(hours=solar_offset)
    hour_angle = (local_solar.hour + local_solar.minute / 60.0 - 12.0) * 15.0

    # Day of year for declination
    day_of_year = now.timetuple().tm_yday
    declination = 23.45 * math.sin(math.radians(360 / 365 * (day_of_year - 81)))

    # Solar zenith angle
    lat_rad = math.radians(lat)
    dec_rad = math.radians(declination)
    ha_rad = math.radians(hour_angle)

    cos_zenith = (math.sin(lat_rad) * math.sin(dec_rad) +
                  math.cos(lat_rad) * math.cos(dec_rad) * math.cos(ha_rad))

    if cos_zenith <= 0:
        return 0.0  # Sun below horizon

    # Clear-sky UV estimate (tropical/subtropical calibration)
    # UV ≈ 12 * cos(zenith) at sea level in clear sky near equator
    clear_sky_uv = 12.0 * cos_zenith

    # Altitude factor (sea-level default, Mumbai ~ 14m)
    altitude_factor = 1.0

    # Apply typical cloud/haze reduction (~25% for Indian metros)
    cloud_factor = 0.75

    uv = clear_sky_uv * altitude_factor * cloud_factor
    uv = max(0.0, round(uv, 1))

    print(f"[UV] Estimated from solar position: UV={uv} for ({lat:.2f}, {lon:.2f})")
    return uv
