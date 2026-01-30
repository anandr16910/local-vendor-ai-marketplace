"""
Configuration settings for AI services
"""
import os
from typing import List
from functools import lru_cache
from pydantic import BaseSettings


class Settings(BaseSettings):
    """Application settings"""
    
    # Environment
    environment: str = os.getenv("ENVIRONMENT", "development")
    debug: bool = environment == "development"
    
    # Database URLs
    database_url: str = os.getenv("DATABASE_URL", "postgresql://postgres:postgres123@localhost:5432/local_vendor_ai")
    mongodb_url: str = os.getenv("MONGODB_URL", "mongodb://admin:admin123@localhost:27017/local_vendor_ai?authSource=admin")
    redis_url: str = os.getenv("REDIS_URL", "redis://:redis123@localhost:6379")
    
    # API Keys
    google_translate_api_key: str = os.getenv("GOOGLE_TRANSLATE_API_KEY", "")
    reverie_api_key: str = os.getenv("REVERIE_API_KEY", "")
    openai_api_key: str = os.getenv("OPENAI_API_KEY", "")
    hugging_face_api_key: str = os.getenv("HUGGING_FACE_API_KEY", "")
    
    # CORS settings
    allowed_origins: List[str] = [
        "http://localhost:3000",
        "http://localhost:5000",
        "http://frontend:3000",
        "http://backend:5000"
    ]
    
    # JWT settings
    jwt_secret: str = os.getenv("JWT_SECRET", "your-super-secret-jwt-key-change-in-production")
    jwt_algorithm: str = "HS256"
    
    # Model settings
    translation_model_cache_size: int = 100
    price_model_cache_size: int = 50
    cultural_context_cache_size: int = 200
    
    # Rate limiting
    rate_limit_requests: int = 100
    rate_limit_window: int = 60  # seconds
    
    # Logging
    log_level: str = os.getenv("LOG_LEVEL", "INFO")
    
    class Config:
        env_file = ".env"
        case_sensitive = False


@lru_cache()
def get_settings() -> Settings:
    """Get cached settings instance"""
    return Settings()