from rest_framework import viewsets, status, filters
from rest_framework.decorators import action
from rest_framework.response import Response
from rest_framework.permissions import IsAuthenticated, AllowAny
from django_filters.rest_framework import DjangoFilterBackend
from django.contrib.auth import authenticate
from django.db.models import Q

from .models import (
    Account, Employee, Client, Package, ClientPackage,
    Payment, Installment, StripeCustomer, EmployeeToken
)
from .serializers import (
    AccountSerializer, EmployeeSerializer, EmployeeCreateSerializer,
    EmployeeUpdatePermissionsSerializer, ClientSerializer, PackageSerializer,
    ClientPackageSerializer, PaymentSerializer, InstallmentSerializer,
    StripeCustomerSerializer, ChangePasswordSerializer
)
from .permissions import (
    IsAccountMember, IsSuperAdminOrAdmin, IsSuperAdmin,
    CanManageEmployees, IsSelfOrAdmin
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
                
                # Create Super Admin Employee
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
                    is_superuser=True
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
                        'role': employee.role
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
    All authenticated users can perform CRUD operations on clients in their account.
    """
    queryset = Client.objects.all()
    serializer_class = ClientSerializer
    permission_classes = [IsAuthenticated, IsAccountMember]
    filter_backends = [DjangoFilterBackend, filters.SearchFilter, filters.OrderingFilter]
    filterset_fields = ['status', 'coach', 'closer', 'setter', 'country', 'currency']
    search_fields = ['first_name', 'last_name', 'email', 'instagram_handle']
    ordering_fields = ['first_name', 'last_name', 'email', 'client_start_date']
    ordering = ['first_name']

    def get_queryset(self):
        # Users can only see clients in their account
        queryset = Client.objects.filter(account_id=self.request.user.account_id)
        
        # Additional filtering for assigned coach/closer/setter
        role_filter = self.request.query_params.get('my_clients', None)
        if role_filter:
            queryset = queryset.filter(
                Q(coach=self.request.user) |
                Q(closer=self.request.user) |
                Q(setter=self.request.user)
            )
        
        return queryset.select_related('account', 'coach', 'closer', 'setter')

    # Removed get_permissions - all authenticated account members can CRUD clients

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


class PackageViewSet(viewsets.ModelViewSet):
    """
    ViewSet for managing Packages.
    All authenticated users can perform CRUD operations on packages.
    """
    queryset = Package.objects.all()
    serializer_class = PackageSerializer
    permission_classes = [IsAuthenticated]
    filter_backends = [filters.SearchFilter, filters.OrderingFilter]
    search_fields = ['package_name', 'description']
    ordering_fields = ['package_name']
    ordering = ['package_name']

    # Removed get_permissions - all authenticated users can CRUD packages


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

    # Removed get_permissions - all authenticated account members can CRUD client packages


class PaymentViewSet(viewsets.ModelViewSet):
    """
    ViewSet for managing Payments.
    All authenticated users can perform CRUD operations on payments in their account.
    """
    queryset = Payment.objects.all()
    serializer_class = PaymentSerializer
    permission_classes = [IsAuthenticated, IsAccountMember]
    filter_backends = [DjangoFilterBackend, filters.SearchFilter, filters.OrderingFilter]
    filterset_fields = ['client', 'status', 'currency']
    search_fields = ['client__first_name', 'client__last_name', 'id']
    ordering_fields = ['payment_date', 'amount']
    ordering = ['-payment_date']

    def get_queryset(self):
        # Users can only see payments in their account - direct account_id lookup
        return Payment.objects.filter(
            account_id=self.request.user.account_id
        ).select_related('client', 'client_package', 'account')

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


class InstallmentViewSet(viewsets.ModelViewSet):
    """
    ViewSet for managing Installments.
    All authenticated users can perform CRUD operations on installments in their account.
    """
    queryset = Installment.objects.all()
    serializer_class = InstallmentSerializer
    permission_classes = [IsAuthenticated, IsAccountMember]
    filter_backends = [DjangoFilterBackend, filters.SearchFilter, filters.OrderingFilter]
    filterset_fields = ['client', 'status']
    search_fields = ['client__first_name', 'client__last_name']
    ordering_fields = ['schedule_date', 'amount']
    ordering = ['-schedule_date']

    def get_queryset(self):
        # Users can only see installments in their account - direct account_id lookup
        return Installment.objects.filter(
            account_id=self.request.user.account_id
        ).select_related('client', 'account')

    # Removed get_permissions - all authenticated account members can CRUD installments


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
        ).select_related('client', 'account')
