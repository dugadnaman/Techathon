"""
PrithviAI — Backend Test Suite
Quick smoke tests for all major modules.
Run with: python -m pytest tests/ -v
"""

import sys
import os
sys.path.insert(0, os.path.join(os.path.dirname(__file__), '..'))

from models.schemas import (
    RiskLevel, AgeGroup, ActivityIntent, EnvironmentData, SensorData
)
from intelligence.air_quality_risk import compute_air_quality_risk
from intelligence.thermal_risk import compute_thermal_risk
from intelligence.humidity_risk import compute_humidity_risk
from intelligence.noise_risk import compute_noise_risk
from intelligence.flood_risk import compute_flood_risk
from intelligence.uv_risk import compute_uv_risk
from intelligence.safety_index import compute_safety_index
from intelligence.risk_engine import risk_engine
from services.sensor_service import SensorDataManager


def test_air_quality_low():
    """Good air quality should return LOW risk."""
    result = compute_air_quality_risk(pm25=15, pm10=30, aqi=40)
    assert result.level == RiskLevel.LOW
    assert result.score < 30


def test_air_quality_high():
    """Very poor air quality should return HIGH risk."""
    result = compute_air_quality_risk(pm25=200, pm10=300, aqi=350, age_group=AgeGroup.ELDERLY)
    assert result.level == RiskLevel.HIGH
    assert result.score > 60


def test_thermal_comfortable():
    """Comfortable temperature should return LOW risk."""
    result = compute_thermal_risk(temperature=26, humidity=50, feels_like=26)
    assert result.level == RiskLevel.LOW


def test_thermal_heat_stress():
    """Very hot conditions should return HIGH risk for seniors."""
    result = compute_thermal_risk(
        temperature=42, humidity=70, feels_like=48, age_group=AgeGroup.ELDERLY
    )
    assert result.level == RiskLevel.HIGH


def test_humidity_moderate():
    """High humidity should flag moderate risk for seniors."""
    result = compute_humidity_risk(humidity=78, temperature=33, age_group=AgeGroup.ELDERLY)
    assert result.level in [RiskLevel.MODERATE, RiskLevel.HIGH]


def test_noise_safe():
    """Quiet environment should return LOW risk."""
    result = compute_noise_risk(noise_db=35)
    assert result.level == RiskLevel.LOW


def test_noise_dangerous():
    """Very loud environment should return HIGH risk."""
    result = compute_noise_risk(noise_db=90, age_group=AgeGroup.ELDERLY)
    assert result.level == RiskLevel.HIGH


def test_flood_no_rain():
    """No rain should return LOW risk."""
    result = compute_flood_risk(rainfall=0, water_level=0)
    assert result.level == RiskLevel.LOW


def test_flood_heavy_rain():
    """Heavy rain should be dangerous for seniors."""
    result = compute_flood_risk(
        rainfall=20, water_level=10, age_group=AgeGroup.ELDERLY,
        activity=ActivityIntent.WALKING
    )
    assert result.level == RiskLevel.HIGH


def test_uv_low():
    """Low UV should return LOW risk."""
    result = compute_uv_risk(uv_index=1.5)
    assert result.level == RiskLevel.LOW


def test_uv_high():
    """Very high UV should return HIGH risk."""
    result = compute_uv_risk(uv_index=10, age_group=AgeGroup.ELDERLY, activity=ActivityIntent.OUTDOOR_WORK)
    assert result.level == RiskLevel.HIGH


def test_safety_index_aggregation():
    """Safety index should correctly aggregate multiple risk factors."""
    env = EnvironmentData(
        pm25=80, pm10=120, aqi=160,
        temperature=37, feels_like=40, humidity=75,
        wind_speed=3, rainfall=0, uv_index=8,
        noise_db=55, water_level=0,
    )
    result = risk_engine.compute_all_risks(env, AgeGroup.ELDERLY, ActivityIntent.WALKING)
    
    assert result.overall_score > 0
    assert result.overall_level in [RiskLevel.LOW, RiskLevel.MODERATE, RiskLevel.HIGH]
    assert len(result.all_risks) == 6
    assert len(result.top_risks) == 2
    assert len(result.recommendations) > 0


def test_sensor_validation():
    """Sensor manager should reject invalid readings."""
    mgr = SensorDataManager()
    
    # Valid reading
    assert mgr.validate_reading("pm25", 50) == 50
    assert mgr.validate_reading("temperature", 30) == 30
    
    # Invalid readings
    assert mgr.validate_reading("pm25", -10) is None
    assert mgr.validate_reading("pm25", 5000) is None
    assert mgr.validate_reading("humidity", 150) is None


def test_sensor_smoothing():
    """Sensor manager should smooth noisy readings."""
    mgr = SensorDataManager(window_size=3)
    
    mgr.ingest(SensorData(pm25=50, temperature=30))
    mgr.ingest(SensorData(pm25=55, temperature=31))
    mgr.ingest(SensorData(pm25=45, temperature=29))
    
    latest = mgr.get_latest_smoothed()
    assert latest.pm25 is not None
    assert 45 <= latest.pm25 <= 55  # Should be averaged


if __name__ == "__main__":
    # Run all tests
    test_fns = [v for k, v in globals().items() if k.startswith("test_")]
    passed = 0
    failed = 0
    
    for fn in test_fns:
        try:
            fn()
            print(f"  ✅ {fn.__name__}")
            passed += 1
        except AssertionError as e:
            print(f"  ❌ {fn.__name__}: {e}")
            failed += 1
        except Exception as e:
            print(f"  ❌ {fn.__name__}: {type(e).__name__}: {e}")
            failed += 1
    
    print(f"\n{'='*40}")
    print(f"Results: {passed} passed, {failed} failed, {passed + failed} total")
