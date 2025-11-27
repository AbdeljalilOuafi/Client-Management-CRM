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
            'stripe_client_id', 'api_key', 'is_active', 'is_primary',
            'checkout_thanks_url', 'checkout_cancelled_url',
            'created_at', 'updated_at'
        ]
        read_only_fields = ['id', 'created_at', 'updated_at', 'account_name']
        extra_kwargs = {
            'api_key': {'write_only': True},  # Don't expose in responses
        }
