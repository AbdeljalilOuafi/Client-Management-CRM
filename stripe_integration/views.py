"""
Stripe OAuth Integration Views
Handles Stripe Connect OAuth flow for connecting Stripe accounts
"""
import logging
import stripe
from django.shortcuts import redirect
from django.conf import settings
from django.db import transaction
from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework import status, viewsets, serializers
from rest_framework.decorators import action
from rest_framework.permissions import IsAuthenticated
from .models import StripeApiKey
from .serializers import StripeApiKeySerializer
from api.permissions import IsAccountMember, IsSuperAdmin
from api.mixins import AccountResolutionMixin

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
            
            # STEP 4: Extract default currency
            default_currency = stripe_account_data.get('default_currency', 'usd')
            
            # STEP 5: Check if this is the first Stripe account for this CRM account
            is_first_account = not StripeApiKey.objects.filter(account_id=account_id).exists()
            
            # STEP 6: Save to database
            # Use update_or_create to handle existing connections
            # Note: stripe_account stores the business name (unique key)
            stripe_api_key, created = StripeApiKey.objects.update_or_create(
                stripe_account=business_name,  # Business display name (unique key)
                defaults={
                    'account_id': account_id,           # Link to our CRM account
                    'stripe_client_id': stripe_user_id, # Stripe account ID (acct_xxxxx)
                    'api_key': access_token,            # Store access token (sk_live_xxxxx)
                    'default_currency': default_currency, # Default currency (e.g., "gbp", "usd")
                    'is_active': True,                  # Mark as active
                    'is_primary': is_first_account,     # Auto-set primary if first account
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


class StripeAccountViewSet(AccountResolutionMixin, viewsets.ModelViewSet):
    """
    ViewSet for managing Stripe accounts (CRUD operations).
    
    Permissions:
    - List/Retrieve: Admins and SuperAdmins only
    - Update: Admins and SuperAdmins only
    - Delete: SuperAdmins only
    - set_primary action: SuperAdmins only
    
    Master token users can access any account via X-Account-ID header.
    """
    
    serializer_class = StripeApiKeySerializer
    permission_classes = [IsAuthenticated, IsAccountMember]
    
    def get_queryset(self):
        """Filter Stripe accounts by user's account (or specified account for master token)"""
        return StripeApiKey.objects.filter(
            account_id=self.get_resolved_account_id()
        ).select_related('account').order_by('-is_primary', '-created_at')
    
    def get_permissions(self):
        """
        Override permissions based on action:
        - list, retrieve, update: Admins and SuperAdmins
        - destroy, set_primary: SuperAdmins only
        """
        if self.action in ['destroy', 'set_primary']:
            return [IsAuthenticated(), IsSuperAdmin()]
        return [IsAuthenticated(), IsAccountMember()]
    
    @action(detail=True, methods=['post'], permission_classes=[IsAuthenticated, IsSuperAdmin])
    @transaction.atomic
    def set_primary(self, request, pk=None):
        """
        Set a Stripe account as primary for the user's CRM account.
        Automatically unsets all other accounts as primary (atomic operation).
        
        POST /api/stripe/accounts/{id}/set_primary/
        """
        stripe_account = self.get_object()
        account_id = self.get_resolved_account_id()
        
        # Lock all Stripe accounts for this CRM account to prevent race conditions
        StripeApiKey.objects.filter(account_id=account_id).select_for_update()
        
        # Set all accounts to non-primary and inactive (only one active/primary account allowed)
        StripeApiKey.objects.filter(account_id=account_id).update(
            is_primary=False,
            is_active=False
        )
        
        # Set target account as primary and active
        stripe_account.is_primary = True
        stripe_account.is_active = True
        stripe_account.save(update_fields=['is_primary', 'is_active', 'updated_at'])
        
        logger.info(f"Set Stripe account {stripe_account.id} as primary and active for account {account_id}")
        
        serializer = self.get_serializer(stripe_account)
        return Response({
            'message': f'Stripe account "{stripe_account.stripe_account}" set as primary',
            'data': serializer.data
        })
    
    def perform_destroy(self, instance):
        """
        Prevent deletion if it's the only Stripe account.
        """
        account_id = self.get_resolved_account_id()
        total_accounts = StripeApiKey.objects.filter(account_id=account_id).count()
        
        if total_accounts == 1:
            raise serializers.ValidationError(
                "Cannot delete the only Stripe account. At least one account must remain."
            )
        
        # If deleting primary account, set another account as primary
        if instance.is_primary:
            # Find another active account to set as primary
            new_primary = StripeApiKey.objects.filter(
                account_id=account_id,
                is_active=True
            ).exclude(id=instance.id).first()
            
            if new_primary:
                new_primary.is_primary = True
                new_primary.save(update_fields=['is_primary', 'updated_at'])
                logger.info(f"Auto-set Stripe account {new_primary.id} as primary after deletion")
        
        instance.delete()
