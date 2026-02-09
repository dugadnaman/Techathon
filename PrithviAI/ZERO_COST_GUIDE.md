# PrithviAI — Zero-Cost Deployment Guide

> **Every service, API, and tool used in this project is 100% free.**
> No credit card required anywhere.

---

## 🏗️ Architecture (All Free)

```
┌──────────────────────────────────────────────────────────┐
│                    FRONTEND (Vercel)                      │
│  Next.js 14 + React 18 + Tailwind CSS + Recharts         │
│  Free: Unlimited personal projects, 100GB bandwidth       │
│  Deploy: vercel.com (GitHub auto-deploy)                  │
└─────────────────────┬────────────────────────────────────┘
                      │ HTTPS
┌─────────────────────▼────────────────────────────────────┐
│                   BACKEND (Render)                         │
│  FastAPI + Python 3.11                                     │
│  Free: 750 hrs/month, auto-sleep after 15 min inactivity  │
│  Deploy: render.com (GitHub auto-deploy via render.yaml)   │
└──────┬──────────┬──────────┬──────────┬──────────────────┘
       │          │          │          │
       ▼          ▼          ▼          ▼
   Weather     Air Qual     AI Chat    Storage
  OpenWeather   AQICN     Gemini AI   JSON Files
  (free)       (free)     (free)      (free)
```

---

## ✅ Zero-Cost Checklist

| #  | Component           | Service Used              | Free Tier Limits                     | Cost   | Signup URL                                       |
|----|---------------------|---------------------------|--------------------------------------|--------|--------------------------------------------------|
| 1  | AI Chat Engine      | Google Gemini API         | 15 RPM, 1,500 RPD, 1M tokens/day    | **$0** | https://aistudio.google.com/apikey               |
| 2  | Weather Data        | OpenWeatherMap API        | 1,000 calls/day, current + forecast  | **$0** | https://openweathermap.org/api                   |
| 3  | Air Quality Data    | AQICN (WAQI) API          | 1,000 calls/day                      | **$0** | https://aqicn.org/data-platform/token/           |
| 4  | UV Index            | OpenWeatherMap (included) | Included in free tier                | **$0** | (same as #2)                                     |
| 5  | Database / Storage  | JSON File Storage         | Unlimited (local files)              | **$0** | No signup needed                                 |
| 6  | Backend Hosting     | Render.com                | 750 hrs/month, 512MB RAM             | **$0** | https://render.com                               |
| 7  | Frontend Hosting    | Vercel                    | 100GB bandwidth, unlimited deploys   | **$0** | https://vercel.com                               |
| 8  | Source Control       | GitHub                    | Unlimited public/private repos       | **$0** | https://github.com                               |
| 9  | Domain (optional)   | Not required              | Use *.onrender.com & *.vercel.app    | **$0** | Built-in with hosting                            |
| 10 | SSL/HTTPS           | Auto-provisioned          | Free via Let's Encrypt               | **$0** | Automatic on Vercel & Render                     |
| 11 | Risk Intelligence   | Custom Python (local)     | No external API needed               | **$0** | Built-in                                         |
| 12 | Multi-Language      | Dictionary-based (local)  | No external API needed               | **$0** | Built-in                                         |
| 13 | CI/CD               | GitHub Actions            | 2,000 min/month free                 | **$0** | https://github.com/features/actions              |

**TOTAL MONTHLY COST: $0.00**

---

## 🚀 Step-by-Step Free Setup

### Phase 1: Get Free API Keys (5 min each)

#### 1. Google Gemini API Key (AI Chat)
1. Go to https://aistudio.google.com/apikey
2. Sign in with any Google account
3. Click **"Create API Key"**
4. Copy the key → paste in `.env` as `GEMINI_API_KEY`
5. **Free forever:** 15 requests/min, 1,500 requests/day

#### 2. OpenWeatherMap API Key (Weather Data)
1. Go to https://openweathermap.org/api
2. Sign up for a free account
3. Go to "API Keys" tab in your profile
4. Copy default key → paste in `.env` as `OPENWEATHER_API_KEY`
5. **Free forever:** 1,000 calls/day (more than enough for MVP)

#### 3. AQICN API Token (Air Quality)
1. Go to https://aqicn.org/data-platform/token/
2. Enter your email
3. Receive token via email → paste in `.env` as `AQICN_API_KEY`
4. **Free forever:** 1,000 calls/day

### Phase 2: Local Development (10 min)

```bash
# 1. Clone & setup
git clone <your-repo-url>
cd PrithviAI

# 2. Create .env file
cp .env.example .env
# Edit .env with your free API keys

# 3. Backend setup
cd backend
python -m venv venv
venv\Scripts\activate          # Windows
# source venv/bin/activate     # Mac/Linux
pip install -r requirements.txt

# 4. Run backend
uvicorn main:app --reload --port 8000

# 5. Frontend setup (new terminal)
cd frontend
npm install
npm run dev

# 6. Open http://localhost:3000
```

### Phase 3: Free Deployment (15 min)

#### Deploy Backend to Render.com (Free)
1. Push code to GitHub
2. Go to https://render.com → sign in with GitHub
3. Click **"New" → "Web Service"**
4. Connect your GitHub repo
5. Render auto-detects `render.yaml`
6. Add environment variables (your 3 free API keys)
7. Click **Deploy** — backend live at `https://prithviai-api.onrender.com`

#### Deploy Frontend to Vercel (Free)
1. Go to https://vercel.com → sign in with GitHub
2. Click **"Import Project"** → select your repo
3. Set **Root Directory** to `frontend`
4. Set env var: `NEXT_PUBLIC_API_URL=https://prithviai-api.onrender.com`
5. Click **Deploy** — frontend live at `https://prithviai.vercel.app`

---

## 📊 Free Tier Limitations & Mitigations

| Limitation                          | Impact                          | Mitigation Built-In                     |
|-------------------------------------|---------------------------------|------------------------------------------|
| Render sleeps after 15 min idle     | ~30s cold start on first visit  | Frontend shows loading spinner           |
| OpenWeatherMap 1K calls/day limit   | Enough for ~50 users/day        | 10-min TTL cache reduces calls by 90%   |
| Gemini 15 RPM rate limit            | Max 15 AI chats/minute          | Template fallback if rate limited        |
| JSON storage not suitable for scale | Fine for hackathon/MVP          | Easy to upgrade to free MongoDB Atlas    |
| No custom domain                    | Uses *.vercel.app / *.onrender  | Freenom offers free domains if needed    |

---

## 🔒 Security Considerations (Zero-Cost)

1. **API Keys**: Stored as environment variables, never committed to git
2. **CORS**: Restricted to frontend domain in production
3. **HTTPS**: Auto-provisioned by Vercel and Render (free TLS)
4. **Rate Limiting**: Built-in caching prevents API abuse
5. **No PII Storage**: JSON files don't store personal data
6. **Input Validation**: Pydantic schemas validate all inputs
7. **.gitignore**: Excludes `.env`, `data/`, `node_modules/`

---

## 📅 MVP Timeline (Free Stack)

| Phase | Duration | Deliverable                                        |
|-------|----------|----------------------------------------------------|
| 1     | Day 1    | Backend API running locally with demo data         |
| 2     | Day 1    | Frontend connected to backend, basic UI functional |
| 3     | Day 2    | Free API keys configured, live data flowing        |
| 4     | Day 2    | AI chat working with Gemini free tier              |
| 5     | Day 2    | Deployed to Vercel + Render (live URL)             |
| 6     | Day 3    | Testing, polish, demo preparation                  |

---

## 🔄 Upgrade Path (Still Free)

When you outgrow the basic free tiers:
- **Database**: MongoDB Atlas free tier (512MB, 500 connections)
- **Hosting**: Railway.app free tier ($5 credit/month)
- **AI**: Hugging Face Inference API (another free option)
- **Weather**: Open-Meteo API (completely free, no key needed, unlimited)
