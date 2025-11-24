-- Migration: Convert custom_role from single FK to many-to-many relationship
-- This allows employees to have multiple custom roles

-- Step 1: Create employee_role_assignments junction table
CREATE TABLE IF NOT EXISTS employee_role_assignments (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    employee_id INTEGER NOT NULL REFERENCES employees(id) ON DELETE CASCADE,
    role_id UUID NOT NULL REFERENCES employee_roles(id) ON DELETE CASCADE,
    assigned_at TIMESTAMPTZ DEFAULT now(),
    UNIQUE(employee_id, role_id)
);

-- Step 2: Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_employee_role_assignments_employee 
    ON employee_role_assignments(employee_id);
CREATE INDEX IF NOT EXISTS idx_employee_role_assignments_role 
    ON employee_role_assignments(role_id);

-- Step 3: Migrate existing custom_role_id data to junction table
-- Only migrate non-null custom_role_id values
INSERT INTO employee_role_assignments (employee_id, role_id)
SELECT id, custom_role_id
FROM employees
WHERE custom_role_id IS NOT NULL
ON CONFLICT (employee_id, role_id) DO NOTHING;

-- Step 4: Drop the old custom_role_id column from employees table
ALTER TABLE employees DROP COLUMN IF EXISTS custom_role_id;

-- Add comment to document the relationship
COMMENT ON TABLE employee_role_assignments IS 'Junction table for many-to-many relationship between employees and custom roles';
