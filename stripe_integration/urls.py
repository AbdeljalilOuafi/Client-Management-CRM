"""
Stripe Integration URL Configuration
"""
from django.urls import path, include
from rest_framework.routers import DefaultRouter
from .views import StripeOAuthCallbackView, StripeAccountViewSet

app_name = 'stripe_integration'

# Router for ViewSets
router = DefaultRouter()
router.register(r'accounts', StripeAccountViewSet, basename='stripe-account')

urlpatterns = [
    path('callback/', StripeOAuthCallbackView.as_view(), name='oauth-callback'),
    path('', include(router.urls)),
]
