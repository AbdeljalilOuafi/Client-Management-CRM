-- Add coach, closer, and setter roles to employee_role enum
-- This migration extends the existing employee_role enum type

-- Add new values to the employee_role enum
ALTER TYPE employee_role ADD VALUE IF NOT EXISTS 'coach';
ALTER TYPE employee_role ADD VALUE IF NOT EXISTS 'closer';
ALTER TYPE employee_role ADD VALUE IF NOT EXISTS 'setter';

-- Add comment for documentation
COMMENT ON TYPE employee_role IS 'Employee roles: super_admin, admin, employee, coach, closer, setter';
