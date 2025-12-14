import pytest
from app.config import settings


def test_settings_loaded():
    """Test that settings are loaded correctly"""
    assert settings.AI_SERVICE_NAME == "bantam-ai-service"
    assert settings.AI_SERVICE_PORT == 8083
    assert settings.AI_OPENAI_API_KEY is not None
    assert len(settings.AI_OPENAI_API_KEY) > 0
    print("✓ Settings loaded successfully")


def test_database_url():
    """Test that database URL is configured"""
    assert settings.AI_DATABASE_URL is not None
    assert "postgresql" in settings.AI_DATABASE_URL
    print("✓ Database URL configured")


def test_models_configuration():
    """Test AI model configuration"""
    assert settings.EMBEDDING_MODEL in ["text-embedding-3-small", "text-embedding-3-large"]
    assert settings.CHAT_MODEL in ["gpt-4o-mini", "gpt-4o", "gpt-3.5-turbo"]
    assert settings.VECTOR_DIMENSION == 1536
    print("✓ AI models configured correctly")