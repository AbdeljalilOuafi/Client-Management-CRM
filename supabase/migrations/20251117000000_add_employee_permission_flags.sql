-- Add custom permission flags to employees table
-- These flags provide granular access control while preserving the existing role-based architecture

ALTER TABLE public.employees 
ADD COLUMN IF NOT EXISTS can_view_all_clients BOOLEAN DEFAULT FALSE,
ADD COLUMN IF NOT EXISTS can_manage_all_clients BOOLEAN DEFAULT FALSE,
ADD COLUMN IF NOT EXISTS can_view_all_payments BOOLEAN DEFAULT FALSE,
ADD COLUMN IF NOT EXISTS can_manage_all_payments BOOLEAN DEFAULT FALSE,
ADD COLUMN IF NOT EXISTS can_view_all_installments BOOLEAN DEFAULT FALSE,
ADD COLUMN IF NOT EXISTS can_manage_all_installments BOOLEAN DEFAULT FALSE;

-- Add comments for documentation
COMMENT ON COLUMN public.employees.can_view_all_clients IS 'Can view all clients in account (not just assigned)';
COMMENT ON COLUMN public.employees.can_manage_all_clients IS 'Can create/update/delete all clients (not just assigned)';
COMMENT ON COLUMN public.employees.can_view_all_payments IS 'Can view all payments in account';
COMMENT ON COLUMN public.employees.can_manage_all_payments IS 'Can create/update/delete payments';
COMMENT ON COLUMN public.employees.can_view_all_installments IS 'Can view all installments in account';
COMMENT ON COLUMN public.employees.can_manage_all_installments IS 'Can create/update/delete installments';

-- Super admins should have all permissions by default
UPDATE public.employees 
SET 
    can_view_all_clients = TRUE,
    can_manage_all_clients = TRUE,
    can_view_all_payments = TRUE,
    can_manage_all_payments = TRUE,
    can_view_all_installments = TRUE,
    can_manage_all_installments = TRUE
WHERE role = 'super_admin';

-- Admins get view permissions by default (they can be granted manage permissions individually)
UPDATE public.employees 
SET 
    can_view_all_clients = TRUE,
    can_view_all_payments = TRUE,
    can_view_all_installments = TRUE
WHERE role = 'admin';
