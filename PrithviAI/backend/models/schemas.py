"""
PrithviAI — Pydantic Schemas
Defines all request/response models for type safety and validation.
"""

from pydantic import BaseModel, Field
from typing import Optional, List
from datetime import datetime
from enum import Enum


# ─── Enums ───────────────────────────────────────────────

class RiskLevel(str, Enum):
    LOW = "LOW"
    MODERATE = "MODERATE"
    HIGH = "HIGH"


class AgeGroup(str, Enum):
    ELDERLY = "elderly"
    ADULT = "adult"


class ActivityIntent(str, Enum):
    WALKING = "walking"
    OUTDOOR_WORK = "outdoor_work"
    REST = "rest"
    EXERCISE = "exercise"
    COMMUTE = "commute"


class Language(str, Enum):
    ENGLISH = "en"
    HINDI = "hi"
    MARATHI = "mr"


# ─── Sensor Data ─────────────────────────────────────────

class SensorData(BaseModel):
    """Raw sensor readings from hardware."""
    pm25: Optional[float] = Field(None, description="PM2.5 in µg/m³")
    pm10: Optional[float] = Field(None, description="PM10 in µg/m³")
    temperature: Optional[float] = Field(None, description="Temperature in °C")
    humidity: Optional[float] = Field(None, description="Relative humidity %")
    noise_db: Optional[float] = Field(None, description="Ambient noise in dB")
    water_level: Optional[float] = Field(None, description="Water level in cm")
    soil_moisture: Optional[float] = Field(None, description="Soil moisture %")


# ─── Environment Data ────────────────────────────────────

class EnvironmentData(BaseModel):
    """Combined environmental data from all sources."""
    pm25: float = Field(0, description="PM2.5 in µg/m³")
    pm10: float = Field(0, description="PM10 in µg/m³")
    aqi: int = Field(0, description="Air Quality Index")
    temperature: float = Field(0, description="Temperature in °C")
    feels_like: float = Field(0, description="Feels-like temperature °C")
    humidity: float = Field(0, description="Relative humidity %")
    wind_speed: float = Field(0, description="Wind speed m/s")
    rainfall: float = Field(0, description="Rainfall mm/hr")
    uv_index: float = Field(0, description="UV Index")
    noise_db: float = Field(0, description="Ambient noise in dB")
    water_level: float = Field(0, description="Water level in cm")
    visibility: float = Field(0, description="Visibility in km")
    weather_desc: str = Field("", description="Weather description")
    timestamp: datetime = Field(default_factory=datetime.utcnow)


# ─── Individual Risk Assessments ─────────────────────────

class RiskFactor(BaseModel):
    """Individual risk factor assessment."""
    name: str
    level: RiskLevel
    score: float = Field(ge=0, le=100, description="Risk score 0-100")
    reason: str
    recommendation: str
    icon: str = ""


# ─── Safety Index ────────────────────────────────────────

class SafetyIndex(BaseModel):
    """Senior Environmental Safety Index — the core output."""
    overall_level: RiskLevel
    overall_score: float = Field(ge=0, le=100)
    top_risks: List[RiskFactor]
    all_risks: List[RiskFactor]
    summary: str
    recommendations: List[str]
    timestamp: datetime = Field(default_factory=datetime.utcnow)


# ─── Forecast ────────────────────────────────────────────

class ForecastPoint(BaseModel):
    """Single forecast time point."""
    time: datetime
    predicted_level: RiskLevel
    predicted_score: float
    key_concern: str


class Forecast(BaseModel):
    """24-48 hour environmental forecast."""
    points: List[ForecastPoint]
    early_warnings: List[str]


# ─── Request Models ──────────────────────────────────────

class RiskAssessmentRequest(BaseModel):
    """User request for risk assessment."""
    latitude: float = Field(default=18.5204)
    longitude: float = Field(default=73.8567)
    city: str = Field(default="Pune")
    age_group: AgeGroup = Field(default=AgeGroup.ELDERLY)
    activity: ActivityIntent = Field(default=ActivityIntent.WALKING)
    language: Language = Field(default=Language.ENGLISH)
    sensor_data: Optional[SensorData] = None


class ChatRequest(BaseModel):
    """User chat message."""
    message: str
    latitude: float = Field(default=18.5204)
    longitude: float = Field(default=73.8567)
    city: str = Field(default="Pune")
    age_group: AgeGroup = Field(default=AgeGroup.ELDERLY)
    language: Language = Field(default=Language.ENGLISH)
    session_id: Optional[str] = None


# ─── Response Models ─────────────────────────────────────

class ChatResponse(BaseModel):
    """AI chat response."""
    reply: str
    risk_level: RiskLevel
    safety_index: Optional[SafetyIndex] = None
    session_id: str


class DailySummary(BaseModel):
    """Daily environmental safety summary for seniors."""
    date: str
    location: str
    safety_index: SafetyIndex
    forecast: Forecast
    morning_advice: str
    afternoon_advice: str
    evening_advice: str


class HealthAlert(BaseModel):
    """Proactive health alert."""
    alert_type: str
    severity: RiskLevel
    title: str
    message: str
    action: str
    icon: str
    timestamp: datetime = Field(default_factory=datetime.utcnow)
