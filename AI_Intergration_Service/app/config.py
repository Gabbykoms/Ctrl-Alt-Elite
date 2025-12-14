from pydantic_settings import BaseSettings
from pydantic import ConfigDict
from functools import lru_cache
from typing import List


class Settings(BaseSettings):
    """Application settings loaded from environment variables"""
    
    # Service Info
    AI_SERVICE_NAME: str = "bantam-ai-service"
    AI_SERVICE_PORT: int = 8083
    AI_ENVIRONMENT: str = "production"
    AI_LOG_LEVEL: str = "INFO"
    
    # Database
    AI_DATABASE_URL: str
    AI_SUPABASE_URL: str = ""
    AI_SUPABASE_KEY: str = ""
    
    # OpenAI
    AI_OPENAI_API_KEY: str
    
    # LangChain Models
    EMBEDDING_MODEL: str = "text-embedding-3-small"
    CHAT_MODEL: str = "gpt-4o-mini"
    
    # Generation Parameters
    MAX_TOKENS: int = 500
    TEMPERATURE: float = 0.7
    
    # RAG Settings
    SIMILARITY_THRESHOLD: float = 0.5
    MAX_CONTEXT_DOCUMENTS: int = 5
    VECTOR_DIMENSION: int = 1536

    #WEATHER SETTINGS
    OPENWEATHER_API_KEY: str = ""
    
    # External Services
    TRACKING_SERVICE_URL: str = "http://localhost:8081/api/tracking"
    
    # CORS
    AI_ALLOWED_ORIGINS: str = "http://localhost:5173,http://localhost:8080,http://localhost:8083"
    
    model_config = ConfigDict(
        env_file=".env",
        case_sensitive=True,
        extra="ignore"
    )
    
    @property
    def allowed_origins_list(self) -> List[str]:
        """Convert comma-separated origins to list"""
        return [origin.strip() for origin in self.AI_ALLOWED_ORIGINS.split(",")]


@lru_cache()
def get_settings() -> Settings:
    """
    Get cached settings instance
    Uses lru_cache to only load settings once
    """
    return Settings()


# Global settings instance
settings = get_settings()
