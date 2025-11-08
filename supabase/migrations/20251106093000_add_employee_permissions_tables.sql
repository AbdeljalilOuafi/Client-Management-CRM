-- Create Django's many-to-many tables for Employee model permissions and groups
-- These are required by Django's PermissionsMixin

-- Create employees_groups table (for group membership)
CREATE TABLE IF NOT EXISTS public.employees_groups (
    id SERIAL PRIMARY KEY,
    employee_id INTEGER NOT NULL,
    group_id INTEGER NOT NULL,
    CONSTRAINT employees_groups_employee_id_fkey 
        FOREIGN KEY (employee_id) 
        REFERENCES public.employees(id) 
        ON DELETE CASCADE,
    CONSTRAINT employees_groups_group_id_fkey 
        FOREIGN KEY (group_id) 
        REFERENCES public.auth_group(id) 
        ON DELETE CASCADE,
    CONSTRAINT employees_groups_employee_id_group_id_unique 
        UNIQUE (employee_id, group_id)
);

-- Create employees_user_permissions table (for individual permissions)
CREATE TABLE IF NOT EXISTS public.employees_user_permissions (
    id SERIAL PRIMARY KEY,
    employee_id INTEGER NOT NULL,
    permission_id INTEGER NOT NULL,
    CONSTRAINT employees_user_permissions_employee_id_fkey 
        FOREIGN KEY (employee_id) 
        REFERENCES public.employees(id) 
        ON DELETE CASCADE,
    CONSTRAINT employees_user_permissions_permission_id_fkey 
        FOREIGN KEY (permission_id) 
        REFERENCES public.auth_permission(id) 
        ON DELETE CASCADE,
    CONSTRAINT employees_user_permissions_employee_id_permission_id_unique 
        UNIQUE (employee_id, permission_id)
);

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_employees_groups_employee_id ON public.employees_groups(employee_id);
CREATE INDEX IF NOT EXISTS idx_employees_groups_group_id ON public.employees_groups(group_id);
CREATE INDEX IF NOT EXISTS idx_employees_user_permissions_employee_id ON public.employees_user_permissions(employee_id);
CREATE INDEX IF NOT EXISTS idx_employees_user_permissions_permission_id ON public.employees_user_permissions(permission_id);

-- Add comments for documentation
COMMENT ON TABLE public.employees_groups IS 'Many-to-many relationship between employees and auth groups';
COMMENT ON TABLE public.employees_user_permissions IS 'Many-to-many relationship between employees and permissions';
