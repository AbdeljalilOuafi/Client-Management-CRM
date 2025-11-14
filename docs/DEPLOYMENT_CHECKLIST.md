# 🚀 Quick Deployment Checklist

Use this checklist to ensure smooth production deployment.

## Pre-Deployment (On Your Local Machine)

- [ ] All code committed and pushed to GitHub
- [ ] Database migrations applied to production Supabase
  ```bash
  supabase db push
  ```
- [ ] Test locally with production database
- [ ] Review `.env.production.template` and prepare production values
- [ ] Document any environment-specific configurations

## Server Preparation

- [ ] SSH access to production server configured
- [ ] Server OS updated: `sudo apt update && sudo apt upgrade -y`
- [ ] Required packages installed (Python, Nginx, PostgreSQL libs, Git)
- [ ] Firewall configured (ports 22, 80, 443)
- [ ] DNS records pointing to server IP:
  - `backend.onsync-test.xyz` → Server IP
  - `frontend.onsync-test.xyz` → Server IP

## Application Setup

- [ ] Repository cloned to `/var/www/crm-backend`
- [ ] Virtual environment created and activated
- [ ] Dependencies installed from `requirements.txt`
- [ ] Gunicorn installed: `pip install gunicorn`
- [ ] `.env` file created with production values
- [ ] `.env` file secured: `chmod 600 .env`
- [ ] Static files collected: `python manage.py collectstatic --noinput`
- [ ] Django migrations faked: `python manage.py migrate --fake`
- [ ] Application ownership set: `sudo chown -R www-data:www-data /var/www/crm-backend`

## systemd Service

- [ ] Socket file created: `/etc/systemd/system/crm-backend.socket`
- [ ] Service file created: `/etc/systemd/system/crm-backend.service`
- [ ] Log directory created: `/var/log/crm-backend/`
- [ ] Log directory permissions: `sudo chown www-data:www-data /var/log/crm-backend`
- [ ] systemd reloaded: `sudo systemctl daemon-reload`
- [ ] Socket enabled: `sudo systemctl enable crm-backend.socket`
- [ ] Service enabled: `sudo systemctl enable crm-backend.service`
- [ ] Socket started: `sudo systemctl start crm-backend.socket`
- [ ] Service started: `sudo systemctl start crm-backend.service`
- [ ] Service status verified: `sudo systemctl status crm-backend.service`
- [ ] No errors in logs: `sudo journalctl -u crm-backend.service -n 50`

## Nginx Configuration

- [ ] Nginx configuration created: `/etc/nginx/sites-available/crm-backend`
- [ ] Site enabled: `sudo ln -s /etc/nginx/sites-available/crm-backend /etc/nginx/sites-enabled/`
- [ ] Default site removed: `sudo rm /etc/nginx/sites-enabled/default`
- [ ] Configuration tested: `sudo nginx -t`
- [ ] Nginx reloaded: `sudo systemctl reload nginx`

## SSL Certificates

- [ ] Certbot installed
- [ ] Certbot directory created: `/var/www/certbot`
- [ ] SSL certificate obtained for backend domain:
  ```bash
  sudo certbot --nginx -d backend.onsync-test.xyz -d www.backend.onsync-test.xyz
  ```
- [ ] SSL certificate obtained for frontend domain:
  ```bash
  sudo certbot --nginx -d frontend.onsync-test.xyz -d www.frontend.onsync-test.xyz
  ```
- [ ] HTTPS redirect enabled in Nginx config
- [ ] Nginx configuration updated with SSL settings
- [ ] Nginx reloaded after SSL setup
- [ ] Auto-renewal tested: `sudo certbot renew --dry-run`

## Testing

- [ ] Health endpoint responds: `curl https://backend.onsync-test.xyz/health/`
- [ ] API root accessible: `curl https://backend.onsync-test.xyz/api/`
- [ ] SSL certificate valid (check in browser - green padlock)
- [ ] CORS working (test from frontend domain)
- [ ] Login endpoint works
- [ ] Signup endpoint works
- [ ] Can create resources (clients, payments, etc.)
- [ ] Static files loading correctly
- [ ] Admin panel accessible: `https://backend.onsync-test.xyz/admin/`
- [ ] No errors in logs:
  ```bash
  sudo tail -f /var/log/crm-backend/error.log
  sudo tail -f /var/log/nginx/error.log
  ```

## Security

- [ ] Firewall enabled and configured: `sudo ufw status`
- [ ] SSH key-based authentication (password auth disabled)
- [ ] Django `DEBUG=False`
- [ ] Strong `SECRET_KEY` in production
- [ ] `.env` file permissions secured (600)
- [ ] Database password is strong
- [ ] CORS only allows frontend domain
- [ ] Security headers configured in Nginx
- [ ] HTTPS enforced (HTTP redirects to HTTPS)
- [ ] Fail2ban installed (optional): `sudo apt install fail2ban`

## Monitoring & Maintenance

- [ ] Log rotation configured (logrotate)
- [ ] Database backup script created
- [ ] Backup cron job scheduled (daily at 2 AM)
- [ ] Monitoring tool installed (Uptime Kuma, Prometheus, etc.)
- [ ] Error notification configured (email, Sentry, etc.)
- [ ] Service restart on reboot verified:
  ```bash
  sudo systemctl is-enabled crm-backend.service
  ```

## Documentation

- [ ] Production URLs documented
- [ ] Environment variables documented
- [ ] Deployment process documented
- [ ] Backup/restore procedures documented
- [ ] Emergency contact information recorded
- [ ] Credentials stored securely (password manager)

## Post-Deployment

- [ ] Create super admin user: `python manage.py createsuperuser`
- [ ] Test creating accounts via signup endpoint
- [ ] Test authentication flow
- [ ] Verify data appears correctly
- [ ] Monitor logs for 24 hours
- [ ] Inform team deployment is complete
- [ ] Update frontend to use production API URL

---

## Quick Command Reference

```bash
# Restart application
sudo systemctl restart crm-backend.service

# View logs
sudo journalctl -u crm-backend.service -f
sudo tail -f /var/log/crm-backend/error.log

# Deploy updates
cd /var/www/crm-backend
git pull origin main
source venv/bin/activate
pip install -r requirements.txt --upgrade
python manage.py collectstatic --noinput
sudo systemctl restart crm-backend.service

# Check status
sudo systemctl status crm-backend.service
sudo systemctl status nginx

# Test SSL renewal
sudo certbot renew --dry-run

# Database backup
supabase db dump -f backup_$(date +%Y%m%d_%H%M%S).sql
```

---

## Emergency Rollback

If something goes wrong:

```bash
# 1. Stop the service
sudo systemctl stop crm-backend.service

# 2. Rollback code
cd /var/www/crm-backend
git reset --hard <previous-commit-hash>

# 3. Restore dependencies
source venv/bin/activate
pip install -r requirements.txt

# 4. Restart service
sudo systemctl start crm-backend.service

# 5. Check logs
sudo journalctl -u crm-backend.service -n 100
```

---

**Need Help?**
- Check the full guide: `PRODUCTION_DEPLOYMENT_GUIDE.md`
- Review logs: `sudo journalctl -u crm-backend.service -f`
- Test endpoints: `curl https://backend.onsync-test.xyz/api/`
