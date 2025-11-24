-- Add checkin_link UUID column to clients table
-- This permanent link allows clients to access their check-in forms

ALTER TABLE clients
ADD COLUMN IF NOT EXISTS checkin_link UUID NOT NULL DEFAULT gen_random_uuid() UNIQUE;

-- Create index for fast lookup by checkin_link
CREATE INDEX IF NOT EXISTS idx_clients_checkin_link ON clients(checkin_link);

-- Add comment
COMMENT ON COLUMN clients.checkin_link IS 'Permanent UUID link for client check-in form access (non-expiring)';
