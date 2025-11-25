"""
URL Shortener Integration Service

Integrates with the standalone URL shortener service (running on port 8001)
to create shortened check-in links for clients.

API Documentation: See url-shortener-docs/API_REFERENCE.md
"""

import requests
import logging
import random
import string
from django.conf import settings

logger = logging.getLogger(__name__)


def generate_short_code(length=6):
    """
    Generate a random short code for URL shortening.
    
    Args:
        length (int): Length of the code (4-6 characters)
    
    Returns:
        str: Random alphanumeric code (e.g., 'aB3xK9')
    """
    # Mix of lowercase, uppercase letters and digits
    characters = string.ascii_letters + string.digits
    return ''.join(random.choices(characters, k=length))


def shorten_checkin_url(original_url, domain, title=None):
    """
    Create a shortened URL using the external URL shortener service.
    
    Args:
        original_url (str): The full check-in URL to shorten
        domain (str): The domain to use for the short URL (e.g., 'check.gymname.com')
        title (str, optional): Title/description for the short URL
    
    Returns:
        str: The full shortened URL (e.g., 'https://check.gymname.com/abc123')
        None: If shortening fails
    
    Example:
        >>> original = "https://check.gymname.com/check-in/550e8400-e29b-41d4-a716-446655440000/"
        >>> short_url = shorten_checkin_url(original, "check.gymname.com", "John Doe Check-In")
        >>> print(short_url)
        'https://check.gymname.com/abc123'
    """
    try:
        # Construct API URL
        api_url = f"{settings.URL_SHORTENER_API_URL}/api/shorten/"
        
        # Generate random short code (4-6 characters, alphanumeric)
        short_code = generate_short_code(length=random.randint(4, 6))
        
        # Prepare payload - must match exact URL shortener API requirements
        payload = {
            'original_url': original_url,
            'title': title or "Check-in link",
            'domain': domain,
            'short_code': short_code,
        }
        
        # Make API request with 10s timeout
        logger.info(f"Shortening URL: {original_url} with domain: {domain}, code: {short_code}")
        response = requests.post(
            api_url,
            json=payload,
            timeout=10,
            headers={'Content-Type': 'application/json'}
        )
        response.raise_for_status()
        
        # Parse response
        data = response.json()
        
        # Extract short URL from response
        # Response format: {"status": "success", "data": {"full_short_url": "https://...", ...}}
        if data.get('status') == 'success' and 'data' in data:
            short_url = data['data'].get('full_short_url')
            if short_url:
                logger.info(f"Successfully shortened URL: {original_url} -> {short_url}")
                return short_url
            else:
                logger.warning(f"URL shortener response missing 'full_short_url': {data}")
                return None
        else:
            logger.warning(f"Unexpected URL shortener response format: {data}")
            return None
        
    except requests.exceptions.Timeout:
        logger.error(f"URL shortener API timeout (>10s) for URL: {original_url}")
        return None
        
    except requests.exceptions.RequestException as e:
        logger.error(f"URL shortener API error: {str(e)} for URL: {original_url}")
        return None
        
    except Exception as e:
        logger.exception(f"Unexpected error shortening URL {original_url}: {str(e)}")
        return None


def get_short_url_stats(short_code):
    """
    Get statistics for a shortened URL.
    
    Args:
        short_code (str): The short code (e.g., 'abc123')
    
    Returns:
        dict: Statistics data from URL shortener
        None: If request fails
    """
    try:
        api_url = f"{settings.URL_SHORTENER_API_URL}/api/stats/{short_code}/"
        
        response = requests.get(api_url, timeout=10)
        response.raise_for_status()
        
        return response.json()
        
    except Exception as e:
        logger.error(f"Failed to fetch stats for {short_code}: {str(e)}")
        return None
