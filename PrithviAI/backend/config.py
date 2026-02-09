"""
PrithviAI — Configuration Module
Loads environment variables and defines app-wide settings.
"""

import os
from pydantic_settings import BaseSettings
from dotenv import load_dotenv

load_dotenv()


class Settings(BaseSettings):
    """Application configuration loaded from environment variables."""

    # --- Application ---
    APP_NAME: str = "Prithvi"
    APP_VERSION: str = "1.0.0"
    DEBUG: bool = True

    # --- External API Keys (ALL FREE TIERS) ---
    OPENWEATHER_API_KEY: str = os.getenv("OPENWEATHER_API_KEY", "")  # Free: 1000 calls/day
    AQICN_API_KEY: str = os.getenv("AQICN_API_KEY", "")              # Free: 1000 calls/day
    GEMINI_API_KEY: str = os.getenv("GEMINI_API_KEY", "")             # Free: 15 RPM, 1500 RPD

    # --- Database ---
    # JSON file-based storage (zero-cost, no external DB needed)
    DATA_DIR: str = os.getenv("DATA_DIR", "data")

    # --- Defaults ---
    DEFAULT_CITY: str = "Pune"
    DEFAULT_LAT: float = 18.5204
    DEFAULT_LON: float = 73.8567
    DEFAULT_LANGUAGE: str = "en"

    # --- Risk Thresholds (Senior-focused) ---
    # Air Quality Index thresholds (PM2.5 based)
    AQI_LOW: int = 50
    AQI_MODERATE: int = 100
    AQI_HIGH: int = 150

    # Temperature thresholds in Celsius
    TEMP_COMFORTABLE_LOW: float = 20.0
    TEMP_COMFORTABLE_HIGH: float = 32.0
    TEMP_DANGER_HIGH: float = 40.0
    TEMP_DANGER_LOW: float = 10.0

    # Humidity thresholds (%)
    HUMIDITY_COMFORTABLE_LOW: float = 30.0
    HUMIDITY_COMFORTABLE_HIGH: float = 60.0
    HUMIDITY_HIGH: float = 80.0

    # Noise thresholds in dB
    NOISE_SAFE: float = 55.0
    NOISE_MODERATE: float = 70.0
    NOISE_DANGEROUS: float = 85.0

    # UV Index thresholds
    UV_LOW: float = 2.0
    UV_MODERATE: float = 5.0
    UV_HIGH: float = 7.0
    UV_EXTREME: float = 10.0

    # Rainfall threshold for flood risk (mm/hr)
    RAIN_LOW: float = 2.5
    RAIN_MODERATE: float = 7.5
    RAIN_HEAVY: float = 15.0

    class Config:
        env_file = ".env"


settings = Settings()
