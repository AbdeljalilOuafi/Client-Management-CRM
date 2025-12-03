-- Create master_tokens table for cross-account service authentication
-- These tokens are used for automation (n8n workflows) and have full access to all accounts

CREATE TABLE IF NOT EXISTS master_tokens (
    key VARCHAR(64) PRIMARY KEY,
    name VARCHAR(100) NOT NULL,
    description TEXT,
    is_active BOOLEAN NOT NULL DEFAULT TRUE,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
    last_used_at TIMESTAMP WITH TIME ZONE
);

-- Add index for active token lookups
CREATE INDEX IF NOT EXISTS idx_master_tokens_active ON master_tokens(is_active) WHERE is_active = TRUE;

-- Add comment explaining the table purpose
COMMENT ON TABLE master_tokens IS 'Service account tokens for cross-account API access (n8n workflows, automation)';
COMMENT ON COLUMN master_tokens.key IS 'Unique token key (64 char hex string)';
COMMENT ON COLUMN master_tokens.name IS 'Human-readable name for the token (e.g., CEO n8n Workflows)';
COMMENT ON COLUMN master_tokens.description IS 'Optional description of what this token is used for';
COMMENT ON COLUMN master_tokens.is_active IS 'Whether the token is currently active and can be used';
COMMENT ON COLUMN master_tokens.last_used_at IS 'Timestamp of the last API request using this token';

