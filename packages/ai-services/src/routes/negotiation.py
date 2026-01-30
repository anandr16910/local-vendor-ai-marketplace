"""
Negotiation assistance API routes
"""
from fastapi import APIRouter, HTTPException, Depends, Request
from pydantic import BaseModel
from typing import Dict, List, Optional
import structlog

logger = structlog.get_logger()

router = APIRouter()


class StartNegotiationRequest(BaseModel):
    vendorId: str
    buyerId: str
    productId: str


@router.post("/start")
async def start_negotiation(request: StartNegotiationRequest, req: Request):
    """Start a new negotiation session"""
    try:
        negotiation_service = req.app.state.negotiation_service
        result = await negotiation_service.start_negotiation(
            request.vendorId,
            request.buyerId,
            request.productId
        )
        return result
    except Exception as e:
        logger.error("Failed to start negotiation", error=str(e))
        raise HTTPException(status_code=500, detail="Failed to start negotiation")