"""
Price discovery API routes
"""
from fastapi import APIRouter, HTTPException, Depends, Request
from pydantic import BaseModel
from typing import Dict, List, Optional
import structlog

logger = structlog.get_logger()

router = APIRouter()


class PriceRecommendationRequest(BaseModel):
    productInfo: Dict
    vendorInfo: Dict
    locationInfo: Dict


@router.post("/recommend")
async def get_price_recommendation(request: PriceRecommendationRequest, req: Request):
    """Get AI-powered price recommendations"""
    try:
        price_service = req.app.state.price_discovery_service
        result = await price_service.get_price_recommendation(
            request.productInfo,
            request.vendorInfo,
            request.locationInfo
        )
        return result
    except Exception as e:
        logger.error("Price recommendation failed", error=str(e))
        raise HTTPException(status_code=500, detail="Price recommendation failed")