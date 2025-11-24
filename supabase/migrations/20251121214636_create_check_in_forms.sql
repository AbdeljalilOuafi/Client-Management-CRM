-- Create check_in_forms table
-- Stores form templates linked to packages (1:1 relationship)

CREATE TABLE IF NOT EXISTS check_in_forms (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    account_id INTEGER NOT NULL REFERENCES accounts(id) ON DELETE CASCADE,
    package_id INTEGER NOT NULL UNIQUE REFERENCES packages(id) ON DELETE CASCADE,
    title VARCHAR(255) NOT NULL,
    description TEXT,
    form_schema JSONB NOT NULL DEFAULT '{}',
    is_active BOOLEAN NOT NULL DEFAULT true,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    
    CONSTRAINT check_in_forms_account_package_unique UNIQUE(account_id, package_id)
);

-- Create indexes for performance
CREATE INDEX idx_check_in_forms_account_id ON check_in_forms(account_id);
CREATE INDEX idx_check_in_forms_package_id ON check_in_forms(package_id);
CREATE INDEX idx_check_in_forms_is_active ON check_in_forms(is_active);

-- Create updated_at trigger
CREATE TRIGGER update_check_in_forms_updated_at
    BEFORE UPDATE ON check_in_forms
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

-- Add comment
COMMENT ON TABLE check_in_forms IS 'Check-in form templates assigned to packages (1 form per package)';
