import json
import sys
from pathlib import Path

# Add parent directory to path
sys.path.append(str(Path(__file__).parent.parent))

from sqlalchemy.orm import Session
from app.database import SessionLocal
from app.services.embedding_service import EmbeddingService


def load_json_file(filepath: str):
    """Load JSON file"""
    with open(filepath, 'r') as f:
        return json.load(f)


def ingest_documents(db: Session, documents: list, category: str):
    """Ingest list of documents"""
    embedding_service = EmbeddingService(db)

    print(f"\n📚 Ingesting {category} documents...")

    for idx, doc in enumerate(documents, 1):
        try:
            # Extract content from different formats
            if 'content' in doc:
                content = doc['content']
            elif 'question' in doc and 'answer' in doc:
                content = f"Q: {doc['question']}\nA: {doc['answer']}"
            else:
                print(f"⚠️  Skipping document {idx}: No content field")
                continue

            # Extract metadata
            metadata = {k: v for k, v in doc.items() if k not in ['content', 'question', 'answer']}

            # Create document with embedding
            embedding_service.create_document(
                content=content,
                category=category,
                metadata=metadata
            )
            print(f"  ✓ [{idx}] {content[:60]}...")

        except Exception as e:
            print(f"  ✗ [{idx}] Error: {e}")


def main():
    """Main ingestion function"""
    print("=" * 60)
    print("  Trinity Shuttle Knowledge Base Ingestion")
    print("=" * 60)

    db = SessionLocal()
    data_dir = Path(__file__).parent.parent / 'data' / 'knowledge_base'

    if not data_dir.exists():
        print(f"❌ Data directory not found: {data_dir}")
        return

    # Ingest each category
    files = {
        'faqs.json': 'faq',
        'routes.json': 'route',
        'policies.json': 'policy',
        'buildings.json': 'building'
    }

    total_ingested = 0

    for filename, category in files.items():
        filepath = data_dir / filename
        if filepath.exists():
            try:
                data = load_json_file(filepath)
                ingest_documents(db, data, category)
                total_ingested += len(data)
            except Exception as e:
                print(f"❌ Error processing {filename}: {e}")
        else:
            print(f"⚠️  File not found: {filepath}")

    db.close()

    print("\n" + "=" * 60)
    print(f"  ✅ Ingestion complete! Total documents: {total_ingested}")
    print("=" * 60)


if __name__ == "__main__":
    main()