from django.contrib import admin
from django.contrib.auth.admin import UserAdmin as BaseUserAdmin
from .models import (
    Account, Employee, EmployeeRole, EmployeeRoleAssignment, Client, Package, ClientPackage,
    Payment, Installment, StripeCustomer
)


@admin.register(Account)
class AccountAdmin(admin.ModelAdmin):
    list_display = ['id', 'name', 'email', 'created_at']
    search_fields = ['name', 'email']
    readonly_fields = ['created_at', 'updated_at']


@admin.register(Employee)
class EmployeeAdmin(BaseUserAdmin):
    list_display = ['email', 'name', 'role', 'account', 'status', 'is_active']
    list_filter = ['role', 'status', 'is_active', 'is_staff']
    search_fields = ['email', 'name']
    ordering = ['email']
    
    fieldsets = (
        (None, {'fields': ('email', 'password')}),
        ('Personal info', {'fields': ('name', 'job_role', 'phone_number')}),
        ('Account', {'fields': ('account', 'role', 'status')}),
        ('Permissions', {'fields': ('is_active', 'is_staff', 'is_superuser', 'groups', 'user_permissions')}),
        ('Important dates', {'fields': ('last_login',)}),
        ('Slack', {'fields': ('slack_user_id', 'slack_user_name', 'slack_workspace_id')}),
    )
    
    add_fieldsets = (
        (None, {
            'classes': ('wide',),
            'fields': ('email', 'name', 'account', 'password1', 'password2', 'role'),
        }),
    )


@admin.register(Client)
class ClientAdmin(admin.ModelAdmin):
    list_display = ['email', 'first_name', 'last_name', 'status', 'account', 'coach']
    list_filter = ['status', 'country', 'currency']
    search_fields = ['email', 'first_name', 'last_name', 'instagram_handle']
    raw_id_fields = ['account', 'coach', 'closer', 'setter']


@admin.register(Package)
class PackageAdmin(admin.ModelAdmin):
    list_display = ['id', 'package_name']
    search_fields = ['package_name', 'description']


@admin.register(ClientPackage)
class ClientPackageAdmin(admin.ModelAdmin):
    list_display = ['id', 'client', 'package', 'status', 'payment_schedule', 'start_date']
    list_filter = ['status', 'payment_schedule']
    search_fields = ['client__email', 'client__first_name', 'package__package_name']
    raw_id_fields = ['client', 'package']


@admin.register(Payment)
class PaymentAdmin(admin.ModelAdmin):
    list_display = ['id', 'client', 'amount', 'currency', 'status', 'payment_date'
]
    list_filter = ['status', 'currency']
    search_fields = ['id', 'client__email', 'client__first_name']
    raw_id_fields = ['client', 'client_package']
    readonly_fields = ['payment_date']


@admin.register(Installment)
class InstallmentAdmin(admin.ModelAdmin):
    list_display = ['id', 'client', 'instalment_number', 'amount', 'status', 'schedule_date']
    list_filter = ['status']
    search_fields = ['client__email', 'client__first_name', 'invoice_id']
    raw_id_fields = ['client']
    readonly_fields = ['date_created', 'date_updated']


@admin.register(StripeCustomer)
class StripeCustomerAdmin(admin.ModelAdmin):
    list_display = ['stripe_customer_id', 'email', 'client', 'stripe_account', 'status']
    list_filter = ['status']
    search_fields = ['email', 'stripe_customer_id', 'client__email']
    raw_id_fields = ['account', 'client', 'stripe_account']


