-- Add payment domain fields to accounts table
-- These fields mirror the forms_domain structure for payment link custom domains

ALTER TABLE accounts 
ADD COLUMN IF NOT EXISTS payment_domain VARCHAR(255) UNIQUE,
ADD COLUMN IF NOT EXISTS payment_domain_verified BOOLEAN DEFAULT FALSE,
ADD COLUMN IF NOT EXISTS payment_domain_configured BOOLEAN DEFAULT FALSE,
ADD COLUMN IF NOT EXISTS payment_domain_added_at TIMESTAMPTZ;

-- Add comments for documentation
COMMENT ON COLUMN accounts.payment_domain IS 'Custom subdomain for payment links (e.g., pay.gymname.com)';
COMMENT ON COLUMN accounts.payment_domain_verified IS 'Whether DNS has been verified for payment domain';
COMMENT ON COLUMN accounts.payment_domain_configured IS 'Whether payment domain is fully configured with SSL and Nginx';
COMMENT ON COLUMN accounts.payment_domain_added_at IS 'Timestamp when custom payment domain was configured';
