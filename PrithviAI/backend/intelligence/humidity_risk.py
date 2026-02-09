"""
PrithviAI — Humidity-Related Health Risk
Computes health risks from humidity for seniors:
- Joint pain and arthritis flare-ups
- Respiratory discomfort
- Dehydration (low humidity)
- Fungal/bacterial growth risk (high humidity)
"""

from models.schemas import RiskFactor, RiskLevel, AgeGroup


def compute_humidity_risk(
    humidity: float,
    temperature: float,
    age_group: AgeGroup = AgeGroup.ELDERLY,
) -> RiskFactor:
    """
    Compute humidity-related health risk.
    
    Decision Logic:
    - Ideal humidity: 40-60%
    - Low humidity (<30%): Dry skin, dehydration, respiratory irritation
    - High humidity (>70%): Joint pain trigger, breathing difficulty, mold risk
    - Combined high humidity + high temperature = significantly worse
    - Seniors with arthritis are especially affected by humidity changes
    """
    
    # ── Comfort zone boundaries ──
    if age_group == AgeGroup.ELDERLY:
        ideal_low = 40.0
        ideal_high = 55.0  # Narrower for seniors
    else:
        ideal_low = 35.0
        ideal_high = 65.0
    
    # ── Compute Score ──
    if ideal_low <= humidity <= ideal_high:
        # Comfortable zone
        score = 5  # Minimal baseline risk
    elif humidity < ideal_low:
        # Dry conditions
        deficit = ideal_low - humidity
        if deficit <= 10:
            score = 15 + deficit * 1.5  # 15-30
        elif deficit <= 25:
            score = 30 + (deficit - 10) * 2.5  # 30-67
        else:
            score = min(67 + (deficit - 25) * 2, 100)  # 67-100
    else:
        # Humid conditions
        excess = humidity - ideal_high
        if excess <= 10:
            score = 20 + excess * 2  # 20-40
        elif excess <= 25:
            score = 40 + (excess - 10) * 2.5  # 40-77
        else:
            score = min(77 + (excess - 25) * 1.5, 100)  # 77-100
    
    # ── Compound effect: high humidity + high temperature ──
    if humidity > 65 and temperature > 32:
        compound = ((humidity - 65) / 35) * ((temperature - 32) / 10) * 20
        score = min(score + compound, 100)
    
    # ── Joint pain correlation (research-backed) ──
    # Rapid humidity changes and high humidity correlate with arthritis flare-ups
    # We add a small penalty for very high humidity specifically for elderly
    if age_group == AgeGroup.ELDERLY and humidity > 70:
        arthritis_penalty = (humidity - 70) * 0.3
        score = min(score + arthritis_penalty, 100)
    
    score = min(max(score, 0), 100)
    
    # ── Risk Level ──
    if score < 30:
        level = RiskLevel.LOW
    elif score < 60:
        level = RiskLevel.MODERATE
    else:
        level = RiskLevel.HIGH
    
    # ── Human-Readable Output ──
    if humidity < ideal_low:
        if level == RiskLevel.LOW:
            reason = f"Humidity is slightly low at {humidity:.0f}%."
            recommendation = "Stay hydrated. Use moisturizer for dry skin."
            icon = "🟢"
        elif level == RiskLevel.MODERATE:
            reason = f"Dry air at {humidity:.0f}% humidity can cause throat irritation and dry skin."
            recommendation = "Drink extra water. Use a humidifier indoors. Apply moisturizer."
            icon = "🟡"
        else:
            reason = f"Very dry air at {humidity:.0f}% — risk of dehydration and respiratory irritation."
            recommendation = "Use a humidifier. Drink water frequently. Avoid AC on high."
            icon = "🔴"
    elif humidity > ideal_high:
        if level == RiskLevel.LOW:
            reason = f"Humidity is slightly high at {humidity:.0f}%."
            recommendation = "Normal precautions sufficient."
            icon = "🟢"
        elif level == RiskLevel.MODERATE:
            reason = f"High humidity at {humidity:.0f}% may trigger joint pain and breathing discomfort."
            recommendation = "Use a dehumidifier or AC. Light clothing recommended. Avoid heavy exertion."
            icon = "🟡"
        else:
            reason = f"Very high humidity at {humidity:.0f}% — can worsen arthritis, breathing problems, and cause heat exhaustion."
            recommendation = "Stay in air-conditioned spaces. Avoid outdoor activity. Monitor for dizziness."
            icon = "🔴"
    else:
        reason = f"Humidity at {humidity:.0f}% is comfortable."
        recommendation = "No humidity concerns."
        icon = "🟢"
    
    return RiskFactor(
        name="Humidity",
        level=level,
        score=round(score, 1),
        reason=reason,
        recommendation=recommendation,
        icon=icon,
    )
