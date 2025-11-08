-- Add account_id to payments and instalments tables for easier querying
-- This denormalizes the account relationship for better query performance

-- ============================================
-- Add account_id to payments table
-- ============================================

-- Add the column
ALTER TABLE public.payments 
ADD COLUMN IF NOT EXISTS account_id INTEGER;

-- Add foreign key constraint
ALTER TABLE public.payments
ADD CONSTRAINT payments_account_id_fkey 
FOREIGN KEY (account_id) 
REFERENCES public.accounts(id) 
ON DELETE CASCADE;

-- Create index for better query performance
CREATE INDEX IF NOT EXISTS idx_payments_account_id ON public.payments(account_id);

-- Backfill existing data (set account_id from client's account)
UPDATE public.payments p
SET account_id = c.account_id
FROM public.clients c
WHERE p.client_id = c.id
AND p.account_id IS NULL;

-- Make it NOT NULL after backfilling
ALTER TABLE public.payments 
ALTER COLUMN account_id SET NOT NULL;

-- Add comment
COMMENT ON COLUMN public.payments.account_id IS 'Account that owns this payment (denormalized from client for query performance)';


-- ============================================
-- Add account_id to instalments table
-- ============================================

-- Add the column
ALTER TABLE public.instalments 
ADD COLUMN IF NOT EXISTS account_id INTEGER;

-- Add foreign key constraint
ALTER TABLE public.instalments
ADD CONSTRAINT instalments_account_id_fkey 
FOREIGN KEY (account_id) 
REFERENCES public.accounts(id) 
ON DELETE CASCADE;

-- Create index for better query performance
CREATE INDEX IF NOT EXISTS idx_instalments_account_id ON public.instalments(account_id);

-- Backfill existing data (set account_id from client's account)
UPDATE public.instalments i
SET account_id = c.account_id
FROM public.clients c
WHERE i.client_id = c.id
AND i.account_id IS NULL;

-- Make it NOT NULL after backfilling
ALTER TABLE public.instalments 
ALTER COLUMN account_id SET NOT NULL;

-- Add comment
COMMENT ON COLUMN public.instalments.account_id IS 'Account that owns this installment (denormalized from client for query performance)';
