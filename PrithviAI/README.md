# 🌍 PrithviAI — Environmental Data Intelligence Platform

**For Citizens and Senior Safety**

PrithviAI transforms complex environmental data into simple, actionable safety guidance — with a special focus on senior citizens and vulnerable groups.

---

## 🎯 What It Does

- Monitors air quality, temperature, humidity, noise, UV, and flood risk
- Computes a unified **Senior Environmental Safety Index** (LOW / MODERATE / HIGH)
- Provides natural-language safety guidance via AI chat
- Supports Hindi, Marathi, and English
- Sends proactive alerts with clear do/don't recommendations

## 🏗️ Architecture

```
┌─────────────────────────────────────────────┐
│              Frontend (Next.js)              │
│  ┌──────────┐ ┌──────────┐ ┌─────────────┐ │
│  │ Dashboard │ │ AI Chat  │ │ Alerts View │ │
│  └──────────┘ └──────────┘ └─────────────┘ │
└───────────────────┬─────────────────────────┘
                    │ REST API
┌───────────────────┴─────────────────────────┐
│            Backend (FastAPI)                 │
│  ┌──────────────────────────────────────┐   │
│  │      Risk Intelligence Engine        │   │
│  │  ┌─────┐┌─────┐┌────┐┌────┐┌────┐   │   │
│  │  │ AQI ││Temp ││Hum ││UV  ││Noise│  │   │
│  │  └─────┘└─────┘└────┘└────┘└────┘   │   │
│  │        ↓ Safety Index Generator      │   │
│  └──────────────────────────────────────┘   │
│  ┌──────────────────────────────────────┐   │
│  │  AI Chat Engine + Language Layer     │   │
│  └──────────────────────────────────────┘   │
│  ┌──────────────────────────────────────┐   │
│  │  External APIs + Sensor Ingestion    │   │
│  └──────────────────────────────────────┘   │
└───────────────────┬─────────────────────────┘
                    │
        ┌───────────┴───────────┐
        │   JSON File Storage    │
        └───────────────────────┘
```

## 🚀 Quick Start

### Backend
```bash
cd backend
pip install -r requirements.txt
# Set environment variables in .env
uvicorn main:app --reload --port 8000
```

### Frontend
```bash
cd frontend
npm install
npm run dev
# Opens at http://localhost:3000
```

### Environment Variables (.env in backend/)
```
OPENWEATHER_API_KEY=your_key   # Free: https://openweathermap.org/api
AQICN_API_KEY=your_key          # Free: https://aqicn.org/data-platform/token/
GEMINI_API_KEY=your_key         # Free: https://aistudio.google.com/apikey
DATA_DIR=data
```

> **💰 Total cost: $0** — See [ZERO_COST_GUIDE.md](ZERO_COST_GUIDE.md) for full details.

## 📊 Risk Factors Computed

| Factor | Source | Senior Impact |
|--------|--------|---------------|
| Air Quality (PM2.5/PM10) | Sensors + API | Respiratory distress |
| Thermal Stress | Temperature + Humidity | Heat stroke, dehydration |
| Humidity Risk | Sensor | Joint pain, breathing |
| UV Exposure | API | Skin damage, fatigue |
| Noise Pollution | Sensor (dB) | Sleep disruption, stress |
| Flood / Waterlogging | Rain + Water level | Fall risk, mobility |

## 🗣️ AI Chat Examples

> **User:** "Is it safe for my mother to go walking today?"
> **PrithviAI:** "⚠️ Moderate Risk — The air quality is poor today (AQI 156) and temperature is 38°C. It's best to avoid outdoor walks between 11 AM and 4 PM. Early morning before 8 AM is safer."

## 🌐 Multi-Language Support

- English (default)
- हिन्दी (Hindi)
- मराठी (Marathi)

## 👥 Team

Built for Techathon 2026

## 📝 License

MIT
