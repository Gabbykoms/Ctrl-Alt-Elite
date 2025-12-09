import pytest
from sqlalchemy import text
from app.database import engine, SessionLocal
from app.models.document import Document
from app.models.chat import ChatHistory


def test_database_connection():
    """Test basic database connectivity"""
    try:
        with engine.connect() as conn:
            result = conn.execute(text("SELECT 1"))
            assert result.fetchone()[0] == 1
        print("✓ Database connection successful")
    except Exception as e:
        pytest.fail(f"Database connection failed: {e}")


def test_pgvector_extension():
    """Test that pgvector extension is enabled"""
    try:
        with engine.connect() as conn:
            result = conn.execute(text(
                "SELECT extname FROM pg_extension WHERE extname = 'vector'"
            ))
            assert result.fetchone() is not None
        print("✓ pgvector extension enabled")
    except Exception as e:
        pytest.fail(f"pgvector not enabled: {e}")


def test_documents_table_exists():
    """Test that documents table exists"""
    try:
        with engine.connect() as conn:
            result = conn.execute(text(
                "SELECT table_name FROM information_schema.tables "
                "WHERE table_schema = 'public' AND table_name = 'documents'"
            ))
            assert result.fetchone() is not None
        print("✓ documents table exists")
    except Exception as e:
        pytest.fail(f"documents table not found: {e}")


def test_chat_history_table_exists():
    """Test that chat_history table exists"""
    try:
        with engine.connect() as conn:
            result = conn.execute(text(
                "SELECT table_name FROM information_schema.tables "
                "WHERE table_schema = 'public' AND table_name = 'chat_history'"
            ))
            assert result.fetchone() is not None
        print("✓ chat_history table exists")
    except Exception as e:
        pytest.fail(f"chat_history table not found: {e}")


def test_document_count():
    """Test that there are documents in the database"""
    try:
        db = SessionLocal()
        count = db.query(Document).count()
        db.close()

        assert count > 0, "No documents found in database. Run ingestion script first."
        print(f"✓ Found {count} documents in database")
    except Exception as e:
        pytest.fail(f"Could not count documents: {e}")