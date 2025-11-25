-- Add custom forms domain fields to accounts table
-- This allows super admins to configure custom subdomains for client check-in links
-- Example: check.gymname.com instead of form.fithq.ai

ALTER TABLE accounts
ADD COLUMN IF NOT EXISTS forms_domain VARCHAR(255) UNIQUE,
ADD COLUMN IF NOT EXISTS forms_domain_verified BOOLEAN DEFAULT FALSE,
ADD COLUMN IF NOT EXISTS forms_domain_configured BOOLEAN DEFAULT FALSE,
ADD COLUMN IF NOT EXISTS forms_domain_added_at TIMESTAMP WITH TIME ZONE;

-- Add short check-in link to clients table
-- This stores the shortened URL from the URL shortener service
ALTER TABLE clients
ADD COLUMN IF NOT EXISTS short_checkin_link TEXT;

-- Add indexes for faster lookups
CREATE INDEX IF NOT EXISTS idx_accounts_forms_domain ON accounts(forms_domain);
CREATE INDEX IF NOT EXISTS idx_clients_short_checkin_link ON clients(short_checkin_link);

-- Add comments for documentation
COMMENT ON COLUMN accounts.forms_domain IS 'Custom subdomain for client check-in links (e.g., check.gymname.com). Falls back to form.fithq.ai if not set.';
COMMENT ON COLUMN accounts.forms_domain_verified IS 'Whether DNS for custom domain has been verified to point to server IP';
COMMENT ON COLUMN accounts.forms_domain_configured IS 'Whether custom domain has been fully configured (SSL, Nginx, etc.)';
COMMENT ON COLUMN accounts.forms_domain_added_at IS 'Timestamp when custom domain was first configured';
COMMENT ON COLUMN clients.short_checkin_link IS 'Shortened URL for client check-in form (permanent, generated once by URL shortener)';

-- Mark short_url_domain as deprecated (keeping for backwards compatibility)
COMMENT ON COLUMN accounts.short_url_domain IS 'DEPRECATED: Use forms_domain instead. This field is kept for backwards compatibility only.';
