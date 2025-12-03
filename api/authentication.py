"""
Custom authentication for Employee model using EmployeeToken
and MasterToken for cross-account service authentication
"""
from rest_framework.authentication import TokenAuthentication, BaseAuthentication
from rest_framework import exceptions
from django.utils import timezone
from .models import EmployeeToken, MasterToken, MasterTokenUser


class MasterTokenAuthentication(BaseAuthentication):
    """
    Authentication class for MasterToken (service account tokens).
    
    Supports two authentication methods:
    1. X-Master-Token header: Contains the raw token key
    2. Authorization header: "MasterToken <key>"
    
    Requires X-Account-ID header to specify which account to operate on.
    Returns a MasterTokenUser pseudo-user with super_admin permissions.
    """
    
    keyword = 'MasterToken'
    
    def authenticate(self, request):
        """
        Authenticate the request using MasterToken.
        Returns (MasterTokenUser, MasterToken) or None.
        """
        # Try X-Master-Token header first
        token_key = request.headers.get('X-Master-Token')
        
        # Fall back to Authorization header with MasterToken keyword
        if not token_key:
            auth_header = request.headers.get('Authorization', '')
            if auth_header.startswith(f'{self.keyword} '):
                token_key = auth_header[len(self.keyword) + 1:].strip()
        
        if not token_key:
            return None  # No master token provided, try next auth class
        
        return self.authenticate_credentials(request, token_key)
    
    def authenticate_credentials(self, request, key):
        """
        Validate the master token and return user/token tuple.
        """
        try:
            token = MasterToken.objects.get(key=key)
        except MasterToken.DoesNotExist:
            raise exceptions.AuthenticationFailed('Invalid master token.')
        
        if not token.is_active:
            raise exceptions.AuthenticationFailed('Master token is inactive.')
        
        # Get account_id from X-Account-ID header
        account_id_header = request.headers.get('X-Account-ID')
        account_id = None
        
        if account_id_header:
            try:
                account_id = int(account_id_header)
            except (ValueError, TypeError):
                raise exceptions.AuthenticationFailed(
                    'Invalid X-Account-ID header. Must be an integer.'
                )
        
        # Create MasterTokenUser with the account_id
        user = MasterTokenUser(master_token=token, account_id=account_id)
        
        # Update last_used_at timestamp (async-safe, non-blocking)
        MasterToken.objects.filter(key=key).update(last_used_at=timezone.now())
        
        return (user, token)
    
    def authenticate_header(self, request):
        """
        Return a string to be used as the value of the `WWW-Authenticate`
        header in a `401 Unauthenticated` response.
        """
        return self.keyword


class EmployeeTokenAuthentication(TokenAuthentication):
    """
    Custom token authentication using EmployeeToken model
    This is separate from DRF's default Token to avoid conflicts with other applications
    """
    model = EmployeeToken
    keyword = 'Token'

    def authenticate_credentials(self, key):
        """
        Authenticate the token and return the user and token
        """
        try:
            token = self.model.objects.select_related('user').get(key=key)
        except self.model.DoesNotExist:
            raise exceptions.AuthenticationFailed('Invalid token.')

        if not token.user.is_active:
            raise exceptions.AuthenticationFailed('User inactive or deleted.')

        return (token.user, token)
