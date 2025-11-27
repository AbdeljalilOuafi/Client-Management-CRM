"""
Stripe OAuth Integration Views
Handles Stripe Connect OAuth flow for connecting Stripe accounts
"""
import logging
import stripe
from django.shortcuts import redirect
from django.conf import settings
from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework import status
from .models import StripeApiKey

logger = logging.getLogger(__name__)

# Initialize Stripe with your secret key
stripe.api_key = settings.STRIPE_SECRET_KEY


class StripeOAuthCallbackView(APIView):
    """
    Handles the OAuth callback from Stripe after user authorization.
    
    Flow:
    1. User clicks "Connect Stripe" in frontend → redirects to Stripe
    2. User authorizes on Stripe → Stripe redirects here with code & state
    3. Exchange code for stripe_user_id and access_token
    4. Fetch Stripe account details to get account name
    5. Save to stripe_api_keys table with account_id from state
    6. Redirect user back to frontend settings page
    
    URL Parameters:
        code: Authorization code from Stripe
        state: Our account_id passed through OAuth flow
        error: Error code if user denied authorization
    """
    
    permission_classes = []  # Public endpoint - no authentication required
    
    def get(self, request):
        """Handle GET request from Stripe OAuth redirect"""
        
        # Get parameters from Stripe's redirect
        code = request.GET.get('code')  # Authorization code
        state = request.GET.get('state')  # Our account_id
        error = request.GET.get('error')  # Error if user denied
        
        # Handle case where user denied authorization
        if error:
            logger.warning(f"User denied Stripe authorization: {error}")
            return redirect(f'https://app.fithq.ai/integrations?error={error}')
        
        # Validate required parameters
        if not code or not state:
            logger.error(f"Missing OAuth parameters - code: {bool(code)}, state: {bool(state)}")
            return Response(
                {'error': 'Missing code or state parameter'},
                status=status.HTTP_400_BAD_REQUEST
            )
        
        # Convert state back to account_id
        try:
            account_id = int(state)
        except ValueError:
            logger.error(f"Invalid state parameter: {state}")
            return Response(
                {'error': 'Invalid state parameter'},
                status=status.HTTP_400_BAD_REQUEST
            )
        
        try:
            # STEP 1: Exchange authorization code for tokens
            logger.info(f"Exchanging OAuth code for account_id: {account_id}")
            token_response = stripe.OAuth.token(
                grant_type='authorization_code',
                code=code,
            )
            
            # Extract the important values from response
            stripe_user_id = token_response.get('stripe_user_id')  # acct_xxxxx
            access_token = token_response.get('access_token')      # sk_live_xxxxx
            
            if not stripe_user_id or not access_token:
                logger.error(f"Missing data in token response: {token_response}")
                return redirect('https://app.fithq.ai/integrations?error=invalid_response')
            
            logger.info(f"Successfully obtained Stripe account ID: {stripe_user_id}")
            
            # STEP 2: Fetch the Stripe account details using the Account API
            # Set authorization header with secret key
            stripe.api_key = settings.STRIPE_SECRET_KEY
            stripe_account_data = stripe.Account.retrieve(stripe_user_id)
            logger.info(f"Retrieved Stripe account data :\n{stripe_account_data}")
            # STEP 3: Extract business display name (with fallback chain)
            business_name = (
                stripe_account_data.get('settings', {}).get('dashboard', {}).get('display_name') or
                stripe_account_data.get('business_profile', {}).get('name') or
                stripe_account_data.get('company', {}).get('name') or
                stripe_account_data.get('email') or
                'Unknown Account'
            )
            
            logger.info(f"Stripe business name: {business_name}, Account ID: {stripe_user_id}")
            
            # STEP 4: Save to database
            # Use update_or_create to handle existing connections
            # Note: stripe_account stores the business name (unique key)
            stripe_api_key, created = StripeApiKey.objects.update_or_create(
                stripe_account=business_name,  # Business display name (unique key)
                defaults={
                    'account_id': account_id,           # Link to our CRM account
                    'stripe_client_id': stripe_user_id, # Stripe account ID (acct_xxxxx)
                    'api_key': access_token,            # Store access token (sk_live_xxxxx)
                    'is_active': True,                  # Mark as active
                    'is_primary': False,                # Always False
                }
            )
            
            action = 'created' if created else 'updated'
            logger.info(f"Stripe API key {action} for account_id {account_id}, business: {business_name}")
            
            # Redirect user back to frontend with success message
            return redirect(
                f'https://app.fithq.ai/integrations?stripe_connected=true&account_name={business_name}'
            )
            
        except stripe.error.StripeError as e:
            # Handle Stripe-specific errors
            logger.error(f"Stripe API error: {str(e)}", exc_info=True)
            return redirect(f'https://app.fithq.ai/integrations?error=stripe_error')
            
        except Exception as e:
            # Handle any other errors
            logger.error(f"Unexpected error during Stripe OAuth: {str(e)}", exc_info=True)
            return redirect(f'https://app.fithq.ai/integrations?error=connection_failed')
