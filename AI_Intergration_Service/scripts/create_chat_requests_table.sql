-- Create chat_requests table for queue processing
-- This table tracks chat requests from submission to completion

CREATE TABLE IF NOT EXISTS chat_requests (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    request_id VARCHAR(100) UNIQUE NOT NULL,
    session_id UUID NOT NULL,
    user_id UUID,
    message TEXT NOT NULL,
    status VARCHAR(20) DEFAULT 'queued' NOT NULL,
    response TEXT,
    sources JSONB,
    error_message TEXT,
    created_at TIMESTAMP DEFAULT NOW() NOT NULL,
    started_at TIMESTAMP,
    completed_at TIMESTAMP
);

-- Indexes for performance
CREATE INDEX IF NOT EXISTS idx_chat_requests_request_id ON chat_requests(request_id);
CREATE INDEX IF NOT EXISTS idx_chat_requests_status ON chat_requests(status);
CREATE INDEX IF NOT EXISTS idx_chat_requests_created_at ON chat_requests(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_chat_requests_session_id ON chat_requests(session_id);

-- Comment on table
COMMENT ON TABLE chat_requests IS 'Tracks asynchronous chat requests processed via RabbitMQ queue';
COMMENT ON COLUMN chat_requests.status IS 'Request status: queued, processing, completed, failed';
COMMENT ON COLUMN chat_requests.sources IS 'JSON array of source documents used for RAG response';
