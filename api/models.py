from django.db import models
from django.contrib.auth.models import AbstractBaseUser, PermissionsMixin, BaseUserManager
import binascii
import os
import uuid


class EmployeeToken(models.Model):
    """
    Custom token model for Employee authentication
    Separate from DRF's default Token to avoid conflicts with other applications
    """
    key = models.CharField(max_length=40, primary_key=True)
    user = models.OneToOneField(
        'Employee',
        related_name='auth_token',
        on_delete=models.CASCADE,
        db_column='user_id'
    )
    created = models.DateTimeField(auto_now_add=True)

    class Meta:
        managed = False
        db_table = 'employee_tokens'

    def save(self, *args, **kwargs):
        if not self.key:
            self.key = self.generate_key()
        return super().save(*args, **kwargs)

    @classmethod
    def generate_key(cls):
        return binascii.hexlify(os.urandom(20)).decode()

    def __str__(self):
        return self.key


class Account(models.Model):
    """Account model for multi-tenancy"""
    id = models.AutoField(primary_key=True)
    name = models.CharField(max_length=255)
    email = models.EmailField(max_length=255, unique=True, null=True, blank=True)
    ceo_name = models.CharField(max_length=255, null=True, blank=True)
    niche = models.CharField(max_length=255, null=True, blank=True)
    location = models.TextField(null=True, blank=True)
    trz_api_key = models.TextField(null=True, blank=True)
    domain_name_main = models.CharField(max_length=255, null=True, blank=True)
    website_url = models.CharField(max_length=255, null=True, blank=True)
    date_joined = models.DateField(null=True, blank=True)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)
    trz_group_id = models.IntegerField(null=True, blank=True, unique=True)
    trz_admin_user_id = models.IntegerField(null=True, blank=True, unique=True)
    ghl_location_id = models.TextField(null=True, blank=True, unique=True)
    short_url_domain = models.TextField(null=True, blank=True)  # DEPRECATED: Use forms_domain instead
    timezone = models.TextField(null=True, blank=True)
    company_currency = models.TextField(null=True, blank=True, help_text='Default currency for this company (e.g., "gbp", "usd")')
    
    # Custom Forms Domain Fields
    forms_domain = models.CharField(max_length=255, null=True, blank=True, unique=True, 
                                    help_text='Custom subdomain for client check-in links (e.g., check.gymname.com)')
    forms_domain_verified = models.BooleanField(default=False, 
                                                help_text='Whether DNS has been verified')
    forms_domain_configured = models.BooleanField(default=False, 
                                                  help_text='Whether domain is fully configured')
    forms_domain_added_at = models.DateTimeField(null=True, blank=True, 
                                                 help_text='When custom domain was configured')

    class Meta:
        managed = False
        db_table = 'accounts'

    def __str__(self):
        return self.name


class EmployeeRole(models.Model):
    """Custom role definitions per account for flexible employee classification"""
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    account = models.ForeignKey(Account, on_delete=models.CASCADE, db_column='account_id', related_name='employee_roles')
    name = models.CharField(max_length=100)
    description = models.TextField(null=True, blank=True)
    color = models.CharField(max_length=7, default='#3B82F6', help_text='Hex color code for UI badge display')
    is_active = models.BooleanField(default=True)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        managed = False
        db_table = 'employee_roles'
        unique_together = [['account', 'name']]
        ordering = ['name']

    def __str__(self):
        return f"{self.name} ({self.account.name})"


class EmployeeRoleAssignment(models.Model):
    """Junction table for many-to-many relationship between employees and custom roles"""
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    employee = models.ForeignKey('Employee', on_delete=models.CASCADE, db_column='employee_id')
    role = models.ForeignKey(EmployeeRole, on_delete=models.CASCADE, db_column='role_id')
    assigned_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        managed = False
        db_table = 'employee_role_assignments'
        unique_together = [['employee', 'role']]

    def __str__(self):
        return f"{self.employee.name} - {self.role.name}"


class EmployeeManager(BaseUserManager):
    """Custom manager for Employee user model"""
    
    def create_user(self, email, password=None, **extra_fields):
        if not email:
            raise ValueError('The Email field must be set')
        email = self.normalize_email(email)
        user = self.model(email=email, **extra_fields)
        user.set_password(password)
        user.save(using=self._db)
        return user

    def create_superuser(self, email, password=None, **extra_fields):
        extra_fields.setdefault('is_staff', True)
        extra_fields.setdefault('is_superuser', True)
        extra_fields.setdefault('is_active', True)
        extra_fields.setdefault('role', 'super_admin')
        
        if extra_fields.get('is_staff') is not True:
            raise ValueError('Superuser must have is_staff=True.')
        if extra_fields.get('is_superuser') is not True:
            raise ValueError('Superuser must have is_superuser=True.')

        return self.create_user(email, password, **extra_fields)


class Employee(AbstractBaseUser, PermissionsMixin):
    """Custom Employee user model"""
    
    ROLE_CHOICES = [
        ('super_admin', 'Super Admin'),
        ('admin', 'Admin'),
        ('employee', 'Employee'),
    ]
    
    STATUS_CHOICES = [
        ('active', 'Active'),
        ('inactive', 'Inactive'),
    ]

    id = models.AutoField(primary_key=True)
    account = models.ForeignKey(Account, on_delete=models.CASCADE, db_column='account_id')
    name = models.CharField(max_length=255)
    first_name = models.TextField(null=True, blank=True, help_text='First name (separate from name field)')
    last_name = models.TextField(null=True, blank=True, help_text='Last name (separate from name field)')
    email = models.EmailField(max_length=255, unique=True)
    status = models.CharField(max_length=20, choices=STATUS_CHOICES, default='active')
    job_role = models.CharField(max_length=255, null=True, blank=True)
    phone_number = models.CharField(max_length=50, null=True, blank=True)
    slack_user_id = models.CharField(max_length=255, null=True, blank=True)
    slack_user_name = models.CharField(max_length=255, null=True, blank=True)
    reports_to = models.ForeignKey('self', on_delete=models.SET_NULL, null=True, blank=True, db_column='reports_to')
    slack_workspace_id = models.TextField(null=True, blank=True)
    timezone = models.TextField(null=True, blank=True)
    
    # Custom fields for role-based permissions
    role = models.CharField(max_length=20, choices=ROLE_CHOICES, default='employee')
    custom_roles = models.ManyToManyField(
        EmployeeRole,
        through='EmployeeRoleAssignment',
        related_name='employees',
        blank=True,
        help_text='Custom role definitions for flexible employee classification'
    )
    
    # Custom permission flags for granular access control
    can_view_all_clients = models.BooleanField(default=False, help_text="Can view all clients in account (not just assigned)")
    can_manage_all_clients = models.BooleanField(default=False, help_text="Can create/update/delete all clients (not just assigned)")
    can_view_all_payments = models.BooleanField(default=False, help_text="Can view all payments in account")
    can_manage_all_payments = models.BooleanField(default=False, help_text="Can create/update/delete payments")
    can_view_all_installments = models.BooleanField(default=False, help_text="Can view all installments in account")
    can_manage_all_installments = models.BooleanField(default=False, help_text="Can create/update/delete installments")
    
    # Django Auth Required Fields
    password = models.CharField(max_length=128)
    is_active = models.BooleanField(default=True)
    is_staff = models.BooleanField(default=False)
    is_superuser = models.BooleanField(default=False)
    last_login = models.DateTimeField(null=True, blank=True)
    
    objects = EmployeeManager()

    USERNAME_FIELD = 'email'
    REQUIRED_FIELDS = ['name']

    class Meta:
        managed = False
        db_table = 'employees'
        permissions = [
            ('manage_employees', 'Can manage employees'),
            ('view_all_clients', 'Can view all clients'),
            ('manage_all_clients', 'Can manage all clients'),
            ('view_payments', 'Can view payments'),
            ('manage_payments', 'Can manage payments'),
        ]

    def __str__(self):
        return f"{self.name} ({self.email})"

    @property
    def is_super_admin(self):
        return self.role == 'super_admin'

    @property
    def is_admin(self):
        return self.role in ['super_admin', 'admin']

    @property
    def display_role(self):
        """Returns the role name(s) to display in UI"""
        if self.role in ['super_admin', 'admin']:
            return self.get_role_display()
        
        # Get custom roles - need to check if we're in a query context
        try:
            custom_role_names = list(self.custom_roles.filter(is_active=True).values_list('name', flat=True))
            if custom_role_names:
                return ', '.join(custom_role_names)
        except:
            pass
        
        return self.get_role_display()


class Client(models.Model):
    """Client model"""
    
    STATUS_CHOICES = [
        ('pending', 'Pending'),
        ('active', 'Active'),
        ('inactive', 'Inactive'),
        ('onboarding', 'Onboarding'),
        ('paused', 'Paused'),
        ('cancelled', 'Cancelled'),
    ]

    id = models.AutoField(primary_key=True)
    account = models.ForeignKey(Account, on_delete=models.CASCADE, db_column='account_id')
    first_name = models.CharField(max_length=255)
    last_name = models.CharField(max_length=255, null=True, blank=True)
    email = models.EmailField(max_length=255, unique=True)
    status = models.CharField(max_length=20, choices=STATUS_CHOICES, default='active')
    address = models.TextField(null=True, blank=True)
    instagram_handle = models.CharField(max_length=255, null=True, blank=True)
    ghl_id = models.CharField(max_length=255, null=True, blank=True)
    coaching_app_id = models.CharField(max_length=255, null=True, blank=True)
    trz_id = models.CharField(max_length=255, null=True, blank=True)
    client_start_date = models.DateField(null=True, blank=True)
    client_end_date = models.DateField(null=True, blank=True)
    dob = models.DateField(null=True, blank=True)
    country = models.CharField(max_length=100, null=True, blank=True)
    state = models.CharField(max_length=100, null=True, blank=True)
    currency = models.CharField(max_length=10, null=True, blank=True)
    gender = models.CharField(max_length=50, null=True, blank=True)
    lead_origin = models.TextField(null=True, blank=True)
    notice_given = models.BooleanField(default=False)
    no_more_payments = models.BooleanField(default=False)
    timezone = models.TextField(null=True, blank=True)
    checkin_link = models.UUIDField(
        default=uuid.uuid4, 
        unique=True, 
        editable=False,
        help_text='Permanent UUID link for check-in form access'
    )
    short_checkin_link = models.TextField(
        null=True, 
        blank=True,
        help_text='Shortened URL for check-in form (permanent, generated once by URL shortener)'
    )
    
    # Employee Relationships
    coach = models.ForeignKey(
        Employee, on_delete=models.SET_NULL, null=True, blank=True,
        related_name='coached_clients', db_column='coach_id'
    )
    closer = models.ForeignKey(
        Employee, on_delete=models.SET_NULL, null=True, blank=True,
        related_name='closed_clients', db_column='closer_id'
    )
    setter = models.ForeignKey(
        Employee, on_delete=models.SET_NULL, null=True, blank=True,
        related_name='set_clients', db_column='setter_id'
    )
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True, null=True, blank=True)

    class Meta:
        managed = False
        db_table = 'clients'

    def __str__(self):
        return f"{self.first_name} {self.last_name or ''} ({self.email})".strip()


class Package(models.Model):
    """Package model"""
    
    id = models.AutoField(primary_key=True)
    account = models.ForeignKey(Account, on_delete=models.CASCADE, db_column='account_id')
    package_name = models.CharField(max_length=255)
    description = models.TextField(null=True, blank=True)

    class Meta:
        managed = False
        db_table = 'packages'
        unique_together = [['account', 'package_name']]

    def __str__(self):
        return self.package_name


class ClientPackage(models.Model):
    """ClientPackage model for client-package relationships"""
    
    PAYMENT_SCHEDULE_CHOICES = [
        ('PIF', 'PIF'),
        ('Monthly', 'Monthly'),
        ('Quarterly', 'Quarterly'),
        ('Yearly', 'Yearly'),
    ]
    
    STATUS_CHOICES = [
        ('active', 'Active'),
        ('inactive', 'Inactive'),
    ]

    id = models.AutoField(primary_key=True)
    client = models.ForeignKey(
        Client, on_delete=models.CASCADE, db_column='client_id',
        related_name='packages'
    )
    package = models.ForeignKey(
        Package, on_delete=models.RESTRICT, db_column='package_id'
    )
    custom_price = models.DecimalField(max_digits=10, decimal_places=2, null=True, blank=True)
    monthly_payment_amount = models.DecimalField(max_digits=10, decimal_places=2, null=True, blank=True)
    pif_months = models.IntegerField(null=True, blank=True)
    stripe_account = models.CharField(max_length=255, null=True, blank=True)
    payment_schedule = models.CharField(
        max_length=50, choices=PAYMENT_SCHEDULE_CHOICES, null=True, blank=True
    )
    start_date = models.DateField(null=True, blank=True)
    package_end_date = models.DateField(null=True, blank=True)
    package_type = models.CharField(max_length=255, null=True, blank=True)
    payments_left = models.IntegerField(null=True, blank=True)
    review_type = models.CharField(max_length=255, null=True, blank=True)
    checkin_type = models.CharField(max_length=255, null=True, blank=True)
    checkin_day = models.CharField(max_length=50, null=True, blank=True)
    minimum_term = models.IntegerField(null=True, blank=True)
    status = models.CharField(max_length=20, choices=STATUS_CHOICES, default='active')

    class Meta:
        managed = False
        db_table = 'client_packages'

    def __str__(self):
        return f"{self.client} - {self.package}"


class StripeCustomer(models.Model):
    """Stripe Customer model"""
    
    STATUS_CHOICES = [
        ('active', 'Active'),
        ('inactive', 'Inactive'),
    ]

    # Primary key is now stripe_customer_id (Stripe's customer ID)
    stripe_customer_id = models.CharField(max_length=255, primary_key=True)
    account = models.ForeignKey(Account, on_delete=models.CASCADE, db_column='account_id')
    client = models.ForeignKey(Client, on_delete=models.CASCADE, db_column='client_id')
    stripe_account = models.ForeignKey(
        'stripe_integration.StripeApiKey', 
        on_delete=models.CASCADE, 
        db_column='stripe_account',
        to_field='stripe_account',
        null=True, 
        blank=True
    )
    email = models.EmailField(max_length=255, null=True, blank=True)
    status = models.CharField(max_length=50, null=True, blank=True)

    class Meta:
        managed = False
        db_table = 'stripe_customers'

    def __str__(self):
        return f"StripeCustomer {self.email} ({self.stripe_customer_id})"


class Payment(models.Model):
    """Payment model"""
    
    STATUS_CHOICES = [
        ('paid', 'Paid'),
        ('failed', 'Failed'),
        ('refunded', 'Refunded'),
        ('disputed', 'Disputed'),
        ('incomplete', 'Incomplete'),
    ]

    id = models.CharField(max_length=255, primary_key=True)
    account = models.ForeignKey(Account, on_delete=models.CASCADE, db_column='account_id')
    client_package = models.ForeignKey(
        ClientPackage, on_delete=models.SET_NULL, null=True, blank=True,
        db_column='client_package_id'
    )
    client = models.ForeignKey(Client, on_delete=models.CASCADE, db_column='client_id')
    stripe_customer_id = models.CharField(max_length=255, null=True, blank=True)
    amount = models.DecimalField(max_digits=10, decimal_places=2)
    paid_currency = models.TextField(null=True, blank=True, help_text='Currency the payment was made in (e.g., "gbp", "usd")')
    company_currency_amount = models.DecimalField(max_digits=10, decimal_places=2, null=True, blank=True, help_text='Amount in company currency after conversion')
    exchange_rate = models.DecimalField(max_digits=10, decimal_places=6, null=True, blank=True)
    native_account_currency = models.CharField(max_length=10, null=True, blank=True)
    status = models.CharField(max_length=20, choices=STATUS_CHOICES)
    failure_reason = models.TextField(null=True, blank=True)
    payment_date = models.DateTimeField(auto_now_add=True)

    class Meta:
        managed = False
        db_table = 'payments'

    def __str__(self):
        return f"Payment {self.id} - {self.client}"


class Installment(models.Model):
    """Installment model (mapped to instalments table)"""
    
    STATUS_CHOICES = [
        ('open', 'Open'),
        ('paid', 'Paid'),
        ('failed', 'Failed'),
        ('closed', 'Closed'),
    ]

    id = models.AutoField(primary_key=True)
    account = models.ForeignKey(Account, on_delete=models.CASCADE, db_column='account_id')
    client = models.ForeignKey(Client, on_delete=models.CASCADE, db_column='client_id')
    invoice_id = models.CharField(max_length=255, null=True, blank=True)
    stripe_customer_id = models.CharField(max_length=255, null=True, blank=True)
    stripe_account = models.CharField(max_length=255, null=True, blank=True)
    amount = models.DecimalField(max_digits=10, decimal_places=2, null=True, blank=True)
    currency = models.CharField(max_length=10, null=True, blank=True)
    status = models.CharField(max_length=20, choices=STATUS_CHOICES, default='open')
    instalment_number = models.IntegerField(null=True, blank=True)
    schedule_date = models.DateField()
    date_created = models.DateTimeField(auto_now_add=True)
    date_updated = models.DateTimeField(auto_now=True)

    class Meta:
        managed = False
        db_table = 'instalments'

    def __str__(self):
        return f"Installment #{self.instalment_number} - {self.client}"


class CheckInForm(models.Model):
    """Check-in form template assigned to packages (1:1 relationship)"""
    
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    account = models.ForeignKey(Account, on_delete=models.CASCADE, db_column='account_id')
    package = models.OneToOneField(
        Package, 
        on_delete=models.CASCADE, 
        db_column='package_id',
        related_name='checkin_form'
    )
    title = models.CharField(max_length=255)
    description = models.TextField(null=True, blank=True)
    form_schema = models.JSONField(default=dict, help_text='FormBuilder JSON structure')
    is_active = models.BooleanField(default=True)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        managed = False
        db_table = 'check_in_forms'
        unique_together = [['account', 'package']]

    def __str__(self):
        return f"{self.title} ({self.package.package_name})"


class CheckInSchedule(models.Model):
    """Scheduling configuration for check-in forms"""
    
    SCHEDULE_TYPE_CHOICES = [
        ('SAME_DAY', 'Send to everybody at the same time each week'),
        ('INDIVIDUAL_DAYS', 'Each client has a designated checkin day'),
    ]
    
    DAY_CHOICES = [
        ('monday', 'Monday'),
        ('tuesday', 'Tuesday'),
        ('wednesday', 'Wednesday'),
        ('thursday', 'Thursday'),
        ('friday', 'Friday'),
        ('saturday', 'Saturday'),
        ('sunday', 'Sunday'),
    ]
    
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    form = models.OneToOneField(
        CheckInForm, 
        on_delete=models.CASCADE, 
        db_column='form_id',
        related_name='schedule'
    )
    account = models.ForeignKey(Account, on_delete=models.CASCADE, db_column='account_id')
    schedule_type = models.CharField(max_length=20, choices=SCHEDULE_TYPE_CHOICES)
    day_of_week = models.CharField(
        max_length=10, 
        choices=DAY_CHOICES, 
        null=True, 
        blank=True,
        help_text='Required for SAME_DAY mode, null for INDIVIDUAL_DAYS'
    )
    time = models.TimeField(help_text='Time to send check-in emails (e.g., 09:00)')
    timezone = models.CharField(max_length=50, default='UTC')
    webhook_job_ids = models.JSONField(
        default=list, 
        help_text='Array of webhook IDs from external scheduler'
    )
    is_active = models.BooleanField(default=True)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        managed = False
        db_table = 'check_in_schedules'

    def __str__(self):
        return f"Schedule: {self.form.title} ({self.get_schedule_type_display()})"


class CheckInSubmission(models.Model):
    """Client responses to check-in forms"""
    
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    form = models.ForeignKey(
        CheckInForm, 
        on_delete=models.CASCADE, 
        db_column='form_id',
        related_name='submissions'
    )
    client = models.ForeignKey(
        Client, 
        on_delete=models.CASCADE, 
        db_column='client_id',
        related_name='checkin_submissions'
    )
    account = models.ForeignKey(Account, on_delete=models.CASCADE, db_column='account_id')
    submission_data = models.JSONField(default=dict, help_text='Client form responses as JSON')
    submitted_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        managed = False
        db_table = 'check_in_submissions'
        ordering = ['-submitted_at']

    def __str__(self):
        return f"{self.client.first_name} - {self.form.title} ({self.submitted_at.strftime('%Y-%m-%d')})"
