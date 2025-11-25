"""
Client Link Service

Manages generation and retrieval of check-in links for clients.
Handles custom domain selection and URL shortening with graceful fallbacks.
"""

import logging
from django.conf import settings
from .url_shortener import shorten_checkin_url

logger = logging.getLogger(__name__)


def get_or_generate_short_link(client, force_regenerate=False):
    """
    Get or generate a shortened check-in link for a client.
    
    This function implements a lazy generation strategy:
    1. If short link already exists and force_regenerate=False, return it (links are permanent)
    2. Otherwise, generate a new short link
    
    Domain selection priority:
    1. Account's custom forms_domain (if configured)
    2. Fallback to DEFAULT_FORMS_DOMAIN (form.fithq.ai)
    
    URL shortening with graceful fallback:
    1. Try to shorten via URL shortener service
    2. If shortening fails, return full URL with selected domain
    
    Args:
        client: Client model instance
        force_regenerate (bool): If True, regenerate even if short_checkin_link exists
    
    Returns:
        str: Check-in URL (shortened if possible, full URL otherwise)
    
    Example:
        >>> from api.models import Client
        >>> client = Client.objects.get(id=1)
        >>> link = get_or_generate_short_link(client)
        >>> print(link)
        'https://check.gymname.com/abc123'  # or full URL if shortening failed
    """
    # Return existing link if present and not forcing regeneration
    if client.short_checkin_link and not force_regenerate:
        logger.info(f"Using existing short link for client {client.id}: {client.short_checkin_link}")
        return client.short_checkin_link
    
    # Determine which domain to use for the SHORT URL
    account = client.account
    if account.forms_domain and account.forms_domain_configured:
        short_domain = account.forms_domain
        logger.info(f"Using custom domain for client {client.id}: {short_domain}")
    else:
        short_domain = settings.DEFAULT_FORMS_DOMAIN
        logger.info(f"Using default domain for client {client.id}: {short_domain}")
    
    # Construct original full URL (always uses FRONTEND_URL for the actual check-in page)
    frontend_url = settings.FRONTEND_URL.rstrip('/')
    original_url = f"{frontend_url}/check-in/{client.checkin_link}/"
    
    # Try to shorten the URL
    client_name = f"{client.first_name} {client.last_name or ''}".strip()
    title = f"Check-In: {client_name}"
    
    short_url = shorten_checkin_url(original_url, short_domain, title)
    
    # Fallback to full URL if shortening failed
    if short_url:
        final_url = short_url
        logger.info(f"Successfully shortened URL for client {client.id}")
    else:
        final_url = original_url
        logger.warning(f"URL shortening failed for client {client.id}, using full URL")
    
    # Save the link (whether shortened or full)
    client.short_checkin_link = final_url
    client.save(update_fields=['short_checkin_link'])
    
    logger.info(f"Generated and saved check-in link for client {client.id}: {final_url}")
    return final_url


def regenerate_all_client_links(account):
    """
    Regenerate short links for all active clients in an account.
    
    Used after an account changes their custom domain.
    
    Args:
        account: Account model instance
    
    Returns:
        dict: {
            'success_count': int,
            'fail_count': int,
            'total_count': int
        }
    """
    from api.models import Client
    
    logger.info(f"Starting bulk link regeneration for account {account.id}")
    
    # Get all active clients for this account
    clients = Client.objects.filter(
        account=account,
        status='active'
    )
    
    total_count = clients.count()
    success_count = 0
    fail_count = 0
    
    for client in clients:
        try:
            # Force regeneration of short link
            get_or_generate_short_link(client, force_regenerate=True)
            success_count += 1
        except Exception as e:
            logger.error(f"Failed to regenerate link for client {client.id}: {str(e)}")
            fail_count += 1
    
    logger.info(f"Bulk regeneration complete for account {account.id}: "
                f"{success_count}/{total_count} successful, {fail_count} failed")
    
    return {
        'success_count': success_count,
        'fail_count': fail_count,
        'total_count': total_count
    }


def get_checkin_url_without_saving(client):
    """
    Get the check-in URL for a client without saving to database.
    
    Useful for previewing URLs or one-time use cases.
    
    Args:
        client: Client model instance
    
    Returns:
        str: Check-in URL (full URL, not shortened)
    """
    # Always use frontend URL for the actual check-in page
    frontend_url = settings.FRONTEND_URL.rstrip('/')
    return f"{frontend_url}/check-in/{client.checkin_link}/"
