-- Initialize Trinity Shuttle Database with pgvector extension
-- This script runs automatically when the postgres container starts

-- Create pgvector extension
CREATE EXTENSION IF NOT EXISTS vector;

-- Create documents table for RAG system
CREATE TABLE IF NOT EXISTS documents (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    content TEXT NOT NULL,
    category VARCHAR(100),
    metadata JSONB DEFAULT '{}',
    embedding vector(1536),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Create index for vector similarity search
CREATE INDEX IF NOT EXISTS documents_embedding_idx ON documents USING ivfflat (embedding vector_cosine_ops) WITH (lists = 100);
CREATE INDEX IF NOT EXISTS documents_category_idx ON documents (category);
CREATE INDEX IF NOT EXISTS documents_created_at_idx ON documents (created_at DESC);

-- Create chat_history table
CREATE TABLE IF NOT EXISTS chat_history (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    session_id UUID NOT NULL,
    user_id UUID,
    role VARCHAR(20) NOT NULL,
    content TEXT NOT NULL,
    metadata JSONB DEFAULT '{}',
    timestamp TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Create indexes for chat_history
CREATE INDEX IF NOT EXISTS chat_history_session_idx ON chat_history (session_id);
CREATE INDEX IF NOT EXISTS chat_history_user_idx ON chat_history (user_id);
CREATE INDEX IF NOT EXISTS chat_history_timestamp_idx ON chat_history (timestamp DESC);

-- Grant permissions
GRANT ALL PRIVILEGES ON TABLE documents TO trinity_user;
GRANT ALL PRIVILEGES ON TABLE chat_history TO trinity_user;
GRANT ALL PRIVILEGES ON ALL SEQUENCES IN SCHEMA public TO trinity_user;
