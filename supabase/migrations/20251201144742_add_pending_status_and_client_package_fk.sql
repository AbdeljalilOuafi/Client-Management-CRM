-- Migration: Add 'pending' status to client_packages and add client_package_id FK to instalments
-- Date: 2025-12-01

-- Part 1: Update client_packages status constraint to include 'pending'
ALTER TABLE client_packages 
DROP CONSTRAINT IF EXISTS client_packages_status_check;

ALTER TABLE client_packages 
ADD CONSTRAINT client_packages_status_check 
CHECK (status IN ('pending', 'active', 'inactive'));

-- Part 2: Add client_package_id foreign key to instalments table
ALTER TABLE instalments 
ADD COLUMN client_package_id INTEGER REFERENCES client_packages(id) ON DELETE SET NULL;

-- Add index for performance on the new FK
CREATE INDEX IF NOT EXISTS idx_instalments_client_package_id ON instalments(client_package_id);

-- Add comment for documentation
COMMENT ON COLUMN instalments.client_package_id IS 'Links installment to specific client package for payment tracking';
COMMENT ON CONSTRAINT client_packages_status_check ON client_packages IS 'Allows pending (payment not confirmed), active (payment confirmed), or inactive (cancelled) statuses';
