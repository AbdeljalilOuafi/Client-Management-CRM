-- Create a separate token table for Employee authentication
-- This prevents conflicts with the existing authtoken_token table used by other applications

-- Create employee_tokens table
CREATE TABLE IF NOT EXISTS public.employee_tokens (
    key VARCHAR(40) NOT NULL PRIMARY KEY,
    user_id INTEGER NOT NULL,
    created TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
    CONSTRAINT employee_tokens_user_id_fkey 
        FOREIGN KEY (user_id) 
        REFERENCES public.employees(id) 
        ON DELETE CASCADE
);

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_employee_tokens_user_id ON public.employee_tokens(user_id);
CREATE INDEX IF NOT EXISTS idx_employee_tokens_key ON public.employee_tokens(key);
CREATE UNIQUE INDEX IF NOT EXISTS idx_employee_tokens_user_id_unique ON public.employee_tokens(user_id);

-- Add comments for documentation
COMMENT ON TABLE public.employee_tokens IS 'Authentication tokens for Employee users (custom user model) - separate from authtoken_token to avoid conflicts';
COMMENT ON COLUMN public.employee_tokens.key IS 'Unique authentication token key (40 character hex string)';
COMMENT ON COLUMN public.employee_tokens.user_id IS 'Foreign key to employees table';
COMMENT ON COLUMN public.employee_tokens.created IS 'Timestamp when token was created';
