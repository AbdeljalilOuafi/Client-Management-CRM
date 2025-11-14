-- Add account_id to packages table
-- This migration makes packages account-specific instead of global

-- Add account_id column
ALTER TABLE public.packages 
ADD COLUMN IF NOT EXISTS account_id INTEGER NOT NULL DEFAULT 1;

-- Add foreign key constraint
ALTER TABLE public.packages
ADD CONSTRAINT packages_account_id_fkey 
FOREIGN KEY (account_id) 
REFERENCES public.accounts(id) 
ON DELETE CASCADE;

-- Drop the old unique constraint on package_name
ALTER TABLE public.packages
DROP CONSTRAINT IF EXISTS packages_package_name_key;

-- Add new unique constraint on account_id + package_name
ALTER TABLE public.packages
ADD CONSTRAINT packages_account_package_name_unique 
UNIQUE (account_id, package_name);

-- Create index for better query performance
CREATE INDEX IF NOT EXISTS idx_packages_account_id ON public.packages(account_id);

-- Add comment for documentation
COMMENT ON COLUMN public.packages.account_id IS 'Account that owns this package - packages are now account-specific';
