-- Create check_in_submissions table
-- Stores client responses to check-in forms

CREATE TABLE IF NOT EXISTS check_in_submissions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    form_id UUID NOT NULL REFERENCES check_in_forms(id) ON DELETE CASCADE,
    client_id INTEGER NOT NULL REFERENCES clients(id) ON DELETE CASCADE,
    account_id INTEGER NOT NULL REFERENCES accounts(id) ON DELETE CASCADE,
    submission_data JSONB NOT NULL DEFAULT '{}',
    submitted_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
    
    -- Note: Account consistency is enforced by the application layer
    -- Foreign keys ensure referential integrity
);

-- Create indexes for performance
CREATE INDEX idx_check_in_submissions_form_id ON check_in_submissions(form_id);
CREATE INDEX idx_check_in_submissions_client_id ON check_in_submissions(client_id);
CREATE INDEX idx_check_in_submissions_account_id ON check_in_submissions(account_id);
CREATE INDEX idx_check_in_submissions_submitted_at ON check_in_submissions(submitted_at DESC);

-- Create composite index for client's submission history
CREATE INDEX idx_check_in_submissions_client_form ON check_in_submissions(client_id, form_id, submitted_at DESC);

-- Add comment
COMMENT ON TABLE check_in_submissions IS 'Client responses to check-in forms with submission data stored as JSONB';
