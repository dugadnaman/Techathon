"""
PrithviAI — Dashboard Routes
Admin/analytics endpoints for historical data and area-wise visualization.
"""

from fastapi import APIRouter, Query
from typing import Optional
from datetime import datetime, timedelta
from models.schemas import RiskLevel

router = APIRouter(prefix="/api/dashboard", tags=["Dashboard"])


@router.get("/summary")
async def get_dashboard_summary():
    """
    Get dashboard overview data.
    For demo: returns mock historical and area-wise data.
    For production: query from JSON file storage.
    """
    return {
        "current_time": datetime.utcnow().isoformat(),
        "areas": [
            {
                "name": "Shivajinagar",
                "lat": 18.5308,
                "lon": 73.8475,
                "safety_level": "MODERATE",
                "score": 52,
                "top_concern": "Air Quality",
            },
            {
                "name": "Hadapsar",
                "lat": 18.5089,
                "lon": 73.9260,
                "safety_level": "HIGH",
                "score": 68,
                "top_concern": "Thermal Comfort",
            },
            {
                "name": "Koregaon Park",
                "lat": 18.5362,
                "lon": 73.8939,
                "safety_level": "LOW",
                "score": 28,
                "top_concern": "None",
            },
            {
                "name": "Kothrud",
                "lat": 18.5074,
                "lon": 73.8077,
                "safety_level": "LOW",
                "score": 22,
                "top_concern": "UV Exposure",
            },
            {
                "name": "Hinjewadi",
                "lat": 18.5912,
                "lon": 73.7390,
                "safety_level": "MODERATE",
                "score": 45,
                "top_concern": "Humidity",
            },
        ],
    }


@router.get("/trends")
async def get_trends(
    days: int = Query(default=7, description="Number of days for trend data"),
):
    """Get historical trend data for the dashboard charts."""
    # Generate demo trend data
    trends = []
    now = datetime.utcnow()
    
    for i in range(days * 4):  # 4 points per day (6-hour intervals)
        time = now - timedelta(hours=i * 6)
        hour = time.hour
        
        # Simulate daily patterns
        aqi_base = 80 + 40 * abs((hour - 14) / 14)
        temp_base = 28 + 6 * max(0, 1 - abs(hour - 14) / 10)
        
        trends.append({
            "timestamp": time.isoformat(),
            "aqi": round(aqi_base + (i % 7) * 3),
            "temperature": round(temp_base + (i % 5), 1),
            "humidity": round(65 + (i % 10) * 2),
            "safety_score": round(max(15, min(85, 40 + (i % 15) * 3))),
            "uv_index": round(max(0, 5 - abs(hour - 12) * 0.5), 1),
        })
    
    trends.reverse()
    return {"trends": trends}


@router.get("/risk-distribution")
async def get_risk_distribution():
    """Get risk factor distribution for pie/bar charts."""
    return {
        "distribution": [
            {"factor": "Air Quality", "score": 62, "level": "HIGH"},
            {"factor": "Thermal Comfort", "score": 48, "level": "MODERATE"},
            {"factor": "Humidity", "score": 55, "level": "MODERATE"},
            {"factor": "UV Exposure", "score": 35, "level": "MODERATE"},
            {"factor": "Flood Risk", "score": 12, "level": "LOW"},
            {"factor": "Noise", "score": 28, "level": "LOW"},
        ]
    }
