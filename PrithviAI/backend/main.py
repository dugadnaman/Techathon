"""
PrithviAI — FastAPI Application Entry Point
Main server configuration and startup.
"""

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from contextlib import asynccontextmanager

from config import settings
from models.database import connect_db, disconnect_db
from routes import environment, risk, chat, dashboard, map_explorer


# ── Application Lifespan ──
@asynccontextmanager
async def lifespan(app: FastAPI):
    """Startup and shutdown events."""
    # Startup
    print(f"🌍 Starting {settings.APP_NAME} v{settings.APP_VERSION}")
    try:
        await connect_db()
    except Exception as e:
        print(f"[DB] Storage init warning: {e}")
        print("[DB] Running in demo mode — data will not persist")
    
    yield
    
    # Shutdown
    await disconnect_db()
    print(f"🛑 {settings.APP_NAME} stopped")


# ── Create FastAPI App ──
app = FastAPI(
    title=settings.APP_NAME,
    description=(
        "Environmental Data Intelligence Platform for Citizens and Senior Safety. "
        "Transforms environmental data into simple, actionable safety guidance."
    ),
    version=settings.APP_VERSION,
    lifespan=lifespan,
)

# ── CORS Middleware ──
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # In production, restrict to frontend URL
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# ── Register Routes ──
app.include_router(environment.router)
app.include_router(risk.router)
app.include_router(chat.router)
app.include_router(dashboard.router)
app.include_router(map_explorer.router)


# ── Root Endpoint ──
@app.get("/")
async def root():
    return {
        "name": settings.APP_NAME,
        "version": settings.APP_VERSION,
        "description": "Environmental Data Intelligence Platform for Citizens and Senior Safety",
        "status": "running",
        "docs": "/docs",
        "endpoints": {
            "environment": "/api/environment/current",
            "risk_assessment": "/api/risk/assess",
            "chat": "/api/chat/message",
            "dashboard": "/api/dashboard/summary",
            "map_explorer": "/api/map/location-data",
        },
    }


@app.get("/health")
async def health_check():
    return {"status": "healthy", "version": settings.APP_VERSION}
