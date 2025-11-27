"""
Stripe Integration Tests
"""
import pytest
from django.urls import reverse
from rest_framework import status
from unittest.mock import patch, MagicMock


@pytest.mark.django_db
class TestStripeOAuthCallback:
    """Test Stripe OAuth callback flow"""
    
    def test_callback_missing_code(self, api_client):
        """Test callback fails without code parameter"""
        url = reverse('stripe_integration:oauth-callback')
        response = api_client.get(url, {'state': '1'})
        
        assert response.status_code == status.HTTP_400_BAD_REQUEST
    
    def test_callback_missing_state(self, api_client):
        """Test callback fails without state parameter"""
        url = reverse('stripe_integration:oauth-callback')
        response = api_client.get(url, {'code': 'ac_test123'})
        
        assert response.status_code == status.HTTP_400_BAD_REQUEST
    
    @patch('stripe.OAuth.token')
    @patch('stripe.Account.retrieve')
    def test_successful_oauth_callback(self, mock_account, mock_token, api_client, account):
        """Test successful OAuth callback creates Stripe API key"""
        # Mock Stripe API responses
        mock_token.return_value = {
            'stripe_user_id': 'acct_test123',
            'access_token': 'sk_test_token123'
        }
        mock_account.return_value = {
            'business_profile': {'name': 'Test Business'},
            'email': 'test@stripe.com'
        }
        
        url = reverse('stripe_integration:oauth-callback')
        response = api_client.get(url, {
            'code': 'ac_test123',
            'state': str(account.id)
        })
        
        # Should redirect to settings with success
        assert response.status_code == 302
        assert 'stripe_connected=true' in response.url
