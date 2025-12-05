-- Update schedule_type constraint to allow RECURRING type for reviews forms
-- This migration fixes the IntegrityError when creating reviews forms:
-- "new row for relation 'check_in_schedules' violates check constraint 'check_in_schedules_same_day_requires_day'"

-- =============================================================================
-- Step 1: Drop the old constraint that only allows SAME_DAY and INDIVIDUAL_DAYS
-- =============================================================================

ALTER TABLE check_in_schedules DROP CONSTRAINT IF EXISTS check_in_schedules_same_day_requires_day;

-- =============================================================================
-- Step 2: Add updated constraint that includes RECURRING type
-- =============================================================================

ALTER TABLE check_in_schedules ADD CONSTRAINT check_in_schedules_same_day_requires_day CHECK (
    (schedule_type = 'SAME_DAY' AND day_of_week IS NOT NULL) OR
    (schedule_type = 'INDIVIDUAL_DAYS' AND day_of_week IS NULL) OR
    (schedule_type = 'RECURRING' AND day_of_week IS NULL)
);

-- =============================================================================
-- Step 3: Update schedule_type column constraint to allow RECURRING
-- =============================================================================

-- First check if the constraint exists and drop it
DO $$
BEGIN
    IF EXISTS (
        SELECT 1 FROM pg_constraint 
        WHERE conname = 'check_in_schedules_schedule_type_check'
    ) THEN
        ALTER TABLE check_in_schedules DROP CONSTRAINT check_in_schedules_schedule_type_check;
    END IF;
END $$;

-- Add the new constraint allowing all three types
ALTER TABLE check_in_schedules ADD CONSTRAINT check_in_schedules_schedule_type_check 
    CHECK (schedule_type IN ('SAME_DAY', 'INDIVIDUAL_DAYS', 'RECURRING'));

-- =============================================================================
-- Step 4: Update table comment
-- =============================================================================

COMMENT ON TABLE check_in_schedules IS 'Scheduling configuration for forms: SAME_DAY (check-ins), INDIVIDUAL_DAYS (check-ins), or RECURRING (reviews)';

