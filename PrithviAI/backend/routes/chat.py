"""
PrithviAI — Chat Routes
Endpoints for the AI chat interface.
"""

from fastapi import APIRouter
from models.schemas import ChatRequest, ChatResponse
from chat.chat_engine import process_chat

router = APIRouter(prefix="/api/chat", tags=["AI Chat"])


@router.post("/message", response_model=ChatResponse)
async def send_message(request: ChatRequest):
    """
    Send a natural language message and get safety-aware response.
    
    Example queries:
    - "Is it safe for my parents to go for a walk today?"
    - "Will heat affect elderly people today?"
    - "How is the air quality right now?"
    """
    response = await process_chat(request)
    return response


@router.get("/suggestions")
async def get_suggestions():
    """Get diverse suggested questions for the chat interface."""
    return {
        "suggestions": [
            "What's the full safety report for Mumbai right now?",
            "Is it safe for my grandmother to go for a morning walk today?",
            "What is the exact AQI, temperature, and UV index right now?",
            "Can a senior citizen with asthma go outside today?",
            "What precautions should elderly take if commuting today?",
            "Compare the air quality risk vs heat risk for seniors today",
            "Is it safe to exercise outdoors this evening?",
            "What's the noise level and how does it affect elderly sleep?",
            "Should my father carry an umbrella today?",
            "What are the top 3 health risks for seniors right now?",
        ]
    }
