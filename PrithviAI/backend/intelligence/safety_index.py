"""
PrithviAI — Senior Environmental Safety Index
Aggregates all individual risk factors into a single, actionable safety score.
This is the core output of the platform.
"""

from typing import List
from models.schemas import (
    RiskFactor, RiskLevel, SafetyIndex, AgeGroup, ActivityIntent
)


# ── Risk weights for aggregation ──
# These weights reflect the relative importance of each risk factor
# for senior safety. Thermal and Air Quality are weighted highest
# because they cause the most acute health events in elderly.
RISK_WEIGHTS = {
    "Air Quality": 0.25,
    "Thermal Comfort": 0.25,
    "Humidity": 0.15,
    "UV Exposure": 0.12,
    "Flood / Waterlogging": 0.13,
    "Noise Pollution": 0.10,
}


def compute_safety_index(
    risk_factors: List[RiskFactor],
    age_group: AgeGroup = AgeGroup.ELDERLY,
    activity: ActivityIntent = ActivityIntent.WALKING,
) -> SafetyIndex:
    """
    Aggregate individual risk factors into a Senior Environmental Safety Index.
    
    Aggregation Logic:
    1. Weighted average of all risk scores
    2. Boost score if any single factor is HIGH (domination rule)
    3. Compound penalty when multiple risks are MODERATE+
    4. Identify top 2 contributing factors
    5. Generate summary and recommendations
    """
    
    if not risk_factors:
        return SafetyIndex(
            overall_level=RiskLevel.LOW,
            overall_score=0,
            top_risks=[],
            all_risks=[],
            summary="No environmental data available.",
            recommendations=["Check back later for updated conditions."],
        )
    
    # ── Step 1: Weighted Average ──
    total_weight = 0
    weighted_score = 0
    
    for rf in risk_factors:
        weight = RISK_WEIGHTS.get(rf.name, 0.10)
        weighted_score += rf.score * weight
        total_weight += weight
    
    if total_weight > 0:
        avg_score = weighted_score / total_weight
    else:
        avg_score = sum(rf.score for rf in risk_factors) / len(risk_factors)
    
    # ── Step 2: Domination Rule ──
    # If any single risk is HIGH (score > 60), the overall cannot be LOW
    high_risks = [rf for rf in risk_factors if rf.level == RiskLevel.HIGH]
    if high_risks:
        max_high = max(rf.score for rf in high_risks)
        # Pull the average toward the max high risk
        avg_score = max(avg_score, max_high * 0.7)
    
    # ── Step 3: Compound Penalty ──
    # Multiple moderate+ risks compound the danger
    moderate_plus = [rf for rf in risk_factors if rf.score >= 35]
    if len(moderate_plus) >= 3:
        compound_bonus = len(moderate_plus) * 3
        avg_score = min(avg_score + compound_bonus, 100)
    
    # ── Step 4: Senior Adjustment ──
    if age_group == AgeGroup.ELDERLY:
        avg_score = min(avg_score * 1.08, 100)  # 8% uplift for seniors
    
    overall_score = round(min(max(avg_score, 0), 100), 1)
    
    # ── Step 5: Determine Overall Level ──
    if overall_score < 30:
        overall_level = RiskLevel.LOW
    elif overall_score < 60:
        overall_level = RiskLevel.MODERATE
    else:
        overall_level = RiskLevel.HIGH
    
    # ── Step 6: Identify Top 2 Contributing Risks ──
    sorted_risks = sorted(risk_factors, key=lambda r: r.score, reverse=True)
    top_risks = sorted_risks[:2]
    
    # ── Step 7: Generate Summary ──
    summary = _generate_summary(overall_level, top_risks, age_group, activity)
    recommendations = _generate_recommendations(overall_level, top_risks, activity)
    
    return SafetyIndex(
        overall_level=overall_level,
        overall_score=overall_score,
        top_risks=top_risks,
        all_risks=risk_factors,
        summary=summary,
        recommendations=recommendations,
    )


def _generate_summary(
    level: RiskLevel,
    top_risks: List[RiskFactor],
    age_group: AgeGroup,
    activity: ActivityIntent,
) -> str:
    """Generate a human-readable summary sentence."""
    
    target = "seniors" if age_group == AgeGroup.ELDERLY else "adults"
    activity_text = {
        ActivityIntent.WALKING: "going for a walk",
        ActivityIntent.OUTDOOR_WORK: "outdoor work",
        ActivityIntent.EXERCISE: "exercising outdoors",
        ActivityIntent.COMMUTE: "commuting",
        ActivityIntent.REST: "staying home",
    }.get(activity, "outdoor activity")
    
    if level == RiskLevel.LOW:
        summary = f"Conditions are safe for {target} for {activity_text} today."
        if top_risks:
            summary += f" Minor note: {top_risks[0].name.lower()} is the only slight concern."
    elif level == RiskLevel.MODERATE:
        concerns = " and ".join(r.name.lower() for r in top_risks)
        summary = (
            f"Moderate caution needed for {target}. "
            f"Main concerns: {concerns}. "
            f"Short outdoor activities are okay with precautions."
        )
    else:
        concerns = " and ".join(r.name.lower() for r in top_risks)
        summary = (
            f"High risk for {target} today due to {concerns}. "
            f"It is strongly recommended to avoid {activity_text} unless necessary."
        )
    
    return summary


def _generate_recommendations(
    level: RiskLevel,
    top_risks: List[RiskFactor],
    activity: ActivityIntent,
) -> List[str]:
    """Generate top actionable recommendations."""
    
    recs = []
    
    # Include recommendations from top risk factors
    for rf in top_risks:
        recs.append(rf.recommendation)
    
    # Add general recommendations based on overall level
    if level == RiskLevel.LOW:
        recs.append("Stay hydrated and enjoy your day.")
    elif level == RiskLevel.MODERATE:
        recs.append("Keep a phone charged and nearby in case of emergency.")
        recs.append("Inform a family member if heading out.")
    else:
        recs.append("Stay indoors if possible.")
        recs.append("Keep emergency contacts accessible.")
        recs.append("Monitor for any symptoms like dizziness, breathlessness, or chest pain.")
    
    return recs
