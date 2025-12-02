-- Migration: Add 'pending' status to client_packages and add client_package_id FK to instalments
-- Date: 2025-12-01

-- Part 1: Add 'pending' value to client_package_status ENUM type
ALTER TYPE client_package_status ADD VALUE 'pending' BEFORE 'active';

-- Part 2: Add client_package_id foreign key to instalments table
ALTER TABLE instalments 
ADD COLUMN client_package_id INTEGER REFERENCES client_packages(id) ON DELETE SET NULL;

-- Add index for performance on the new FK
CREATE INDEX IF NOT EXISTS idx_instalments_client_package_id ON instalments(client_package_id);

-- Add comment for documentation
COMMENT ON COLUMN instalments.client_package_id IS 'Links installment to specific client package for payment tracking';
