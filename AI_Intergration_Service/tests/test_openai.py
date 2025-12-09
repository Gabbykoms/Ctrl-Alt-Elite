import pytest
from langchain_openai import OpenAIEmbeddings, ChatOpenAI
from app.config import settings


def test_openai_embeddings():
    """Test OpenAI embeddings generation"""
    try:
        embeddings = OpenAIEmbeddings(
            model=settings.EMBEDDING_MODEL,
            dimensions=settings.VECTOR_DIMENSION,
            api_key=settings.AI_OPENAI_API_KEY
        )

        test_text = "This is a test sentence for embedding."
        embedding = embeddings.embed_query(test_text)

        assert len(embedding) == settings.VECTOR_DIMENSION
        assert all(isinstance(x, float) for x in embedding)
        print(f"✓ Generated embedding with dimension {len(embedding)}")
    except Exception as e:
        pytest.fail(f"Embeddings test failed: {e}")


def test_openai_chat():
    """Test OpenAI chat completion"""
    try:
        llm = ChatOpenAI(
            model=settings.CHAT_MODEL,
            api_key=settings.AI_OPENAI_API_KEY
        )

        response = llm.invoke("Say 'test passed' if you can read this.")

        assert response.content is not None
        assert len(response.content) > 0
        print(f"✓ Chat completion successful: {response.content[:50]}")
    except Exception as e:
        pytest.fail(f"Chat test failed: {e}")


def test_openai_api_key_valid():
    """Test that OpenAI API key is valid format"""
    assert settings.AI_OPENAI_API_KEY.startswith("sk-")
    assert len(settings.AI_OPENAI_API_KEY) > 20
    print("✓ OpenAI API key format valid")