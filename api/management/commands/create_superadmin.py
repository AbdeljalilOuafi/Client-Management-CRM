from django.core.management.base import BaseCommand
from django.contrib.auth.models import Permission
from django.contrib.contenttypes.models import ContentType
from api.models import Employee, Account


class Command(BaseCommand):
    help = 'Create a superadmin user for testing'

    def add_arguments(self, parser):
        parser.add_argument('--email', type=str, help='Email address', default='admin@example.com')
        parser.add_argument('--password', type=str, help='Password', default='admin123')
        parser.add_argument('--name', type=str, help='Full name', default='Super Admin')

    def handle(self, *args, **options):
        email = options['email']
        password = options['password']
        name = options['name']

        # Check if user already exists
        if Employee.objects.filter(email=email).exists():
            self.stdout.write(self.style.WARNING(f'User with email {email} already exists!'))
            return

        # Get the first account or create a test account
        account = Account.objects.first()
        if not account:
            self.stdout.write(self.style.ERROR('No accounts found in database. Please create an account first.'))
            return

        # Create superadmin user
        user = Employee.objects.create_user(
            email=email,
            password=password,
            name=name,
            account=account,
            role='super_admin',
            is_staff=True,
            is_superuser=True,
            is_active=True,
            status='active'
        )

        self.stdout.write(self.style.SUCCESS(f'Successfully created superadmin user:'))
        self.stdout.write(f'  Email: {email}')
        self.stdout.write(f'  Password: {password}')
        self.stdout.write(f'  Account: {account.name} (ID: {account.id})')
        self.stdout.write(self.style.WARNING('\nPlease change the password after first login!'))
