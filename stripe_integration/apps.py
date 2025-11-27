from django.apps import AppConfig


class StripeIntegrationConfig(AppConfig):
    """Configuration for Stripe Integration app"""
    
    default_auto_field = 'django.db.models.BigAutoField'
    name = 'stripe_integration'
    verbose_name = 'Stripe Integration'
    
    def ready(self):
        """Initialize app when Django starts"""
        pass  # Add signal handlers here if needed
