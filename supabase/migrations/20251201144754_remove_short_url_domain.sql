-- Migration: Remove deprecated short_url_domain from accounts
-- Date: 2025-12-01
-- Note: This field has been replaced by forms_domain and payment_domain

-- Drop the deprecated column
ALTER TABLE accounts 
DROP COLUMN IF EXISTS short_url_domain;

-- Add comment to document replacement
COMMENT ON COLUMN accounts.forms_domain IS 'Custom domain for check-in forms (replaces deprecated short_url_domain)';
COMMENT ON COLUMN accounts.payment_domain IS 'Custom domain for payment links';
