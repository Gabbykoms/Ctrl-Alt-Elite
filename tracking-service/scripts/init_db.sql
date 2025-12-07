-- Initialize tracking database with stops table
-- This script creates the schema for persistent stop storage

-- Create stops table
CREATE TABLE IF NOT EXISTS stops (
    id VARCHAR(255) PRIMARY KEY,
    name VARCHAR(255) NOT NULL,
    latitude DECIMAL(10, 6) NOT NULL,
    longitude DECIMAL(10, 6) NOT NULL,
    description TEXT,
    is_active BOOLEAN DEFAULT true,
    created_at_ms BIGINT NOT NULL,
    updated_at_ms BIGINT NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Create index on name for faster searches
CREATE INDEX idx_stops_name ON stops(name);

-- Create index on is_active for filtering active stops
CREATE INDEX idx_stops_is_active ON stops(is_active);

-- Create index on created_at for sorting by creation time
CREATE INDEX idx_stops_created_at ON stops(created_at_ms);

-- Create index on coordinates for spatial queries (future optimization)
CREATE INDEX idx_stops_coordinates ON stops(latitude, longitude);

-- Add trigger to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = CURRENT_TIMESTAMP;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_stops_updated_at BEFORE UPDATE ON stops
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Insert default Trinity College stops
INSERT INTO stops (id, name, latitude, longitude, description, is_active, created_at_ms, updated_at_ms)
VALUES
    ('stop-mather-' || EXTRACT(EPOCH FROM NOW())::BIGINT, 'Mather', 41.746210, -72.692788, 'Mather', true, EXTRACT(EPOCH FROM NOW())::BIGINT * 1000, EXTRACT(EPOCH FROM NOW())::BIGINT * 1000)
ON CONFLICT (id) DO NOTHING;
