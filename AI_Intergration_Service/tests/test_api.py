import pytest
from fastapi.testclient import TestClient
from app.main import app

client = TestClient(app)


def test_root_endpoint():
    """Test root endpoint"""
    response = client.get("/")
    assert response.status_code == 200
    data = response.json()
    assert "service" in data
    assert data["status"] == "running"
    print("✓ Root endpoint working")


def test_health_endpoint():
    """Test health check endpoint"""
    response = client.get("/health/")
    assert response.status_code == 200
    data = response.json()
    assert data["status"] == "healthy"
    print("✓ Health endpoint working")


def test_health_database_endpoint():
    """Test database health endpoint"""
    response = client.get("/health/db")
    assert response.status_code == 200
    data = response.json()
    assert "database" in data
    print(f"✓ Database health: {data}")


def test_health_openai_endpoint():
    """Test OpenAI health endpoint"""
    response = client.get("/health/openai")
    assert response.status_code == 200
    data = response.json()
    assert "openai" in data
    print(f"✓ OpenAI health: {data}")


def test_chat_endpoint():
    """Test chat endpoint"""
    test_message = {
        "message": "What are the shuttle hours?",
        "include_sources": True
    }

    response = client.post("/chat/", json=test_message)
    assert response.status_code == 200

    data = response.json()
    assert "response" in data
    assert "session_id" in data
    assert len(data["response"]) > 0

    print("✓ Chat endpoint working")
    print(f"  Response: {data['response'][:100]}...")


def test_documents_list_endpoint():
    """Test documents list endpoint"""
    response = client.get("/documents/")
    assert response.status_code == 200

    data = response.json()
    assert isinstance(data, list)

    print(f"✓ Documents endpoint working (found {len(data)} documents)")