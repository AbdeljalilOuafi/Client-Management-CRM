-- Create employee_roles table for custom role definitions
CREATE TABLE IF NOT EXISTS employee_roles (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    account_id INTEGER NOT NULL REFERENCES accounts(id) ON DELETE CASCADE,
    name VARCHAR(100) NOT NULL,
    description TEXT,
    color VARCHAR(7) DEFAULT '#3B82F6',
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    CONSTRAINT unique_role_per_account UNIQUE(account_id, name)
);

-- Add custom_role_id column to employees table
ALTER TABLE employees 
ADD COLUMN IF NOT EXISTS custom_role_id UUID REFERENCES employee_roles(id) ON DELETE SET NULL;

-- Create indexes for better query performance
CREATE INDEX IF NOT EXISTS idx_employees_custom_role ON employees(custom_role_id);
CREATE INDEX IF NOT EXISTS idx_employee_roles_account ON employee_roles(account_id);
CREATE INDEX IF NOT EXISTS idx_employee_roles_active ON employee_roles(is_active) WHERE is_active = true;

-- Insert default custom roles for existing accounts that have coaches, closers, or setters
-- This ensures a smooth migration from hardcoded roles to custom roles
INSERT INTO employee_roles (account_id, name, description, color)
SELECT DISTINCT 
    e.account_id, 
    'Sales Coach', 
    'Manages and coaches clients through their fitness journey', 
    '#10B981'
FROM employees e 
WHERE e.role = 'coach'
ON CONFLICT (account_id, name) DO NOTHING;

INSERT INTO employee_roles (account_id, name, description, color)
SELECT DISTINCT 
    e.account_id, 
    'Sales Closer', 
    'Closes sales deals and converts leads into clients', 
    '#F59E0B'
FROM employees e 
WHERE e.role = 'closer'
ON CONFLICT (account_id, name) DO NOTHING;

INSERT INTO employee_roles (account_id, name, description, color)
SELECT DISTINCT 
    e.account_id, 
    'Lead Setter', 
    'Sets appointments and generates qualified leads', 
    '#8B5CF6'
FROM employees e 
WHERE e.role = 'setter'
ON CONFLICT (account_id, name) DO NOTHING;

-- Migrate existing employees with coach/closer/setter roles to use custom roles
-- Update coaches
UPDATE employees e
SET custom_role_id = er.id
FROM employee_roles er
WHERE e.account_id = er.account_id
  AND e.role = 'coach' 
  AND er.name = 'Sales Coach'
  AND e.custom_role_id IS NULL;

-- Update closers
UPDATE employees e
SET custom_role_id = er.id
FROM employee_roles er
WHERE e.account_id = er.account_id
  AND e.role = 'closer' 
  AND er.name = 'Sales Closer'
  AND e.custom_role_id IS NULL;

-- Update setters
UPDATE employees e
SET custom_role_id = er.id
FROM employee_roles er
WHERE e.account_id = er.account_id
  AND e.role = 'setter' 
  AND er.name = 'Lead Setter'
  AND e.custom_role_id IS NULL;

-- Change all coach/closer/setter roles to 'employee' since custom_role now handles the label
UPDATE employees
SET role = 'employee'
WHERE role IN ('coach', 'closer', 'setter');

-- Add comment to table
COMMENT ON TABLE employee_roles IS 'Custom role definitions per account for flexible employee classification';
COMMENT ON COLUMN employee_roles.color IS 'Hex color code for UI badge display (e.g., #3B82F6)';
COMMENT ON COLUMN employees.custom_role_id IS 'Reference to custom role definition, used when role=employee';
