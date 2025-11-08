#!/usr/bin/env python
"""
Test script to verify environment variables are being loaded correctly.
Run this on your production server to debug .env loading issues.
"""
import os
import sys
from pathlib import Path

# Add the project directory to the path
BASE_DIR = Path(__file__).resolve().parent
sys.path.insert(0, str(BASE_DIR))

# Set Django settings module
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'config.settings')

print("=" * 80)
print("🔍 Environment Variables Loading Test")
print("=" * 80)
print()

# Test 1: Check if .env file exists
env_file = BASE_DIR / '.env'
print(f"1. Checking .env file location: {env_file}")
print(f"   - File exists: {env_file.exists()}")
if env_file.exists():
    print(f"   - File size: {env_file.stat().st_size} bytes")
    print(f"   - File permissions: {oct(env_file.stat().st_mode)[-3:]}")
print()

# Test 2: Try to read .env file manually
print("2. Reading .env file contents:")
if env_file.exists():
    with open(env_file, 'r') as f:
        lines = [line.strip() for line in f.readlines() if line.strip() and not line.startswith('#')]
        for line in lines:
            if '=' in line:
                key = line.split('=')[0]
                print(f"   ✓ Found: {key}")
else:
    print("   ❌ .env file not found!")
print()

# Test 3: Test django-environ parsing
print("3. Testing django-environ parsing:")
try:
    import environ
    env = environ.Env(DEBUG=(bool, False))
    environ.Env.read_env(os.path.join(BASE_DIR, '.env'))
    
    print(f"   - SECRET_KEY: {'*' * 20} (length: {len(env.str('SECRET_KEY', default='NOT_SET'))})")
    print(f"   - DEBUG: {env.bool('DEBUG', default=False)} (type: {type(env.bool('DEBUG', default=False))})")
    
    allowed_hosts_str = env.str('ALLOWED_HOSTS', default='NOT_SET')
    print(f"   - ALLOWED_HOSTS (raw): {allowed_hosts_str}")
    if allowed_hosts_str != 'NOT_SET':
        allowed_hosts = [h.strip() for h in allowed_hosts_str.split(',') if h.strip()]
        print(f"   - ALLOWED_HOSTS (parsed): {allowed_hosts}")
    
    db_url = env.str('DATABASE_URL', default='NOT_SET')
    if db_url != 'NOT_SET':
        # Mask password in output
        if '@' in db_url:
            parts = db_url.split('@')
            masked = parts[0].split(':')[0] + ':****@' + '@'.join(parts[1:])
            print(f"   - DATABASE_URL: {masked}")
        else:
            print(f"   - DATABASE_URL: {db_url}")
    else:
        print(f"   - DATABASE_URL: NOT_SET")
    
    cors_str = env.str('CORS_ALLOWED_ORIGINS', default='NOT_SET')
    print(f"   - CORS_ALLOWED_ORIGINS (raw): {cors_str[:100]}...")
    
    print("\n   ✅ django-environ loaded successfully")
except Exception as e:
    print(f"   ❌ Error loading with django-environ: {e}")
print()

# Test 4: Load Django settings
print("4. Loading Django settings:")
try:
    import django
    django.setup()
    
    from django.conf import settings
    
    print(f"   - DEBUG: {settings.DEBUG}")
    print(f"   - ALLOWED_HOSTS: {settings.ALLOWED_HOSTS}")
    print(f"   - DATABASE ENGINE: {settings.DATABASES['default']['ENGINE']}")
    print(f"   - DATABASE NAME: {settings.DATABASES['default']['NAME']}")
    print(f"   - DATABASE HOST: {settings.DATABASES['default']['HOST']}")
    print(f"   - DATABASE PORT: {settings.DATABASES['default']['PORT']}")
    print(f"   - CORS_ALLOWED_ORIGINS: {settings.CORS_ALLOWED_ORIGINS}")
    
    print("\n   ✅ Django settings loaded successfully")
    
    # Test 5: Check if the issue is resolved
    print()
    print("5. Validation:")
    if 'backend.onsync-test.xyz' in settings.ALLOWED_HOSTS:
        print("   ✅ backend.onsync-test.xyz is in ALLOWED_HOSTS")
    else:
        print("   ❌ backend.onsync-test.xyz is NOT in ALLOWED_HOSTS")
        print(f"   Current ALLOWED_HOSTS: {settings.ALLOWED_HOSTS}")
    
    if not settings.DEBUG:
        print("   ✅ DEBUG is False (production mode)")
    else:
        print("   ⚠️  DEBUG is True (development mode)")
        
except Exception as e:
    print(f"   ❌ Error loading Django settings: {e}")
    import traceback
    traceback.print_exc()

print()
print("=" * 80)
print("Test complete!")
print("=" * 80)
