"""
PrithviAI — Risk Intelligence Engine
Central orchestrator that collects all data and computes the full risk profile.
"""
  
from typing import Optional
from models.schemas import (
    EnvironmentData, SafetyIndex, RiskFactor, AgeGroup,
    ActivityIntent, SensorData, Forecast, ForecastPoint,
    RiskLevel, DailySummary, HealthAlert,
)
from intelligence.air_quality_risk import compute_air_quality_risk
from intelligence.thermal_risk import compute_thermal_risk
from intelligence.humidity_risk import compute_humidity_risk
from intelligence.noise_risk import compute_noise_risk
from intelligence.flood_risk import compute_flood_risk
from intelligence.uv_risk import compute_uv_risk
from intelligence.safety_index import compute_safety_index
from intelligence.forecasting import generate_forecast
from datetime import datetime, timedelta
from typing import List


class RiskEngine:
    """
    Central risk intelligence engine.
    Orchestrates data collection, risk computation, and output generation.
    """

    def compute_all_risks(
        self,
        env_data: EnvironmentData,
        age_group: AgeGroup = AgeGroup.ELDERLY,
        activity: ActivityIntent = ActivityIntent.WALKING,
    ) -> SafetyIndex:
        """
        Compute all risk factors and aggregate into a Safety Index.
        This is the main entry point for risk assessment.
        """
        
        risk_factors: List[RiskFactor] = []
        
        # 1. Air Quality Risk
        aqi_risk = compute_air_quality_risk(
            pm25=env_data.pm25,
            pm10=env_data.pm10,
            aqi=env_data.aqi,
            age_group=age_group,
            activity=activity,
        )
        risk_factors.append(aqi_risk)
        
        # 2. Thermal Comfort Risk
        thermal_risk = compute_thermal_risk(
            temperature=env_data.temperature,
            humidity=env_data.humidity,
            feels_like=env_data.feels_like,
            wind_speed=env_data.wind_speed,
            age_group=age_group,
            activity=activity,
        )
        risk_factors.append(thermal_risk)
        
        # 3. Humidity Risk
        hum_risk = compute_humidity_risk(
            humidity=env_data.humidity,
            temperature=env_data.temperature,
            age_group=age_group,
        )
        risk_factors.append(hum_risk)
        
        # 4. UV Exposure Risk
        uv_risk = compute_uv_risk(
            uv_index=env_data.uv_index,
            age_group=age_group,
            activity=activity,
        )
        risk_factors.append(uv_risk)
        
        # 5. Flood / Waterlogging Risk
        fl_risk = compute_flood_risk(
            rainfall=env_data.rainfall,
            water_level=env_data.water_level,
            wind_speed=env_data.wind_speed,
            age_group=age_group,
            activity=activity,
        )
        risk_factors.append(fl_risk)
        
        # 6. Noise Pollution Risk
        noise_risk_val = compute_noise_risk(
            noise_db=env_data.noise_db,
            age_group=age_group,
            activity=activity,
        )
        risk_factors.append(noise_risk_val)
        
        # Aggregate into Safety Index
        safety_index = compute_safety_index(
            risk_factors=risk_factors,
            age_group=age_group,
            activity=activity,
        )
        
        return safety_index

    def generate_daily_summary(
        self,
        env_data: EnvironmentData,
        forecast_data: List[EnvironmentData],
        city: str,
        age_group: AgeGroup = AgeGroup.ELDERLY,
    ) -> DailySummary:
        """Generate a full day summary with morning/afternoon/evening advice."""
        
        # Compute current safety index
        safety_index = self.compute_all_risks(env_data, age_group)
        
        # Generate forecast
        forecast = generate_forecast(forecast_data, age_group)
        
        # Time-specific advice
        morning_advice = self._time_advice(env_data, age_group, "morning")
        afternoon_advice = self._time_advice(env_data, age_group, "afternoon")
        evening_advice = self._time_advice(env_data, age_group, "evening")
        
        return DailySummary(
            date=datetime.utcnow().strftime("%Y-%m-%d"),
            location=city,
            safety_index=safety_index,
            forecast=forecast,
            morning_advice=morning_advice,
            afternoon_advice=afternoon_advice,
            evening_advice=evening_advice,
        )

    def generate_alerts(
        self,
        safety_index: SafetyIndex,
        age_group: AgeGroup = AgeGroup.ELDERLY,
    ) -> List[HealthAlert]:
        """Generate proactive health alerts based on risk assessment."""
        
        alerts = []
        
        for risk in safety_index.all_risks:
            if risk.level == RiskLevel.HIGH:
                alerts.append(HealthAlert(
                    alert_type=risk.name,
                    severity=RiskLevel.HIGH,
                    title=f"⚠️ {risk.name} Alert",
                    message=risk.reason,
                    action=risk.recommendation,
                    icon=risk.icon,
                ))
            elif risk.level == RiskLevel.MODERATE and risk.score > 50:
                alerts.append(HealthAlert(
                    alert_type=risk.name,
                    severity=RiskLevel.MODERATE,
                    title=f"🔔 {risk.name} Advisory",
                    message=risk.reason,
                    action=risk.recommendation,
                    icon=risk.icon,
                ))
        
        return alerts

    def _time_advice(
        self,
        env_data: EnvironmentData,
        age_group: AgeGroup,
        time_of_day: str,
    ) -> str:
        """Generate time-specific advice."""
        
        if time_of_day == "morning":
            if env_data.temperature < 28 and env_data.aqi < 100:
                return "Morning is the best time for a short walk. Air quality is usually better before traffic builds up. Go before 9 AM."
            elif env_data.aqi >= 100:
                return "Air quality is poor this morning. If possible, wait for conditions to improve or stay indoors."
            else:
                return "Morning may be warm. Go out only if necessary and stay hydrated."
        
        elif time_of_day == "afternoon":
            if env_data.temperature > 35:
                return "Afternoon will be very hot. Stay indoors between 12 PM–4 PM. Use fans or AC."
            elif env_data.uv_index > 5:
                return "UV is high in the afternoon. Avoid sun exposure. If you must go out, use sunscreen and a hat."
            else:
                return "Afternoon conditions are manageable. Take breaks if outdoors."
        
        else:  # evening
            if env_data.noise_db > 60:
                return "Evening noise levels are elevated. Close windows before sleeping. Use earplugs if needed."
            elif env_data.temperature < 20:
                return "Evening will be cool. Wear warm clothes and use a blanket while sleeping."
            else:
                return "Evening conditions are comfortable. A light walk after sunset can be beneficial."


# Singleton instance
risk_engine = RiskEngine()
