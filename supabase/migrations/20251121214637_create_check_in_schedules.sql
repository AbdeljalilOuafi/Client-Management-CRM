-- Create check_in_schedules table
-- Stores scheduling configuration for check-in forms

CREATE TABLE IF NOT EXISTS check_in_schedules (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    form_id UUID NOT NULL REFERENCES check_in_forms(id) ON DELETE CASCADE,
    account_id INTEGER NOT NULL REFERENCES accounts(id) ON DELETE CASCADE,
    schedule_type VARCHAR(20) NOT NULL CHECK (schedule_type IN ('SAME_DAY', 'INDIVIDUAL_DAYS')),
    day_of_week VARCHAR(10) CHECK (day_of_week IN ('monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday', 'sunday')),
    time TIME NOT NULL,
    timezone VARCHAR(50) NOT NULL DEFAULT 'UTC',
    webhook_job_ids JSONB NOT NULL DEFAULT '[]',
    is_active BOOLEAN NOT NULL DEFAULT true,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    
    CONSTRAINT check_in_schedules_same_day_requires_day CHECK (
        (schedule_type = 'SAME_DAY' AND day_of_week IS NOT NULL) OR
        (schedule_type = 'INDIVIDUAL_DAYS' AND day_of_week IS NULL)
    ),
    CONSTRAINT check_in_schedules_one_per_form UNIQUE(form_id)
);

-- Create indexes for performance
CREATE INDEX idx_check_in_schedules_form_id ON check_in_schedules(form_id);
CREATE INDEX idx_check_in_schedules_account_id ON check_in_schedules(account_id);
CREATE INDEX idx_check_in_schedules_is_active ON check_in_schedules(is_active);
CREATE INDEX idx_check_in_schedules_schedule_type ON check_in_schedules(schedule_type);

-- Create updated_at trigger
CREATE TRIGGER update_check_in_schedules_updated_at
    BEFORE UPDATE ON check_in_schedules
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

-- Add comment
COMMENT ON TABLE check_in_schedules IS 'Scheduling configuration for check-in forms (SAME_DAY or INDIVIDUAL_DAYS mode)';
