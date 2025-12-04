from pydantic_settings import BaseSettings
from functools import lru_cache
from typing import List


class Settings(BaseSettings):
    """Application settings loaded from environment variables"""
    
    # Service Info
    SERVICE_NAME: str = "trinity-ai-service"
    SERVICE_PORT: int = 8083
    ENVIRONMENT: str = "development"
    LOG_LEVEL: str = "INFO"
    
    # Database
    DATABASE_URL: str
    SUPABASE_URL: str = ""
    SUPABASE_KEY: str = ""
    
    # OpenAI
    OPENAI_API_KEY: str
    
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
    ALLOWED_ORIGINS: str = "http://localhost:3000,http://localhost:8080,http://localhost:5173"
    
    @property
    def allowed_origins_list(self) -> List[str]:
        """Convert comma-separated origins to list"""
        return [origin.strip() for origin in self.ALLOWED_ORIGINS.split(",")]
    
    class Config:
        env_file = ".env"
        case_sensitive = True


@lru_cache()
def get_settings() -> Settings:
    """
    Get cached settings instance
    Uses lru_cache to only load settings once
    """
    return Settings()


# Global settings instance
settings = get_settings()
