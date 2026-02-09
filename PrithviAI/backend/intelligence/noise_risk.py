"""
PrithviAI — Noise Pollution Risk Assessment
Computes noise impact on elderly health and sleep quality.
"""

from models.schemas import RiskFactor, RiskLevel, AgeGroup, ActivityIntent


def compute_noise_risk(
    noise_db: float,
    age_group: AgeGroup = AgeGroup.ELDERLY,
    activity: ActivityIntent = ActivityIntent.REST,
) -> RiskFactor:
    """
    Compute noise pollution risk for health and sleep.
    
    Decision Logic:
    - WHO recommends <55 dB for outdoor residential areas
    - Night-time threshold: 40 dB for sleep quality
    - Seniors are more sensitive to noise-induced stress
    - Continuous noise above 70 dB increases cardiovascular risk
    - Activity context matters: rest/sleep needs quiet vs. commute can tolerate more
    """
    
    # ── Context-adjusted thresholds ──
    if activity == ActivityIntent.REST:
        # Resting / sleeping — very noise sensitive
        threshold_safe = 40 if age_group == AgeGroup.ELDERLY else 45
        threshold_moderate = 55
        threshold_high = 70
    else:
        # Active / outdoors — slightly more tolerant
        threshold_safe = 55 if age_group == AgeGroup.ELDERLY else 60
        threshold_moderate = 70
        threshold_high = 85
    
    # ── Compute Score ──
    if noise_db <= threshold_safe:
        score = noise_db / threshold_safe * 15  # 0-15
    elif noise_db <= threshold_moderate:
        ratio = (noise_db - threshold_safe) / (threshold_moderate - threshold_safe)
        score = 15 + ratio * 35  # 15-50
    elif noise_db <= threshold_high:
        ratio = (noise_db - threshold_moderate) / (threshold_high - threshold_moderate)
        score = 50 + ratio * 30  # 50-80
    else:
        score = min(80 + (noise_db - threshold_high) * 1.5, 100)  # 80-100
    
    # ── Senior sensitivity bonus ──
    if age_group == AgeGroup.ELDERLY and noise_db > 50:
        score = min(score + 8, 100)  # Elderly are more stressed by noise
    
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
        reason = f"Noise level is safe at {noise_db:.0f} dB."
        recommendation = "Environment is quiet enough for rest and outdoor activities."
        icon = "🟢"
    elif level == RiskLevel.MODERATE:
        reason = f"Noise is elevated at {noise_db:.0f} dB — may cause stress and disturb rest."
        recommendation = "Use earplugs if resting. Avoid prolonged exposure in noisy areas."
        icon = "🟡"
    else:
        reason = f"Noise level is high at {noise_db:.0f} dB — can cause hearing stress, increased blood pressure, and sleep disruption."
        recommendation = "Move to a quieter area. Close windows. Use noise-cancelling methods."
        icon = "🔴"
    
    return RiskFactor(
        name="Noise Pollution",
        level=level,
        score=round(score, 1),
        reason=reason,
        recommendation=recommendation,
        icon=icon,
    )
