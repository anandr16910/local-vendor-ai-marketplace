"""
Main FastAPI application for AI services
"""
from fastapi import FastAPI, HTTPException, Depends
from fastapi.middleware.cors import CORSMiddleware
from fastapi.middleware.gzip import GZipMiddleware
import structlog
import uvicorn
from contextlib import asynccontextmanager

from .config.settings import get_settings
from .services.translation import TranslationService
from .services.price_discovery import PriceDiscoveryService
from .services.negotiation import NegotiationService
from .services.cultural_context import CulturalContextService
from .middleware.auth import verify_token
from .middleware.rate_limit import RateLimitMiddleware
from .routes import translation, price_discovery, negotiation, cultural

# Configure structured logging
logger = structlog.get_logger()

@asynccontextmanager
async def lifespan(app: FastAPI):
    """Application lifespan manager"""
    # Startup
    logger.info("Starting AI services...")
    
    # Initialize services
    app.state.translation_service = TranslationService()
    app.state.price_discovery_service = PriceDiscoveryService()
    app.state.negotiation_service = NegotiationService()
    app.state.cultural_service = CulturalContextService()
    
    # Load ML models
    await app.state.translation_service.initialize()
    await app.state.price_discovery_service.initialize()
    await app.state.negotiation_service.initialize()
    await app.state.cultural_service.initialize()
    
    logger.info("AI services initialized successfully")
    
    yield
    
    # Shutdown
    logger.info("Shutting down AI services...")
    
    # Cleanup resources
    await app.state.translation_service.cleanup()
    await app.state.price_discovery_service.cleanup()
    await app.state.negotiation_service.cleanup()
    await app.state.cultural_service.cleanup()
    
    logger.info("AI services shutdown complete")

# Create FastAPI app
app = FastAPI(
    title="Local Vendor AI Services",
    description="AI/ML microservices for price discovery, translation, and negotiation assistance",
    version="1.0.0",
    lifespan=lifespan
)

# Get settings
settings = get_settings()

# Add middleware
app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.allowed_origins,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.add_middleware(GZipMiddleware, minimum_size=1000)
app.add_middleware(RateLimitMiddleware)

# Health check endpoint
@app.get("/health")
async def health_check():
    """Health check endpoint"""
    return {
        "status": "healthy",
        "services": {
            "translation": "ready",
            "price_discovery": "ready",
            "negotiation": "ready",
            "cultural_context": "ready"
        }
    }

# Include routers
app.include_router(
    translation.router,
    prefix="/api/v1/translation",
    tags=["translation"],
    dependencies=[Depends(verify_token)]
)

app.include_router(
    price_discovery.router,
    prefix="/api/v1/price-discovery",
    tags=["price-discovery"],
    dependencies=[Depends(verify_token)]
)

app.include_router(
    negotiation.router,
    prefix="/api/v1/negotiation",
    tags=["negotiation"],
    dependencies=[Depends(verify_token)]
)

app.include_router(
    cultural.router,
    prefix="/api/v1/cultural",
    tags=["cultural-context"],
    dependencies=[Depends(verify_token)]
)

# Error handlers
@app.exception_handler(HTTPException)
async def http_exception_handler(request, exc):
    logger.error("HTTP exception", status_code=exc.status_code, detail=exc.detail)
    return {
        "error": {
            "code": exc.status_code,
            "message": exc.detail,
            "timestamp": "2023-01-01T00:00:00Z"
        }
    }

@app.exception_handler(Exception)
async def general_exception_handler(request, exc):
    logger.error("Unhandled exception", error=str(exc))
    return {
        "error": {
            "code": 500,
            "message": "Internal server error",
            "timestamp": "2023-01-01T00:00:00Z"
        }
    }

if __name__ == "__main__":
    uvicorn.run(
        "main:app",
        host="0.0.0.0",
        port=8000,
        reload=True,
        log_level="info"
    )