-- Migration: Update payment_schedule enum values
-- Date: 2025-12-02
-- Purpose: Replace old payment schedule values with new standardized ones
-- Old values: 'PIF', 'Monthly', 'Quarterly', 'Yearly'
-- New values: 'one_time', 'instalments', 'subscription', 'deposit'

-- Step 1: Create new enum type with updated values
CREATE TYPE payment_schedule_new AS ENUM (
    'one_time',
    'instalments', 
    'subscription',
    'deposit'
);

-- Step 2: Add temporary column with new enum type
ALTER TABLE client_packages 
ADD COLUMN payment_schedule_new payment_schedule_new;

-- Step 3: Migrate existing data with mapping logic
-- PIF (Paid In Full) -> one_time
-- Monthly/Quarterly/Yearly -> subscription
UPDATE client_packages
SET payment_schedule_new = 
    CASE 
        WHEN payment_schedule = 'PIF' THEN 'one_time'::payment_schedule_new
        WHEN payment_schedule IN ('Monthly', 'Quarterly', 'Yearly') THEN 'subscription'::payment_schedule_new
        ELSE NULL
    END
WHERE payment_schedule IS NOT NULL;

-- Step 4: Drop old column and rename new column
ALTER TABLE client_packages DROP COLUMN payment_schedule;
ALTER TABLE client_packages RENAME COLUMN payment_schedule_new TO payment_schedule;

-- Step 5: Drop old enum type
DROP TYPE payment_schedule;

-- Step 6: Rename new type to original name
ALTER TYPE payment_schedule_new RENAME TO payment_schedule;

-- Add documentation
COMMENT ON TYPE payment_schedule IS 'Payment structure types: one_time (single payment), instalments (multiple fixed payments), subscription (recurring), deposit (partial upfront payment)';
COMMENT ON COLUMN client_packages.payment_schedule IS 'Defines how client pays for package: one_time, instalments, subscription, or deposit';
