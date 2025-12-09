import sys
from pathlib import Path

sys.path.append(str(Path(__file__).parent.parent))

import asyncio
from uuid import uuid4


async def quick_test():
    """Quick test of the RAG service"""
    print("=" * 60)
    print("  QUICK TEST - Trinity Shuttle AI Service")
    print("=" * 60)

    # Test 1: Configuration
    print("\n[1/5] Testing configuration...")
    try:
        from app.config import settings
        print(f"✓ Service: {settings.SERVICE_NAME}")
        print(f"✓ Port: {settings.SERVICE_PORT}")
        print(f"✓ Chat Model: {settings.CHAT_MODEL}")
    except Exception as e:
        print(f"✗ Configuration failed: {e}")
        return

    # Test 2: Database
    print("\n[2/5] Testing database...")
    try:
        from app.database import engine
        from sqlalchemy import text

        with engine.connect() as conn:
            conn.execute(text("SELECT 1"))
        print("✓ Database connected")
    except Exception as e:
        print(f"✗ Database failed: {e}")
        return

    # Test 3: OpenAI
    print("\n[3/5] Testing OpenAI...")
    try:
        from langchain_openai import ChatOpenAI

        llm = ChatOpenAI(model=settings.CHAT_MODEL, api_key=settings.AI_OPENAI_API_KEY)
        response = llm.invoke("test")
        print(f"✓ OpenAI connected")
    except Exception as e:
        print(f"✗ OpenAI failed: {e}")
        return

    # Test 4: RAG Service
    print("\n[4/5] Testing RAG service...")
    try:
        from app.database import SessionLocal
        from app.services.rag_service import ShuttleRAGService

        db = SessionLocal()
        rag_service = ShuttleRAGService(db)
        print("✓ RAG service initialized")
        db.close()
    except Exception as e:
        print(f"✗ RAG service failed: {e}")
        return

    # Test 5: Full Query
    print("\n[5/5] Testing full query...")
    try:
        db = SessionLocal()
        rag_service = ShuttleRAGService(db)

        result = await rag_service.process_query(
            user_query="What are the shuttle operating hours?",
            session_id=str(uuid4())
        )

        print("✓ Query successful!")
        print(f"\nResponse: {result['response'][:200]}...")
        print(f"Sources: {len(result['sources'])}")

        db.close()
    except Exception as e:
        print(f"✗ Query failed: {e}")
        return

    print("\n" + "=" * 60)
    print("   ALL TESTS PASSED!")
    print("  Your service is working correctly!")
    print("=" * 60 + "\n")


if __name__ == "__main__":
    asyncio.run(quick_test())