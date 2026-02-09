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
    
    def get_demo_sensor_data(self, lat: float = 19.076, lon: float = 72.878) -> SensorData:
        """
        Generate realistic noise estimate based on location characteristics and time.
        Models: traffic corridors, residential vs commercial, time-of-day patterns.
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

        # ── Location-based adjustment ──
        # Known noisy/quiet zones (lat, lon, radius_deg, noise_offset_dB)
        NOISE_ZONES = [
            # Traffic hubs — louder
            (18.531, 73.848, 0.015, +12),   # Shivajinagar junction
            (18.509, 73.926, 0.015, +10),   # Hadapsar traffic
            (18.591, 73.739, 0.012, +8),    # Hinjewadi IT traffic
            (18.530, 73.879, 0.012, +9),    # Pune Station area
            # Quiet / green zones
            (18.458, 73.804, 0.025, -12),   # Sinhagad foothills
            (18.554, 73.808, 0.015, -8),    # Pashan lake
            (18.537, 73.894, 0.012, -5),    # Koregaon Park
            # Industrial
            (18.527, 73.953, 0.020, +8),    # Pimpri-Chinchwad industrial
            (18.633, 73.795, 0.015, +6),    # Bhosari MIDC
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

        noise_db = round(max(25.0, min(90.0, time_base + zone_adj + micro_noise)), 1)

        return SensorData(
            noise_db=noise_db,
            water_level=0,
        )


# Singleton instance
sensor_manager = SensorDataManager()
