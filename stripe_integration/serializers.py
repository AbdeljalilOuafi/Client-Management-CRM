"""
Stripe Integration Serializers
"""
from rest_framework import serializers
from .models import StripeApiKey


class StripeApiKeySerializer(serializers.ModelSerializer):
    """Serializer for Stripe API Key model"""
    
    account_name = serializers.CharField(source='account.name', read_only=True)
    
    class Meta:
        model = StripeApiKey
        fields = [
            'id', 'account', 'account_name', 'stripe_account', 
            'stripe_client_id', 'api_key', 'is_active', 'is_primary', 'default_currency',
            'checkout_thanks_url', 'checkout_cancelled_url',
            'created_at', 'updated_at'
        ]
        read_only_fields = ['id', 'created_at', 'updated_at', 'account_name', 
                           'stripe_account', 'stripe_client_id']
        extra_kwargs = {
            'api_key': {'write_only': True},  # Don't expose in responses
        }
    
    def validate_is_primary(self, value):
        """Prevent unsetting primary if it's the only account"""
        if not value and self.instance:
            # Check if this is the only Stripe account for this CRM account
            account_id = self.instance.account_id
            total_accounts = StripeApiKey.objects.filter(account_id=account_id).count()
            
            if total_accounts == 1:
                raise serializers.ValidationError(
                    "Cannot unset primary flag. At least one Stripe account must be marked as primary."
                )
        
        return value
    
    def validate(self, attrs):
        """
        Cross-field validation to prevent deactivating primary accounts.
        Business rule: Primary accounts must remain active.
        """
        # Check if we're updating an existing instance
        if self.instance:
            is_active = attrs.get('is_active', self.instance.is_active)
            is_primary = attrs.get('is_primary', self.instance.is_primary)
            
            # Prevent setting is_active=False if is_primary=True
            if is_primary and not is_active:
                raise serializers.ValidationError({
                    'is_active': 'Cannot deactivate primary Stripe account. Set another account as primary first.'
                })
        
        return attrs
