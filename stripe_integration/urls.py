"""
Stripe Integration URL Configuration
"""
from django.urls import path
from .views import StripeOAuthCallbackView

app_name = 'stripe_integration'

urlpatterns = [
    path('callback/', StripeOAuthCallbackView.as_view(), name='oauth-callback'),
]
