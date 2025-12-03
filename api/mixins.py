"""
Mixins for API ViewSets
"""
from rest_framework.exceptions import ValidationError
from .models import Account


class AccountResolutionMixin:
    """
    Mixin for ViewSets that need to resolve account_id dynamically.
    
    For MasterToken users:
        - Requires X-Account-ID header
        - Validates that the account exists
        - Returns the account_id from the header
    
    For regular Employee users:
        - Returns request.user.account_id as usual
    
    Usage in ViewSet:
        class MyViewSet(AccountResolutionMixin, viewsets.ModelViewSet):
            def get_queryset(self):
                return Model.objects.filter(account_id=self.get_resolved_account_id())
            
            def perform_create(self, serializer):
                serializer.save(account_id=self.get_resolved_account_id())
    """
    
    _resolved_account_id = None
    _resolved_account = None
    
    def get_resolved_account_id(self):
        """
        Get the account_id for the current request.
        
        For master token users, extracts from X-Account-ID header.
        For regular users, returns request.user.account_id.
        
        Returns:
            int: The account_id to use for this request
            
        Raises:
            ValidationError: If master token is used without X-Account-ID header
            ValidationError: If the specified account does not exist
        """
        if self._resolved_account_id is not None:
            return self._resolved_account_id
        
        user = self.request.user
        
        # Check if this is a master token request
        if getattr(user, 'is_master_token', False):
            account_id = user.account_id
            
            if account_id is None:
                raise ValidationError({
                    'detail': 'X-Account-ID header is required for master token requests.'
                })
            
            # Validate account exists
            if not Account.objects.filter(id=account_id).exists():
                raise ValidationError({
                    'detail': f'Account with ID {account_id} does not exist.'
                })
            
            self._resolved_account_id = account_id
            return self._resolved_account_id
        
        # Regular user - use their account_id
        self._resolved_account_id = user.account_id
        return self._resolved_account_id
    
    def get_resolved_account(self):
        """
        Get the Account object for the current request.
        
        Returns:
            Account: The account object to use for this request
        """
        if self._resolved_account is not None:
            return self._resolved_account
        
        user = self.request.user
        
        # Check if this is a master token request
        if getattr(user, 'is_master_token', False):
            account_id = self.get_resolved_account_id()
            self._resolved_account = Account.objects.get(id=account_id)
            return self._resolved_account
        
        # Regular user - use their account
        self._resolved_account = user.account
        return self._resolved_account
    
    def initial(self, request, *args, **kwargs):
        """
        Reset cached values on each request.
        Called before dispatch.
        """
        self._resolved_account_id = None
        self._resolved_account = None
        super().initial(request, *args, **kwargs)

