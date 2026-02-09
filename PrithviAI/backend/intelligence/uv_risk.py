"""
PrithviAI — UV Exposure Risk Assessment
Computes UV radiation risk for skin and overall health of seniors.
"""

from models.schemas import RiskFactor, RiskLevel, AgeGroup, ActivityIntent


def compute_uv_risk(
    uv_index: float,
    age_group: AgeGroup = AgeGroup.ELDERLY,
    activity: ActivityIntent = ActivityIntent.WALKING,
) -> RiskFactor:
    """
    Compute UV exposure risk.
    
    Decision Logic:
    - UV Index: 0-2 Low, 3-5 Moderate, 6-7 High, 8-10 Very High, 11+ Extreme
    - Seniors have thinner skin — more susceptible to UV damage
    - Outdoor activities increase exposure duration
    - Even moderate UV can be harmful with prolonged exposure for elderly
    """
    
    # ── Activity exposure multiplier ──
    activity_exposure = {
        ActivityIntent.REST: 0.3,        # Minimal outdoor exposure
        ActivityIntent.COMMUTE: 0.6,     # Brief outdoor exposure
        ActivityIntent.WALKING: 1.0,     # Standard outdoor exposure
        ActivityIntent.OUTDOOR_WORK: 1.4, # Extended exposure
        ActivityIntent.EXERCISE: 1.2,    # Moderate-extended exposure
    }
    exposure = activity_exposure.get(activity, 1.0)
    
    # ── Effective UV (adjusted for age and activity) ──
    age_sensitivity = 1.3 if age_group == AgeGroup.ELDERLY else 1.0
    effective_uv = uv_index * exposure * age_sensitivity
    
    # ── Compute Score ──
    if effective_uv <= 2:
        score = effective_uv * 7.5  # 0-15
    elif effective_uv <= 5:
        score = 15 + (effective_uv - 2) * 10  # 15-45
    elif effective_uv <= 7:
        score = 45 + (effective_uv - 5) * 12.5  # 45-70
    elif effective_uv <= 10:
        score = 70 + (effective_uv - 7) * 8  # 70-94
    else:
        score = min(94 + (effective_uv - 10) * 2, 100)  # 94-100
    
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
        reason = f"UV index is low at {uv_index:.1f}."
        recommendation = "Minimal sun protection needed. Sunglasses recommended."
        icon = "🟢"
    elif level == RiskLevel.MODERATE:
        reason = f"UV index is {uv_index:.1f} — moderate risk of skin damage with prolonged exposure."
        recommendation = "Apply sunscreen (SPF 30+). Wear a hat and long sleeves. Seek shade during peak hours."
        icon = "🟡"
    else:
        reason = f"UV index is high at {uv_index:.1f} — seniors are at risk of sunburn and heat-related fatigue."
        recommendation = "Avoid going outside between 10 AM–4 PM. Use strong sunscreen, hat, and protective clothing."
        icon = "🔴"
    
    return RiskFactor(
        name="UV Exposure",
        level=level,
        score=round(score, 1),
        reason=reason,
        recommendation=recommendation,
        icon=icon,
    )
