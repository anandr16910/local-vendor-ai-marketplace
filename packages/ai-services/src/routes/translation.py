"""
Translation API routes
"""
from fastapi import APIRouter, HTTPException, Depends, Request
from pydantic import BaseModel
from typing import Dict, List, Optional
import structlog

logger = structlog.get_logger()

router = APIRouter()


class TranslationRequest(BaseModel):
    text: str
    sourceLang: str
    targetLang: str
    culturalContext: Optional[Dict] = None


class VoiceTranslationRequest(BaseModel):
    audioData: str  # Base64 encoded audio
    sourceLang: str
    targetLang: str


@router.post("/translate")
async def translate_text(request: TranslationRequest, req: Request):
    """Translate text with cultural context"""
    try:
        translation_service = req.app.state.translation_service
        result = await translation_service.translate_text(
            request.text,
            request.sourceLang,
            request.targetLang,
            request.culturalContext
        )
        return result
    except Exception as e:
        logger.error("Translation failed", error=str(e))
        raise HTTPException(status_code=500, detail="Translation failed")


@router.post("/translate/voice")
async def translate_voice(request: VoiceTranslationRequest, req: Request):
    """Translate voice input"""
    try:
        translation_service = req.app.state.translation_service
        # TODO: Decode base64 audio data
        audio_data = b"mock_audio_data"
        
        result = await translation_service.translate_voice(
            audio_data,
            request.sourceLang,
            request.targetLang
        )
        return result
    except Exception as e:
        logger.error("Voice translation failed", error=str(e))
        raise HTTPException(status_code=500, detail="Voice translation failed")


@router.get("/languages")
async def get_supported_languages(req: Request):
    """Get supported languages"""
    try:
        translation_service = req.app.state.translation_service
        languages = await translation_service.get_supported_languages()
        return {"languages": languages}
    except Exception as e:
        logger.error("Failed to get languages", error=str(e))
        raise HTTPException(status_code=500, detail="Failed to get languages")