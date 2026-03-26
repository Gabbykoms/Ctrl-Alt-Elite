-- Initialize tracking database with stops, drivers, and rides tables
-- This script creates the schema for persistent tracking storage

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

-- ============================================================================
-- DRIVERS TABLE
-- ============================================================================
CREATE TABLE IF NOT EXISTS drivers (
    id VARCHAR(255) PRIMARY KEY,
    name VARCHAR(255) NOT NULL,
    shuttle_id VARCHAR(255),
    route_id VARCHAR(255),
    current_lat DECIMAL(10, 6),
    current_lng DECIMAL(10, 6),
    last_location_update_at_ms BIGINT,
    status VARCHAR(50) NOT NULL DEFAULT 'OFFLINE' -- OFFLINE | ONLINE
);

-- Create indexes for drivers table
CREATE INDEX idx_drivers_status ON drivers(status);
CREATE INDEX idx_drivers_shuttle_id ON drivers(shuttle_id);
CREATE INDEX idx_drivers_route_id ON drivers(route_id);

-- Note: Drivers table manages its own updated_at_ms timestamp (no trigger needed)

-- ============================================================================
-- RIDES TABLE
-- ============================================================================
CREATE TABLE IF NOT EXISTS rides (
    ride_id VARCHAR(255) PRIMARY KEY,
    student_id VARCHAR(255) NOT NULL,
    driver_id VARCHAR(255), -- Nullable - driver might not be assigned yet
    shuttle_id VARCHAR(255) NOT NULL,
    status VARCHAR(50) NOT NULL DEFAULT 'REQUESTED', -- REQUESTED | IN_PROGRESS | COMPLETED | CANCELED
    pickup_lat DECIMAL(10, 6) NOT NULL,
    pickup_lng DECIMAL(10, 6) NOT NULL,
    dropoff_lat DECIMAL(10, 6) NOT NULL,
    dropoff_lng DECIMAL(10, 6) NOT NULL,
    created_at_ms BIGINT NOT NULL,
    completed_at_ms BIGINT
);

-- Create indexes for rides table
CREATE INDEX idx_rides_student_id ON rides(student_id);
CREATE INDEX idx_rides_driver_id ON rides(driver_id);
CREATE INDEX idx_rides_shuttle_id ON rides(shuttle_id);
CREATE INDEX idx_rides_status ON rides(status);
CREATE INDEX idx_rides_created_at_ms ON rides(created_at_ms);
CREATE INDEX idx_rides_active ON rides(status) WHERE status IN ('REQUESTED', 'IN_PROGRESS');

-- Create trigger to update updated_at_ms timestamp for rides
-- Note: rides table uses separate completed_at_ms for explicit control
-- We'll rely on application logic for timestamp management

-- ============================================================================
-- DRIVER SHIFT REPORTS TABLE
-- ============================================================================
CREATE TABLE IF NOT EXISTS driver_shift_reports (
    id VARCHAR(255) PRIMARY KEY,
    report_date DATE NOT NULL,
    radio_number VARCHAR(255),
    driver_id VARCHAR(255) NOT NULL,
    driver_name VARCHAR(255) NOT NULL,
    vehicle_license VARCHAR(255),
    starting_mileage BIGINT NOT NULL,
    ending_mileage BIGINT,
    condition_notes TEXT,
    created_at_ms BIGINT NOT NULL,
    updated_at_ms BIGINT NOT NULL,
    CONSTRAINT chk_driver_shift_starting_mileage_non_negative CHECK (starting_mileage >= 0),
    CONSTRAINT chk_driver_shift_ending_mileage_valid CHECK (ending_mileage IS NULL OR (ending_mileage >= 0 AND ending_mileage >= starting_mileage)),
    CONSTRAINT uq_driver_shift_driver_date UNIQUE (driver_id, report_date)
);

CREATE INDEX idx_driver_shift_reports_driver_id ON driver_shift_reports(driver_id);
CREATE INDEX idx_driver_shift_reports_report_date ON driver_shift_reports(report_date);
