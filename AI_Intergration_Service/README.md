# Trinity Shuttle AI Service 🤖

Python-based RAG (Retrieval Augmented Generation) chatbot using **LangChain + LangGraph** for Trinity College Campus Shuttle Tracker.

## 🎯 Architecture

This service uses the same modern architecture as your healthcare reference:
- **LangChain** for LLM integration
- **LangGraph** for agentic workflow
- **Supabase pgvector** for vector storage
- **Tool-based retrieval** pattern
- **Memory/checkpointing** for conversations

## 🚀 Quick Start

### 1. Setup
```bash
cd Ctrl-Alt-Elite/AI_Intergration_Service
source .venv/bin/activate
pip install -r requirements.txt
```

### 2. Configure
```bash
# Edit .env with your credentials
nano .env
```

### 3. Database
Run the migration script in Supabase SQL Editor (see database-migration.sql)

### 4. Test
```bash
python scripts/test_connection.py
```

### 5. Ingest Knowledge Base
```bash
python scripts/ingest_knowledge_base.py
```

### 6. Start Service
```bash
uvicorn app.main:app --reload --port 8083
```

## 📡 API Endpoints

- **POST /chat/** - Chat with the AI
- **GET /chat/history/{session_id}** - Get conversation history
- **POST /documents/** - Add documents (admin)
- **GET /health/** - Health check
- **GET /docs** - Interactive API documentation

## 🧪 Testing

```bash
# Test the chat endpoint
curl -X POST http://localhost:8083/chat/ \
  -H "Content-Type: application/json" \
  -d '{"message": "What are the shuttle hours?"}'
```

## 📊 API Documentation

Visit: http://localhost:8083/docs

## 🏗️ Architecture Flow

```
User Query
    ↓
query_or_respond (decides if tool needed)
    ↓
tools (retrieve from pgvector)
    ↓
generate (create response with context)
    ↓
Response
```

## 📝 Files Created

- ✅ app/main.py - FastAPI application
- ✅ app/config.py - Configuration
- ✅ app/database.py - Database connection
- ✅ app/services/rag_service.py - LangGraph RAG
- ✅ app/services/embedding_service.py - Embeddings
- ✅ app/api/routes/*.py - API endpoints
- ✅ scripts/*.py - Utility scripts
- ✅ data/knowledge_base/*.json - Knowledge base


## 🐛 Troubleshooting

If you get import errors:
```bash
pip install langchain langchain-openai langgraph
```

If database connection fails:
- Check DATABASE_URL in .env
- Ensure pgvector is enabled in Supabase

## 📧 Support

See main repository for contribution guidelines.