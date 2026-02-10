"""
PrithviAI — Air Quality Service
Fetches air quality data from BOTH AQICN API and OpenWeatherMap Air Pollution API,
cross-validates, and returns the most accurate values.
Uses geo-based lookups so each location gets its own AQI.
"""

import httpx
import asyncio
from cachetools import TTLCache
from config import settings

# Cache AQI data for 10 minutes — keyed by rounded lat/lon
_aqi_cache = TTLCache(maxsize=200, ttl=600)


async def fetch_air_quality(
    lat: float = None,
    lon: float = None,
    city: str = None,
) -> dict:
    """
    Fetch air quality from BOTH AQICN and OpenWeatherMap, then cross-validate.

    Key insight: AQICN's iaqi.pm25.v is an AQI SUB-INDEX (0-500 scale),
    NOT the raw µg/m³ concentration. OpenWeatherMap returns actual µg/m³.
    
    Strategy:
    - Use OWM for raw PM2.5/PM10 concentrations (µg/m³) — always reliable
    - Use AQICN for official station AQI — trusted government data
    - Compute our own AQI from OWM's PM2.5 using EPA breakpoints
    - Take the HIGHER AQI (worst-case) between AQICN and computed
    - This ensures we never under-report pollution
    """
    lat = lat or settings.DEFAULT_LAT
    lon = lon or settings.DEFAULT_LON

    cache_key = f"aqi_{lat:.3f}_{lon:.3f}"
    if cache_key in _aqi_cache:
        return _aqi_cache[cache_key]

    # Fetch from BOTH sources in parallel for accuracy
    aqicn_data = None
    owm_data = None

    tasks = []
    if settings.AQICN_API_KEY:
        tasks.append(("aqicn", _fetch_from_aqicn_geo(lat, lon)))
    if settings.OPENWEATHER_API_KEY:
        tasks.append(("owm", _fetch_from_openweather(lat, lon)))

    if tasks:
        results = await asyncio.gather(*[t[1] for t in tasks], return_exceptions=True)
        for i, (name, _) in enumerate(tasks):
            if not isinstance(results[i], Exception) and results[i] is not None:
                if name == "aqicn":
                    aqicn_data = results[i]
                else:
                    owm_data = results[i]

    # Cross-validate and merge
    merged = _merge_air_quality(aqicn_data, owm_data, lat, lon)
    _aqi_cache[cache_key] = merged
    return merged


def _merge_air_quality(aqicn: dict, owm: dict, lat: float, lon: float) -> dict:
    """
    Merge AQICN + OpenWeatherMap data for maximum accuracy.
    
    AQICN gives: official station AQI, sub-indices
    OWM gives:   raw PM2.5/PM10 concentrations in µg/m³
    
    We use OWM concentrations + max of (AQICN AQI, computed AQI from PM2.5).
    """
    if owm and aqicn:
        # Best case: both available — use OWM concentrations + worst-case AQI
        pm25_ugm3 = owm["pm25"]       # Real µg/m³ from OWM
        pm10_ugm3 = owm["pm10"]       # Real µg/m³ from OWM
        computed_aqi = _compute_aqi_from_pm25(pm25_ugm3)
        aqicn_aqi = aqicn.get("aqi", 0)

        # Take the HIGHER AQI — never under-report
        final_aqi = max(computed_aqi, aqicn_aqi)

        # Also compute AQI from PM10 and take worst
        pm10_aqi = _compute_aqi_from_pm10(pm10_ugm3)
        final_aqi = max(final_aqi, pm10_aqi)

        station = aqicn.get("station", "")
        print(f"[AQI] MERGED: aqicn_aqi={aqicn_aqi}, owm_pm25={pm25_ugm3}µg/m³, "
              f"computed_aqi={computed_aqi}, pm10_aqi={pm10_aqi}, final_aqi={final_aqi}, "
              f"station={station}")

        return {
            "aqi": final_aqi,
            "pm25": round(pm25_ugm3, 1),
            "pm10": round(pm10_ugm3, 1),
            "no2": owm.get("no2", aqicn.get("no2", 0)),
            "so2": owm.get("so2", aqicn.get("so2", 0)),
            "co": owm.get("co", aqicn.get("co", 0)),
            "o3": owm.get("o3", aqicn.get("o3", 0)),
            "station": station,
            "source": "aqicn+owm",
        }

    elif owm:
        # Only OWM — compute AQI from real concentrations
        pm25 = owm["pm25"]
        pm10 = owm["pm10"]
        aqi_pm25 = _compute_aqi_from_pm25(pm25)
        aqi_pm10 = _compute_aqi_from_pm10(pm10)
        final_aqi = max(aqi_pm25, aqi_pm10)
        print(f"[AQI] OWM only: pm25={pm25}µg/m³, aqi={final_aqi}")
        return {
            "aqi": final_aqi,
            "pm25": round(pm25, 1),
            "pm10": round(pm10, 1),
            "no2": owm.get("no2", 0),
            "so2": owm.get("so2", 0),
            "co": owm.get("co", 0),
            "o3": owm.get("o3", 0),
            "source": "openweathermap",
        }

    elif aqicn:
        # Only AQICN — convert sub-indices back to approximate µg/m³
        aqicn_aqi = aqicn.get("aqi", 0)
        pm25_subindex = aqicn.get("pm25", 0)
        pm10_subindex = aqicn.get("pm10", 0)

        # Convert AQI sub-indices back to approximate concentrations
        pm25_ugm3 = _aqi_to_pm25(pm25_subindex)
        pm10_ugm3 = _aqi_to_pm10(pm10_subindex)

        # Recompute AQI from concentrations and take max with station AQI
        computed_aqi = max(_compute_aqi_from_pm25(pm25_ugm3), _compute_aqi_from_pm10(pm10_ugm3))
        final_aqi = max(aqicn_aqi, computed_aqi)

        print(f"[AQI] AQICN only: station_aqi={aqicn_aqi}, pm25_sub={pm25_subindex}→{pm25_ugm3}µg/m³, "
              f"pm10_sub={pm10_subindex}→{pm10_ugm3}µg/m³, final_aqi={final_aqi}")

        return {
            "aqi": final_aqi,
            "pm25": round(pm25_ugm3, 1),
            "pm10": round(pm10_ugm3, 1),
            "no2": aqicn.get("no2", 0),
            "so2": aqicn.get("so2", 0),
            "co": aqicn.get("co", 0),
            "o3": aqicn.get("o3", 0),
            "station": aqicn.get("station", ""),
            "source": "aqicn",
        }

    else:
        # Both failed — use demo data
        demo = _get_demo_aqi(lat, lon)
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

                # NOTE: iaqi values are AQI sub-indices (0-500), NOT µg/m³
                return {
                    "aqi": aqi_data.get("aqi", 0),
                    "pm25": iaqi.get("pm25", {}).get("v", 0),  # Sub-index
                    "pm10": iaqi.get("pm10", {}).get("v", 0),  # Sub-index
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
    """Fetch from OpenWeatherMap Air Pollution API — returns raw µg/m³ concentrations."""
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

            print(f"[AQI] OWM raw: pm2.5={pm25}µg/m³, pm10={pm10}µg/m³")

            return {
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
    This gives a proper 0-500 AQI scale.
    """
    if pm25 < 0:
        return 0
    breakpoints = [
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

    return 500


def _compute_aqi_from_pm10(pm10: float) -> int:
    """
    Convert PM10 concentration (µg/m³) to US EPA AQI using standard breakpoints.
    """
    if pm10 < 0:
        return 0
    breakpoints = [
        (0,    54,     0,  50),
        (55,   154,   51, 100),
        (155,  254,  101, 150),
        (255,  354,  151, 200),
        (355,  424,  201, 300),
        (425,  504,  301, 400),
        (505,  604,  401, 500),
    ]

    for pm_lo, pm_hi, aqi_lo, aqi_hi in breakpoints:
        if pm10 <= pm_hi:
            aqi = ((aqi_hi - aqi_lo) / (pm_hi - pm_lo)) * (pm10 - pm_lo) + aqi_lo
            return round(aqi)

    return 500


def _aqi_to_pm25(aqi_subindex: float) -> float:
    """
    Convert PM2.5 AQI sub-index back to approximate µg/m³ concentration.
    Inverse of _compute_aqi_from_pm25.
    """
    if aqi_subindex <= 0:
        return 0.0
    breakpoints = [
        (0,  50,    0.0,   12.0),
        (51, 100,  12.1,   35.4),
        (101, 150, 35.5,   55.4),
        (151, 200, 55.5,  150.4),
        (201, 300, 150.5, 250.4),
        (301, 400, 250.5, 350.4),
        (401, 500, 350.5, 500.4),
    ]

    for aqi_lo, aqi_hi, pm_lo, pm_hi in breakpoints:
        if aqi_subindex <= aqi_hi:
            pm = ((pm_hi - pm_lo) / (aqi_hi - aqi_lo)) * (aqi_subindex - aqi_lo) + pm_lo
            return round(pm, 1)

    return 500.0


def _aqi_to_pm10(aqi_subindex: float) -> float:
    """
    Convert PM10 AQI sub-index back to approximate µg/m³ concentration.
    Inverse of _compute_aqi_from_pm10.
    """
    if aqi_subindex <= 0:
        return 0.0
    breakpoints = [
        (0,  50,    0,   54),
        (51, 100,  55,  154),
        (101, 150, 155, 254),
        (151, 200, 255, 354),
        (201, 300, 355, 424),
        (301, 400, 425, 504),
        (401, 500, 505, 604),
    ]

    for aqi_lo, aqi_hi, pm_lo, pm_hi in breakpoints:
        if aqi_subindex <= aqi_hi:
            pm = ((pm_hi - pm_lo) / (aqi_hi - aqi_lo)) * (aqi_subindex - aqi_lo) + pm_lo
            return round(pm, 1)

    return 604.0


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
