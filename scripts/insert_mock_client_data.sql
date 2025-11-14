-- ============================================================
-- Mock Client Data Insertion Script
-- Account ID: 1
-- Run this in Supabase SQL Editor
-- ============================================================

-- Begin transaction
BEGIN;

-- ============================================================
-- 1. Insert Mock Client
-- ============================================================
INSERT INTO public.clients (
    account_id,
    first_name,
    last_name,
    email,
    status,
    address,
    instagram_handle,
    ghl_id,
    coaching_app_id,
    trz_id,
    client_start_date,
    client_end_date,
    dob,
    country,
    state,
    currency,
    gender,
    lead_origin,
    notice_given,
    no_more_payments,
    timezone,
    coach_id,
    closer_id,
    setter_id
) VALUES (
    1,                                          -- account_id
    'Sarah',                                    -- first_name
    'Johnson',                                  -- last_name
    'sarah.johnson@example.com',                -- email (must be unique)
    'active',                                   -- status: pending|active|inactive|onboarding|paused|cancelled
    '123 Main Street, Apt 4B, New York, NY',   -- address
    '@sarahj_fitness',                          -- instagram_handle
    'ghl_' || gen_random_uuid()::text,          -- ghl_id (random)
    'coach_' || gen_random_uuid()::text,        -- coaching_app_id (random)
    'trz_' || gen_random_uuid()::text,          -- trz_id (random)
    '2024-06-01',                               -- client_start_date
    '2025-06-01',                               -- client_end_date
    '1990-05-15',                               -- dob
    'US',                                       -- country
    'New York',                                 -- state
    'USD',                                      -- currency
    'Female',                                   -- gender
    'Facebook Ad Campaign - Summer 2024',       -- lead_origin
    false,                                      -- notice_given
    false,                                      -- no_more_payments
    'America/New_York',                         -- timezone
    (SELECT id FROM public.employees WHERE account_id = 1 AND role IN ('coach', 'super_admin', 'admin') LIMIT 1),  -- coach_id (first available employee)
    (SELECT id FROM public.employees WHERE account_id = 1 AND role IN ('closer', 'super_admin', 'admin') LIMIT 1), -- closer_id
    (SELECT id FROM public.employees WHERE account_id = 1 AND role IN ('setter', 'super_admin', 'admin') LIMIT 1)  -- setter_id
)
RETURNING id;

-- Store the client ID for later use
DO $$
DECLARE
    v_client_id INTEGER;
    v_package_id INTEGER;
    v_client_package_id INTEGER;
    v_stripe_customer_id TEXT;
BEGIN
    -- Get the client we just inserted
    SELECT id INTO v_client_id FROM public.clients WHERE email = 'sarah.johnson@example.com';
    
    -- ============================================================
    -- 2. Insert Package (if doesn't exist)
    -- ============================================================
    INSERT INTO public.packages (
        account_id,
        package_name,
        description
    ) VALUES (
        1,
        'Premium Coaching Package',
        '12-month premium one-on-one coaching with weekly check-ins and custom meal plans'
    )
    ON CONFLICT (account_id, package_name) DO NOTHING
    RETURNING id INTO v_package_id;
    
    -- Get package ID if it already existed
    IF v_package_id IS NULL THEN
        SELECT id INTO v_package_id FROM public.packages 
        WHERE account_id = 1 AND package_name = 'Premium Coaching Package';
    END IF;
    
    -- ============================================================
    -- 3. Insert Client Package
    -- ============================================================
    INSERT INTO public.client_packages (
        client_id,
        package_id,
        custom_price,
        monthly_payment_amount,
        pif_months,
        stripe_account,
        payment_schedule,
        start_date,
        package_end_date,
        package_type,
        payments_left,
        review_type,
        checkin_type,
        checkin_day,
        minimum_term,
        status
    ) VALUES (
        v_client_id,
        v_package_id,
        1199.88,                    -- custom_price (total)
        99.99,                      -- monthly_payment_amount
        12,                         -- pif_months
        'acct_mock_default',        -- stripe_account
        'Monthly',                  -- payment_schedule: PIF|Monthly|Quarterly|Yearly
        '2024-06-01',               -- start_date
        '2025-06-01',               -- package_end_date
        'Premium',                  -- package_type
        7,                          -- payments_left (12 total - 5 paid)
        'Weekly',                   -- review_type
        'Video Call',               -- checkin_type
        'Monday',                   -- checkin_day
        12,                         -- minimum_term (months)
        'active'                    -- status: active|inactive
    )
    RETURNING id INTO v_client_package_id;
    
    -- ============================================================
    -- 4. Insert Stripe API Key (if doesn't exist)
    -- ============================================================
    INSERT INTO public.stripe_api_keys (
        client_account_id,
        stripe_account,
        api_key,
        is_active,
        checkout_thanks_url,
        checkout_cancelled_url
    ) VALUES (
        1,
        'acct_mock_default',
        'sk_test_mock_' || substring(gen_random_uuid()::text, 1, 24),
        true,
        'https://example.com/thanks',
        'https://example.com/cancelled'
    )
    ON CONFLICT (stripe_account) DO NOTHING;
    
    -- ============================================================
    -- 5. Insert Stripe Customer
    -- ============================================================
    v_stripe_customer_id := 'cus_mock_' || substring(gen_random_uuid()::text, 1, 24);
    
    INSERT INTO public.stripe_customers (
        stripe_customer_id,
        account_id,
        client_id,
        stripe_account,
        email,
        status
    ) VALUES (
        v_stripe_customer_id,
        1,
        v_client_id,
        'acct_mock_default',
        'sarah.johnson@example.com',
        'active'
    );
    
    -- ============================================================
    -- 6. Insert Multiple Payments (5 successful payments)
    -- ============================================================
    -- Payment 1 (June 2024)
    INSERT INTO public.payments (
        id,
        account_id,
        client_package_id,
        client_id,
        stripe_customer_id,
        amount,
        currency,
        exchange_rate,
        native_account_currency,
        status,
        failure_reason,
        payment_date
    ) VALUES (
        'pi_mock_' || substring(gen_random_uuid()::text, 1, 24),
        1,
        v_client_package_id,
        v_client_id,
        v_stripe_customer_id,
        99.99,
        'USD',
        1.0,
        'USD',
        'paid',
        NULL,
        '2024-06-01 10:30:00+00'::timestamptz
    );
    
    -- Payment 2 (July 2024)
    INSERT INTO public.payments (
        id,
        account_id,
        client_package_id,
        client_id,
        stripe_customer_id,
        amount,
        currency,
        exchange_rate,
        native_account_currency,
        status,
        failure_reason,
        payment_date
    ) VALUES (
        'pi_mock_' || substring(gen_random_uuid()::text, 1, 24),
        1,
        v_client_package_id,
        v_client_id,
        v_stripe_customer_id,
        99.99,
        'USD',
        1.0,
        'USD',
        'paid',
        NULL,
        '2024-07-01 10:30:00+00'::timestamptz
    );
    
    -- Payment 3 (August 2024)
    INSERT INTO public.payments (
        id,
        account_id,
        client_package_id,
        client_id,
        stripe_customer_id,
        amount,
        currency,
        exchange_rate,
        native_account_currency,
        status,
        failure_reason,
        payment_date
    ) VALUES (
        'pi_mock_' || substring(gen_random_uuid()::text, 1, 24),
        1,
        v_client_package_id,
        v_client_id,
        v_stripe_customer_id,
        99.99,
        'USD',
        1.0,
        'USD',
        'paid',
        NULL,
        '2024-08-01 10:30:00+00'::timestamptz
    );
    
    -- Payment 4 (September 2024)
    INSERT INTO public.payments (
        id,
        account_id,
        client_package_id,
        client_id,
        stripe_customer_id,
        amount,
        currency,
        exchange_rate,
        native_account_currency,
        status,
        failure_reason,
        payment_date
    ) VALUES (
        'pi_mock_' || substring(gen_random_uuid()::text, 1, 24),
        1,
        v_client_package_id,
        v_client_id,
        v_stripe_customer_id,
        99.99,
        'USD',
        1.0,
        'USD',
        'paid',
        NULL,
        '2024-09-01 10:30:00+00'::timestamptz
    );
    
    -- Payment 5 (October 2024)
    INSERT INTO public.payments (
        id,
        account_id,
        client_package_id,
        client_id,
        stripe_customer_id,
        amount,
        currency,
        exchange_rate,
        native_account_currency,
        status,
        failure_reason,
        payment_date
    ) VALUES (
        'pi_mock_' || substring(gen_random_uuid()::text, 1, 24),
        1,
        v_client_package_id,
        v_client_id,
        v_stripe_customer_id,
        99.99,
        'USD',
        1.0,
        'USD',
        'paid',
        NULL,
        '2024-10-01 10:30:00+00'::timestamptz
    );
    
    -- ============================================================
    -- 7. Insert Upcoming Installments (7 remaining payments)
    -- ============================================================
    -- November 2024
    INSERT INTO public.instalments (
        account_id,
        client_id,
        invoice_id,
        stripe_customer_id,
        stripe_account,
        amount,
        currency,
        status,
        instalment_number,
        schedule_date,
        date_created,
        date_updated
    ) VALUES (
        1,
        v_client_id,
        'in_mock_' || substring(gen_random_uuid()::text, 1, 20),
        v_stripe_customer_id,
        'acct_mock_default',
        99.99,
        'USD',
        'open',
        6,
        '2024-11-01',
        NOW(),
        NOW()
    );
    
    -- December 2024
    INSERT INTO public.instalments (
        account_id,
        client_id,
        invoice_id,
        stripe_customer_id,
        stripe_account,
        amount,
        currency,
        status,
        instalment_number,
        schedule_date,
        date_created,
        date_updated
    ) VALUES (
        1,
        v_client_id,
        'in_mock_' || substring(gen_random_uuid()::text, 1, 20),
        v_stripe_customer_id,
        'acct_mock_default',
        99.99,
        'USD',
        'open',
        7,
        '2024-12-01',
        NOW(),
        NOW()
    );
    
    -- January 2025
    INSERT INTO public.instalments (
        account_id,
        client_id,
        invoice_id,
        stripe_customer_id,
        stripe_account,
        amount,
        currency,
        status,
        instalment_number,
        schedule_date,
        date_created,
        date_updated
    ) VALUES (
        1,
        v_client_id,
        'in_mock_' || substring(gen_random_uuid()::text, 1, 20),
        v_stripe_customer_id,
        'acct_mock_default',
        99.99,
        'USD',
        'open',
        8,
        '2025-01-01',
        NOW(),
        NOW()
    );
    
    -- February 2025
    INSERT INTO public.instalments (
        account_id,
        client_id,
        invoice_id,
        stripe_customer_id,
        stripe_account,
        amount,
        currency,
        status,
        instalment_number,
        schedule_date,
        date_created,
        date_updated
    ) VALUES (
        1,
        v_client_id,
        'in_mock_' || substring(gen_random_uuid()::text, 1, 20),
        v_stripe_customer_id,
        'acct_mock_default',
        99.99,
        'USD',
        'open',
        9,
        '2025-02-01',
        NOW(),
        NOW()
    );
    
    -- March 2025
    INSERT INTO public.instalments (
        account_id,
        client_id,
        invoice_id,
        stripe_customer_id,
        stripe_account,
        amount,
        currency,
        status,
        instalment_number,
        schedule_date,
        date_created,
        date_updated
    ) VALUES (
        1,
        v_client_id,
        'in_mock_' || substring(gen_random_uuid()::text, 1, 20),
        v_stripe_customer_id,
        'acct_mock_default',
        99.99,
        'USD',
        'open',
        10,
        '2025-03-01',
        NOW(),
        NOW()
    );
    
    -- April 2025
    INSERT INTO public.instalments (
        account_id,
        client_id,
        invoice_id,
        stripe_customer_id,
        stripe_account,
        amount,
        currency,
        status,
        instalment_number,
        schedule_date,
        date_created,
        date_updated
    ) VALUES (
        1,
        v_client_id,
        'in_mock_' || substring(gen_random_uuid()::text, 1, 20),
        v_stripe_customer_id,
        'acct_mock_default',
        99.99,
        'USD',
        'open',
        11,
        '2025-04-01',
        NOW(),
        NOW()
    );
    
    -- May 2025
    INSERT INTO public.instalments (
        account_id,
        client_id,
        invoice_id,
        stripe_customer_id,
        stripe_account,
        amount,
        currency,
        status,
        instalment_number,
        schedule_date,
        date_created,
        date_updated
    ) VALUES (
        1,
        v_client_id,
        'in_mock_' || substring(gen_random_uuid()::text, 1, 20),
        v_stripe_customer_id,
        'acct_mock_default',
        99.99,
        'USD',
        'open',
        12,
        '2025-05-01',
        NOW(),
        NOW()
    );
    
    -- ============================================================
    -- Success Message
    -- ============================================================
    RAISE NOTICE 'Mock client data inserted successfully!';
    RAISE NOTICE 'Client ID: %', v_client_id;
    RAISE NOTICE 'Client Name: Sarah Johnson';
    RAISE NOTICE 'Email: sarah.johnson@example.com';
    RAISE NOTICE 'Package: Premium Coaching Package';
    RAISE NOTICE 'Payments: 5 paid (total: $499.95)';
    RAISE NOTICE 'Installments: 7 upcoming';
    RAISE NOTICE 'LTV: $499.95';
    RAISE NOTICE 'Next Payment: 2024-11-01';
    
END $$;

-- Commit transaction
COMMIT;

-- ============================================================
-- Verification Query (run separately to verify)
-- ============================================================
-- SELECT 
--     c.id,
--     c.first_name || ' ' || c.last_name as client_name,
--     c.email,
--     c.status,
--     cp.package_type,
--     cp.monthly_payment_amount,
--     cp.payments_left,
--     COUNT(DISTINCT p.id) as payments_count,
--     SUM(p.amount) as total_paid,
--     COUNT(DISTINCT i.id) as installments_count
-- FROM clients c
-- LEFT JOIN client_packages cp ON cp.client_id = c.id
-- LEFT JOIN payments p ON p.client_id = c.id AND p.status = 'paid'
-- LEFT JOIN instalments i ON i.client_id = c.id AND i.status = 'open'
-- WHERE c.email = 'sarah.johnson@example.com'
-- GROUP BY c.id, c.first_name, c.last_name, c.email, c.status, cp.package_type, cp.monthly_payment_amount, cp.payments_left;
