"""
PrithviAI — Flood / Waterlogging Risk Assessment
Computes fall risk and mobility hazards from waterlogging for seniors.
"""

from models.schemas import RiskFactor, RiskLevel, AgeGroup, ActivityIntent


def compute_flood_risk(
    rainfall: float,
    water_level: float = 0,
    wind_speed: float = 0,
    age_group: AgeGroup = AgeGroup.ELDERLY,
    activity: ActivityIntent = ActivityIntent.WALKING,
) -> RiskFactor:
    """
    Compute flood and waterlogging risk for mobility and safety.
    
    Decision Logic:
    - Rainfall rate is primary indicator
    - Water level sensor provides ground-truth for waterlogging
    - Seniors face much higher fall risk on wet/flooded surfaces
    - Walking and commuting are most affected activities
    - Wind + rain compounds the risk significantly
    """
    
    # ── Rainfall Score ──
    # Light: <2.5 mm/hr, Moderate: 2.5-7.5, Heavy: 7.5-15, Extreme: >15
    if rainfall <= 1:
        rain_score = rainfall * 5  # 0-5
    elif rainfall <= 2.5:
        rain_score = 5 + (rainfall - 1) * 10  # 5-20
    elif rainfall <= 7.5:
        rain_score = 20 + (rainfall - 2.5) * 8  # 20-60
    elif rainfall <= 15:
        rain_score = 60 + (rainfall - 7.5) * 3.3  # 60-85
    else:
        rain_score = min(85 + (rainfall - 15) * 1, 100)  # 85-100
    
    # ── Water Level Score ──
    # 0 cm = dry, >5 cm = ankle level (problematic for elderly)
    # >15 cm = knee level (dangerous for anyone)
    if water_level <= 0:
        water_score = 0
    elif water_level <= 5:
        water_score = water_level * 10  # 0-50
    elif water_level <= 15:
        water_score = 50 + (water_level - 5) * 4  # 50-90
    else:
        water_score = min(90 + (water_level - 15) * 1, 100)  # 90-100
    
    # ── Combined Score ──
    # Use max of the two (either rainfall OR standing water is dangerous)
    # But also add a compound bonus when both are present
    score = max(rain_score, water_score)
    if rain_score > 20 and water_score > 20:
        score = min(score + 10, 100)  # Compound risk
    
    # ── Wind compound effect ──
    if rainfall > 2.5 and wind_speed > 10:
        wind_penalty = min((wind_speed - 10) * 1.5, 15)
        score = min(score + wind_penalty, 100)
    
    # ── Activity modifier ──
    if activity in [ActivityIntent.WALKING, ActivityIntent.COMMUTE]:
        score = min(score * 1.2, 100)  # 20% higher risk for mobility activities
    elif activity == ActivityIntent.REST:
        score = score * 0.6  # Indoors, much lower concern
    
    # ── Senior fall risk bonus ──
    if age_group == AgeGroup.ELDERLY and score > 15:
        score = min(score + 12, 100)  # Seniors have higher fall risk on wet surfaces
    
    score = min(max(score, 0), 100)
    
    # ── Risk Level ──
    if score < 30:
        level = RiskLevel.LOW
    elif score < 60:
        level = RiskLevel.MODERATE
    else:
        level = RiskLevel.HIGH
    
    # ── Human-Readable Output ──
    if level == RiskLevel.LOW:
        if rainfall > 0:
            reason = f"Light rain ({rainfall:.1f} mm/hr) — minimal waterlogging risk."
            recommendation = "Carry an umbrella. Watch your step on wet surfaces."
        else:
            reason = "No rain or waterlogging detected."
            recommendation = "No flood-related concerns."
        icon = "🟢"
    elif level == RiskLevel.MODERATE:
        reason = f"Moderate rain ({rainfall:.1f} mm/hr)"
        if water_level > 0:
            reason += f" with water level at {water_level:.0f} cm"
        reason += " — slippery surfaces and puddles may affect mobility."
        recommendation = "Avoid walking in low-lying areas. Wear non-slip footwear. Use walking aids."
        icon = "🟡"
    else:
        reason = f"Heavy rain ({rainfall:.1f} mm/hr)"
        if water_level > 0:
            reason += f" with waterlogging at {water_level:.0f} cm"
        reason += " — high fall risk and mobility hazard for seniors."
        recommendation = "Do not go outside. Risk of falls, injuries, and waterborne infections. Wait for water to recede."
        icon = "🔴"
    
    return RiskFactor(
        name="Flood / Waterlogging",
        level=level,
        score=round(score, 1),
        reason=reason,
        recommendation=recommendation,
        icon=icon,
    )
