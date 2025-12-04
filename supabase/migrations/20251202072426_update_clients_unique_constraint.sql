-- Migration: Update clients table - multi-tenant email constraint and additional fields
-- Date: 2025-12-02
-- Purpose: Allow same email across different accounts, add phone/coach/notes fields

-- Drop existing email-only unique constraint (so same email can exist in different accounts)
ALTER TABLE clients DROP CONSTRAINT IF EXISTS clients_email_key;

-- Add multi-tenant unique constraint (email must be unique within an account)
ALTER TABLE clients
ADD CONSTRAINT clients_account_email_unique
UNIQUE (account_id, email);

-- Add missing columns to clients
ALTER TABLE clients
ADD COLUMN IF NOT EXISTS phone character varying,
ADD COLUMN IF NOT EXISTS assigned_coach text,
ADD COLUMN IF NOT EXISTS notes text;

-- Add comments for documentation
COMMENT ON CONSTRAINT clients_account_email_unique ON clients IS 'Ensures email is unique within each account, but allows same email across different accounts';
COMMENT ON COLUMN clients.phone IS 'Client contact phone number';
COMMENT ON COLUMN clients.assigned_coach IS 'Name or identifier of assigned coach';
COMMENT ON COLUMN clients.notes IS 'Additional notes or comments about the client';
