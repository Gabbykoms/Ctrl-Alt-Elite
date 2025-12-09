import pytest
from app.database import SessionLocal
from app.services.embedding_service import EmbeddingService
from app.models.document import Document


def test_create_document_with_embedding():
    """Test creating a document with embedding"""
    db = SessionLocal()

    try:
        embedding_service = EmbeddingService(db)

        test_content = "Test shuttle information for embedding service"
        test_category = "test"
        test_metadata = {"test": True, "purpose": "unit_test"}

        doc = embedding_service.create_document(
            content=test_content,
            category=test_category,
            metadata=test_metadata
        )

        assert doc.id is not None
        assert doc.content == test_content
        assert doc.category == test_category
        assert doc.metadata == test_metadata
        assert doc.embedding is not None

        print(f"✓ Created document with ID: {doc.id}")

        # Cleanup
        db.delete(doc)
        db.commit()

    except Exception as e:
        pytest.fail(f"Document creation failed: {e}")
    finally:
        db.close()