import sys
from pathlib import Path

sys.path.append(str(Path(__file__).parent.parent))

import asyncio
from colorama import Fore, Style, init

# Initialize colorama for colored output
try:
    init()
except:
    pass


def print_header(text):
    print("\n" + "=" * 60)
    print(f"  {text}")
    print("=" * 60)


def print_success(text):
    print(f"{Fore.GREEN}✓{Style.RESET_ALL} {text}")


def print_error(text):
    print(f"{Fore.RED}✗{Style.RESET_ALL} {text}")


def print_warning(text):
    print(f"{Fore.YELLOW}⚠{Style.RESET_ALL} {text}")


def test_imports():
    """Test that all required imports work"""
    print_header("Testing Imports")

    try:
        import langchain
        print_success("langchain")
    except ImportError as e:
        print_error(f"langchain: {e}")
        return False

    try:
        import langgraph
        print_success("langgraph")
    except ImportError as e:
        print_error(f"langgraph: {e}")
        return False

    try:
        import fastapi
        print_success("fastapi")
    except ImportError as e:
        print_error(f"fastapi: {e}")
        return False

    try:
        import sqlalchemy
        print_success("sqlalchemy")
    except ImportError as e:
        print_error(f"sqlalchemy: {e}")
        return False

    try:
        import pgvector
        print_success("pgvector")
    except ImportError as e:
        print_error(f"pgvector: {e}")
        return False

    return True


def test_configuration():
    """Test configuration loading"""
    print_header("Testing Configuration")

    try:
        from app.config import settings

        assert settings.OPENAI_API_KEY, "OpenAI API key not set"
        print_success(f"OpenAI API key loaded (starts with {settings.OPENAI_API_KEY[:8]}...)")

        assert settings.DATABASE_URL, "Database URL not set"
        print_success("Database URL loaded")

        assert settings.SERVICE_PORT == 8083, "Service port incorrect"
        print_success(f"Service port: {settings.SERVICE_PORT}")

        return True
    except Exception as e:
        print_error(f"Configuration test failed: {e}")
        return False


def test_database():
    """Test database connection"""
    print_header("Testing Database")

    try:
        from app.database import engine
        from sqlalchemy import text

        with engine.connect() as conn:
            result = conn.execute(text("SELECT 1"))
            assert result.fetchone()[0] == 1
        print_success("Database connection successful")

        # Test pgvector
        with engine.connect() as conn:
            result = conn.execute(text(
                "SELECT extname FROM pg_extension WHERE extname = 'vector'"
            ))
            if result.fetchone():
                print_success("pgvector extension enabled")
            else:
                print_warning("pgvector extension not found")
                return False

        # Check tables
        with engine.connect() as conn:
            result = conn.execute(text(
                "SELECT table_name FROM information_schema.tables "
                "WHERE table_schema = 'public' AND table_name IN ('documents', 'chat_history')"
            ))
            tables = [row[0] for row in result]

            if 'documents' in tables:
                print_success("documents table exists")
            else:
                print_error("documents table not found")
                return False

            if 'chat_history' in tables:
                print_success("chat_history table exists")
            else:
                print_warning("chat_history table not found")

        # Check document count
        with engine.connect() as conn:
            result = conn.execute(text("SELECT COUNT(*) FROM documents"))
            count = result.fetchone()[0]
            print_success(f"Found {count} documents in database")

            if count == 0:
                print_warning("No documents found. Run: python scripts/ingest_knowledge_base.py")

        return True
    except Exception as e:
        print_error(f"Database test failed: {e}")
        return False


def test_openai():
    """Test OpenAI connectivity"""
    print_header("Testing OpenAI")

    try:
        from langchain_openai import OpenAIEmbeddings, ChatOpenAI
        from app.config import settings

        # Test embeddings
        embeddings = OpenAIEmbeddings(
            model=settings.EMBEDDING_MODEL,
            api_key=settings.OPENAI_API_KEY
        )
        test_embedding = embeddings.embed_query("test")
        print_success(f"Embeddings working (dimension: {len(test_embedding)})")

        # Test chat
        llm = ChatOpenAI(
            model=settings.CHAT_MODEL,
            api_key=settings.OPENAI_API_KEY
        )
        response = llm.invoke("Say 'ok' if you can read this")
        print_success(f"Chat working (response: {response.content[:30]}...)")

        return True
    except Exception as e:
        print_error(f"OpenAI test failed: {e}")
        return False


async def test_rag_service():
    """Test RAG service"""
    print_header("Testing RAG Service")

    try:
        from app.database import SessionLocal
        from app.services.rag_service import ShuttleRAGService
        from uuid import uuid4

        db = SessionLocal()

        # Initialize service
        rag_service = ShuttleRAGService(db)
        print_success("RAG service initialized")

        # Test query processing
        test_query = "What are the shuttle hours?"
        session_id = str(uuid4())

        result = await rag_service.process_query(
            user_query=test_query,
            session_id=session_id
        )

        assert "response" in result
        assert len(result["response"]) > 0

        print_success("Query processing successful")
        print(f"  Query: {test_query}")
        print(f"  Response: {result['response'][:80]}...")
        print(f"  Sources: {len(result.get('sources', []))}")

        db.close()
        return True
    except Exception as e:
        print_error(f"RAG service test failed: {e}")
        return False


def test_api_server():
    """Test API server"""
    print_header("Testing API Server")

    try:
        from fastapi.testclient import TestClient
        from app.main import app

        client = TestClient(app)

        # Test root
        response = client.get("/")
        assert response.status_code == 200
        print_success("Root endpoint working")

        # Test health
        response = client.get("/health/")
        assert response.status_code == 200
        print_success("Health endpoint working")

        # Test chat
        response = client.post("/chat/", json={
            "message": "Test message",
            "include_sources": False
        })
        assert response.status_code == 200
        print_success("Chat endpoint working")

        return True
    except Exception as e:
        print_error(f"API server test failed: {e}")
        return False


async def main():
    """Run all tests"""
    print("\n" + "=" * 60)
    print("  TRINITY SHUTTLE AI SERVICE - COMPREHENSIVE TEST")
    print("=" * 60)

    results = []

    # Run tests
    results.append(("Imports", test_imports()))
    results.append(("Configuration", test_configuration()))
    results.append(("Database", test_database()))
    results.append(("OpenAI", test_openai()))
    results.append(("RAG Service", await test_rag_service()))
    results.append(("API Server", test_api_server()))

    # Summary
    print_header("Test Summary")

    passed = sum(1 for _, result in results if result)
    total = len(results)

    for name, result in results:
        if result:
            print_success(f"{name:20} PASSED")
        else:
            print_error(f"{name:20} FAILED")

    print("\n" + "=" * 60)
    print(f"  Results: {passed}/{total} tests passed")

    if passed == total:
        print(f"  {Fore.GREEN}✓ ALL TESTS PASSED!{Style.RESET_ALL}")
        print(f"  Your AI service is ready to use!")
        print(f"\n  Start it with: uvicorn app.main:app --reload --port 8083")
    else:
        print(f"  {Fore.RED}✗ SOME TESTS FAILED{Style.RESET_ALL}")
        print(f"  Fix the issues above before starting the service")

    print("=" * 60 + "\n")


if __name__ == "__main__":
    asyncio.run(main())