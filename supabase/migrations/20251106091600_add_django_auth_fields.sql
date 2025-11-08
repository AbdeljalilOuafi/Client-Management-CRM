-- Add Django authentication fields to employees table
-- Run this migration in Supabase to add the missing columns

-- Add role column with enum type
DO $$ BEGIN
    CREATE TYPE employee_role AS ENUM ('super_admin', 'admin', 'employee');
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

ALTER TABLE public.employees 
ADD COLUMN IF NOT EXISTS role employee_role DEFAULT 'employee';

-- Add Django auth required fields
ALTER TABLE public.employees 
ADD COLUMN IF NOT EXISTS password VARCHAR(128) DEFAULT '',
ADD COLUMN IF NOT EXISTS is_active BOOLEAN DEFAULT TRUE,
ADD COLUMN IF NOT EXISTS is_staff BOOLEAN DEFAULT FALSE,
ADD COLUMN IF NOT EXISTS is_superuser BOOLEAN DEFAULT FALSE,
ADD COLUMN IF NOT EXISTS last_login TIMESTAMP WITH TIME ZONE;

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_employees_role ON public.employees(role);
CREATE INDEX IF NOT EXISTS idx_employees_is_active ON public.employees(is_active);
CREATE INDEX IF NOT EXISTS idx_employees_is_staff ON public.employees(is_staff);

-- Add comments for documentation
COMMENT ON COLUMN public.employees.role IS 'Employee role: super_admin, admin, or employee';
COMMENT ON COLUMN public.employees.password IS 'Django hashed password';
COMMENT ON COLUMN public.employees.is_active IS 'Whether the employee account is active';
COMMENT ON COLUMN public.employees.is_staff IS 'Whether the employee can access Django admin';
COMMENT ON COLUMN public.employees.is_superuser IS 'Whether the employee has all permissions';
COMMENT ON COLUMN public.employees.last_login IS 'Last login timestamp';
