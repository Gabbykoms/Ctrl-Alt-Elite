
import json
import sys
from pathlib import Path
from sqlalchemy import text  

# Add parent directory to path
sys.path.append(str(Path(__file__).parent.parent))

from sqlalchemy.orm import Session
from app.database import SessionLocal
from app.services.embedding_service import EmbeddingService


def load_json_file(filepath: str):
    """Load JSON file"""
    with open(filepath, 'r') as f:
        return json.load(f)


def document_exists(db: Session, content: str) -> bool:
    """
    Check if a document with this exact content already exists.
    Returns True if it exists, False otherwise.
    """
    # We use a raw SQL query for speed. 
    # It checks if any row has matching content.
    query = text("SELECT 1 FROM documents WHERE content = :content LIMIT 1")
    result = db.execute(query, {"content": content}).scalar()
    return result is not None


def ingest_documents(db: Session, documents: list, category: str):
    """Ingest list of documents with deduplication"""
    embedding_service = EmbeddingService(db)

    print(f"\n Ingesting {category} documents...")

    skipped_count = 0
    
    for idx, doc in enumerate(documents, 1):
        try:
            # 1. Extract content (Standardize format)
            if 'content' in doc:
                content = doc['content']
            elif 'question' in doc and 'answer' in doc:
                content = f"Q: {doc['question']}\nA: {doc['answer']}"
            else:
                print(f"  Skipping document {idx}: No content field")
                continue

            # 2. Check for Duplicates (The New Logic)
            if document_exists(db, content):
                # print(f"   Skipping [{idx}] (Already exists)")
                skipped_count += 1
                continue

            # 3. Extract metadata
            metadata = {k: v for k, v in doc.items() if k not in ['content', 'question', 'answer']}

            # 4. Create document
            embedding_service.create_document(
                content=content,
                category=category,
                metadata=metadata
            )
            print(f"  ✓ [{idx}] {content[:60]}...")

        except Exception as e:
            print(f"  ✗ [{idx}] Error: {e}")
            
    if skipped_count > 0:
        print(f"     (Skipped {skipped_count} duplicates)")


def main():
    """Main ingestion function"""
    print("=" * 60)
    print("  Trinity Shuttle Knowledge Base Ingestion")
    print("=" * 60)

    db = SessionLocal()
    data_dir = Path(__file__).parent.parent / 'data' / 'knowledge_base'

    if not data_dir.exists():
        print(f" Data directory not found: {data_dir}")
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
                print(f" Error processing {filename}: {e}")
        else:
            print(f"  File not found: {filepath}")

    db.close()

    print("\n" + "=" * 60)
    print(f"   Ingestion process complete!")
    print("=" * 60)


if __name__ == "__main__":
    main()