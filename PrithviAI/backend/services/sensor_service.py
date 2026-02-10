"""
PrithviAI — Sensor Data Service
Handles incoming data from hardware sensors.
Provides data cleaning, validation, and temporal smoothing.
"""

from typing import Optional, List, Dict
from datetime import datetime, timedelta
from collections import deque
from models.schemas import SensorData


class SensorDataManager:
    """
    Manages sensor data ingestion with:
    - Validation (reject out-of-range values)
    - Temporal smoothing (rolling average to reduce noise)
    - Fallback to external API data when sensors unavailable
    """
    
    def __init__(self, window_size: int = 5):
        self.window_size = window_size
        # Rolling windows for each sensor type
        self._buffers: Dict[str, deque] = {
            "pm25": deque(maxlen=window_size),
            "pm10": deque(maxlen=window_size),
            "temperature": deque(maxlen=window_size),
            "humidity": deque(maxlen=window_size),
            "noise_db": deque(maxlen=window_size),
            "water_level": deque(maxlen=window_size),
        }
        self._last_valid: Dict[str, float] = {}
    
    # ── Valid sensor ranges (physical limits + sanity) ──
    VALID_RANGES = {
        "pm25": (0, 1000),        # µg/m³
        "pm10": (0, 1500),        # µg/m³
        "temperature": (-20, 60), # °C (India range)
        "humidity": (0, 100),     # %
        "noise_db": (0, 150),     # dB
        "water_level": (0, 500),  # cm
        "soil_moisture": (0, 100), # %
    }
    
    def validate_reading(self, sensor: str, value: Optional[float]) -> Optional[float]:
        """
        Validate a sensor reading against physical limits.
        Returns None if invalid.
        """
        if value is None:
            return None
        
        low, high = self.VALID_RANGES.get(sensor, (0, float('inf')))
        
        if not (low <= value <= high):
            print(f"[Sensor] Invalid {sensor} reading: {value} (range: {low}-{high})")
            return None
        
        return value
    
    def ingest(self, reading: SensorData) -> SensorData:
        """
        Process a new sensor reading:
        1. Validate each field
        2. Add to rolling buffer
        3. Return smoothed (averaged) values
        """
        validated = SensorData()
        
        for field in ["pm25", "pm10", "temperature", "humidity", "noise_db", "water_level"]:
            raw_value = getattr(reading, field, None)
            valid_value = self.validate_reading(field, raw_value)
            
            if valid_value is not None:
                self._buffers[field].append(valid_value)
                self._last_valid[field] = valid_value
            
            # Compute smoothed value from buffer
            if self._buffers[field]:
                smoothed = sum(self._buffers[field]) / len(self._buffers[field])
                setattr(validated, field, round(smoothed, 2))
            elif field in self._last_valid:
                # Use last known good value
                setattr(validated, field, self._last_valid[field])
        
        return validated
    
    def get_latest_smoothed(self) -> SensorData:
        """Get the latest smoothed sensor data."""
        result = SensorData()
        
        for field in ["pm25", "pm10", "temperature", "humidity", "noise_db", "water_level"]:
            if self._buffers[field]:
                smoothed = sum(self._buffers[field]) / len(self._buffers[field])
                setattr(result, field, round(smoothed, 2))
            elif field in self._last_valid:
                setattr(result, field, self._last_valid[field])
        
        return result
    
    def get_demo_sensor_data(self, lat: float = 18.5204, lon: float = 73.8567) -> SensorData:
        """
        Generate realistic noise estimate based on location characteristics and time.
        Uses time-of-day urban patterns + city-specific zones + population density proxy.
        Works for ANY Indian city, with special accuracy for known zones.
        """
        from datetime import datetime, timezone, timedelta
        import hashlib, math

        # IST time (UTC + 5:30)
        ist = datetime.now(timezone.utc) + timedelta(hours=5, minutes=30)
        hour = ist.hour

        # ── Time-of-day base noise (dB) — urban Indian city pattern ──
        if 0 <= hour < 5:
            time_base = 35.0   # Late night — quiet
        elif 5 <= hour < 7:
            time_base = 45.0   # Early morning — waking up
        elif 7 <= hour < 10:
            time_base = 62.0   # Morning rush hour
        elif 10 <= hour < 13:
            time_base = 55.0   # Late morning
        elif 13 <= hour < 16:
            time_base = 52.0   # Afternoon
        elif 16 <= hour < 20:
            time_base = 65.0   # Evening rush hour
        elif 20 <= hour < 22:
            time_base = 50.0   # Post dinner
        else:
            time_base = 42.0   # Night

        # ── City-level noise adjustment (metros are louder) ──
        # Based on published CPCB noise data for Indian cities
        CITY_NOISE_OFFSETS = {
            # (lat_center, lon_center, radius_deg, base_offset_dB)
            # Delhi NCR — one of the noisiest cities in India
            (28.61, 77.21, 0.3, +8),
            # Mumbai — high density
            (19.08, 72.88, 0.25, +6),
            # Kolkata — dense with traffic
            (22.57, 88.36, 0.2, +5),
            # Chennai
            (13.08, 80.27, 0.2, +3),
            # Bangalore
            (12.97, 77.59, 0.2, +2),
            # Hyderabad
            (17.39, 78.49, 0.2, +2),
            # Pune — moderate
            (18.52, 73.86, 0.2, +0),
        }

        city_adj = 0.0
        for c_lat, c_lon, c_rad, c_offset in CITY_NOISE_OFFSETS:
            dist = math.sqrt((lat - c_lat) ** 2 + (lon - c_lon) ** 2)
            if dist < c_rad:
                influence = 1.0 - (dist / c_rad)
                city_adj = max(city_adj, c_offset * influence)

        # ── Known zone-level adjustments (traffic hubs, quiet parks, etc.) ──
        # Applies only when user zooms into known locations
        NOISE_ZONES = [
            # Pune zones
            (18.531, 73.848, 0.015, +12),   # Shivajinagar junction
            (18.509, 73.926, 0.015, +10),   # Hadapsar traffic
            (18.591, 73.739, 0.012, +8),    # Hinjewadi IT traffic
            (18.530, 73.879, 0.012, +9),    # Pune Station area
            (18.458, 73.804, 0.025, -12),   # Sinhagad foothills
            (18.554, 73.808, 0.015, -8),    # Pashan lake
            (18.537, 73.894, 0.012, -5),    # Koregaon Park
            (18.527, 73.953, 0.020, +8),    # Pimpri-Chinchwad industrial
            (18.633, 73.795, 0.015, +6),    # Bhosari MIDC
            # Delhi zones
            (28.633, 77.220, 0.015, +10),   # Chandni Chowk
            (28.570, 77.250, 0.012, +8),    # ITO junction
            (28.556, 77.100, 0.015, -6),    # Ridge forest
            (28.613, 77.229, 0.012, +12),   # Connaught Place
            (28.653, 77.234, 0.012, +7),    # Old Delhi railway
            # Mumbai zones
            (19.017, 72.831, 0.012, +10),   # Dadar station area
            (19.067, 72.835, 0.010, +9),    # Bandra traffic
            (18.922, 72.835, 0.012, +11),   # CST/Fort area
            (19.126, 72.908, 0.020, -5),    # Sanjay Gandhi National Park
            # Bangalore zones
            (12.977, 77.572, 0.012, +8),    # Majestic bus station
            (12.935, 77.610, 0.012, +6),    # Silk Board junction
            (13.020, 77.570, 0.015, -4),    # Lalbagh
            # Kolkata zones
            (22.572, 88.363, 0.012, +10),   # Howrah bridge area
            (22.550, 88.340, 0.015, +8),    # Esplanade
            # Chennai zones
            (13.082, 80.282, 0.012, +7),    # T Nagar
            (13.107, 80.290, 0.015, +9),    # Central station
        ]

        zone_adj = 0.0
        for z_lat, z_lon, z_rad, z_noise in NOISE_ZONES:
            dist = math.sqrt((lat - z_lat) ** 2 + (lon - z_lon) ** 2)
            if dist < z_rad:
                influence = 1.0 - (dist / z_rad)
                zone_adj += z_noise * influence

        # Small deterministic variance from coordinates (±3 dB)
        coord_hash = int(hashlib.md5(f"{lat:.4f},{lon:.4f}".encode()).hexdigest()[:4], 16)
        micro_noise = ((coord_hash % 60) - 30) / 10.0  # -3 to +3 dB

        noise_db = round(max(25.0, min(95.0, time_base + city_adj + zone_adj + micro_noise)), 1)

        return SensorData(
            noise_db=noise_db,
            water_level=0,
        )


# Singleton instance
sensor_manager = SensorDataManager()
