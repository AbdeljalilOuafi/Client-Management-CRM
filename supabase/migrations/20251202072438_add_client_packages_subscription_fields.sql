-- Migration: Update client_packages table - add subscription and trial fields
-- Date: 2025-12-02
-- Purpose: Support free trials, subscription intervals, and installment plans

-- Add missing columns to client_packages
ALTER TABLE client_packages
ADD COLUMN IF NOT EXISTS free_trial boolean DEFAULT false,
ADD COLUMN IF NOT EXISTS trial_length_days integer,
ADD COLUMN IF NOT EXISTS subscription_interval text,
ADD COLUMN IF NOT EXISTS instalments jsonb;

-- Add comments for documentation
COMMENT ON COLUMN client_packages.free_trial IS 'Whether this package is a free trial';
COMMENT ON COLUMN client_packages.trial_length_days IS 'Length of free trial period in days (if free_trial is true)';
COMMENT ON COLUMN client_packages.subscription_interval IS 'Billing interval for subscription (e.g., "monthly", "yearly", "weekly")';
COMMENT ON COLUMN client_packages.instalments IS 'JSON structure for installment payment plan details';
