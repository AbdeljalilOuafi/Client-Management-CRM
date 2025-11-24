from rest_framework import viewsets, status, filters
from rest_framework.decorators import action, api_view, permission_classes
from rest_framework.response import Response
from rest_framework.permissions import IsAuthenticated, AllowAny
from django_filters.rest_framework import DjangoFilterBackend
from django.contrib.auth import authenticate
from django.db.models import Q, Sum, Min, Max, Count
from django.http import HttpResponse
from dateutil.relativedelta import relativedelta
import csv
import io
from datetime import datetime
from django.db import transaction
from django.conf import settings
import requests
import logging

from .models import (
    Account, Employee, EmployeeRole, Client, Package, ClientPackage,
    Payment, Installment, StripeCustomer, StripeApiKey, EmployeeToken,
    CheckInForm, CheckInSchedule, CheckInSubmission
)
from .serializers import (
    AccountSerializer, EmployeeSerializer, EmployeeRoleSerializer, EmployeeCreateSerializer,
    EmployeeUpdatePermissionsSerializer, ClientSerializer, PackageSerializer,
    ClientPackageSerializer, PaymentSerializer, InstallmentSerializer,
    StripeCustomerSerializer, ChangePasswordSerializer,
    CheckInFormSerializer, CheckInScheduleSerializer, CheckInSubmissionSerializer
)
from .permissions import (
    IsAccountMember, IsSuperAdminOrAdmin, IsSuperAdmin,
    CanManageEmployees, IsSelfOrAdmin, CanViewClients, CanManageClients,
    CanViewPayments, CanManagePayments, CanViewInstallments, CanManageInstallments
)


class AuthViewSet(viewsets.ViewSet):
    """Authentication ViewSet"""
    permission_classes = [AllowAny]

    @action(detail=False, methods=['post'])
    def login(self, request):
        """
        Login endpoint
        POST /api/auth/login/
        Body: {"email": "user@example.com", "password": "password"}
        """
        email = request.data.get('email')
        password = request.data.get('password')

        if not email or not password:
            return Response(
                {'error': 'Email and password are required'},
                status=status.HTTP_400_BAD_REQUEST
            )

        user = authenticate(request, username=email, password=password)

        if user is not None:
            if not user.is_active:
                return Response(
                    {'error': 'Account is inactive'},
                    status=status.HTTP_403_FORBIDDEN
                )

            token, _ = EmployeeToken.objects.get_or_create(user=user)
            
            return Response({
                'token': token.key,
                'user': {
                    'id': user.id,
                    'email': user.email,
                    'name': user.name,
                    'role': user.role,
                    'account_id': user.account_id,
                    'account_name': user.account.name,
                    'permissions': {
                        'can_view_all_clients': user.can_view_all_clients,
                        'can_manage_all_clients': user.can_manage_all_clients,
                        'can_view_all_payments': user.can_view_all_payments,
                        'can_manage_all_payments': user.can_manage_all_payments,
                        'can_view_all_installments': user.can_view_all_installments,
                        'can_manage_all_installments': user.can_manage_all_installments
                    }
                }
            })
        else:
            return Response(
                {'error': 'Invalid credentials'},
                status=status.HTTP_401_UNAUTHORIZED
            )

    @action(detail=False, methods=['post'])
    def signup(self, request):
        """
        Signup endpoint - Creates a new account and super admin user
        POST /api/auth/signup/
        Body: {
            "account": {
                "name": "Company Name",
                "email": "company@example.com",
                "ceo_name": "CEO Name",
                "niche": "Fitness",
                "location": "New York, USA",
                "website_url": "https://company.com",
                "timezone": "America/New_York"
            },
            "user": {
                "name": "Admin Name",
                "email": "admin@example.com",
                "password": "securepassword123",
                "phone_number": "+1234567890",
                "job_role": "CEO"
            }
        }
        """
        from django.db import transaction
        
        account_data = request.data.get('account', {})
        user_data = request.data.get('user', {})
        
        # Validate required fields
        if not account_data.get('name'):
            return Response(
                {'error': 'Account name is required'},
                status=status.HTTP_400_BAD_REQUEST
            )
        
        if not user_data.get('email') or not user_data.get('password') or not user_data.get('name'):
            return Response(
                {'error': 'User email, password, and name are required'},
                status=status.HTTP_400_BAD_REQUEST
            )
        
        # Check if user email already exists
        if Employee.objects.filter(email=user_data.get('email')).exists():
            return Response(
                {'error': 'User with this email already exists'},
                status=status.HTTP_400_BAD_REQUEST
            )
        
        try:
            with transaction.atomic():
                # Create Account
                account = Account.objects.create(
                    name=account_data.get('name'),
                    email=account_data.get('email'),
                    ceo_name=account_data.get('ceo_name'),
                    niche=account_data.get('niche'),
                    location=account_data.get('location'),
                    website_url=account_data.get('website_url'),
                    timezone=account_data.get('timezone', 'UTC')
                )
                
                # Create Super Admin Employee with full permissions
                employee = Employee.objects.create(
                    account=account,
                    name=user_data.get('name'),
                    email=user_data.get('email'),
                    job_role=user_data.get('job_role', 'Admin'),
                    phone_number=user_data.get('phone_number'),
                    role='super_admin',
                    status='active',
                    is_active=True,
                    is_staff=True,
                    is_superuser=True,
                    # Super admin gets all permissions by default
                    can_view_all_clients=True,
                    can_manage_all_clients=True,
                    can_view_all_payments=True,
                    can_manage_all_payments=True,
                    can_view_all_installments=True,
                    can_manage_all_installments=True
                )
                employee.set_password(user_data.get('password'))
                employee.save()
                
                # Create authentication token
                token = EmployeeToken.objects.create(user=employee)
                
                return Response({
                    'message': 'Account and user created successfully',
                    'token': token.key,
                    'account': {
                        'id': account.id,
                        'name': account.name,
                        'email': account.email
                    },
                    'user': {
                        'id': employee.id,
                        'email': employee.email,
                        'name': employee.name,
                        'role': employee.role,
                        'permissions': {
                            'can_view_all_clients': employee.can_view_all_clients,
                            'can_manage_all_clients': employee.can_manage_all_clients,
                            'can_view_all_payments': employee.can_view_all_payments,
                            'can_manage_all_payments': employee.can_manage_all_payments,
                            'can_view_all_installments': employee.can_view_all_installments,
                            'can_manage_all_installments': employee.can_manage_all_installments
                        }
                    }
                }, status=status.HTTP_201_CREATED)
                
        except Exception as e:
            return Response(
                {'error': f'Failed to create account: {str(e)}'},
                status=status.HTTP_500_INTERNAL_SERVER_ERROR
            )

    @action(detail=False, methods=['post'])
    def logout(self, request):
        """
        Logout endpoint
        POST /api/auth/logout/
        """
        if request.user.is_authenticated:
            try:
                request.user.auth_token.delete()
            except EmployeeToken.DoesNotExist:
                pass
        return Response({'message': 'Successfully logged out'})

    @action(detail=False, methods=['get'], permission_classes=[IsAuthenticated])
    def me(self, request):
        """
        Get current user
        GET /api/auth/me/
        """
        serializer = EmployeeSerializer(request.user)
        return Response(serializer.data)


class AccountViewSet(viewsets.ReadOnlyModelViewSet):
    """
    ViewSet for viewing Account information.
    Employees can only view their own account.
    """
    queryset = Account.objects.all()
    serializer_class = AccountSerializer
    permission_classes = [IsAuthenticated, IsAccountMember]

    def get_queryset(self):
        # Users can only see their own account
        return Account.objects.filter(id=self.request.user.account_id)


class EmployeeRoleViewSet(viewsets.ModelViewSet):
    """
    ViewSet for managing custom Employee Roles.
    - Super Admin and Admin can create/update/delete roles
    - All authenticated users can view roles in their account
    """
    serializer_class = EmployeeRoleSerializer
    permission_classes = [IsAuthenticated, IsAccountMember]
    filter_backends = [DjangoFilterBackend, filters.SearchFilter, filters.OrderingFilter]
    filterset_fields = ['is_active']
    search_fields = ['name', 'description']
    ordering_fields = ['name', 'created_at']
    ordering = ['name']

    def get_queryset(self):
        """Filter roles by account"""
        return EmployeeRole.objects.filter(account_id=self.request.user.account_id)

    def get_permissions(self):
        """Only admins can create/update/delete roles"""
        if self.action in ['create', 'update', 'partial_update', 'destroy']:
            return [IsAuthenticated(), IsSuperAdminOrAdmin()]
        return super().get_permissions()

    def perform_create(self, serializer):
        """Automatically set account when creating a role"""
        serializer.save(account_id=self.request.user.account_id)

    def destroy(self, request, *args, **kwargs):
        """Prevent deletion if employees are assigned to this role"""
        instance = self.get_object()
        employee_count = instance.employees.count()
        
        if employee_count > 0:
            return Response(
                {
                    'error': f'Cannot delete role. {employee_count} employee(s) are assigned to this role.',
                    'detail': 'Please reassign or remove employees from this role before deleting.'
                },
                status=status.HTTP_400_BAD_REQUEST
            )
        
        return super().destroy(request, *args, **kwargs)

    @action(detail=True, methods=['get'])
    def employees(self, request, pk=None):
        """
        Get list of employees assigned to this role
        GET /api/employee-roles/{id}/employees/
        """
        role = self.get_object()
        employees = role.employees.filter(account_id=request.user.account_id)
        serializer = EmployeeSerializer(employees, many=True, context={'request': request})
        return Response(serializer.data)


class EmployeeViewSet(viewsets.ModelViewSet):
    """
    ViewSet for managing Employees.
    - Super Admin and Admin can create/update/delete employees
    - Employees can view colleagues and update their own profile
    """
    queryset = Employee.objects.all()
    serializer_class = EmployeeSerializer
    permission_classes = [IsAuthenticated, IsAccountMember]
    filter_backends = [DjangoFilterBackend, filters.SearchFilter, filters.OrderingFilter]
    filterset_fields = ['role', 'status', 'job_role']
    search_fields = ['name', 'email']
    ordering_fields = ['name', 'email', 'role']
    ordering = ['name']

    def get_queryset(self):
        # Users can only see employees in their account
        return Employee.objects.filter(account_id=self.request.user.account_id)

    def get_serializer_class(self):
        if self.action == 'create':
            return EmployeeCreateSerializer
        elif self.action == 'update_permissions':
            return EmployeeUpdatePermissionsSerializer
        return EmployeeSerializer

    def get_permissions(self):
        if self.action in ['create', 'destroy']:
            return [IsAuthenticated(), CanManageEmployees()]
        elif self.action in ['update', 'partial_update']:
            return [IsAuthenticated(), IsSelfOrAdmin()]
        elif self.action == 'update_permissions':
            return [IsAuthenticated(), IsSuperAdminOrAdmin()]
        return super().get_permissions()

    @action(detail=True, methods=['post'])
    def update_permissions(self, request, pk=None):
        """
        Update employee permissions
        POST /api/employees/{id}/update_permissions/
        Body: {"permissions": ["view_all_clients", "manage_all_clients"]}
        """
        employee = self.get_object()
        serializer = self.get_serializer(employee, data=request.data)
        serializer.is_valid(raise_exception=True)
        serializer.save()
        return Response({'message': 'Permissions updated successfully'})

    @action(detail=True, methods=['post'])
    def change_password(self, request, pk=None):
        """
        Change password
        POST /api/employees/{id}/change_password/
        Body: {"old_password": "old", "new_password": "new"}
        """
        employee = self.get_object()
        
        # Only allow users to change their own password or admins
        if employee.id != request.user.id and not request.user.is_admin:
            return Response(
                {'error': 'You can only change your own password'},
                status=status.HTTP_403_FORBIDDEN
            )

        serializer = ChangePasswordSerializer(
            employee,
            data=request.data,
            context={'request': request}
        )
        serializer.is_valid(raise_exception=True)
        serializer.save()
        return Response({'message': 'Password changed successfully'})


class ClientViewSet(viewsets.ModelViewSet):
    """
    ViewSet for managing Clients.
    Permissions controlled by can_view_all_clients and can_manage_all_clients flags.
    """
    queryset = Client.objects.all()
    serializer_class = ClientSerializer
    permission_classes = [IsAuthenticated, IsAccountMember, CanViewClients]
    filter_backends = [DjangoFilterBackend, filters.SearchFilter, filters.OrderingFilter]
    filterset_fields = ['status', 'coach', 'closer', 'setter', 'country', 'currency']
    search_fields = ['first_name', 'last_name', 'email', 'instagram_handle']
    ordering_fields = ['first_name', 'last_name', 'email', 'client_start_date']
    ordering = ['first_name']

    def get_permissions(self):
        """Use CanManageClients for create/update/delete operations"""
        if self.action in ['create', 'update', 'partial_update', 'destroy']:
            return [IsAuthenticated(), IsAccountMember(), CanManageClients()]
        return super().get_permissions()

    def get_queryset(self):
        """
        Filter queryset based on permissions:
        - Super admin: sees all clients in account
        - Has 'can_view_all_clients': sees all clients in account
        - Otherwise: sees only assigned clients (coach/closer/setter)
        """
        user = self.request.user
        queryset = Client.objects.filter(account_id=user.account_id)
        
        # Super admin sees everything
        if user.is_super_admin:
            return queryset.select_related('account', 'coach', 'closer', 'setter')
        
        # Check if user has permission to view all clients
        if user.can_view_all_clients:
            return queryset.select_related('account', 'coach', 'closer', 'setter')
        
        # Otherwise, filter to only assigned clients
        queryset = queryset.filter(
            Q(coach=user) | Q(closer=user) | Q(setter=user)
        ).distinct()
        
        return queryset.select_related('account', 'coach', 'closer', 'setter')

    def perform_create(self, serializer):
        """Ensure account is set (permission already checked by CanManageClients)"""
        serializer.save(account_id=self.request.user.account_id)

    @action(detail=False, methods=['get'])
    def my_clients(self, request):
        """
        Get clients assigned to the current user (as coach/closer/setter)
        GET /api/clients/my_clients/
        """
        queryset = self.get_queryset().filter(
            Q(coach=request.user) |
            Q(closer=request.user) |
            Q(setter=request.user)
        ).distinct()
        
        page = self.paginate_queryset(queryset)
        if page is not None:
            serializer = self.get_serializer(page, many=True)
            return self.get_paginated_response(serializer.data)

        serializer = self.get_serializer(queryset, many=True)
        return Response(serializer.data)

    @action(detail=False, methods=['get'])
    def statistics(self, request):
        """
        Get client statistics
        GET /api/clients/statistics/
        """
        queryset = self.get_queryset()
        
        stats = {
            'total': queryset.count(),
            'active': queryset.filter(status='active').count(),
            'inactive': queryset.filter(status='inactive').count(),
            'onboarding': queryset.filter(status='onboarding').count(),
            'paused': queryset.filter(status='paused').count(),
            'cancelled': queryset.filter(status='cancelled').count(),
        }
        
        return Response(stats)

    @action(detail=True, methods=['get'], url_path='payment-details')
    def payment_details(self, request, pk=None):
        """
        Get comprehensive payment and package information for a client
        GET /api/clients/{id}/payment-details/
        """
        client = self.get_object()
        
        # Serialize client data using existing serializer
        client_serializer = self.get_serializer(client)
        client_data = client_serializer.data
        
        # Get active client package
        client_package = ClientPackage.objects.filter(
            client=client,
            status='active'
        ).select_related('package').first()
        
        # Get successful payments
        successful_payments = Payment.objects.filter(
            client=client,
            status='paid'
        ).order_by('-payment_date')
        
        # Build package info
        package_info = {
            'package_type': client_package.package_type if client_package else None,
            'status': client_package.status if client_package else None,
            'start_date': client_package.start_date if client_package else None,
            'end_date': client_package.package_end_date if client_package else None,
            'minimum_term': client_package.minimum_term if client_package else None,
            'review_type': client_package.review_type if client_package else None,
            'payment_schedule': client_package.payment_schedule if client_package else None,
            'payments_left': client_package.payments_left if client_package else None,
        }
        
        # Build payment info
        payment_info = {
            'payment_method': self._get_payment_method(successful_payments),
            'payment_amount': float(client_package.monthly_payment_amount) if client_package and client_package.monthly_payment_amount else 0.00,
            'latest_payment_amount': self._get_latest_payment_amount(successful_payments),
            'latest_payment_date': self._get_latest_payment_date(successful_payments),
            'next_payment_date': self._calculate_next_payment_date(client_package, successful_payments),
            'ltv': self._calculate_ltv(successful_payments),
            'currency': client.currency or 'USD',
            'day_of_month': self._get_payment_day(successful_payments),
            'no_more_payments': client.no_more_payments,
            'number_of_months': self._calculate_months(client_package),
            'number_of_months_paid': successful_payments.count(),
        }
        
        return Response({
            'client': client_data,
            'package_info': package_info,
            'payment_info': payment_info,
        })
    
    def _get_payment_method(self, payments_queryset):
        """Determine payment method based on latest payment"""
        latest_payment = payments_queryset.first()
        if latest_payment and latest_payment.stripe_customer_id:
            return 'Stripe'
        return 'Manual'
    
    def _get_latest_payment_amount(self, payments_queryset):
        """Get amount from most recent payment"""
        latest_payment = payments_queryset.first()
        if latest_payment:
            return float(latest_payment.amount)
        return 0.00
    
    def _get_latest_payment_date(self, payments_queryset):
        """Get date of most recent payment"""
        latest_payment = payments_queryset.first()
        if latest_payment:
            return latest_payment.payment_date
        return None
    
    def _calculate_next_payment_date(self, client_package, payments_queryset):
        """Calculate next payment date based on payment schedule"""
        if not client_package or not client_package.payment_schedule:
            return None
        
        latest_payment = payments_queryset.first()
        if not latest_payment:
            return None
        
        latest_date = latest_payment.payment_date
        schedule = client_package.payment_schedule.lower()
        
        if schedule == 'monthly':
            return latest_date + relativedelta(months=1)
        elif schedule == 'quarterly':
            return latest_date + relativedelta(months=3)
        elif schedule == 'semi_annually':
            return latest_date + relativedelta(months=6)
        elif schedule == 'annually':
            return latest_date + relativedelta(years=1)
        
        return None
    
    def _get_payment_day(self, payments_queryset):
        """Extract day of month from first payment"""
        first_payment = payments_queryset.last()  # last() because ordered DESC
        if first_payment:
            return first_payment.payment_date.day
        return None
    
    def _calculate_ltv(self, payments_queryset):
        """Calculate lifetime value (sum of all successful payments)"""
        ltv = payments_queryset.aggregate(total=Sum('amount'))['total']
        return float(ltv) if ltv else 0.00
    
    def _calculate_months(self, client_package):
        """Calculate number of months between start and end dates"""
        if not client_package or not client_package.start_date or not client_package.package_end_date:
            return None
        
        start = client_package.start_date
        end = client_package.package_end_date
        
        # Calculate difference in months
        months = (end.year - start.year) * 12 + (end.month - start.month)
        return months if months >= 0 else None

    @action(detail=True, methods=['get'], url_path='package-history')
    def package_history(self, request, pk=None):
        """
        Get historical packages for a client (inactive packages only)
        GET /api/clients/{id}/package-history/
        
        Returns all packagescon the client has had in the past with status='inactive',
        ordered by most recent first (based on package_end_date).
        """
        client = self.get_object()
        
        # Get all inactive packages for this client
        inactive_packages = ClientPackage.objects.filter(
            client=client,
            status='inactive'
        ).select_related('package').order_by('-package_end_date', '-start_date')
        
        # Serialize the packages using ClientPackageSerializer
        serializer = ClientPackageSerializer(inactive_packages, many=True)
        
        # Calculate summary statconistics
        total_packages = inactive_packages.count()
        
        # Get date range if packages exist
        if total_packages > 0:
            earliest_start = inactive_packages.aggregate(
                earliest=Min('start_date')
            )['earliest']
            latest_end = inactive_packages.aggregate(
                latest=Max('package_end_date')
            )['latest']
        else:
            earliest_start = None
            latest_end = None
        
        return Response({
            'client_id': client.id,
            'client_name': f"{client.first_name} {client.last_name or ''}".strip(),
            'total_inactive_packages': total_packages,
            'earliest_package_start': earliest_start,
            'latest_package_end': latest_end,
            'packages': serializer.data
        })

    @action(detail=False, methods=['post'], url_path='import')
    def import_csv(self, request):
        """
        Import clients from CSV file
        POST /api/clients/import/
        
        Requires can_manage_all_clients permission.
        CSV format: first_name,last_name,email,status,address,instagram_handle,ghl_id,
                    client_start_date,client_end_date,dob,country,state,currency,gender,
                    lead_origin,notice_given,no_more_payments
        """
        # Check permission - only users who can manage all clients can import
        if not request.user.is_super_admin and not request.user.can_manage_all_clients:
            return Response(
                {'error': 'You do not have permission to import clients'},
                status=status.HTTP_403_FORBIDDEN
            )
        
        if 'file' not in request.FILES:
            return Response(
                {'error': 'No file provided. Please upload a CSV file.'},
                status=status.HTTP_400_BAD_REQUEST
            )
        
        csv_file = request.FILES['file']
        
        # Validate file type
        if not csv_file.name.endswith('.csv'):
            return Response(
                {'error': 'Invalid file format. Please upload a CSV file.'},
                status=status.HTTP_400_BAD_REQUEST
            )
        
        # Limit file size (10MB)
        if csv_file.size > 10 * 1024 * 1024:
            return Response(
                {'error': 'File too large. Maximum size is 10MB.'},
                status=status.HTTP_400_BAD_REQUEST
            )
        
        try:
            # Read and decode CSV
            decoded_file = csv_file.read().decode('utf-8')
            io_string = io.StringIO(decoded_file)
            reader = csv.DictReader(io_string)
            
            imported = 0
            skipped = 0
            errors = []
            
            with transaction.atomic():
                for row_num, row in enumerate(reader, start=2):  # Start at 2 (header is row 1)
                    try:
                        # Skip if email already exists
                        email = row.get('email', '').strip()
                        if not email:
                            errors.append({'row': row_num, 'error': 'Email is required'})
                            skipped += 1
                            continue
                        
                        if Client.objects.filter(email=email).exists():
                            errors.append({'row': row_num, 'error': f'Client with email {email} already exists'})
                            skipped += 1
                            continue
                        
                        # Parse boolean fields
                        notice_given = row.get('notice_given', '').lower() in ['true', '1', 'yes']
                        no_more_payments = row.get('no_more_payments', '').lower() in ['true', '1', 'yes']
                        
                        # Parse date fields
                        client_start_date = None
                        if row.get('client_start_date'):
                            try:
                                client_start_date = datetime.strptime(row['client_start_date'], '%Y-%m-%d').date()
                            except ValueError:
                                errors.append({'row': row_num, 'error': f'Invalid client_start_date format: {row["client_start_date"]} (expected YYYY-MM-DD)'})
                                skipped += 1
                                continue
                        
                        client_end_date = None
                        if row.get('client_end_date'):
                            try:
                                client_end_date = datetime.strptime(row['client_end_date'], '%Y-%m-%d').date()
                            except ValueError:
                                errors.append({'row': row_num, 'error': f'Invalid client_end_date format: {row["client_end_date"]} (expected YYYY-MM-DD)'})
                                skipped += 1
                                continue
                        
                        dob = None
                        if row.get('dob'):
                            try:
                                dob = datetime.strptime(row['dob'], '%Y-%m-%d').date()
                            except ValueError:
                                errors.append({'row': row_num, 'error': f'Invalid dob format: {row["dob"]} (expected YYYY-MM-DD)'})
                                skipped += 1
                                continue
                        
                        # Validate status
                        status_value = row.get('status', 'active').lower()
                        valid_statuses = ['pending', 'active', 'inactive', 'onboarding', 'paused', 'cancelled']
                        if status_value not in valid_statuses:
                            errors.append({'row': row_num, 'error': f'Invalid status: {status_value}. Must be one of: {', '.join(valid_statuses)}'})
                            skipped += 1
                            continue
                        
                        # Create client
                        Client.objects.create(
                            account_id=request.user.account_id,
                            first_name=row.get('first_name', '').strip(),
                            last_name=row.get('last_name', '').strip() or None,
                            email=email,
                            status=status_value,
                            address=row.get('address', '').strip() or None,
                            instagram_handle=row.get('instagram_handle', '').strip() or None,
                            ghl_id=row.get('ghl_id', '').strip() or None,
                            client_start_date=client_start_date,
                            client_end_date=client_end_date,
                            dob=dob,
                            country=row.get('country', '').strip() or None,
                            state=row.get('state', '').strip() or None,
                            currency=row.get('currency', '').strip() or None,
                            gender=row.get('gender', '').strip() or None,
                            lead_origin=row.get('lead_origin', '').strip() or None,
                            notice_given=notice_given,
                            no_more_payments=no_more_payments
                        )
                        imported += 1
                        
                    except Exception as e:
                        errors.append({'row': row_num, 'error': str(e)})
                        skipped += 1
            
            return Response({
                'success': True,
                'message': 'Import completed',
                'imported': imported,
                'skipped': skipped,
                'errors': errors
            })
            
        except Exception as e:
            return Response(
                {'success': False, 'error': f'Error processing CSV file: {str(e)}'},
                status=status.HTTP_400_BAD_REQUEST
            )

    @action(detail=False, methods=['get'], url_path='export')
    def export_csv(self, request):
        """
        Export clients to CSV file
        GET /api/clients/export/
        
        Respects existing permissions:
        - Super admin or can_view_all_clients: exports all clients in account
        - Otherwise: exports only assigned clients
        """
        # Use existing get_queryset logic to respect permissions
        queryset = self.get_queryset()
        
        # Create CSV response
        response = HttpResponse(content_type='text/csv; charset=utf-8')
        today = datetime.now().strftime('%Y-%m-%d')
        response['Content-Disposition'] = f'attachment; filename="clients_{today}.csv"'
        
        writer = csv.writer(response)
        
        # Write headers
        writer.writerow([
            'id', 'first_name', 'last_name', 'email', 'status', 'address',
            'instagram_handle', 'ghl_id', 'client_start_date', 'client_end_date',
            'dob', 'country', 'state', 'currency', 'gender', 'lead_origin',
            'notice_given', 'no_more_payments'
        ])
        
        # Write data rows
        for client in queryset:
            writer.writerow([
                client.id,
                client.first_name,
                client.last_name or '',
                client.email,
                client.status,
                client.address or '',
                client.instagram_handle or '',
                client.ghl_id or '',
                client.client_start_date.strftime('%Y-%m-%d') if client.client_start_date else '',
                client.client_end_date.strftime('%Y-%m-%d') if client.client_end_date else '',
                client.dob.strftime('%Y-%m-%d') if client.dob else '',
                client.country or '',
                client.state or '',
                client.currency or '',
                client.gender or '',
                client.lead_origin or '',
                'true' if client.notice_given else 'false',
                'true' if client.no_more_payments else 'false'
            ])
        
        return response


class PackageViewSet(viewsets.ModelViewSet):
    """
    ViewSet for managing Packages.
    All authenticated users can perform CRUD operations on packages in their account.
    """
    queryset = Package.objects.all()
    serializer_class = PackageSerializer
    permission_classes = [IsAuthenticated, IsAccountMember]
    filter_backends = [filters.SearchFilter, filters.OrderingFilter]
    search_fields = ['package_name', 'description']
    ordering_fields = ['package_name']
    ordering = ['package_name']

    def get_queryset(self):
        # Users can only see packages in their account
        return Package.objects.filter(account_id=self.request.user.account_id)

    def perform_create(self, serializer):
        # Automatically set the account to the current user's account
        serializer.save(account_id=self.request.user.account_id)


class ClientPackageViewSet(viewsets.ModelViewSet):
    """
    ViewSet for managing Client Packages.
    All authenticated users can perform CRUD operations on client packages in their account.
    """
    queryset = ClientPackage.objects.all()
    serializer_class = ClientPackageSerializer
    permission_classes = [IsAuthenticated, IsAccountMember]
    filter_backends = [DjangoFilterBackend, filters.SearchFilter, filters.OrderingFilter]
    filterset_fields = ['client', 'package', 'status', 'payment_schedule']
    search_fields = ['client__first_name', 'client__last_name', 'package__package_name']
    ordering_fields = ['start_date', 'package_end_date']
    ordering = ['-start_date']

    def get_queryset(self):
        # Users can only see client packages in their account
        return ClientPackage.objects.filter(
            client__account_id=self.request.user.account_id
        ).select_related('client', 'package')

    def perform_create(self, serializer):
        """
        When creating a new client package, automatically set all previous
        active packages for the same client to inactive (only 1 active package per client).
        """
        client = serializer.validated_data.get('client')
        
        # Set all existing active packages for this client to inactive
        ClientPackage.objects.filter(
            client=client,
            status='active'
        ).update(status='inactive')
        
        # Create the new package (defaults to active status)
        serializer.save()

    # Removed get_permissions - all authenticated account members can CRUD client packages


class PaymentViewSet(viewsets.ModelViewSet):
    """
    ViewSet for managing Payments.
    Permissions controlled by can_view_all_payments and can_manage_all_payments flags.
    """
    queryset = Payment.objects.all()
    serializer_class = PaymentSerializer
    permission_classes = [IsAuthenticated, IsAccountMember, CanViewPayments]
    filter_backends = [DjangoFilterBackend, filters.SearchFilter, filters.OrderingFilter]
    filterset_fields = ['client', 'status', 'currency']
    search_fields = ['client__first_name', 'client__last_name', 'id']
    ordering_fields = ['payment_date', 'amount']
    ordering = ['-payment_date']

    def get_permissions(self):
        """Use CanManagePayments for create/update/delete operations"""
        if self.action in ['create', 'update', 'partial_update', 'destroy']:
            return [IsAuthenticated(), IsAccountMember(), CanManagePayments()]
        return super().get_permissions()

    def get_queryset(self):
        """
        Filter queryset based on permissions:
        - Super admin: sees all payments in account
        - Has 'can_view_all_payments': sees all payments in account
        - Otherwise: sees only payments for assigned clients
        """
        user = self.request.user
        queryset = Payment.objects.filter(account_id=user.account_id)
        
        # Super admin sees everything
        if user.is_super_admin:
            return queryset.select_related('client', 'client_package', 'account')
        
        # Check if user can view all payments
        if user.can_view_all_payments:
            return queryset.select_related('client', 'client_package', 'account')
        
        # Otherwise, filter to only payments for assigned clients
        queryset = queryset.filter(
            Q(client__coach=user) |
            Q(client__closer=user) |
            Q(client__setter=user)
        ).distinct()
        
        return queryset.select_related('client', 'client_package', 'account')

    @action(detail=False, methods=['get'])
    def statistics(self, request):
        """
        Get payment statistics
        GET /api/payments/statistics/
        """
        from django.db.models import Sum, Count
        
        queryset = self.get_queryset()
        
        stats = {
            'total_payments': queryset.count(),
            'total_amount': queryset.filter(status='paid').aggregate(Sum('amount'))['amount__sum'] or 0,
            'paid': queryset.filter(status='paid').count(),
            'failed': queryset.filter(status='failed').count(),
            'refunded': queryset.filter(status='refunded').count(),
            'disputed': queryset.filter(status='disputed').count(),
        }
        
        return Response(stats)

    @action(detail=False, methods=['post'], url_path='import')
    def import_csv(self, request):
        """
        Import payments from CSV file
        POST /api/payments/import/
        
        Requires can_manage_all_payments permission.
        CSV format: id,client_email,amount,currency,exchange_rate,native_account_currency,
                    status,failure_reason,payment_date
        """
        # Check permission - only users who can manage all payments can import
        if not request.user.is_super_admin and not request.user.can_manage_all_payments:
            return Response(
                {'error': 'You do not have permission to import payments'},
                status=status.HTTP_403_FORBIDDEN
            )
        
        if 'file' not in request.FILES:
            return Response(
                {'error': 'No file provided. Please upload a CSV file.'},
                status=status.HTTP_400_BAD_REQUEST
            )
        
        csv_file = request.FILES['file']
        
        # Validate file type
        if not csv_file.name.endswith('.csv'):
            return Response(
                {'error': 'Invalid file format. Please upload a CSV file.'},
                status=status.HTTP_400_BAD_REQUEST
            )
        
        # Limit file size (10MB)
        if csv_file.size > 10 * 1024 * 1024:
            return Response(
                {'error': 'File too large. Maximum size is 10MB.'},
                status=status.HTTP_400_BAD_REQUEST
            )
        
        try:
            # Read and decode CSV
            decoded_file = csv_file.read().decode('utf-8')
            io_string = io.StringIO(decoded_file)
            reader = csv.DictReader(io_string)
            
            imported = 0
            skipped = 0
            errors = []
            
            with transaction.atomic():
                for row_num, row in enumerate(reader, start=2):  # Start at 2 (header is row 1)
                    try:
                        # Validate required fields
                        payment_id = row.get('id', '').strip()
                        client_email = row.get('client_email', '').strip()
                        
                        if not payment_id:
                            errors.append({'row': row_num, 'error': 'Payment ID is required'})
                            skipped += 1
                            continue
                        
                        if not client_email:
                            errors.append({'row': row_num, 'error': 'Client email is required'})
                            skipped += 1
                            continue
                        
                        # Check if payment already exists
                        if Payment.objects.filter(id=payment_id).exists():
                            errors.append({'row': row_num,'error': f'Payment with ID {payment_id} already exists'})
                            skipped += 1
                            continue
                        
                        # Find client by email in the same account
                        try:
                            client = Client.objects.get(
                                email=client_email,
                                account_id=request.user.account_id
                            )
                        except Client.DoesNotExist:
                            errors.append({'row': row_num, 'error': f'Client with email {client_email} not found in your account'})
                            skipped += 1
                            continue
                        
                        # Parse amount
                        try:
                            amount = float(row.get('amount', 0))
                            if amount <= 0:
                                raise ValueError("Amount must be positive")
                        except ValueError as e:
                            errors.append({'row': row_num, 'error': f'Invalid amount: {row.get("amount")} - {str(e)}'})
                            skipped += 1
                            continue
                        
                        # Parse exchange rate (optional)
                        exchange_rate = None
                        if row.get('exchange_rate'):
                            try:
                                exchange_rate = float(row['exchange_rate'])
                            except ValueError:
                                errors.append({'row': row_num, 'error': f'Invalid exchange_rate: {row["exchange_rate"]}'})
                                skipped += 1
                                continue
                        
                        # Parse payment date,
                        payment_date = None
                        if row.get('payment_date'):
                            try:
                                # Try multiple date formats
                                for date_format in ['%Y-%m-%d %H:%M:%S', '%Y-%m-%d']:
                                    try:
                                        payment_date = datetime.strptime(row['payment_date'], date_format)
                                        break
                                    except ValueError:
                                        continue
                                if not payment_date:
                                    raise ValueError("Could not parse date")
                            except ValueError:
                                errors.append({'row': row_num, 'error': f'Invalid payment_date format: {row["payment_date"]} (expected YYYY-MM-DD or YYYY-MM-DD HH:MM:SS)'})
                                skipped += 1
                                continue
                        else:
                            payment_date = datetime.now()
                        
                        # Validate status
                        status_value = row.get('status', 'paid').lower()
                        valid_statuses = ['paid', 'failed', 'refunded', 'disputed', 'incomplete']
                        if status_value not in valid_statuses:
                            errors.append({'row': row_num, 'error': f'Invalid status: {status_value}. Must be one of: {", ".join(valid_statuses)}'})
                            skipped += 1
                            continue
                        
                        # Create payment
                        Payment.objects.create(
                            id=payment_id,
                            account_id=request.user.account_id,
                            client=client,
                            amount=amount,
                            currency=row.get('currency', 'USD').strip().upper(),
                            exchange_rate=exchange_rate,
                            native_account_currency=row.get('native_account_currency', '').strip().upper() or None,
                            status=status_value,
                            failure_reason=row.get('failure_reason', '').strip() or None,
                            payment_date=payment_date
                        )
                        imported += 1
                        
                    except Exception as e:
                        errors.append({'row': row_num, 'error': str(e)})
                        skipped += 1
            
            return Response({
                'success': True,
                'message': 'Import completed',
                'imported': imported,
                'skipped': skipped,
                'errors': errors
            })
            
        except Exception as e:
            return Response(
                {'success': False, 'error': f'Error processing CSV file: {str(e)}'},
                status=status.HTTP_400_BAD_REQUEST
            )

    @action(detail=False, methods=['get'], url_path='export')
    def export_csv(self, request):
        """
        Export payments to CSV file
        GET /api/payments/export/
        
        Respects existing permissions:
        - Super admin or can_view_all_payments: exports all payments in account
        - Otherwise: exports only payments for assigned clients
        """
        # Use existing get_queryset logic to respect permissions
        queryset = self.get_queryset().select_related('client')
        
        # Create CSV response
        response = HttpResponse(content_type='text/csv; charset=utf-8')
        today = datetime.now().strftime('%Y-%m-%d')
        response['Content-Disposition'] = f'attachment; filename="payments_{today}.csv"'
        
        writer = csv.writer(response)
        
        # Write headers
        writer.writerow([
            'id', 'client_email', 'amount', 'currency', 'exchange_rate',
            'native_account_currency', 'status', 'failure_reason', 'payment_date'
        ])
        
        # Write data rows
        for payment in queryset:
            writer.writerow([
                payment.id,
                payment.client.email,
                f'{payment.amount:.2f}',
                payment.currency or 'USD',
                f'{payment.exchange_rate:.6f}' if payment.exchange_rate else '',
                payment.native_account_currency or '',
                payment.status,
                payment.failure_reason or '',
                payment.payment_date.strftime('%Y-%m-%d %H:%M:%S')
            ])
        
        return response


class InstallmentViewSet(viewsets.ModelViewSet):
    """
    ViewSet for managing Installments.
    Permissions controlled by can_view_all_installments and can_manage_all_installments flags.
    """
    queryset = Installment.objects.all()
    serializer_class = InstallmentSerializer
    permission_classes = [IsAuthenticated, IsAccountMember, CanViewInstallments]
    filter_backends = [DjangoFilterBackend, filters.SearchFilter, filters.OrderingFilter]
    filterset_fields = ['client', 'status']
    search_fields = ['client__first_name', 'client__last_name']
    ordering_fields = ['schedule_date', 'amount']
    ordering = ['-schedule_date']

    def get_permissions(self):
        """Use CanManageInstallments for create/update/delete operations"""
        if self.action in ['create', 'update', 'partial_update', 'destroy']:
            return [IsAuthenticated(), IsAccountMember(), CanManageInstallments()]
        return super().get_permissions()

    def get_queryset(self):
        """
        Filter queryset based on permissions:
        - Super admin: sees all installments in account
        - Has 'can_view_all_installments': sees all installments in account
        - Otherwise: sees only installments for assigned clients
        """
        user = self.request.user
        queryset = Installment.objects.filter(account_id=user.account_id)
        
        # Super admin sees everything
        if user.is_super_admin:
            return queryset.select_related('client', 'account')
        
        # Check if user can view all installments
        if user.can_view_all_installments:
            return queryset.select_related('client', 'account')
        
        # Otherwise, filter to only installments for assigned clients
        queryset = queryset.filter(
            Q(client__coach=user) |
            Q(client__closer=user) |
            Q(client__setter=user)
        ).distinct()
        
        return queryset.select_related('client', 'account')

    def perform_create(self, serializer):
        """Auto-set account from client (permission already checked by CanManageInstallments)"""
        # Auto-set account from client if not provided
        if 'account' not in serializer.validated_data and 'client' in serializer.validated_data:
            serializer.save(account=serializer.validated_data['client'].account)
        else:
            serializer.save()


class StripeCustomerViewSet(viewsets.ReadOnlyModelViewSet):
    """
    ViewSet for viewing Stripe Customers.
    Read-only for all authenticated users.
    """
    queryset = StripeCustomer.objects.all()
    serializer_class = StripeCustomerSerializer
    permission_classes = [IsAuthenticated, IsAccountMember]
    filter_backends = [DjangoFilterBackend, filters.SearchFilter, filters.OrderingFilter]
    filterset_fields = ['client', 'status']
    search_fields = ['client__first_name', 'client__last_name', 'email', 'stripe_customer_id']
    ordering_fields = ['email']
    ordering = ['email']

    def get_queryset(self):
        # Users can only see stripe customers in their account
        return StripeCustomer.objects.filter(
            account_id=self.request.user.account_id
        ).select_related('client', 'account', 'stripe_account')


class CheckInFormViewSet(viewsets.ModelViewSet):
    """
    ViewSet for managing Check-In Forms.
    All authenticated account members can CRUD check-in forms.
    """
    queryset = CheckInForm.objects.all()
    serializer_class = CheckInFormSerializer
    permission_classes = [IsAuthenticated, IsAccountMember]
    filter_backends = [DjangoFilterBackend, filters.SearchFilter, filters.OrderingFilter]
    filterset_fields = ['package', 'is_active']
    search_fields = ['title', 'description', 'package__package_name']
    ordering_fields = ['created_at', 'title']
    ordering = ['-created_at']

    def get_queryset(self):
        """Filter forms to user's account"""
        return CheckInForm.objects.filter(
            account_id=self.request.user.account_id
        ).select_related('account', 'package', 'schedule')

    def perform_create(self, serializer):
        """Auto-set account and create webhook schedules"""
        from .utils.webhook_scheduler import create_schedule_webhooks
        import logging
        
        logger = logging.getLogger(__name__)
        
        # Save the form with account
        form = serializer.save(account_id=self.request.user.account_id)
        
        # Create webhook schedules if schedule was provided
        if hasattr(form, 'schedule') and form.schedule:
            try:
                create_schedule_webhooks(form.schedule)
                logger.info(f"Created webhooks for CheckInForm {form.id}")
            except Exception as e:
                logger.error(f"Failed to create webhooks for CheckInForm {form.id}: {str(e)}")
                # Don't fail the form creation, just log the error
                # Admin can manually recreate webhooks later

    def perform_destroy(self, instance):
        """Delete webhook schedules before deleting form"""
        from .utils.webhook_scheduler import delete_schedule_webhooks
        import logging
        
        logger = logging.getLogger(__name__)
        
        # Delete webhooks if schedule exists
        if hasattr(instance, 'schedule') and instance.schedule:
            try:
                delete_schedule_webhooks(instance.schedule)
                logger.info(f"Deleted webhooks for CheckInForm {instance.id}")
            except Exception as e:
                logger.error(f"Failed to delete webhooks for CheckInForm {instance.id}: {str(e)}")
        
        # Delete the form
        instance.delete()

    @action(detail=True, methods=['get'])
    def submissions(self, request, pk=None):
        """Get all submissions for this form"""
        form = self.get_object()
        submissions = CheckInSubmission.objects.filter(
            form=form,
            account_id=request.user.account_id
        ).select_related('client', 'form').order_by('-submitted_at')
        
        from .serializers import CheckInSubmissionSerializer
        serializer = CheckInSubmissionSerializer(submissions, many=True)
        return Response(serializer.data)

    @action(detail=True, methods=['post'])
    def recreate_webhooks(self, request, pk=None):
        """Manually recreate webhooks for a form's schedule"""
        from .utils.webhook_scheduler import update_schedule_webhooks
        import logging
        
        logger = logging.getLogger(__name__)
        form = self.get_object()
        
        if not hasattr(form, 'schedule') or not form.schedule:
            return Response(
                {'error': 'Form has no schedule'},
                status=status.HTTP_400_BAD_REQUEST
            )
        
        try:
            update_schedule_webhooks(form.schedule)
            logger.info(f"Recreated webhooks for CheckInForm {form.id}")
            return Response({'status': 'Webhooks recreated successfully'})
        except Exception as e:
            logger.error(f"Failed to recreate webhooks: {str(e)}")
            return Response(
                {'error': f'Failed to recreate webhooks: {str(e)}'},
                status=status.HTTP_500_INTERNAL_SERVER_ERROR
            )


class CheckInScheduleViewSet(viewsets.ModelViewSet):
    """
    ViewSet for managing Check-In Schedules.
    All authenticated account members can CRUD schedules.
    """
    queryset = CheckInSchedule.objects.all()
    serializer_class = CheckInScheduleSerializer
    permission_classes = [IsAuthenticated, IsAccountMember]
    filter_backends = [DjangoFilterBackend, filters.OrderingFilter]
    filterset_fields = ['form', 'schedule_type', 'is_active']
    ordering_fields = ['created_at']
    ordering = ['-created_at']

    def get_queryset(self):
        """Filter schedules to user's account"""
        return CheckInSchedule.objects.filter(
            account_id=self.request.user.account_id
        ).select_related('form', 'account')

    def perform_update(self, serializer):
        """Update webhooks when schedule is modified"""
        from .utils.webhook_scheduler import update_schedule_webhooks
        import logging
        
        logger = logging.getLogger(__name__)
        schedule = serializer.save()
        
        try:
            update_schedule_webhooks(schedule)
            logger.info(f"Updated webhooks for CheckInSchedule {schedule.id}")
        except Exception as e:
            logger.error(f"Failed to update webhooks for CheckInSchedule {schedule.id}: {str(e)}")
            # Don't fail the update, just log the error

    def perform_destroy(self, instance):
        """Delete webhooks before deleting schedule"""
        from .utils.webhook_scheduler import delete_schedule_webhooks
        import logging
        
        logger = logging.getLogger(__name__)
        
        try:
            delete_schedule_webhooks(instance)
            logger.info(f"Deleted webhooks for CheckInSchedule {instance.id}")
        except Exception as e:
            logger.error(f"Failed to delete webhooks for CheckInSchedule {instance.id}: {str(e)}")
        
        instance.delete()


class CheckInSubmissionViewSet(viewsets.ModelViewSet):
    """
    ViewSet for managing Check-In Submissions.
    Permissions controlled by can_view_all_clients flag.
    """
    queryset = CheckInSubmission.objects.all()
    serializer_class = CheckInSubmissionSerializer
    permission_classes = [IsAuthenticated, IsAccountMember]
    filter_backends = [DjangoFilterBackend, filters.SearchFilter, filters.OrderingFilter]
    filterset_fields = ['form', 'client']
    search_fields = ['client__first_name', 'client__last_name', 'form__title']
    ordering_fields = ['submitted_at']
    ordering = ['-submitted_at']

    def get_queryset(self):
        """
        Filter submissions based on permissions:
        - Super admin: sees all submissions in account
        - Has 'can_view_all_clients': sees all submissions in account
        - Otherwise: sees only submissions for assigned clients
        """
        user = self.request.user
        queryset = CheckInSubmission.objects.filter(account_id=user.account_id)
        
        # Super admin sees everything
        if user.is_super_admin:
            return queryset.select_related('client', 'form', 'account')
        
        # Check if user can view all clients
        if user.can_view_all_clients:
            return queryset.select_related('client', 'form', 'account')
        
        # Otherwise, filter to only submissions for assigned clients
        queryset = queryset.filter(
            Q(client__coach=user) |
            Q(client__closer=user) |
            Q(client__setter=user)
        ).distinct()
        
        return queryset.select_related('client', 'form', 'account')

    @action(detail=False, methods=['get'])
    def statistics(self, request):
        """Get submission statistics by form"""
        queryset = self.get_queryset()
        
        # Group by form and count
        stats = queryset.values('form__id', 'form__title').annotate(
            submission_count=Count('id')
        ).order_by('-submission_count')
        
        return Response(stats)


# ===================== Internal Webhook Trigger Endpoint =====================

@api_view(['POST'])
@permission_classes([AllowAny])
def checkin_trigger_webhook(request):
    """
    Internal webhook endpoint that receives triggers from external scheduler.
    Validates X-Webhook-Secret header, queries clients based on schedule_id and day_filter,
    and pushes client batch to n8n for email sending.
    
    POST /api/internal/checkin-trigger/
    Headers:
        X-Webhook-Secret: <webhook_secret>
    Body:
        {
            "schedule_id": "uuid",
            "day_filter": "monday" | null
        }
    """
    logger = logging.getLogger(__name__)
    
    # Validate webhook secret (check header first, then payload as fallback)
    webhook_secret = request.headers.get('X-Webhook-Secret') or request.data.get('webhook_secret')
    if webhook_secret != settings.WEBHOOK_SECRET:
        logger.warning(f"Invalid webhook secret received from {request.META.get('REMOTE_ADDR')}")
        return Response(
            {'error': 'Invalid webhook secret'},
            status=status.HTTP_403_FORBIDDEN
        )
    
    # Extract schedule_id and day_filter
    schedule_id = request.data.get('schedule_id')
    day_filter = request.data.get('day_filter')  # Can be None for SAME_DAY schedules
    
    if not schedule_id:
        return Response(
            {'error': 'schedule_id is required'},
            status=status.HTTP_400_BAD_REQUEST
        )
    
    try:
        # Get the schedule
        schedule = CheckInSchedule.objects.select_related('form', 'form__package', 'account').get(id=schedule_id)
        
        # Verify schedule is active
        if not schedule.is_active or not schedule.form.is_active:
            logger.info(f"Skipping inactive schedule {schedule_id}")
            return Response({'status': 'Schedule is inactive, no emails sent'})
        
        # Query clients with active packages matching the form's package
        client_packages = ClientPackage.objects.filter(
            package=schedule.form.package,
            status='active',
            client__account_id=schedule.account_id
        ).select_related('client')
        
        # Filter by checkin_day if day_filter provided (INDIVIDUAL_DAYS mode)
        if day_filter:
            client_packages = client_packages.filter(checkin_day=day_filter)
        
        # Build client list for n8n
        clients_data = []
        for cp in client_packages:
            client = cp.client
            clients_data.append({
                'email': client.email,
                'first_name': client.first_name,
                'last_name': client.last_name,
                'checkin_link': f"{settings.BACKEND_URL}/api/public/checkin/{client.checkin_link}/",
                'form_title': schedule.form.title,
                'form_description': schedule.form.description or ''
            })
        
        if not clients_data:
            logger.info(f"No clients found for schedule {schedule_id} with day_filter={day_filter}")
            return Response({
                'status': 'No clients found',
                'schedule_id': str(schedule_id),
                'day_filter': day_filter,
                'clients_count': 0
            })
        
        # Push to n8n webhook
        n8n_url = settings.N8N_CHECKIN_WEBHOOK_URL
        if not n8n_url:
            logger.error("N8N_CHECKIN_WEBHOOK_URL not configured")
            return Response(
                {'error': 'n8n webhook URL not configured'},
                status=status.HTTP_500_INTERNAL_SERVER_ERROR
            )
        
        n8n_headers = {
            'Content-Type': 'application/json',
            'X-N8N-Secret': settings.N8N_WEBHOOK_SECRET
        }
        
        n8n_payload = {
            'clients': clients_data,
            'schedule_id': str(schedule_id),
            'day_filter': day_filter,
            'triggered_at': datetime.utcnow().isoformat()
        }
        
        try:
            n8n_response = requests.post(n8n_url, json=n8n_payload, headers=n8n_headers, timeout=10)
            n8n_response.raise_for_status()
            
            logger.info(f"Successfully pushed {len(clients_data)} clients to n8n for schedule {schedule_id}")
            
            return Response({
                'status': 'success',
                'schedule_id': str(schedule_id),
                'day_filter': day_filter,
                'clients_count': len(clients_data),
                'n8n_status': n8n_response.status_code
            })
            
        except requests.exceptions.RequestException as e:
            logger.error(f"Failed to push to n8n: {str(e)}")
            return Response(
                {'error': f'Failed to push to n8n: {str(e)}'},
                status=status.HTTP_500_INTERNAL_SERVER_ERROR
            )
    
    except CheckInSchedule.DoesNotExist:
        logger.error(f"Schedule {schedule_id} not found")
        return Response(
            {'error': 'Schedule not found'},
            status=status.HTTP_404_NOT_FOUND
        )
    
    except Exception as e:
        logger.error(f"Unexpected error in checkin_trigger_webhook: {str(e)}")
        return Response(
            {'error': f'Internal server error: {str(e)}'},
            status=status.HTTP_500_INTERNAL_SERVER_ERROR
        )


# ===================== Public Check-In Endpoints =====================

@api_view(['GET'])
@permission_classes([AllowAny])
def get_checkin_form(request, checkin_uuid):
    """
    Public endpoint to retrieve check-in form by client's checkin_link UUID.
    
    GET /api/public/checkin/{uuid}/
    
    Returns:
        {
            "client": {
                "first_name": "John",
                "last_name": "Doe",
                "email": "john@example.com"
            },
            "form": {
                "id": "uuid",
                "title": "Weekly Check-In",
                "description": "...",
                "form_schema": {...}
            },
            "package": {
                "package_name": "Premium Package"
            }
        }
    """
    logger = logging.getLogger(__name__)
    
    try:
        # Look up client by checkin_link
        client = Client.objects.get(checkin_link=checkin_uuid)
        
        # Get active package for client
        try:
            client_package = ClientPackage.objects.select_related('package').get(
                client=client,
                status='active'
            )
        except ClientPackage.DoesNotExist:
            return Response(
                {'error': 'No active package found for this client'},
                status=status.HTTP_404_NOT_FOUND
            )
        
        # Get form for this package
        try:
            form = CheckInForm.objects.get(
                package=client_package.package,
                is_active=True
            )
        except CheckInForm.DoesNotExist:
            return Response(
                {'error': 'No check-in form available for your package'},
                status=status.HTTP_404_NOT_FOUND
            )
        
        # Return form data
        return Response({
            'client': {
                'first_name': client.first_name,
                'last_name': client.last_name,
                'email': client.email
            },
            'form': {
                'id': str(form.id),
                'title': form.title,
                'description': form.description or '',
                'form_schema': form.form_schema
            },
            'package': {
                'package_name': client_package.package.package_name
            }
        })
    
    except Client.DoesNotExist:
        logger.warning(f"Invalid checkin_link: {checkin_uuid}")
        return Response(
            {'error': 'Invalid check-in link'},
            status=status.HTTP_404_NOT_FOUND
        )
    
    except Exception as e:
        logger.error(f"Error in get_checkin_form: {str(e)}")
        return Response(
            {'error': 'Internal server error'},
            status=status.HTTP_500_INTERNAL_SERVER_ERROR
        )


@api_view(['POST'])
@permission_classes([AllowAny])
def submit_checkin_form(request, checkin_uuid):
    """
    Public endpoint to submit check-in form response.
    
    POST /api/public/checkin/{uuid}/submit/
    Body:
        {
            "submission_data": {...}  # JSON matching form_schema structure
        }
    """
    logger = logging.getLogger(__name__)
    
    try:
        # Look up client by checkin_link
        client = Client.objects.get(checkin_link=checkin_uuid)
        
        # Get active package for client
        try:
            client_package = ClientPackage.objects.select_related('package').get(
                client=client,
                status='active'
            )
        except ClientPackage.DoesNotExist:
            return Response(
                {'error': 'No active package found for this client'},
                status=status.HTTP_404_NOT_FOUND
            )
        
        # Get form for this package
        try:
            form = CheckInForm.objects.get(
                package=client_package.package,
                is_active=True
            )
        except CheckInForm.DoesNotExist:
            return Response(
                {'error': 'No check-in form available for your package'},
                status=status.HTTP_404_NOT_FOUND
            )
        
        # Validate submission_data
        submission_data = request.data.get('submission_data')
        if not submission_data or not isinstance(submission_data, dict):
            return Response(
                {'error': 'submission_data must be a non-empty JSON object'},
                status=status.HTTP_400_BAD_REQUEST
            )
        
        # Create submission
        submission = CheckInSubmission.objects.create(
            form=form,
            client=client,
            account_id=client.account_id,
            submission_data=submission_data,
            submitted_at=datetime.utcnow()
        )
        
        logger.info(f"Client {client.id} submitted check-in form {form.id}")
        
        return Response({
            'status': 'success',
            'submission_id': str(submission.id),
            'submitted_at': submission.submitted_at.isoformat()
        }, status=status.HTTP_201_CREATED)
    
    except Client.DoesNotExist:
        logger.warning(f"Invalid checkin_link: {checkin_uuid}")
        return Response(
            {'error': 'Invalid check-in link'},
            status=status.HTTP_404_NOT_FOUND
        )
    
    except Exception as e:
        logger.error(f"Error in submit_checkin_form: {str(e)}")
        return Response(
            {'error': 'Internal server error'},
            status=status.HTTP_500_INTERNAL_SERVER_ERROR
        )
