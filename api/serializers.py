from rest_framework import serializers
from django.contrib.auth.password_validation import validate_password
from .models import (
    Account, Employee, EmployeeRole, EmployeeRoleAssignment, Client, Package, ClientPackage,
    Payment, Installment, StripeCustomer, CheckInForm, CheckInSchedule, CheckInSubmission
)
from stripe_integration.models import StripeApiKey


def get_request_account_id(request):
    """
    Helper function to get account_id from request for both regular employees
    and master token users. For master token users, reads from X-Account-ID header.
    """
    user = request.user
    if getattr(user, 'is_master_token', False):
        # For master token users, get account_id from header
        account_id_header = request.headers.get('X-Account-ID')
        if account_id_header:
            try:
                return int(account_id_header)
            except ValueError:
                pass
        # If account_id was already set on the user (by mixin), use that
        if hasattr(user, '_account_id') and user._account_id is not None:
            return user._account_id
        return None
    else:
        # Regular employee
        return getattr(user, 'account_id', None)


class AccountSerializer(serializers.ModelSerializer):
    class Meta:
        model = Account
        fields = ['id', 'name', 'email', 'ceo_name', 'niche', 'location', 'website_url',
                  'date_joined', 'created_at', 'updated_at', 'timezone', 'forms_domain',
                  'forms_domain_verified', 'forms_domain_configured', 'forms_domain_added_at',
                  'payment_domain', 'payment_domain_verified', 'payment_domain_configured', 
                  'payment_domain_added_at']
        read_only_fields = ['id', 'date_joined', 'created_at', 'updated_at', 
                           'forms_domain_verified', 'forms_domain_configured', 'forms_domain_added_at',
                           'payment_domain_verified', 'payment_domain_configured', 'payment_domain_added_at']
    
    def validate_forms_domain(self, value):
        """Validate custom forms domain format"""
        if not value:
            return value
        
        # Basic domain format validation (subdomain.domain.tld)
        import re
        domain_pattern = r'^[a-zA-Z0-9][a-zA-Z0-9-]{0,61}[a-zA-Z0-9]?\.[a-zA-Z0-9][a-zA-Z0-9-]{0,61}[a-zA-Z0-9]\.[a-zA-Z]{2,}$'
        
        if not re.match(domain_pattern, value):
            raise serializers.ValidationError(
                "Invalid domain format. Expected format: subdomain.domain.com (e.g., check.gymname.com)"
            )
        
        # Ensure no protocol prefix
        if value.startswith('http://') or value.startswith('https://'):
            raise serializers.ValidationError(
                "Domain should not include protocol (http:// or https://). Use format: check.gymname.com"
            )
        
        return value.lower()  # Normalize to lowercase
    
    def validate_payment_domain(self, value):
        """Validate custom payment domain format"""
        if not value:
            return value
        
        # Basic domain format validation (subdomain.domain.tld)
        import re
        domain_pattern = r'^[a-zA-Z0-9][a-zA-Z0-9-]{0,61}[a-zA-Z0-9]?\.[a-zA-Z0-9][a-zA-Z0-9-]{0,61}[a-zA-Z0-9]\.[a-zA-Z]{2,}$'
        
        if not re.match(domain_pattern, value):
            raise serializers.ValidationError(
                "Invalid domain format. Expected format: subdomain.domain.com (e.g., pay.gymname.com)"
            )
        
        # Ensure no protocol prefix
        if value.startswith('http://') or value.startswith('https://'):
            raise serializers.ValidationError(
                "Domain should not include protocol (http:// or https://). Use format: pay.gymname.com"
            )
        
        return value.lower()  # Normalize to lowercase


class EmployeeRoleSerializer(serializers.ModelSerializer):
    """Serializer for custom employee roles"""
    account_name = serializers.CharField(source='account.name', read_only=True)
    employee_count = serializers.SerializerMethodField()
    
    class Meta:
        model = EmployeeRole
        fields = [
            'id', 'account', 'account_name', 'name', 'description',
            'color', 'is_active', 'employee_count', 'created_at', 'updated_at'
        ]
        read_only_fields = ['id', 'account', 'account_name', 'employee_count', 'created_at', 'updated_at']
    
    def get_employee_count(self, obj):
        """Return count of active employees with this role"""
        return obj.employees.filter(status='active').count()
    
    def validate_color(self, value):
        """Validate hex color format"""
        if not value.startswith('#') or len(value) != 7:
            raise serializers.ValidationError("Color must be a valid hex code (e.g., #3B82F6)")
        return value
    
    def validate_name(self, value):
        """Ensure role name is not a reserved system role"""
        reserved_names = ['super_admin', 'admin', 'employee', 'Super Admin', 'Admin', 'Employee']
        if value in reserved_names:
            raise serializers.ValidationError(f"'{value}' is a reserved system role name. Please choose a different name.")
        return value


class EmployeeSerializer(serializers.ModelSerializer):
    account_name = serializers.CharField(source='account.name', read_only=True)
    password = serializers.CharField(write_only=True, required=False, validators=[validate_password])
    custom_roles = serializers.PrimaryKeyRelatedField(
        many=True, 
        queryset=EmployeeRole.objects.all(), 
        required=False
    )
    custom_role_names = serializers.SerializerMethodField()
    custom_role_colors = serializers.SerializerMethodField()
    display_role = serializers.CharField(read_only=True)
    
    class Meta:
        model = Employee
        fields = [
            'id', 'account', 'account_name', 'name', 'email', 'job_role',
            'phone_number', 'role', 'custom_roles', 'custom_role_names', 'custom_role_colors',
            'display_role', 'status', 'is_active', 'password', 'last_login',
            'slack_user_id', 'slack_user_name', 'timezone',
            'can_view_all_clients', 'can_manage_all_clients',
            'can_view_all_payments', 'can_manage_all_payments',
            'can_view_all_installments', 'can_manage_all_installments'
        ]
        read_only_fields = ['id', 'account', 'last_login', 'account_name', 'custom_role_names', 
                            'custom_role_colors', 'display_role']
        extra_kwargs = {
            'password': {'write_only': True},
        }
    
    def get_custom_role_names(self, obj):
        """Return list of custom role names"""
        return [role.name for role in obj.custom_roles.filter(is_active=True)]
    
    def get_custom_role_colors(self, obj):
        """Return list of custom role colors"""
        return [role.color for role in obj.custom_roles.filter(is_active=True)]

    def create(self, validated_data):
        password = validated_data.pop('password', None)
        custom_roles = validated_data.pop('custom_roles', [])
        
        # Account is set by the ViewSet via perform_create() using account_id kwarg
        # This supports both regular employees and master token users
        employee = Employee(**validated_data)
        if password:
            employee.set_password(password)
        else:
            employee.set_unusable_password()
        
        employee.save()
        
        # Assign custom roles
        if custom_roles:
            employee.custom_roles.set(custom_roles)
        
        return employee

    def update(self, instance, validated_data):
        password = validated_data.pop('password', None)
        custom_roles = validated_data.pop('custom_roles', None)
        
        for attr, value in validated_data.items():
            setattr(instance, attr, value)
        
        if password:
            instance.set_password(password)
        
        instance.save()
        
        # Update custom roles if provided
        if custom_roles is not None:
            instance.custom_roles.set(custom_roles)
        
        return instance


class EmployeeCreateSerializer(serializers.ModelSerializer):
    """Separate serializer for creating employees with permission management"""
    password = serializers.CharField(write_only=True, required=True, validators=[validate_password])
    custom_roles = serializers.PrimaryKeyRelatedField(
        many=True,
        queryset=EmployeeRole.objects.all(),
        required=False
    )
    permissions = serializers.ListField(
        child=serializers.CharField(),
        required=False,
        write_only=True,
        help_text="List of permission codenames to assign"
    )
    
    class Meta:
        model = Employee
        fields = [
            'name', 'email', 'job_role', 'phone_number', 'role', 'custom_roles',
            'password', 'permissions', 'is_active', 'status',
            'can_view_all_clients', 'can_manage_all_clients',
            'can_view_all_payments', 'can_manage_all_payments',
            'can_view_all_installments', 'can_manage_all_installments'
        ]

    def create(self, validated_data):
        permissions_data = validated_data.pop('permissions', None)
        password = validated_data.pop('password')
        custom_roles = validated_data.pop('custom_roles', [])
        
        # Account is set by the ViewSet via perform_create() using account_id kwarg
        # This supports both regular employees and master token users
        employee = Employee(**validated_data)
        employee.set_password(password)
        employee.save()
        
        # Assign custom roles
        if custom_roles:
            employee.custom_roles.set(custom_roles)
        
        # Handle permissions
        if permissions_data is not None:
            self._assign_permissions(employee, permissions_data)
        else:
            # Assign all permissions by default
            from django.contrib.auth.models import Permission
            permissions = Permission.objects.filter(content_type__app_label='api')
            employee.user_permissions.set(permissions)
        
        return employee

    def _assign_permissions(self, employee, permission_codenames):
        from django.contrib.auth.models import Permission
        permissions = Permission.objects.filter(
            codename__in=permission_codenames,
            content_type__app_label='api'
        )
        employee.user_permissions.set(permissions)


class EmployeeUpdatePermissionsSerializer(serializers.Serializer):
    """Serializer for updating employee permissions"""
    permissions = serializers.ListField(
        child=serializers.CharField(),
        required=True,
        help_text="List of permission codenames to assign"
    )

    def update(self, instance, validated_data):
        permission_codenames = validated_data['permissions']
        from django.contrib.auth.models import Permission
        permissions = Permission.objects.filter(
            codename__in=permission_codenames,
            content_type__app_label='api'
        )
        instance.user_permissions.set(permissions)
        return instance


class ClientSerializer(serializers.ModelSerializer):
    account_name = serializers.CharField(source='account.name', read_only=True)
    coach_name = serializers.CharField(source='coach.name', read_only=True)
    closer_name = serializers.CharField(source='closer.name', read_only=True)
    setter_name = serializers.CharField(source='setter.name', read_only=True)
    
    class Meta:
        model = Client
        fields = [
            'id', 'account', 'account_name', 'first_name', 'last_name', 'email',
            'status', 'address', 'instagram_handle', 'ghl_id', 'coaching_app_id',
            'trz_id', 'client_start_date', 'client_end_date', 'dob', 'country',
            'state', 'currency', 'gender', 'lead_origin', 'notice_given',
            'no_more_payments', 'timezone', 'phone', 'assigned_coach', 'notes',
            'coach', 'coach_name', 'closer', 'closer_name', 'setter', 'setter_name',
            'checkin_link', 'short_checkin_link'
        ]
        read_only_fields = ['id', 'account', 'account_name', 'coach_name', 'closer_name', 'setter_name', 
                           'checkin_link', 'short_checkin_link']

    def create(self, validated_data):
        # Account is set by the ViewSet via perform_create() using account_id kwarg
        # This is especially important for master token users where account is resolved dynamically
        # Note: account_id kwarg from save() is added to validated_data by DRF automatically
        return super().create(validated_data)

    def validate_coach(self, value):
        account_id = get_request_account_id(self.context['request'])
        if value and account_id and value.account_id != account_id:
            raise serializers.ValidationError("Coach must belong to your account.")
        return value

    def validate_closer(self, value):
        account_id = get_request_account_id(self.context['request'])
        if value and account_id and value.account_id != account_id:
            raise serializers.ValidationError("Closer must belong to your account.")
        return value

    def validate_setter(self, value):
        account_id = get_request_account_id(self.context['request'])
        if value and account_id and value.account_id != account_id:
            raise serializers.ValidationError("Setter must belong to your account.")
        return value


class PackageSerializer(serializers.ModelSerializer):
    account_name = serializers.CharField(source='account.name', read_only=True)
    
    class Meta:
        model = Package
        fields = ['id', 'account', 'account_name', 'package_name', 'description']
        read_only_fields = ['id', 'account', 'account_name']


class ClientPackageSerializer(serializers.ModelSerializer):
    client_name = serializers.CharField(source='client.first_name', read_only=True)
    package_name = serializers.CharField(source='package.package_name', read_only=True)
    
    class Meta:
        model = ClientPackage
        fields = [
            'id', 'client', 'client_name', 'package', 'package_name',
            'custom_price', 'monthly_payment_amount', 'pif_months',
            'stripe_account', 'payment_schedule', 'start_date',
            'package_end_date', 'package_type', 'payments_left',
            'review_type', 'checkin_type', 'checkin_day', 'minimum_term', 'status'
        ]
        read_only_fields = ['id', 'client_name', 'package_name']

    def validate_client(self, value):
        # Ensure client belongs to user's account
        account_id = get_request_account_id(self.context['request'])
        if account_id and value.account_id != account_id:
            raise serializers.ValidationError("Client must belong to your account.")
        return value


class PaymentSerializer(serializers.ModelSerializer):
    client_name = serializers.SerializerMethodField()
    account_name = serializers.CharField(source='account.name', read_only=True)
    
    class Meta:
        model = Payment
        fields = [
            'id', 'account', 'account_name', 'client_package', 'client', 'client_name',
            'stripe_customer_id', 'amount', 'paid_currency', 'company_currency_amount',
            'exchange_rate', 'native_account_currency', 'status', 'failure_reason', 'payment_date'
        ]
        read_only_fields = ['id', 'account', 'account_name', 'client_name']

    def get_client_name(self, obj):
        return f"{obj.client.first_name} {obj.client.last_name or ''}".strip()


class InstallmentSerializer(serializers.ModelSerializer):
    client_name = serializers.SerializerMethodField()
    account_name = serializers.CharField(source='account.name', read_only=True)
    
    class Meta:
        model = Installment
        fields = [
            'id', 'account', 'account_name', 'client', 'client_name', 'client_package',
            'invoice_id', 'stripe_customer_id', 'stripe_account', 'amount', 'currency',
            'status', 'instalment_number', 'schedule_date', 'date_created', 'date_updated'
        ]
        read_only_fields = ['id', 'account', 'account_name', 'client_name', 'date_created', 'date_updated']

    def get_client_name(self, obj):
        return f"{obj.client.first_name} {obj.client.last_name or ''}".strip()


class StripeCustomerSerializer(serializers.ModelSerializer):
    client_name = serializers.SerializerMethodField()
    stripe_account_name = serializers.CharField(source='stripe_account.stripe_account', read_only=True)
    
    class Meta:
        model = StripeCustomer
        fields = [
            'stripe_customer_id', 'account', 'stripe_account', 'stripe_account_name',
            'client', 'client_name', 'email', 'status'
        ]
        read_only_fields = ['stripe_customer_id', 'account', 'stripe_account_name', 'client_name']

    def get_client_name(self, obj):
        return f"{obj.client.first_name} {obj.client.last_name or ''}".strip()


class ChangePasswordSerializer(serializers.Serializer):
    old_password = serializers.CharField(required=True, write_only=True)
    new_password = serializers.CharField(required=True, write_only=True, validators=[validate_password])

    def validate_old_password(self, value):
        user = self.context['request'].user
        if not user.check_password(value):
            raise serializers.ValidationError("Old password is incorrect.")
        return value

    def update(self, instance, validated_data):
        instance.set_password(validated_data['new_password'])
        instance.save()
        return instance


# Check-In Forms Serializers

class CheckInScheduleSerializer(serializers.ModelSerializer):
    """Serializer for check-in schedules"""
    
    class Meta:
        model = CheckInSchedule
        fields = [
            'id', 'form', 'account', 'schedule_type', 'day_of_week',
            'time', 'timezone', 'webhook_job_ids', 'is_active',
            'created_at', 'updated_at'
        ]
        read_only_fields = ['id', 'form', 'account', 'webhook_job_ids', 'created_at', 'updated_at']
    
    def validate(self, data):
        """Validate schedule configuration"""
        schedule_type = data.get('schedule_type')
        day_of_week = data.get('day_of_week')
        
        if schedule_type == 'SAME_DAY' and not day_of_week:
            raise serializers.ValidationError({
                'day_of_week': 'This field is required for SAME_DAY schedule type.'
            })
        
        if schedule_type == 'INDIVIDUAL_DAYS' and day_of_week:
            raise serializers.ValidationError({
                'day_of_week': 'This field should be null for INDIVIDUAL_DAYS schedule type.'
            })
        
        return data


class CheckInFormSerializer(serializers.ModelSerializer):
    """Serializer for check-in forms"""
    package_name = serializers.CharField(source='package.package_name', read_only=True)
    account_name = serializers.CharField(source='account.name', read_only=True)
    schedule = CheckInScheduleSerializer(read_only=True)
    submission_count = serializers.SerializerMethodField()
    
    # Nested write for schedule creation
    schedule_data = CheckInScheduleSerializer(write_only=True, required=False)
    
    class Meta:
        model = CheckInForm
        fields = [
            'id', 'account', 'account_name', 'package', 'package_name',
            'title', 'description', 'form_schema', 'is_active',
            'schedule', 'schedule_data', 'submission_count',
            'created_at', 'updated_at'
        ]
        read_only_fields = ['id', 'account', 'account_name', 'package_name', 
                           'schedule', 'submission_count', 'created_at', 'updated_at']
    
    def get_submission_count(self, obj):
        """Return total number of submissions for this form"""
        return obj.submissions.count()
    
    def validate_package(self, value):
        """Ensure package belongs to user's account and doesn't have existing form"""
        request = self.context.get('request')
        if not request:
            return value
        
        # Check package belongs to same account
        account_id = get_request_account_id(request)
        if account_id and value.account_id != account_id:
            raise serializers.ValidationError("Package must belong to your account.")
        
        # Check if form already exists for this package (for create only)
        if not self.instance and hasattr(value, 'checkin_form'):
            raise serializers.ValidationError(
                f"A check-in form already exists for package '{value.package_name}'. "
                "Each package can only have one form."
            )
        
        return value
    
    def validate_form_schema(self, value):
        """Validate form schema is valid JSON and has required structure"""
        if not isinstance(value, dict):
            raise serializers.ValidationError("Form schema must be a JSON object.")
        
        # Basic validation - can be extended based on FormBuilder requirements
        if not value:
            raise serializers.ValidationError("Form schema cannot be empty.")
        
        return value
    
    def create(self, validated_data):
        """Create form and optionally create schedule"""
        schedule_data = validated_data.pop('schedule_data', None)
        
        # Account is set by the ViewSet via perform_create() using account_id kwarg
        # This supports both regular employees and master token users
        
        # Create form
        form = super().create(validated_data)
        
        # Create schedule if provided
        if schedule_data:
            schedule_data['form'] = form
            schedule_data['account'] = form.account
            CheckInSchedule.objects.create(**schedule_data)
            
            # Webhook creation will be handled in the ViewSet after schedule is saved
        
        return form
    
    def update(self, instance, validated_data):
        """Update form (schedule updates handled separately)"""
        validated_data.pop('schedule_data', None)  # Ignore schedule updates here
        return super().update(instance, validated_data)


class CheckInSubmissionSerializer(serializers.ModelSerializer):
    """Serializer for check-in submissions"""
    form_title = serializers.CharField(source='form.title', read_only=True)
    client_name = serializers.SerializerMethodField()
    client_email = serializers.EmailField(source='client.email', read_only=True)
    
    class Meta:
        model = CheckInSubmission
        fields = [
            'id', 'form', 'form_title', 'client', 'client_name', 'client_email',
            'account', 'submission_data', 'submitted_at'
        ]
        read_only_fields = ['id', 'form_title', 'client_name', 'client_email', 
                           'account', 'submitted_at']
    
    def get_client_name(self, obj):
        return f"{obj.client.first_name} {obj.client.last_name or ''}".strip()
    
    def validate(self, data):
        """Ensure client and form belong to same account"""
        form = data.get('form')
        client = data.get('client')
        
        if form and client:
            if form.account_id != client.account_id:
                raise serializers.ValidationError(
                    "Form and client must belong to the same account."
                )
        
        return data
    
    def create(self, validated_data):
        """Create submission with auto-assigned account"""
        # Auto-assign account from form
        form = validated_data['form']
        validated_data['account'] = form.account
        
        return super().create(validated_data)


class CheckInSubmissionCreateSerializer(serializers.ModelSerializer):
    """Simplified serializer for public submission creation via checkin link"""
    
    class Meta:
        model = CheckInSubmission
        fields = ['submission_data']
    
    def validate_submission_data(self, value):
        """Validate submission data structure"""
        if not isinstance(value, dict):
            raise serializers.ValidationError("Submission data must be a JSON object.")
        
        if not value:
            raise serializers.ValidationError("Submission data cannot be empty.")
        
        return value
