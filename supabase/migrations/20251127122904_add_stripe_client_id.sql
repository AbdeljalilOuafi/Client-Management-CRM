-- Add stripe_client_id column to stripe_api_keys table
ALTER TABLE public.stripe_api_keys
ADD COLUMN IF NOT EXISTS stripe_client_id VARCHAR(255) NULL;

-- Add comment explaining the column
COMMENT ON COLUMN public.stripe_api_keys.stripe_client_id IS 'Stripe Connect client ID used for OAuth (ca_xxxxx)';
