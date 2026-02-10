"""
PrithviAI — Data Freshness & Confidence Engine
Tracks how recent environmental data is, estimates confidence in guidance,
and provides human-readable labels for the UI.
"""

from datetime import datetime, timedelta
from typing import List, Optional
from enum import Enum


# ─── Freshness ───────────────────────────────────────────

class FreshnessStatus(str, Enum):
    FRESH = "Fresh"
    SLIGHTLY_STALE = "Slightly Stale"
    STALE = "Stale"


def get_freshness_status(timestamp: Optional[datetime]) -> dict:
    """
    Compute how fresh a data point is.

    Returns:
        {
          "freshness_label": "Fresh" | "Slightly Stale" | "Stale",
          "freshness_minutes": int,
          "timestamp_iso": str
        }
    """
    if timestamp is None:
        return {
            "freshness_label": FreshnessStatus.STALE.value,
            "freshness_minutes": 999,
            "timestamp_iso": None,
        }

    now = datetime.utcnow()
    age = now - timestamp
    minutes = max(0, int(age.total_seconds() / 60))

    if minutes <= 30:
        label = FreshnessStatus.FRESH
    elif minutes <= 120:
        label = FreshnessStatus.SLIGHTLY_STALE
    else:
        label = FreshnessStatus.STALE

    return {
        "freshness_label": label.value,
        "freshness_minutes": minutes,
        "timestamp_iso": timestamp.isoformat() + "Z",
    }


# ─── Confidence ──────────────────────────────────────────

class ConfidenceLevel(str, Enum):
    HIGH = "HIGH"
    MEDIUM = "MEDIUM"
    LOW = "LOW"


def calculate_confidence_score(data_context: dict) -> dict:
    """
    Calculate a confidence score (0–100) reflecting how trustworthy
    the current environmental guidance is.

    data_context keys (all optional, sensible defaults assumed):
        - data_age_minutes: int      — age of the core data in minutes
        - is_forecast_based: bool    — True if value came from forecast, not observation
        - precision: str             — "pinned" | "city-level" | "fallback"
        - missing_metrics: list[str] — names of metrics that couldn't be fetched
        - is_cached: bool            — True if cached/fallback data was used
        - api_errors: list[str]      — names of APIs that errored

    Returns:
        {
          "confidence_score": int,
          "confidence_level": "HIGH" | "MEDIUM" | "LOW",
          "confidence_reasons": [str, ...]
        }
    """
    score = 100
    reasons: List[str] = []

    # ── Data age penalty ──
    age = data_context.get("data_age_minutes", 0)
    if age > 120:
        score -= 30
        reasons.append("Data is over 2 hours old")
    elif age > 60:
        score -= 20
        reasons.append("Data is over 1 hour old")

    # ── Forecast-based penalty ──
    if data_context.get("is_forecast_based", False):
        score -= 15
        reasons.append("Based on forecast, not live observation")

    # ── Location precision penalty ──
    precision = data_context.get("precision", "city-level")
    if precision == "fallback":
        score -= 20
        reasons.append("Using fallback location data")
    elif precision == "city-level":
        score -= 15
        reasons.append("City-level data (not exact pin)")

    # ── Missing metrics penalty (−10 per metric, max −30) ──
    missing = data_context.get("missing_metrics", [])
    if missing:
        penalty = min(30, len(missing) * 10)
        score -= penalty
        if len(missing) == 1:
            reasons.append(f"{missing[0]} data unavailable")
        else:
            reasons.append(f"{len(missing)} metrics unavailable")

    # ── Cached / fallback data penalty ──
    if data_context.get("is_cached", False):
        score -= 20
        reasons.append("Using cached data")

    # ── API errors penalty ──
    api_errors = data_context.get("api_errors", [])
    if api_errors:
        penalty = min(20, len(api_errors) * 10)
        score -= penalty
        reasons.append(f"{len(api_errors)} data source(s) had errors")

    # Clamp 0–100
    score = max(0, min(100, score))

    # Map to level
    if score >= 80:
        level = ConfidenceLevel.HIGH
    elif score >= 60:
        level = ConfidenceLevel.MEDIUM
    else:
        level = ConfidenceLevel.LOW

    # If no penalties, give a positive reason
    if not reasons:
        reasons.append("All data sources are live and recent")

    return {
        "confidence_score": score,
        "confidence_level": level.value,
        "confidence_reasons": reasons,
    }


def get_confidence_disclaimer(level: str) -> str:
    """
    Return a one-line disclaimer for AI responses based on confidence level.
    """
    if level == ConfidenceLevel.HIGH.value:
        return ""  # No disclaimer needed for high confidence
    elif level == ConfidenceLevel.MEDIUM.value:
        return "This guidance is based on moderate-confidence data from nearby sources."
    else:
        return "This guidance is based on limited data; exercise extra caution and verify conditions locally."
