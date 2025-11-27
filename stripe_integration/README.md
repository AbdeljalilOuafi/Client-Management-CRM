# Stripe OAuth Integration

Complete Stripe Connect OAuth implementation for linking Stripe accounts to CRM accounts.

## Overview

This Django app handles the OAuth flow for connecting Stripe accounts to CRM accounts via Stripe Connect. When an admin connects their Stripe account, the CRM stores the OAuth credentials to enable payment processing features.

## Features

- **OAuth Flow**: Complete authorization code exchange with Stripe
- **Account Linking**: Links Stripe accounts to CRM accounts
- **Secure Token Storage**: Stores Stripe API keys (access tokens) securely
- **Admin Interface**: Manage connected Stripe accounts
- **Multi-tenant**: Each CRM account can have its own Stripe connection

## Architecture

### Models

**StripeApiKey** (`stripe_api_keys` table):
- `account` - Foreign key to CRM Account (multi-tenant)
- `stripe_account` - Stripe account ID (e.g., `acct_1234567890`)
- `stripe_client_id` - Stripe Connect application client ID (e.g., `ca_1234567890`)
- `api_key` - Stripe API key (access token from OAuth, e.g., `sk_live_1234567890`)
- `is_active` - Boolean flag to enable/disable the connection
- `is_primary` - Boolean flag for accounts with multiple Stripe connections
- `checkout_url` - Payment link URL
- `checkout_url_one_time` - One-time payment link URL
- Timestamps: `created_at`, `updated_at`

**Unique Constraint**: `unique_together = [['account', 'stripe_account']]`

### Views

**StripeOAuthCallbackView** (`/api/stripe/callback/`):
- Handles OAuth redirect from Stripe
- Exchanges authorization code for access token
- Retrieves Stripe account details
- Saves/updates StripeApiKey record
- Redirects to frontend with success message

**Flow**:
1. User clicks "Connect with Stripe" button in CRM
2. Redirects to Stripe OAuth page with `client_id`, `redirect_uri`, and `state` (account_id)
3. User authorizes in Stripe
4. Stripe redirects to `/api/stripe/callback/?code=XXX&state=ACCOUNT_ID`
5. Backend exchanges code for access token
6. Backend retrieves Stripe account details
7. Backend saves to database
8. Backend redirects to `/settings?stripe_connected=true&account_name=Business%20Name`

### API Endpoints

**GET /api/stripe/callback/**
- **Purpose**: OAuth callback endpoint (handled by Stripe redirect)
- **Query Params**:
  - `code` (required) - Authorization code from Stripe
  - `state` (required) - CRM account ID
- **Responses**:
  - 302 Redirect to `/settings?stripe_connected=true&account_name=...` on success
  - 400 with `{"error": "Missing code or state parameter"}` on missing params
  - 500 with `{"error": "OAuth failed: ..."}` on Stripe API errors

## Setup Instructions

### 1. Environment Variables

Add to `.env`:

```bash
# Stripe OAuth Configuration
STRIPE_CLIENT_ID=ca_1234567890  # From Stripe Connect settings
STRIPE_SECRET_KEY=sk_test_1234567890  # Stripe secret key
STRIPE_OAUTH_REDIRECT_URI=https://stripe.fithq.ai/api/stripe/callback/
```

**Development**:
```bash
STRIPE_CLIENT_ID=ca_test_1234567890
STRIPE_SECRET_KEY=sk_test_1234567890
STRIPE_OAUTH_REDIRECT_URI=http://localhost:8000/api/stripe/callback/
```

### 2. Database Migration

Run the Supabase migration to add the `stripe_client_id` column:

```bash
supabase migration up
```

Or manually apply:
```sql
ALTER TABLE public.stripe_api_keys 
ADD COLUMN IF NOT EXISTS stripe_client_id VARCHAR(255) NULL;
```

### 3. Nginx Configuration (Production)

**a) Create subdomain configuration:**
```bash
sudo cp deployment/nginx-stripe.conf /etc/nginx/sites-available/stripe.fithq.ai
sudo ln -s /etc/nginx/sites-available/stripe.fithq.ai /etc/nginx/sites-enabled/
```

**b) Obtain SSL certificate:**
```bash
sudo certbot --nginx -d stripe.fithq.ai
```

**c) Test and reload nginx:**
```bash
sudo nginx -t
sudo systemctl reload nginx
```

### 4. Stripe Connect Application Setup

**a) Create Stripe Connect application:**
1. Go to Stripe Dashboard → Settings → Connect
2. Click "Build a Connect platform"
3. Set OAuth redirect URI to: `https://stripe.fithq.ai/api/stripe/callback/`
4. Copy the Client ID (starts with `ca_`)

**b) Configure environment:**
- Add `STRIPE_CLIENT_ID` to production `.env`
- Add `STRIPE_SECRET_KEY` (your main Stripe secret key)

### 5. Frontend Integration

**a) Add "Connect with Stripe" button:**

```typescript
// components/ConnectStripeButton.tsx
import { useEffect } from 'react';
import { useRouter } from 'next/navigation';

export default function ConnectStripeButton() {
  const router = useRouter();
  
  const handleConnect = () => {
    const clientId = process.env.NEXT_PUBLIC_STRIPE_CLIENT_ID;
    const redirectUri = 'https://stripe.fithq.ai/api/stripe/callback/';
    const accountId = localStorage.getItem('accountId');
    
    const stripeUrl = `https://connect.stripe.com/oauth/authorize?` +
      `response_type=code` +
      `&client_id=${clientId}` +
      `&scope=read_write` +
      `&redirect_uri=${encodeURIComponent(redirectUri)}` +
      `&state=${accountId}`;
    
    window.location.href = stripeUrl;
  };
  
  return (
    <button onClick={handleConnect} className="btn-primary">
      Connect with Stripe
    </button>
  );
}
```

**b) Handle OAuth callback in settings page:**

```typescript
// app/settings/page.tsx
'use client';
import { useEffect } from 'react';
import { useSearchParams } from 'next/navigation';

export default function SettingsPage() {
  const searchParams = useSearchParams();
  
  useEffect(() => {
    const connected = searchParams.get('stripe_connected');
    const accountName = searchParams.get('account_name');
    
    if (connected === 'true') {
      alert(`Successfully connected Stripe account: ${accountName}`);
      // Refresh Stripe connection status
    }
  }, [searchParams]);
  
  return (
    <div>
      <h1>Settings</h1>
      <ConnectStripeButton />
    </div>
  );
}
```

**c) Add environment variable to frontend:**

```bash
# frontend/.env.local
NEXT_PUBLIC_STRIPE_CLIENT_ID=ca_1234567890
```

## Testing

### Unit Tests

Run the test suite:
```bash
pytest stripe_integration/tests.py -v
```

**Test cases**:
1. `test_callback_missing_code` - Validates error handling for missing code
2. `test_callback_missing_state` - Validates error handling for missing state
3. `test_successful_oauth_callback` - Validates complete OAuth flow with mocked Stripe API

### Manual Testing

**Development flow:**
1. Start Django server: `python manage.py runserver`
2. Navigate to: `http://localhost:8000/admin/api/stripeapikey/`
3. Test OAuth flow with Stripe test credentials

**Production flow:**
1. Deploy code to production
2. Set up nginx subdomain
3. Configure Stripe Connect with production redirect URI
4. Test with real Stripe OAuth

## Security Considerations

1. **HTTPS Required**: OAuth callbacks MUST use HTTPS in production
2. **State Parameter**: Used to pass account_id and prevent CSRF attacks
3. **Secure Token Storage**: API keys stored in database, never exposed to frontend
4. **Scope Management**: Request only necessary Stripe permissions (`read_write`)
5. **Error Handling**: Detailed error logging, generic errors to frontend
6. **Admin Access**: Only admins can manage Stripe connections

## API Reference

### Serializer Fields

**StripeApiKeySerializer**:
```json
{
  "id": 1,
  "account": 1,
  "account_name": "Acme Corp",
  "stripe_account": "acct_1234567890",
  "stripe_client_id": "ca_1234567890",
  "api_key": "***",  // Write-only, hidden in responses
  "is_active": true,
  "is_primary": true,
  "checkout_url": "https://checkout.stripe.com/...",
  "checkout_url_one_time": "https://checkout.stripe.com/...",
  "created_at": "2024-01-01T00:00:00Z",
  "updated_at": "2024-01-01T00:00:00Z"
}
```

## Troubleshooting

### OAuth Callback Fails

**Issue**: `redirect_uri_mismatch` error from Stripe

**Solutions**:
1. Verify redirect URI in Stripe Dashboard matches exactly: `https://stripe.fithq.ai/api/stripe/callback/`
2. Check nginx configuration routes to Django correctly
3. Verify `STRIPE_OAUTH_REDIRECT_URI` in `.env`

### Missing state Parameter

**Issue**: Database saves with `account_id=None`

**Solutions**:
1. Ensure frontend passes `state` parameter with account ID
2. Check browser console for frontend errors
3. Verify localStorage has `accountId`

### Stripe API Errors

**Issue**: `stripe.error.AuthenticationError`

**Solutions**:
1. Verify `STRIPE_SECRET_KEY` in `.env` is correct
2. Check Stripe dashboard for API key validity
3. Ensure using correct key (test vs live mode)

### 404 on Callback

**Issue**: `/api/stripe/callback/` returns 404

**Solutions**:
1. Verify `stripe_integration` in `INSTALLED_APPS`
2. Check `config/urls.py` includes `path('api/stripe/', include('stripe_integration.urls'))`
3. Restart Django server

## Future Enhancements

- [ ] Support for multiple Stripe accounts per CRM account (already supported in model)
- [ ] Webhook handling for Stripe events (payment success, subscription changes)
- [ ] Automatic refresh of expired tokens
- [ ] Dashboard to view Stripe payment statistics
- [ ] Support for Stripe Express/Custom account types

## References

- [Stripe Connect OAuth Documentation](https://stripe.com/docs/connect/oauth-reference)
- [Stripe Python Library](https://github.com/stripe/stripe-python)
- [Django REST Framework](https://www.django-rest-framework.org/)
