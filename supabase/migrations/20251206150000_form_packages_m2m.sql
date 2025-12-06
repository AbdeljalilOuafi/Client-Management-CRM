-- Migration: Form-Package Many-to-Many Relationship
-- Allows forms to be assigned to multiple packages
-- Constraint: Each package can only have one form per type (checkins, onboarding, reviews)

-- Create junction table for form-package M2M relationship
CREATE TABLE IF NOT EXISTS check_in_form_packages (
    id SERIAL PRIMARY KEY,
    form_id UUID NOT NULL REFERENCES check_in_forms(id) ON DELETE CASCADE,
    package_id INTEGER NOT NULL REFERENCES packages(id) ON DELETE CASCADE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    
    -- Ensure form-package pair is unique
    UNIQUE(form_id, package_id)
);

-- Create index for efficient lookups
CREATE INDEX IF NOT EXISTS idx_check_in_form_packages_form_id ON check_in_form_packages(form_id);
CREATE INDEX IF NOT EXISTS idx_check_in_form_packages_package_id ON check_in_form_packages(package_id);

-- Create function to enforce one form per type per package
CREATE OR REPLACE FUNCTION enforce_one_form_per_type_per_package()
RETURNS TRIGGER AS $$
DECLARE
    new_form_type VARCHAR(20);
    existing_form_id UUID;
BEGIN
    -- Get the form_type of the form being linked
    SELECT form_type INTO new_form_type FROM check_in_forms WHERE id = NEW.form_id;
    
    -- Check if the package already has a form of this type (excluding the current form)
    SELECT cfp.form_id INTO existing_form_id
    FROM check_in_form_packages cfp
    JOIN check_in_forms f ON f.id = cfp.form_id
    WHERE cfp.package_id = NEW.package_id
    AND f.form_type = new_form_type
    AND cfp.form_id != NEW.form_id
    LIMIT 1;
    
    IF existing_form_id IS NOT NULL THEN
        RAISE EXCEPTION 'Package % already has a % form (form_id: %)', 
            NEW.package_id, new_form_type, existing_form_id;
    END IF;
    
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger to enforce constraint
DROP TRIGGER IF EXISTS check_one_form_per_type_per_package ON check_in_form_packages;
CREATE TRIGGER check_one_form_per_type_per_package
BEFORE INSERT OR UPDATE ON check_in_form_packages
FOR EACH ROW EXECUTE FUNCTION enforce_one_form_per_type_per_package();

-- Migrate existing data from check_in_forms.package_id to junction table
-- Only insert if not already exists (idempotent)
INSERT INTO check_in_form_packages (form_id, package_id)
SELECT id, package_id 
FROM check_in_forms 
WHERE package_id IS NOT NULL
ON CONFLICT (form_id, package_id) DO NOTHING;

-- Drop the old unique constraint that included package_id
ALTER TABLE check_in_forms DROP CONSTRAINT IF EXISTS check_in_forms_account_id_package_id_form_type_key;

-- Drop old FK column after data migration
ALTER TABLE check_in_forms DROP COLUMN IF EXISTS package_id;

