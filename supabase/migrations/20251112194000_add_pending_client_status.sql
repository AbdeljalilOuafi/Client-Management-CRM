-- Add 'pending' status to client_status enum
-- This migration extends the existing client_status enum type

-- Add new value to the client_status enum
-- Note: PostgreSQL requires adding enum values in a specific way
ALTER TYPE client_status ADD VALUE IF NOT EXISTS 'pending';

-- Add comment for documentation
COMMENT ON TYPE client_status IS 'Client statuses: pending, active, inactive, onboarding, paused, cancelled';
