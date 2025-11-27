"""
Stripe Integration Admin
"""
from django.contrib import admin
from .models import StripeApiKey


@admin.register(StripeApiKey)
class StripeApiKeyAdmin(admin.ModelAdmin):
    """Admin interface for Stripe API Keys"""
    
    list_display = [
        'id', 'stripe_account', 'account', 'is_active', 
        'is_primary', 'created_at'
    ]
    list_filter = ['is_active', 'is_primary', 'created_at']
    search_fields = ['stripe_account', 'account__name', 'stripe_client_id']
    readonly_fields = ['created_at', 'updated_at']
    
    fieldsets = (
        ('Basic Information', {
            'fields': ('account', 'stripe_account', 'stripe_client_id')
        }),
        ('API Configuration', {
            'fields': ('api_key', 'is_active', 'is_primary')
        }),
        ('Checkout URLs', {
            'fields': ('checkout_thanks_url', 'checkout_cancelled_url')
        }),
        ('Timestamps', {
            'fields': ('created_at', 'updated_at'),
            'classes': ('collapse',)
        }),
    )
    
    def get_queryset(self, request):
        """Optimize query with select_related"""
        qs = super().get_queryset(request)
        return qs.select_related('account')
