"""
Domain Service

Handles SSL certificate generation and Nginx configuration for custom domains.
Automates the setup of custom forms domains with Let's Encrypt SSL.
"""

import subprocess
import os
import logging
from django.conf import settings

logger = logging.getLogger(__name__)


class DomainService:
    """Service class for managing custom domain SSL and Nginx configuration"""
    
    NGINX_SITES_AVAILABLE = "/etc/nginx/sites-available"
    NGINX_SITES_ENABLED = "/etc/nginx/sites-enabled"
    
    @staticmethod
    def generate_ssl_certificate(domain):
        """
        Generate Let's Encrypt SSL certificate using Certbot.
        
        Args:
            domain (str): The domain to generate certificate for (e.g., 'check.gymname.com')
        
        Returns:
            tuple: (success: bool, message: str)
        """
        try:
            logger.info(f"Generating SSL certificate for {domain}")
            
            # Get admin email from settings
            admin_email = getattr(settings, 'ADMIN_EMAIL', 'admin@fithq.ai')
            
            result = subprocess.run([
                'sudo', 'certbot', 'certonly',
                '--nginx',
                '-d', domain,
                '--non-interactive',
                '--agree-tos',
                '--email', admin_email,
                '--no-eff-email',
            ], capture_output=True, text=True, timeout=120)
            
            if result.returncode != 0:
                logger.error(f"Certbot failed for {domain}: {result.stderr}")
                return False, f"Certificate generation failed: {result.stderr}"
            
            logger.info(f"SSL certificate generated successfully for {domain}")
            return True, "SSL certificate generated successfully"
            
        except subprocess.TimeoutExpired:
            logger.error(f"Certificate generation timed out for {domain}")
            return False, "Certificate generation timed out (>120s)"
        except Exception as e:
            logger.exception(f"Exception during SSL generation for {domain}: {str(e)}")
            return False, f"Failed to generate certificate: {str(e)}"
    
    @staticmethod
    def create_nginx_config(domain):
        """
        Create Nginx configuration file for the custom domain.
        Proxies requests to the URL shortener service on port 8001.
        
        Args:
            domain (str): The domain to configure
        
        Returns:
            tuple: (success: bool, message: str)
        """
        try:
            from django.utils import timezone
            
            # Nginx configuration template
            nginx_config = f"""# Auto-generated configuration for {domain}
# Generated at: {timezone.now().isoformat()}
# Managed by Django CRM - Do not edit manually

server {{
    listen 443 ssl;
    server_name {domain};
    
    # SSL Configuration
    ssl_certificate /etc/letsencrypt/live/{domain}/fullchain.pem;
    ssl_certificate_key /etc/letsencrypt/live/{domain}/privkey.pem;
    ssl_protocols TLSv1.2 TLSv1.3;
    ssl_ciphers HIGH:!aNULL:!MD5;
    ssl_prefer_server_ciphers on;
    
    # SSL session cache
    ssl_session_cache shared:SSL:10m;
    ssl_session_timeout 10m;
    
    # Proxy to URL shortener service
    location / {{
        proxy_pass http://localhost:8001;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        proxy_redirect off;
        
        # Timeouts
        proxy_connect_timeout 60s;
        proxy_send_timeout 60s;
        proxy_read_timeout 60s;
    }}
    
    # Security headers
    add_header X-Frame-Options "SAMEORIGIN" always;
    add_header X-Content-Type-Options "nosniff" always;
    add_header X-XSS-Protection "1; mode=block" always;
    add_header Strict-Transport-Security "max-age=31536000; includeSubDomains" always;
    
    # Logging
    access_log /var/log/nginx/{domain}_access.log;
    error_log /var/log/nginx/{domain}_error.log;
}}

# HTTP to HTTPS redirect
server {{
    listen 80;
    server_name {domain};
    
    # Let's Encrypt ACME challenge
    location /.well-known/acme-challenge/ {{
        root /var/www/html;
    }}
    
    # Redirect all other requests to HTTPS
    location / {{
        return 301 https://$server_name$request_uri;
    }}
}}
"""
            
            # Write configuration file
            config_path = os.path.join(DomainService.NGINX_SITES_AVAILABLE, domain)
            
            logger.info(f"Creating Nginx config file: {config_path}")
            
            # Write to temporary file first
            temp_config = f"/tmp/nginx_{domain}.conf"
            with open(temp_config, 'w') as f:
                f.write(nginx_config)
            
            # Move to sites-available with sudo
            move_result = subprocess.run(
                ['sudo', 'mv', temp_config, config_path],
                capture_output=True,
                text=True,
                timeout=10
            )
            
            if move_result.returncode != 0:
                logger.error(f"Failed to move config file: {move_result.stderr}")
                return False, f"Failed to create config file: {move_result.stderr}"
            
            # Set correct permissions
            subprocess.run(
                ['sudo', 'chmod', '644', config_path],
                capture_output=True,
                timeout=10
            )
            
            # Create symlink in sites-enabled
            symlink_path = os.path.join(DomainService.NGINX_SITES_ENABLED, domain)
            
            # Remove existing symlink if present
            if os.path.exists(symlink_path):
                subprocess.run(
                    ['sudo', 'rm', symlink_path],
                    capture_output=True,
                    timeout=10
                )
            
            # Create new symlink
            symlink_result = subprocess.run(
                ['sudo', 'ln', '-s', config_path, symlink_path],
                capture_output=True,
                text=True,
                timeout=10
            )
            
            if symlink_result.returncode != 0:
                logger.error(f"Failed to create symlink: {symlink_result.stderr}")
                return False, f"Failed to enable site: {symlink_result.stderr}"
            
            logger.info(f"Nginx config created and enabled for {domain}")
            return True, "Nginx configuration created successfully"
            
        except Exception as e:
            logger.exception(f"Failed to create Nginx config for {domain}: {str(e)}")
            return False, f"Failed to create Nginx config: {str(e)}"
    
    @staticmethod
    def test_and_reload_nginx():
        """
        Test Nginx configuration and reload if valid.
        
        Returns:
            tuple: (success: bool, message: str)
        """
        try:
            # Test configuration
            logger.info("Testing Nginx configuration")
            test_result = subprocess.run(
                ['sudo', 'nginx', '-t'],
                capture_output=True,
                text=True,
                timeout=10
            )
            
            if test_result.returncode != 0:
                logger.error(f"Nginx config test failed: {test_result.stderr}")
                return False, f"Nginx config test failed: {test_result.stderr}"
            
            # Reload Nginx
            logger.info("Reloading Nginx")
            reload_result = subprocess.run(
                ['sudo', 'systemctl', 'reload', 'nginx'],
                capture_output=True,
                text=True,
                timeout=10
            )
            
            if reload_result.returncode != 0:
                logger.error(f"Nginx reload failed: {reload_result.stderr}")
                return False, f"Nginx reload failed: {reload_result.stderr}"
            
            logger.info("Nginx reloaded successfully")
            return True, "Nginx reloaded successfully"
            
        except Exception as e:
            logger.exception(f"Failed to reload Nginx: {str(e)}")
            return False, f"Failed to reload Nginx: {str(e)}"
    
    @staticmethod
    def remove_domain_config(domain):
        """
        Remove Nginx configuration and symlink for a domain.
        Does NOT remove SSL certificate (Let's Encrypt handles that).
        
        Args:
            domain (str): The domain to remove configuration for
        
        Returns:
            tuple: (success: bool, message: str)
        """
        try:
            logger.info(f"Removing Nginx config for {domain}")
            
            # Remove symlink
            symlink_path = os.path.join(DomainService.NGINX_SITES_ENABLED, domain)
            if os.path.exists(symlink_path):
                subprocess.run(
                    ['sudo', 'rm', symlink_path],
                    capture_output=True,
                    timeout=10
                )
            
            # Remove config file
            config_path = os.path.join(DomainService.NGINX_SITES_AVAILABLE, domain)
            if os.path.exists(config_path):
                subprocess.run(
                    ['sudo', 'rm', config_path],
                    capture_output=True,
                    timeout=10
                )
            
            # Reload Nginx
            subprocess.run(
                ['sudo', 'systemctl', 'reload', 'nginx'],
                capture_output=True,
                timeout=10
            )
            
            logger.info(f"Removed Nginx config for {domain}")
            return True, "Nginx configuration removed"
            
        except Exception as e:
            logger.exception(f"Failed to remove Nginx config for {domain}: {str(e)}")
            return False, f"Failed to remove config: {str(e)}"
