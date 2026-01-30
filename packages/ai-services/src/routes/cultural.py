"""
Cultural context API routes
"""
from fastapi import APIRouter, HTTPException, Depends, Request
from pydantic import BaseModel
from typing import Dict, List, Optional
import structlog

logger = structlog.get_logger()

router = APIRouter()


class CulturalGuidanceRequest(BaseModel):
    sessionId: str
    action: str
    context: Dict


@router.post("/guidance")
async def get_cultural_guidance(request: CulturalGuidanceRequest, req: Request):
    """Get cultural guidance for negotiations"""
    try:
        cultural_service = req.app.state.cultural_service
        result = await cultural_service.get_cultural_guidance(
            request.sessionId,
            request.action,
            request.context
        )
        return result
    except Exception as e:
        logger.error("Failed to get cultural guidance", error=str(e))
        raise HTTPException(status_code=500, detail="Failed to get cultural guidance")