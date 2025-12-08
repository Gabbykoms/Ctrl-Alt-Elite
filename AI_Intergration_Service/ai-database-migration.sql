-- Trinity Shuttle AI Service - Database Schema
-- This is a SEPARATE database from the backend
-- Run this in a separate Supabase project OR PostgreSQL instance

-- ============================================
-- ENABLE EXTENSIONS
-- ============================================
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pgvector";


-- ============================================
-- DOCUMENTS TABLE (for RAG - Vector embeddings)
-- ============================================
CREATE TABLE IF NOT EXISTS public.documents (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  content TEXT NOT NULL,
  category VARCHAR(100),
  metadata JSONB,
  embedding vector(1536),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc', NOW()),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc', NOW())
);

-- Index for vector similarity search
CREATE INDEX idx_documents_embedding ON public.documents USING ivfflat (embedding vector_cosine_ops) 
  WITH (lists = 100);

-- Other useful indexes
CREATE INDEX idx_documents_category ON public.documents(category);
CREATE INDEX idx_documents_created_at ON public.documents(created_at);


-- ============================================
-- CONVERSATIONS TABLE (for conversation history)
-- ============================================
CREATE TABLE IF NOT EXISTS public.conversations (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  session_id VARCHAR(255) NOT NULL,
  user_message TEXT NOT NULL,
  ai_response TEXT,
  tokens_used INTEGER,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc', NOW()),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc', NOW())
);

CREATE INDEX idx_conversations_session_id ON public.conversations(session_id);
CREATE INDEX idx_conversations_created_at ON public.conversations(created_at);


-- ============================================
-- ROW LEVEL SECURITY (RLS)
-- ============================================

ALTER TABLE public.documents ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.conversations ENABLE ROW LEVEL SECURITY;

-- Allow all reads (backend handles auth)
CREATE POLICY "All can read documents"
  ON public.documents FOR SELECT
  USING (TRUE);

CREATE POLICY "All can read conversations"
  ON public.conversations FOR SELECT
  USING (TRUE);


-- ============================================
-- TRIGGERS: Update updated_at timestamp
-- ============================================

CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = TIMEZONE('utc', NOW());
  RETURN NEW;
END;
$$ LANGUAGE PLPGSQL;

DROP TRIGGER IF EXISTS update_documents_updated_at ON public.documents;
DROP TRIGGER IF EXISTS update_conversations_updated_at ON public.conversations;

CREATE TRIGGER update_documents_updated_at BEFORE UPDATE ON public.documents
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_conversations_updated_at BEFORE UPDATE ON public.conversations
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
