"""
Test cases for the granular permission system.

Tests cover:
- Permission class behavior (CanViewClients, CanManageClients, etc.)
- ViewSet queryset filtering based on permissions
- Create/Update/Delete operations with permission checks
- Super admin, permission flag, and assigned user scenarios
"""
from django.test import TestCase
from django.contrib.auth import get_user_model
from rest_framework.test import APIClient, APIRequestFactory, force_authenticate
from rest_framework import status
from datetime import date, timedelta

from .models import Account, Client, Payment, Installment, ClientPackage, Package, EmployeeToken
from .views import ClientViewSet, PaymentViewSet, InstallmentViewSet
from .permissions import (
    CanViewClients, CanManageClients, CanViewPayments, CanManagePayments,
    CanViewInstallments, CanManageInstallments
)

Employee = get_user_model()


class PermissionClassTestCase(TestCase):
    """Test permission classes directly"""
    
    def setUp(self):
        """Create test account and users with different permission levels"""
        self.account = Account.objects.create(
            name="Test Company",
            email="test@company.com"
        )
        
        # Super admin
        self.super_admin = Employee.objects.create_user(
            email="superadmin@test.com",
            password="password123",
            name="Super Admin",
            account=self.account,
            role='super_admin',
            can_view_all_clients=True,
            can_manage_all_clients=True,
            can_view_all_payments=True,
            can_manage_all_payments=True,
            can_view_all_installments=True,
            can_manage_all_installments=True
        )
        
        # Employee with all permissions
        self.privileged_employee = Employee.objects.create_user(
            email="privileged@test.com",
            password="password123",
            name="Privileged Employee",
            account=self.account,
            role='employee',
            can_view_all_clients=True,
            can_manage_all_clients=True,
            can_view_all_payments=True,
            can_manage_all_payments=True,
            can_view_all_installments=True,
            can_manage_all_installments=True
        )
        
        # Employee with only view permissions
        self.viewer_employee = Employee.objects.create_user(
            email="viewer@test.com",
            password="password123",
            name="Viewer Employee",
            account=self.account,
            role='employee',
            can_view_all_clients=True,
            can_manage_all_clients=False,
            can_view_all_payments=True,
            can_manage_all_payments=False,
            can_view_all_installments=True,
            can_manage_all_installments=False
        )
        
        # Regular employee with no special permissions
        self.regular_employee = Employee.objects.create_user(
            email="regular@test.com",
            password="password123",
            name="Regular Employee",
            account=self.account,
            role='employee',
            can_view_all_clients=False,
            can_manage_all_clients=False,
            can_view_all_payments=False,
            can_manage_all_payments=False,
            can_view_all_installments=False,
            can_manage_all_installments=False
        )
        
        self.factory = APIRequestFactory()
    
    def test_can_view_clients_super_admin(self):
        """Super admin can always view clients"""
        request = self.factory.get('/api/clients/')
        request.user = self.super_admin
        
        permission = CanViewClients()
        self.assertTrue(permission.has_permission(request, None))
    
    def test_can_view_clients_with_permission(self):
        """Employee with can_view_all_clients can view"""
        request = self.factory.get('/api/clients/')
        request.user = self.viewer_employee
        
        permission = CanViewClients()
        self.assertTrue(permission.has_permission(request, None))
    
    def test_can_view_clients_without_permission(self):
        """Regular employee can still view (but queryset will filter)"""
        request = self.factory.get('/api/clients/')
        request.user = self.regular_employee
        
        permission = CanViewClients()
        self.assertTrue(permission.has_permission(request, None))
    
    def test_can_manage_clients_super_admin(self):
        """Super admin can manage clients"""
        request = self.factory.post('/api/clients/')
        request.user = self.super_admin
        
        view = ClientViewSet()
        view.action = 'create'
        
        permission = CanManageClients()
        self.assertTrue(permission.has_permission(request, view))
    
    def test_can_manage_clients_with_permission(self):
        """Employee with can_manage_all_clients can create"""
        request = self.factory.post('/api/clients/')
        request.user = self.privileged_employee
        
        view = ClientViewSet()
        view.action = 'create'
        
        permission = CanManageClients()
        self.assertTrue(permission.has_permission(request, view))
    
    def test_can_manage_clients_without_permission_create(self):
        """Regular employee cannot create clients"""
        request = self.factory.post('/api/clients/')
        request.user = self.regular_employee
        
        view = ClientViewSet()
        view.action = 'create'
        
        permission = CanManageClients()
        self.assertFalse(permission.has_permission(request, view))
    
    def test_can_manage_clients_object_permission_assigned(self):
        """Regular employee can manage assigned clients"""
        client = Client.objects.create(
            account=self.account,
            first_name="Test",
            last_name="Client",
            email="client@test.com",
            coach=self.regular_employee
        )
        
        request = self.factory.put(f'/api/clients/{client.id}/')
        request.user = self.regular_employee
        
        view = ClientViewSet()
        view.action = 'update'
        
        permission = CanManageClients()
        self.assertTrue(permission.has_object_permission(request, view, client))
    
    def test_can_manage_clients_object_permission_not_assigned(self):
        """Regular employee cannot manage non-assigned clients"""
        other_employee = Employee.objects.create_user(
            email="other@test.com",
            password="password123",
            name="Other Employee",
            account=self.account,
            role='employee'
        )
        
        client = Client.objects.create(
            account=self.account,
            first_name="Test",
            last_name="Client",
            email="client2@test.com",
            coach=other_employee
        )
        
        request = self.factory.put(f'/api/clients/{client.id}/')
        request.user = self.regular_employee
        
        view = ClientViewSet()
        view.action = 'update'
        
        permission = CanManageClients()
        self.assertFalse(permission.has_object_permission(request, view, client))
    
    def test_can_manage_payments_with_permission(self):
        """Employee with can_manage_all_payments can manage payments"""
        request = self.factory.post('/api/payments/')
        request.user = self.privileged_employee
        
        permission = CanManagePayments()
        self.assertTrue(permission.has_permission(request, None))
    
    def test_can_manage_payments_without_permission(self):
        """Regular employee cannot manage payments"""
        request = self.factory.post('/api/payments/')
        request.user = self.regular_employee
        
        permission = CanManagePayments()
        self.assertFalse(permission.has_permission(request, None))
    
    def test_can_manage_installments_with_permission(self):
        """Employee with can_manage_all_installments can manage installments"""
        request = self.factory.post('/api/installments/')
        request.user = self.privileged_employee
        
        permission = CanManageInstallments()
        self.assertTrue(permission.has_permission(request, None))
    
    def test_can_manage_installments_without_permission(self):
        """Regular employee cannot manage installments"""
        request = self.factory.post('/api/installments/')
        request.user = self.regular_employee
        
        permission = CanManageInstallments()
        self.assertFalse(permission.has_permission(request, None))


class ClientViewSetPermissionTestCase(TestCase):
    """Test ClientViewSet with different permission levels"""
    
    def setUp(self):
        """Create test data"""
        # Clean up any existing data first
        Client.objects.all().delete()
        Employee.objects.all().delete()
        Account.objects.all().delete()
        
        self.account1 = Account.objects.create(name="Account 1", email="account1@test.com")
        self.account2 = Account.objects.create(name="Account 2", email="account2@test.com")
        
        # Account 1 users
        self.super_admin = Employee.objects.create_user(
            email="superadmin@account1.com",
            password="password123",
            name="Super Admin",
            account=self.account1,
            role='super_admin',
            can_view_all_clients=True,
            can_manage_all_clients=True
        )
        
        self.viewer = Employee.objects.create_user(
            email="viewer@account1.com",
            password="password123",
            name="Viewer",
            account=self.account1,
            role='employee',
            can_view_all_clients=True,
            can_manage_all_clients=False
        )
        
        self.regular = Employee.objects.create_user(
            email="regular@account1.com",
            password="password123",
            name="Regular",
            account=self.account1,
            role='employee',
            can_view_all_clients=False,
            can_manage_all_clients=False
        )
        
        # Create clients
        self.client1 = Client.objects.create(
            account=self.account1,
            first_name="Client",
            last_name="One",
            email="client1@test.com",
            coach=self.regular
        )
        
        self.client2 = Client.objects.create(
            account=self.account1,
            first_name="Client",
            last_name="Two",
            email="client2@test.com",
            coach=self.super_admin
        )
        
        self.client3 = Client.objects.create(
            account=self.account2,
            first_name="Client",
            last_name="Three",
            email="client3@test.com"
        )
        
        self.client = APIClient()
        
        # Create tokens
        EmployeeToken.objects.create(user=self.super_admin)
        EmployeeToken.objects.create(user=self.viewer)
        EmployeeToken.objects.create(user=self.regular)
    
    def test_super_admin_sees_all_clients_in_account(self):
        """Super admin sees all clients in their account"""
        self.client.force_authenticate(user=self.super_admin)
        response = self.client.get('/api/clients/')
        
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        # Should see client1 and client2, not client3 (different account)
        self.assertEqual(len(response.data), 2)
    
    def test_viewer_sees_all_clients_in_account(self):
        """Employee with can_view_all_clients sees all clients"""
        self.client.force_authenticate(user=self.viewer)
        response = self.client.get('/api/clients/')
        
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(len(response.data), 2)
    
    def test_regular_sees_only_assigned_clients(self):
        """Regular employee sees only assigned clients"""
        self.client.force_authenticate(user=self.regular)
        response = self.client.get('/api/clients/')
        
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        # Should only see client1 (assigned as coach)
        self.assertEqual(len(response.data), 1)
        self.assertEqual(response.data[0]['email'], 'client1@test.com')
    
    def test_super_admin_can_create_client(self):
        """Super admin can create clients"""
        self.client.force_authenticate(user=self.super_admin)
        response = self.client.post('/api/clients/', {
            'first_name': 'New',
            'last_name': 'Client',
            'email': 'newclient@test.com',
            'status': 'active'
        })
        
        self.assertEqual(response.status_code, status.HTTP_201_CREATED)
    
    def test_viewer_cannot_create_client(self):
        """Viewer (no manage permission) cannot create clients"""
        self.client.force_authenticate(user=self.viewer)
        response = self.client.post('/api/clients/', {
            'first_name': 'New',
            'last_name': 'Client',
            'email': 'newclient2@test.com',
            'status': 'active'
        })
        
        self.assertEqual(response.status_code, status.HTTP_403_FORBIDDEN)
    
    def test_regular_cannot_create_client(self):
        """Regular employee cannot create clients"""
        self.client.force_authenticate(user=self.regular)
        response = self.client.post('/api/clients/', {
            'first_name': 'New',
            'last_name': 'Client',
            'email': 'newclient3@test.com',
            'status': 'active'
        })
        
        self.assertEqual(response.status_code, status.HTTP_403_FORBIDDEN)
    
    def test_regular_can_update_assigned_client(self):
        """Regular employee can update their assigned client"""
        self.client.force_authenticate(user=self.regular)
        response = self.client.patch(f'/api/clients/{self.client1.id}/', {
            'first_name': 'Updated'
        })
        
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.client1.refresh_from_db()
        self.assertEqual(self.client1.first_name, 'Updated')
    
    def test_regular_cannot_update_non_assigned_client(self):
        """Regular employee cannot update non-assigned client"""
        self.client.force_authenticate(user=self.regular)
        response = self.client.patch(f'/api/clients/{self.client2.id}/', {
            'first_name': 'Updated'
        })
        
        self.assertEqual(response.status_code, status.HTTP_403_FORBIDDEN)
    
    def test_regular_can_delete_assigned_client(self):
        """Regular employee can delete their assigned client"""
        self.client.force_authenticate(user=self.regular)
        response = self.client.delete(f'/api/clients/{self.client1.id}/')
        
        self.assertEqual(response.status_code, status.HTTP_204_NO_CONTENT)
        self.assertFalse(Client.objects.filter(id=self.client1.id).exists())
    
    def test_regular_cannot_delete_non_assigned_client(self):
        """Regular employee cannot delete non-assigned client"""
        self.client.force_authenticate(user=self.regular)
        response = self.client.delete(f'/api/clients/{self.client2.id}/')
        
        self.assertEqual(response.status_code, status.HTTP_403_FORBIDDEN)


class PaymentViewSetPermissionTestCase(TestCase):
    """Test PaymentViewSet with different permission levels"""
    
    def setUp(self):
        """Create test data"""
        # Clean up any existing data first
        Payment.objects.all().delete()
        Client.objects.all().delete()
        Employee.objects.all().delete()
        Account.objects.all().delete()
        
        self.account = Account.objects.create(name="Test Account", email="test@account.com")
        
        self.super_admin = Employee.objects.create_user(
            email="superadmin@test.com",
            password="password123",
            name="Super Admin",
            account=self.account,
            role='super_admin',
            can_view_all_payments=True,
            can_manage_all_payments=True
        )
        
        self.manager = Employee.objects.create_user(
            email="manager@test.com",
            password="password123",
            name="Manager",
            account=self.account,
            role='employee',
            can_view_all_payments=True,
            can_manage_all_payments=True
        )
        
        self.viewer = Employee.objects.create_user(
            email="viewer@test.com",
            password="password123",
            name="Viewer",
            account=self.account,
            role='employee',
            can_view_all_payments=True,
            can_manage_all_payments=False
        )
        
        self.regular = Employee.objects.create_user(
            email="regular@test.com",
            password="password123",
            name="Regular",
            account=self.account,
            role='employee',
            can_view_all_payments=False,
            can_manage_all_payments=False
        )
        
        # Create clients
        self.client1 = Client.objects.create(
            account=self.account,
            first_name="Client",
            last_name="One",
            email="client1@test.com",
            coach=self.regular
        )
        
        self.client2 = Client.objects.create(
            account=self.account,
            first_name="Client",
            last_name="Two",
            email="client2@test.com",
            coach=self.super_admin
        )
        
        # Create payments
        self.payment1 = Payment.objects.create(
            id="pay_1",
            account=self.account,
            client=self.client1,
            amount=100.00,
            currency="USD",
            status="paid"
        )
        
        self.payment2 = Payment.objects.create(
            id="pay_2",
            account=self.account,
            client=self.client2,
            amount=200.00,
            currency="USD",
            status="paid"
        )
        
        self.client_api = APIClient()
    
    def test_super_admin_sees_all_payments(self):
        """Super admin sees all payments in account"""
        self.client_api.force_authenticate(user=self.super_admin)
        response = self.client_api.get('/api/payments/')
        
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(len(response.data), 2)
    
    def test_viewer_sees_all_payments(self):
        """Employee with can_view_all_payments sees all"""
        self.client_api.force_authenticate(user=self.viewer)
        response = self.client_api.get('/api/payments/')
        
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(len(response.data), 2)
    
    def test_regular_sees_only_assigned_client_payments(self):
        """Regular employee sees only payments for assigned clients"""
        self.client_api.force_authenticate(user=self.regular)
        response = self.client_api.get('/api/payments/')
        
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(len(response.data), 1)
        self.assertEqual(response.data[0]['id'], 'pay_1')
    
    def test_manager_can_create_payment(self):
        """Employee with can_manage_all_payments can create"""
        self.client_api.force_authenticate(user=self.manager)
        response = self.client_api.post('/api/payments/', {
            'id': 'pay_3',
            'client': self.client1.id,
            'amount': 150.00,
            'currency': 'USD',
            'status': 'paid'
        })
        
        self.assertEqual(response.status_code, status.HTTP_201_CREATED)
    
    def test_viewer_cannot_create_payment(self):
        """Viewer cannot create payments"""
        self.client_api.force_authenticate(user=self.viewer)
        response = self.client_api.post('/api/payments/', {
            'id': 'pay_4',
            'client': self.client1.id,
            'amount': 150.00,
            'currency': 'USD',
            'status': 'paid'
        })
        
        self.assertEqual(response.status_code, status.HTTP_403_FORBIDDEN)
    
    def test_regular_cannot_create_payment(self):
        """Regular employee cannot create payments"""
        self.client_api.force_authenticate(user=self.regular)
        response = self.client_api.post('/api/payments/', {
            'id': 'pay_5',
            'client': self.client1.id,
            'amount': 150.00,
            'currency': 'USD',
            'status': 'paid'
        })
        
        self.assertEqual(response.status_code, status.HTTP_403_FORBIDDEN)


class InstallmentViewSetPermissionTestCase(TestCase):
    """Test InstallmentViewSet with different permission levels"""
    
    def setUp(self):
        """Create test data"""
        # Clean up any existing data first
        Installment.objects.all().delete()
        Client.objects.all().delete()
        Employee.objects.all().delete()
        Account.objects.all().delete()
        
        self.account = Account.objects.create(name="Test Account", email="test@account.com")
        
        self.super_admin = Employee.objects.create_user(
            email="superadmin@test.com",
            password="password123",
            name="Super Admin",
            account=self.account,
            role='super_admin',
            can_view_all_installments=True,
            can_manage_all_installments=True
        )
        
        self.manager = Employee.objects.create_user(
            email="manager@test.com",
            password="password123",
            name="Manager",
            account=self.account,
            role='employee',
            can_view_all_installments=True,
            can_manage_all_installments=True
        )
        
        self.regular = Employee.objects.create_user(
            email="regular@test.com",
            password="password123",
            name="Regular",
            account=self.account,
            role='employee',
            can_view_all_installments=False,
            can_manage_all_installments=False
        )
        
        # Create clients
        self.client1 = Client.objects.create(
            account=self.account,
            first_name="Client",
            last_name="One",
            email="client1@test.com",
            setter=self.regular
        )
        
        self.client2 = Client.objects.create(
            account=self.account,
            first_name="Client",
            last_name="Two",
            email="client2@test.com"
        )
        
        # Create installments
        self.installment1 = Installment.objects.create(
            account=self.account,
            client=self.client1,
            amount=50.00,
            currency="USD",
            status="open",
            schedule_date=date.today()
        )
        
        self.installment2 = Installment.objects.create(
            account=self.account,
            client=self.client2,
            amount=75.00,
            currency="USD",
            status="open",
            schedule_date=date.today() + timedelta(days=30)
        )
        
        self.client_api = APIClient()
    
    def test_super_admin_sees_all_installments(self):
        """Super admin sees all installments"""
        self.client_api.force_authenticate(user=self.super_admin)
        response = self.client_api.get('/api/installments/')
        
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(len(response.data), 2)
    
    def test_manager_sees_all_installments(self):
        """Manager with can_view_all_installments sees all"""
        self.client_api.force_authenticate(user=self.manager)
        response = self.client_api.get('/api/installments/')
        
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(len(response.data), 2)
    
    def test_regular_sees_only_assigned_client_installments(self):
        """Regular employee sees only installments for assigned clients"""
        self.client_api.force_authenticate(user=self.regular)
        response = self.client_api.get('/api/installments/')
        
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(len(response.data), 1)
        self.assertEqual(response.data[0]['client'], self.client1.id)
    
    def test_manager_can_create_installment(self):
        """Manager with can_manage_all_installments can create"""
        self.client_api.force_authenticate(user=self.manager)
        response = self.client_api.post('/api/installments/', {
            'client': self.client1.id,
            'amount': 100.00,
            'currency': 'USD',
            'status': 'open',
            'schedule_date': date.today().isoformat()
        })
        
        self.assertEqual(response.status_code, status.HTTP_201_CREATED)
    
    def test_regular_cannot_create_installment(self):
        """Regular employee cannot create installments"""
        self.client_api.force_authenticate(user=self.regular)
        response = self.client_api.post('/api/installments/', {
            'client': self.client1.id,
            'amount': 100.00,
            'currency': 'USD',
            'status': 'open',
            'schedule_date': date.today().isoformat()
        })
        
        self.assertEqual(response.status_code, status.HTTP_403_FORBIDDEN)
    
    def test_manager_can_update_installment(self):
        """Manager can update any installment"""
        self.client_api.force_authenticate(user=self.manager)
        response = self.client_api.patch(f'/api/installments/{self.installment1.id}/', {
            'status': 'paid'
        })
        
        self.assertEqual(response.status_code, status.HTTP_200_OK)
    
    def test_regular_cannot_update_installment(self):
        """Regular employee cannot update installments"""
        self.client_api.force_authenticate(user=self.regular)
        response = self.client_api.patch(f'/api/installments/{self.installment1.id}/', {
            'status': 'paid'
        })
        
        self.assertEqual(response.status_code, status.HTTP_403_FORBIDDEN)


class SignupLoginPermissionTestCase(TestCase):
    """Test that signup and login return permission flags"""
    
    def setUp(self):
        self.client = APIClient()
        # Clean up any existing data
        Employee.objects.all().delete()
        Account.objects.all().delete()
    
    def test_signup_returns_permissions(self):
        """Signup endpoint returns all permission flags for super admin"""
        response = self.client.post('/api/auth/signup/', {
            'account': {
                'name': 'New Company',
                'email': 'newco@test.com'
            },
            'user': {
                'name': 'Admin User',
                'email': 'admin@newco.com',
                'password': 'securepass123'
            }
        })
        
        self.assertEqual(response.status_code, status.HTTP_201_CREATED)
        self.assertIn('permissions', response.data['user'])
        
        permissions = response.data['user']['permissions']
        self.assertTrue(permissions['can_view_all_clients'])
        self.assertTrue(permissions['can_manage_all_clients'])
        self.assertTrue(permissions['can_view_all_payments'])
        self.assertTrue(permissions['can_manage_all_payments'])
        self.assertTrue(permissions['can_view_all_installments'])
        self.assertTrue(permissions['can_manage_all_installments'])
    
    def test_login_returns_permissions(self):
        """Login endpoint returns permission flags"""
        # Create account and user first
        account = Account.objects.create(name="Test Co", email="testco@test.com")
        employee = Employee.objects.create_user(
            email="user@testco.com",
            password="password123",
            name="Test User",
            account=account,
            role='employee',
            can_view_all_clients=True,
            can_manage_all_clients=False
        )
        
        response = self.client.post('/api/auth/login/', {
            'email': 'user@testco.com',
            'password': 'password123'
        })
        
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertIn('permissions', response.data['user'])
        
        permissions = response.data['user']['permissions']
        self.assertTrue(permissions['can_view_all_clients'])
        self.assertFalse(permissions['can_manage_all_clients'])
