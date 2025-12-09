import sys
from pathlib import Path

sys.path.append(str(Path(__file__).parent.parent))

from app.database import engine
from app.config import settings
from sqlalchemy import text
from langchain_openai import OpenAIEmbeddings, ChatOpenAI


def test_database():
    """Test database connection"""
    print("\n" + "=" * 60)
    print("  Testing Database Connection")
    print("=" * 60)

    try:
        with engine.connect() as conn:
            # Test basic connection
            result = conn.execute(text("SELECT version()"))
            version = result.fetchone()[0]
            print(f"✓ Database connected")
            print(f"  PostgreSQL: {version[:50]}...")

            # Test pgvector extension
            result = conn.execute(text("SELECT extname FROM pg_extension WHERE extname = 'vector'"))
            if result.fetchone():
                print("✓ pgvector extension is enabled")
            else:
                print("✗ pgvector extension not found")
                print("  Run this in Supabase SQL Editor:")
                print("  CREATE EXTENSION IF NOT EXISTS vector;")
                return False

            # Check documents table
            result = conn.execute(text("""
                SELECT table_name FROM information_schema.tables 
                WHERE table_schema = 'public' AND table_name = 'documents'
            """))
            if result.fetchone():
                print("✓ documents table exists")

                # Count documents
                result = conn.execute(text("SELECT COUNT(*) FROM documents"))
                count = result.fetchone()[0]
                print(f"  Total documents: {count}")
            else:
                print("⚠ documents table not found")
                print("  You need to run the database migration script")

        return True
    except Exception as e:
        print(f"✗ Database connection failed: {e}")
        return False


def test_openai():
    """Test OpenAI API connection"""
    print("\n" + "=" * 60)
    print("  Testing OpenAI Connection")
    print("=" * 60)

    try:
        # Test embeddings
        print("Testing embeddings...")
        embeddings = OpenAIEmbeddings(
            model=settings.EMBEDDING_MODEL,
            dimensions=settings.VECTOR_DIMENSION,
            api_key=settings.AI_OPENAI_API_KEY
        )

        embedding = embeddings.embed_query("test")
        print(f"✓ OpenAI embeddings working")
        print(f"  Model: {settings.EMBEDDING_MODEL}")
        print(f"  Dimension: {len(embedding)}")

        # Test chat
        print("\nTesting chat completion...")
        llm = ChatOpenAI(
            model=settings.CHAT_MODEL,
            api_key=settings.AI_OPENAI_API_KEY
        )

        response = llm.invoke("Say 'test successful' if you can read this")
        print(f"✓ OpenAI chat working")
        print(f"  Model: {settings.CHAT_MODEL}")
        print(f"  Response: {response.content[:50]}...")

        return True
    except Exception as e:
        print(f"✗ OpenAI connection failed: {e}")
        print("\nCheck your AI_OPENAI_API_KEY in .env file")
        return False


def test_langchain():
    """Test LangChain setup"""
    print("\n" + "=" * 60)
    print("  Testing LangChain Setup")
    print("=" * 60)

    try:
        from langchain_core.messages import HumanMessage
        from langgraph.graph import StateGraph, MessagesState

        print("✓ LangChain imports working")
        print("  langchain-core: OK")
        print("  langgraph: OK")

        return True
    except Exception as e:
        print(f"✗ LangChain setup failed: {e}")
        print("\nRun: pip install langchain langchain-openai langgraph")
        return False


def main():
    """Run all tests"""
    print("\n" + "=" * 60)
    print("  Trinity AI Service - Connection Test")
    print("=" * 60)
    print(f"\nEnvironment: {settings.ENVIRONMENT}")
    print(f"Service: {settings.SERVICE_NAME}")

    results = []

    # Test database
    results.append(("Database", test_database()))

    # Test OpenAI
    results.append(("OpenAI", test_openai()))

    # Test LangChain
    results.append(("LangChain", test_langchain()))

    # Summary
    print("\n" + "=" * 60)
    print("  Test Summary")
    print("=" * 60)

    for name, passed in results:
        status = "✓ PASSED" if passed else "✗ FAILED"
        print(f"{status:12} - {name}")

    all_passed = all(result[1] for result in results)

    print("\n" + "=" * 60)
    if all_passed:
        print("   All tests passed! You're ready to start the service.")
        print("\n  Run: uvicorn app.main:app --reload --port 8083")
    else:
        print("    Some tests failed. Fix the issues above before starting.")
    print("=" * 60 + "\n")


if __name__ == "__main__":
    main()