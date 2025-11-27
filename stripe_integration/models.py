"""
Stripe Integration Models
Manages Stripe Connect OAuth and API keys
"""
from django.db import models


class StripeApiKey(models.Model):
    """
    Stripe API Key model for managing Stripe Connect accounts via OAuth.
    
    Note: stripe_account field stores the Stripe account name (not the ID).
    The actual Stripe account ID (acct_xxxxx) is stored in this field.
    """
    
    id = models.AutoField(primary_key=True)
    account = models.ForeignKey(
        'api.Account', 
        on_delete=models.CASCADE, 
        db_column='client_account_id', 
        null=True, 
        blank=True,
        help_text='CRM account this Stripe connection belongs to'
    )
    stripe_account = models.CharField(
        max_length=255, 
        unique=True,
        help_text='Stripe account ID (acct_xxxxx) from OAuth'
    )
    stripe_client_id = models.CharField(
        max_length=255, 
        null=True, 
        blank=True,
        help_text='Stripe Connect client ID used for OAuth (ca_xxxxx)'
    )
    api_key = models.CharField(
        max_length=255, 
        unique=True, 
        null=True, 
        blank=True,
        help_text='Stripe access token (sk_live_xxxxx or sk_test_xxxxx)'
    )
    is_active = models.BooleanField(
        default=True,
        help_text='Whether this Stripe connection is active'
    )
    is_primary = models.BooleanField(
        default=False,
        help_text='Always False - reserved for future use'
    )
    checkout_thanks_url = models.TextField(
        null=True, 
        blank=True,
        help_text='Redirect URL after successful checkout'
    )
    checkout_cancelled_url = models.TextField(
        null=True, 
        blank=True,
        help_text='Redirect URL after cancelled checkout'
    )
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        managed = False  # Table managed by Supabase migrations
        db_table = 'stripe_api_keys'
        verbose_name = 'Stripe API Key'
        verbose_name_plural = 'Stripe API Keys'

    def __str__(self):
        return f"Stripe Account: {self.stripe_account} (Account: {self.account.name if self.account else 'None'})"
