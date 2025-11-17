from rest_framework import serializers
from django.contrib.auth.password_validation import validate_password
from .models import (
    Account, Employee, Client, Package, ClientPackage,
    Payment, Installment, StripeCustomer, StripeApiKey
)


class AccountSerializer(serializers.ModelSerializer):
    class Meta:
        model = Account
        fields = ['id', 'name', 'email', 'ceo_name', 'niche', 'location', 'website_url',
                  'date_joined', 'created_at', 'updated_at', 'timezone']
        read_only_fields = ['id', 'date_joined', 'created_at', 'updated_at']


class EmployeeSerializer(serializers.ModelSerializer):
    account_name = serializers.CharField(source='account.name', read_only=True)
    password = serializers.CharField(write_only=True, required=False, validators=[validate_password])
    
    class Meta:
        model = Employee
        fields = [
            'id', 'account', 'account_name', 'name', 'email', 'job_role',
            'phone_number', 'role', 'status', 'is_active', 'password', 'last_login',
            'slack_user_id', 'slack_user_name', 'timezone',
            'can_view_all_clients', 'can_manage_all_clients',
            'can_view_all_payments', 'can_manage_all_payments',
            'can_view_all_installments', 'can_manage_all_installments'
        ]
        read_only_fields = ['id', 'last_login', 'account_name']
        extra_kwargs = {
            'password': {'write_only': True},
            'account': {'required': False}
        }

    def create(self, validated_data):
        password = validated_data.pop('password', None)
        
        # Set account from request user if not provided
        if 'account' not in validated_data:
            validated_data['account'] = self.context['request'].user.account
        
        employee = Employee(**validated_data)
        if password:
            employee.set_password(password)
        else:
            employee.set_unusable_password()
        
        employee.save()
        return employee

    def update(self, instance, validated_data):
        password = validated_data.pop('password', None)
        
        for attr, value in validated_data.items():
            setattr(instance, attr, value)
        
        if password:
            instance.set_password(password)
        
        instance.save()
        return instance


class EmployeeCreateSerializer(serializers.ModelSerializer):
    """Separate serializer for creating employees with permission management"""
    password = serializers.CharField(write_only=True, required=True, validators=[validate_password])
    permissions = serializers.ListField(
        child=serializers.CharField(),
        required=False,
        write_only=True,
        help_text="List of permission codenames to assign"
    )
    
    class Meta:
        model = Employee
        fields = [
            'name', 'email', 'job_role', 'phone_number', 'role',
            'password', 'permissions', 'is_active', 'status',
            'can_view_all_clients', 'can_manage_all_clients',
            'can_view_all_payments', 'can_manage_all_payments',
            'can_view_all_installments', 'can_manage_all_installments'
        ]

    def create(self, validated_data):
        permissions_data = validated_data.pop('permissions', None)
        password = validated_data.pop('password')
        
        # Set account from request user
        validated_data['account'] = self.context['request'].user.account
        
        employee = Employee(**validated_data)
        employee.set_password(password)
        employee.save()
        
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
            'no_more_payments', 'timezone', 'coach', 'coach_name', 'closer',
            'closer_name', 'setter', 'setter_name'
        ]
        read_only_fields = ['id', 'account_name', 'coach_name', 'closer_name', 'setter_name']
        extra_kwargs = {
            'account': {'required': False}
        }

    def create(self, validated_data):
        # Set account from request user
        validated_data['account'] = self.context['request'].user.account
        return super().create(validated_data)

    def validate_coach(self, value):
        if value and value.account_id != self.context['request'].user.account_id:
            raise serializers.ValidationError("Coach must belong to your account.")
        return value

    def validate_closer(self, value):
        if value and value.account_id != self.context['request'].user.account_id:
            raise serializers.ValidationError("Closer must belong to your account.")
        return value

    def validate_setter(self, value):
        if value and value.account_id != self.context['request'].user.account_id:
            raise serializers.ValidationError("Setter must belong to your account.")
        return value


class PackageSerializer(serializers.ModelSerializer):
    account_name = serializers.CharField(source='account.name', read_only=True)
    
    class Meta:
        model = Package
        fields = ['id', 'account', 'account_name', 'package_name', 'description']
        read_only_fields = ['id', 'account_name']


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
        if value.account_id != self.context['request'].user.account_id:
            raise serializers.ValidationError("Client must belong to your account.")
        return value


class PaymentSerializer(serializers.ModelSerializer):
    client_name = serializers.SerializerMethodField()
    account_name = serializers.CharField(source='account.name', read_only=True)
    
    class Meta:
        model = Payment
        fields = [
            'id', 'account', 'account_name', 'client_package', 'client', 'client_name',
            'stripe_customer_id', 'amount', 'currency', 'exchange_rate',
            'native_account_currency', 'status', 'failure_reason', 'payment_date'
        ]
        read_only_fields = ['id', 'account_name', 'client_name']
        extra_kwargs = {
            'account': {'required': False}
        }

    def get_client_name(self, obj):
        return f"{obj.client.first_name} {obj.client.last_name or ''}".strip()
    
    def create(self, validated_data):
        # Automatically set account from client if not provided
        if 'account' not in validated_data and 'client' in validated_data:
            validated_data['account'] = validated_data['client'].account
        return super().create(validated_data)


class InstallmentSerializer(serializers.ModelSerializer):
    client_name = serializers.SerializerMethodField()
    account_name = serializers.CharField(source='account.name', read_only=True)
    
    class Meta:
        model = Installment
        fields = [
            'id', 'account', 'account_name', 'client', 'client_name', 'invoice_id',
            'stripe_customer_id', 'stripe_account', 'amount', 'currency', 'status',
            'instalment_number', 'schedule_date', 'date_created', 'date_updated'
        ]
        read_only_fields = ['id', 'account_name', 'client_name', 'date_created', 'date_updated']
        extra_kwargs = {
            'account': {'required': False}
        }

    def get_client_name(self, obj):
        return f"{obj.client.first_name} {obj.client.last_name or ''}".strip()
    
    def create(self, validated_data):
        # Automatically set account from client if not provided
        if 'account' not in validated_data and 'client' in validated_data:
            validated_data['account'] = validated_data['client'].account
        return super().create(validated_data)


class StripeApiKeySerializer(serializers.ModelSerializer):
    account_name = serializers.CharField(source='account.name', read_only=True)
    
    class Meta:
        model = StripeApiKey
        fields = [
            'id', 'account', 'account_name', 'stripe_account', 'api_key',
            'is_active', 'checkout_thanks_url', 'checkout_cancelled_url',
            'created_at', 'updated_at'
        ]
        read_only_fields = ['id', 'account_name', 'created_at', 'updated_at']
        extra_kwargs = {
            'api_key': {'write_only': True}  # Don't expose API key in responses
        }


class StripeCustomerSerializer(serializers.ModelSerializer):
    client_name = serializers.SerializerMethodField()
    stripe_account_name = serializers.CharField(source='stripe_account.stripe_account', read_only=True)
    
    class Meta:
        model = StripeCustomer
        fields = [
            'stripe_customer_id', 'account', 'stripe_account', 'stripe_account_name',
            'client', 'client_name', 'email', 'status'
        ]
        read_only_fields = ['stripe_customer_id', 'stripe_account_name', 'client_name']

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
