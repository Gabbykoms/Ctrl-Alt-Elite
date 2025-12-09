import pytest
import asyncio
from app.database import SessionLocal
from app.services.rag_service import ShuttleRAGService
from uuid import uuid4


@pytest.mark.asyncio
async def test_rag_service_initialization():
    """Test that RAG service initializes correctly"""
    db = SessionLocal()

    try:
        rag_service = ShuttleRAGService(db)

        assert rag_service.llm is not None
        assert rag_service.embeddings is not None
        assert rag_service.graph is not None

        print("✓ RAG service initialized successfully")
    except Exception as e:
        pytest.fail(f"RAG service initialization failed: {e}")
    finally:
        db.close()


@pytest.mark.asyncio
async def test_rag_query_processing():
    """Test processing a query through RAG pipeline"""
    db = SessionLocal()

    try:
        rag_service = ShuttleRAGService(db)

        test_query = "What are the shuttle operating hours?"
        session_id = str(uuid4())

        result = await rag_service.process_query(
            user_query=test_query,
            session_id=session_id
        )

        assert "response" in result
        assert "sources" in result
        assert "session_id" in result
        assert len(result["response"]) > 0

        print(f"✓ Query processed successfully")
        print(f"  Response: {result['response'][:100]}...")
        print(f"  Sources found: {len(result['sources'])}")

    except Exception as e:
        pytest.fail(f"RAG query processing failed: {e}")
    finally:
        db.close()


@pytest.mark.asyncio
async def test_vector_search():
    """Test vector similarity search"""
    db = SessionLocal()

    try:
        rag_service = ShuttleRAGService(db)

        test_query = "shuttle schedule"
        documents = rag_service._retrieve_documents(test_query, k=3)

        assert len(documents) > 0, "No documents retrieved"
        assert all(hasattr(doc, 'similarity') for doc in documents)

        print(f"✓ Retrieved {len(documents)} similar documents")
        for i, doc in enumerate(documents):
            print(f"  [{i + 1}] Similarity: {doc.similarity:.3f}, Category: {doc.category}")

    except Exception as e:
        pytest.fail(f"Vector search failed: {e}")
    finally:
        db.close()