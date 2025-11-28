"""
Stripe Integration Models
Manages Stripe Connect OAuth and API keys
"""
from django.db import models


class StripeApiKey(models.Model):
    """
    Stripe Account model for managing Stripe Connect accounts via OAuth.
    
    Field mapping:
    - stripe_account: Business display name from Stripe (e.g., "NTT Fitness")
    - stripe_client_id: Stripe account ID (e.g., "acct_1LdN5IEee7MKhuOm")
    - api_key: Stripe access token (e.g., "sk_live_xxxxx")
    - default_currency: Default currency for this Stripe account (e.g., "gbp", "usd")
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
        null=True,
        blank=True,
        help_text='Business display name from Stripe dashboard (e.g., "NTT Fitness")'
    )
    stripe_client_id = models.CharField(
        max_length=255, 
        null=True, 
        blank=True,
        help_text='Stripe account ID from OAuth (e.g., "acct_1LdN5IEee7MKhuOm")'
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
        null=True,
        blank=True,
        help_text='Primary Stripe account flag'
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
    default_currency = models.TextField(
        null=True,
        blank=True,
        help_text='Default currency for this Stripe account (e.g., "gbp", "usd")'
    )
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        managed = False  # Table managed by Supabase migrations
        db_table = 'stripe_accounts'
        verbose_name = 'Stripe Account'
        verbose_name_plural = 'Stripe Accounts'

    def __str__(self):
        return f"Stripe Account: {self.stripe_account} (Account: {self.account.name if self.account else 'None'})"
