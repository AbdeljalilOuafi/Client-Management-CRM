"""
Domain Management Views

Handles custom forms domain configuration for accounts.
Allows super admins to set up custom subdomains for client check-in links.
"""

from rest_framework.decorators import api_view, permission_classes
from rest_framework.permissions import IsAuthenticated
from rest_framework.response import Response
from rest_framework import status
from django.utils import timezone
from api.models import Account
from api.permissions import IsSuperAdmin
from api.utils.client_link_service import regenerate_all_client_links
from api.services.domain_service import DomainService
import logging

logger = logging.getLogger(__name__)


@api_view(['POST'])
@permission_classes([IsAuthenticated, IsSuperAdmin])
def configure_custom_domain(request):
    """
    Configure custom forms domain for the authenticated user's account.
    
    Frontend has already verified DNS points to server IP.
    This endpoint simply saves the domain and marks it as configured.
    
    POST /api/domains/configure/
    Request Body:
    {
        "forms_domain": "check.gymname.com"
    }
    
    Response:
    {
        "success": true,
        "message": "Custom domain configured successfully",
        "domain": "check.gymname.com",
        "configured_at": "2025-11-25T10:30:00Z"
    }
    """
    try:
        forms_domain = request.data.get('forms_domain')
        
        if not forms_domain:
            return Response(
                {'error': 'forms_domain is required'},
                status=status.HTTP_400_BAD_REQUEST
            )
        
        # Get the authenticated user's account
        account = request.user.account
        
        # Check if domain already in use by another account
        existing = Account.objects.filter(forms_domain=forms_domain).exclude(id=account.id).first()
        if existing:
            return Response(
                {'error': f'This domain is already in use by another account: {existing.name}'},
                status=status.HTTP_400_BAD_REQUEST
            )
        
        logger.info(f"Configuring custom domain for account {account.id}: {forms_domain}")
        
        # Step 1: Generate SSL certificate
        ssl_success, ssl_message = DomainService.generate_ssl_certificate(forms_domain)
        if not ssl_success:
            logger.error(f"SSL generation failed for {forms_domain}: {ssl_message}")
            return Response({
                'success': False,
                'error': 'SSL certificate generation failed',
                'details': ssl_message
            }, status=status.HTTP_500_INTERNAL_SERVER_ERROR)
        
        # Step 2: Create Nginx configuration
        config_success, config_message = DomainService.create_nginx_config(forms_domain)
        if not config_success:
            logger.error(f"Nginx config creation failed for {forms_domain}: {config_message}")
            return Response({
                'success': False,
                'error': 'Nginx configuration failed',
                'details': config_message
            }, status=status.HTTP_500_INTERNAL_SERVER_ERROR)
        
        # Step 3: Test and reload Nginx
        reload_success, reload_message = DomainService.test_and_reload_nginx()
        if not reload_success:
            logger.error(f"Nginx reload failed for {forms_domain}: {reload_message}")
            return Response({
                'success': False,
                'error': 'Nginx reload failed',
                'details': reload_message
            }, status=status.HTTP_500_INTERNAL_SERVER_ERROR)
        
        # Step 4: Save domain configuration in database
        # Frontend has verified DNS, SSL and Nginx are now configured
        account.forms_domain = forms_domain
        account.forms_domain_verified = True
        account.forms_domain_configured = True
        account.forms_domain_added_at = timezone.now()
        account.save()
        
        logger.info(f"Custom domain configured successfully for account {account.id}: {forms_domain}")
        
        return Response({
            'success': True,
            'message': 'Custom domain configured successfully with SSL and Nginx',
            'domain': forms_domain,
            'configured_at': account.forms_domain_added_at.isoformat(),
            'ssl_status': 'Active',
            'nginx_status': 'Configured'
        }, status=status.HTTP_200_OK)
        
    except Exception as e:
        logger.exception(f"Error configuring custom domain: {str(e)}")
        return Response(
            {'error': f'Internal server error: {str(e)}'},
            status=status.HTTP_500_INTERNAL_SERVER_ERROR
        )


@api_view(['POST'])
@permission_classes([IsAuthenticated, IsSuperAdmin])
def regenerate_client_links(request):
    """
    Regenerate short links for all active clients in the account.
    
    Use this after changing the custom domain to update all client links
    with the new domain.
    
    POST /api/domains/regenerate-links/
    
    Response:
    {
        "success": true,
        "message": "Regenerated 45 out of 50 client links",
        "stats": {
            "total_count": 50,
            "success_count": 45,
            "fail_count": 5
        }
    }
    """
    try:
        account = request.user.account
        
        logger.info(f"Starting bulk link regeneration for account {account.id}")
        
        # Regenerate all client links
        stats = regenerate_all_client_links(account)
        
        success = stats['success_count'] > 0
        message = f"Regenerated {stats['success_count']} out of {stats['total_count']} client links"
        
        if stats['fail_count'] > 0:
            message += f". {stats['fail_count']} failed."
        
        return Response({
            'success': success,
            'message': message,
            'stats': stats
        }, status=status.HTTP_200_OK)
        
    except Exception as e:
        logger.exception(f"Error regenerating client links: {str(e)}")
        return Response(
            {'error': f'Internal server error: {str(e)}'},
            status=status.HTTP_500_INTERNAL_SERVER_ERROR
        )


@api_view(['GET'])
@permission_classes([IsAuthenticated])
def get_domain_config(request):
    """
    Get current custom domain configuration for the authenticated user's account.
    
    GET /api/domains/
    
    Response:
    {
        "forms_domain": "check.gymname.com",
        "forms_domain_verified": true,
        "forms_domain_configured": true,
        "forms_domain_added_at": "2025-11-25T10:30:00Z"
    }
    """
    try:
        account = request.user.account
        
        return Response({
            'forms_domain': account.forms_domain,
            'forms_domain_verified': account.forms_domain_verified,
            'forms_domain_configured': account.forms_domain_configured,
            'forms_domain_added_at': account.forms_domain_added_at.isoformat() if account.forms_domain_added_at else None
        }, status=status.HTTP_200_OK)
        
    except Exception as e:
        logger.exception(f"Error getting domain config: {str(e)}")
        return Response(
            {'error': f'Internal server error: {str(e)}'},
            status=status.HTTP_500_INTERNAL_SERVER_ERROR
        )


@api_view(['PATCH'])
@permission_classes([IsAuthenticated, IsSuperAdmin])
def update_domain_config(request):
    """
    Update custom domain configuration.
    
    PATCH /api/domains/
    Request Body:
    {
        "forms_domain": "newdomain.gym.com"
    }
    
    Response:
    {
        "success": true,
        "message": "Domain updated successfully",
        "domain": "newdomain.gym.com"
    }
    """
    try:
        account = request.user.account
        forms_domain = request.data.get('forms_domain')
        
        if not forms_domain:
            return Response(
                {'error': 'forms_domain is required'},
                status=status.HTTP_400_BAD_REQUEST
            )
        
        # Check if domain already in use by another account
        existing = Account.objects.filter(forms_domain=forms_domain).exclude(id=account.id).first()
        if existing:
            return Response(
                {'error': f'This domain is already in use by another account: {existing.name}'},
                status=status.HTTP_400_BAD_REQUEST
            )
        
        logger.info(f"Updating custom domain for account {account.id}: {forms_domain}")
        
        account.forms_domain = forms_domain
        account.forms_domain_verified = True
        account.forms_domain_configured = True
        account.save()
        
        return Response({
            'success': True,
            'message': 'Domain updated successfully',
            'domain': forms_domain
        }, status=status.HTTP_200_OK)
        
    except Exception as e:
        logger.exception(f"Error updating domain config: {str(e)}")
        return Response(
            {'error': f'Internal server error: {str(e)}'},
            status=status.HTTP_500_INTERNAL_SERVER_ERROR
        )


@api_view(['DELETE'])
@permission_classes([IsAuthenticated, IsSuperAdmin])
def delete_domain_config(request):
    """
    Remove custom domain configuration and revert to default domain.
    
    DELETE /api/domains/
    
    Response:
    {
        "success": true,
        "message": "Custom domain removed successfully"
    }
    """
    try:
        account = request.user.account
        
        logger.info(f"Removing custom domain for account {account.id}")
        
        domain_to_remove = account.forms_domain
        
        # Remove SSL certificate and Nginx configuration
        if domain_to_remove:
            remove_success, remove_message = DomainService.remove_domain_config(domain_to_remove)
            if not remove_success:
                logger.warning(f"Failed to remove domain config for {domain_to_remove}: {remove_message}")
                # Continue with DB cleanup even if file removal fails
        
        account.forms_domain = None
        account.forms_domain_verified = False
        account.forms_domain_configured = False
        account.forms_domain_added_at = None
        account.save()
        
        return Response({
            'success': True,
            'message': 'Custom domain removed successfully. All clients will now use the default domain.'
        }, status=status.HTTP_200_OK)
        
    except Exception as e:
        logger.exception(f"Error deleting domain config: {str(e)}")
        return Response(
            {'error': f'Internal server error: {str(e)}'},
            status=status.HTTP_500_INTERNAL_SERVER_ERROR
        )
