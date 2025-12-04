-- Add form_type column and make package_id nullable
-- This allows forms to be created without a package and supports multiple form types per package

-- Step 1: Drop existing unique constraints on package_id
ALTER TABLE check_in_forms DROP CONSTRAINT IF EXISTS check_in_forms_package_id_key;
ALTER TABLE check_in_forms DROP CONSTRAINT IF EXISTS check_in_forms_account_package_unique;

-- Step 2: Make package_id nullable (allows forms without assigned packages)
ALTER TABLE check_in_forms ALTER COLUMN package_id DROP NOT NULL;

-- Step 3: Add form_type column with default 'checkins' for existing records
-- form_type can be: 'checkins', 'onboarding', or 'reviews'
ALTER TABLE check_in_forms ADD COLUMN IF NOT EXISTS form_type VARCHAR(20) NOT NULL DEFAULT 'checkins';

-- Step 4: Add check constraint to validate form_type values
ALTER TABLE check_in_forms ADD CONSTRAINT check_in_forms_form_type_check 
    CHECK (form_type IN ('checkins', 'onboarding', 'reviews'));

-- Step 5: Create new unique constraint
-- Each package can have at most one form of each type
-- Note: PostgreSQL allows multiple NULL values in unique constraints, 
-- so multiple unassigned forms of the same type are allowed
CREATE UNIQUE INDEX idx_check_in_forms_package_form_type_unique 
    ON check_in_forms(account_id, package_id, form_type) 
    WHERE package_id IS NOT NULL;

-- Step 6: Create index for form_type queries
CREATE INDEX IF NOT EXISTS idx_check_in_forms_form_type ON check_in_forms(form_type);

-- Update table comment
COMMENT ON TABLE check_in_forms IS 'Form templates that can be assigned to packages. Supports checkin, onboarding, and reviews form types. Each package can have at most one form of each type.';
COMMENT ON COLUMN check_in_forms.form_type IS 'Type of form: checkin, onboarding, or reviews';
COMMENT ON COLUMN check_in_forms.package_id IS 'Package this form is assigned to (can be null for unassigned forms)';


