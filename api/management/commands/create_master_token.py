"""
Management command to create a MasterToken for cross-account API access.

Usage:
    python manage.py create_master_token "CEO n8n Workflows"
    python manage.py create_master_token "Integration Service" --description "Used for automated reporting"
    python manage.py create_master_token --list  # List all tokens
    python manage.py create_master_token --revoke <token_key>  # Deactivate a token
"""
from django.core.management.base import BaseCommand, CommandError
from api.models import MasterToken


class Command(BaseCommand):
    help = 'Create, list, or manage MasterTokens for cross-account API access'

    def add_arguments(self, parser):
        parser.add_argument(
            'name',
            nargs='?',
            type=str,
            help='Name for the new master token (e.g., "CEO n8n Workflows")'
        )
        parser.add_argument(
            '--description',
            type=str,
            default='',
            help='Optional description for the token'
        )
        parser.add_argument(
            '--list',
            action='store_true',
            help='List all master tokens'
        )
        parser.add_argument(
            '--revoke',
            type=str,
            metavar='TOKEN_KEY',
            help='Revoke (deactivate) a master token by its key'
        )
        parser.add_argument(
            '--delete',
            type=str,
            metavar='TOKEN_KEY',
            help='Permanently delete a master token by its key'
        )
        parser.add_argument(
            '--activate',
            type=str,
            metavar='TOKEN_KEY',
            help='Reactivate a previously revoked token'
        )

    def handle(self, *args, **options):
        # Handle --list flag
        if options['list']:
            return self._list_tokens()
        
        # Handle --revoke flag
        if options['revoke']:
            return self._revoke_token(options['revoke'])
        
        # Handle --delete flag
        if options['delete']:
            return self._delete_token(options['delete'])
        
        # Handle --activate flag
        if options['activate']:
            return self._activate_token(options['activate'])
        
        # Create new token
        name = options['name']
        if not name:
            raise CommandError(
                'Please provide a name for the token, or use --list to see existing tokens.\n'
                'Usage: python manage.py create_master_token "Token Name"'
            )
        
        return self._create_token(name, options['description'])

    def _create_token(self, name, description):
        """Create a new master token"""
        # Check if token with same name exists
        if MasterToken.objects.filter(name=name).exists():
            raise CommandError(f'A master token with name "{name}" already exists.')
        
        # Create the token
        token = MasterToken.objects.create(
            name=name,
            description=description or None,
            is_active=True
        )
        
        self.stdout.write(self.style.SUCCESS('\n' + '=' * 60))
        self.stdout.write(self.style.SUCCESS('Master Token Created Successfully!'))
        self.stdout.write(self.style.SUCCESS('=' * 60))
        self.stdout.write(f'\nName: {token.name}')
        if token.description:
            self.stdout.write(f'Description: {token.description}')
        self.stdout.write(f'Created: {token.created_at}')
        self.stdout.write(f'Status: Active')
        self.stdout.write(self.style.WARNING('\n⚠️  IMPORTANT: Save this token securely! It will not be shown again.'))
        self.stdout.write(self.style.SUCCESS(f'\nToken Key: {token.key}'))
        self.stdout.write('\n' + '=' * 60)
        self.stdout.write('\nUsage in n8n or API calls:')
        self.stdout.write('  Header option 1: X-Master-Token: <token_key>')
        self.stdout.write('  Header option 2: Authorization: MasterToken <token_key>')
        self.stdout.write('  Required header: X-Account-ID: <account_id>')
        self.stdout.write('=' * 60 + '\n')

    def _list_tokens(self):
        """List all master tokens"""
        tokens = MasterToken.objects.all().order_by('-created_at')
        
        if not tokens.exists():
            self.stdout.write(self.style.WARNING('No master tokens found.'))
            return
        
        self.stdout.write(self.style.SUCCESS('\n' + '=' * 80))
        self.stdout.write(self.style.SUCCESS('Master Tokens'))
        self.stdout.write(self.style.SUCCESS('=' * 80))
        
        for token in tokens:
            status = self.style.SUCCESS('Active') if token.is_active else self.style.ERROR('Inactive')
            last_used = token.last_used_at.strftime('%Y-%m-%d %H:%M:%S') if token.last_used_at else 'Never'
            
            self.stdout.write(f'\nName: {token.name}')
            self.stdout.write(f'  Key: {token.key[:8]}...{token.key[-8:]}')  # Show partial key for safety
            self.stdout.write(f'  Status: {status}')
            self.stdout.write(f'  Created: {token.created_at.strftime("%Y-%m-%d %H:%M:%S")}')
            self.stdout.write(f'  Last Used: {last_used}')
            if token.description:
                self.stdout.write(f'  Description: {token.description}')
        
        self.stdout.write('\n' + '=' * 80 + '\n')

    def _revoke_token(self, token_key):
        """Revoke (deactivate) a master token"""
        try:
            token = MasterToken.objects.get(key=token_key)
        except MasterToken.DoesNotExist:
            raise CommandError(f'Token with key "{token_key}" not found.')
        
        if not token.is_active:
            self.stdout.write(self.style.WARNING(f'Token "{token.name}" is already inactive.'))
            return
        
        token.is_active = False
        token.save()
        
        self.stdout.write(self.style.SUCCESS(f'Token "{token.name}" has been revoked (deactivated).'))

    def _activate_token(self, token_key):
        """Reactivate a revoked token"""
        try:
            token = MasterToken.objects.get(key=token_key)
        except MasterToken.DoesNotExist:
            raise CommandError(f'Token with key "{token_key}" not found.')
        
        if token.is_active:
            self.stdout.write(self.style.WARNING(f'Token "{token.name}" is already active.'))
            return
        
        token.is_active = True
        token.save()
        
        self.stdout.write(self.style.SUCCESS(f'Token "{token.name}" has been reactivated.'))

    def _delete_token(self, token_key):
        """Permanently delete a master token"""
        try:
            token = MasterToken.objects.get(key=token_key)
        except MasterToken.DoesNotExist:
            raise CommandError(f'Token with key "{token_key}" not found.')
        
        name = token.name
        token.delete()
        
        self.stdout.write(self.style.SUCCESS(f'Token "{name}" has been permanently deleted.'))

