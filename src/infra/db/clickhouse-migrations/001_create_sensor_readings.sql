-- Migration: Create sensor_readings table in ClickHouse
-- ClickHouse is optimized for time-series data and analytical queries

CREATE TABLE IF NOT EXISTS sensor_readings (
    id UUID DEFAULT generateUUIDv4(),
    device_id UUID NOT NULL,
    value Decimal(10, 2) NOT NULL,
    timestamp DateTime64(3) DEFAULT now64(3)
)
ENGINE = MergeTree()
ORDER BY (device_id, timestamp)
SETTINGS index_granularity = 8192;

-- Create index for faster device_id lookups
-- Note: ClickHouse uses ORDER BY clause for primary indexing
-- Additional indexes can be added for specific query patterns
