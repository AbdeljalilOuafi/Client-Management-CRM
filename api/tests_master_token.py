"""
Tests for MasterToken authentication and cross-account access.

These tests cover:
1. MasterToken authentication via X-Master-Token header
2. MasterToken authentication via Authorization header
3. Account resolution via X-Account-ID header
4. Cross-account CRUD operations
5. Permission checks for master token users
6. Error handling for invalid tokens and missing headers
"""
from django.test import TestCase, override_settings
from django.urls import reverse
from rest_framework.test import APIClient
from rest_framework import status
from api.models import (
    Account, Employee, MasterToken, MasterTokenUser,
    Client, Package, ClientPackage, Payment, Installment
)
from api.authentication import MasterTokenAuthentication
from unittest.mock import MagicMock, patch


class MasterTokenModelTestCase(TestCase):
    """Tests for MasterToken model"""
    
    def test_create_master_token(self):
        """Test creating a master token generates a 64-char key"""
        token = MasterToken.objects.create(
            name='Test Token',
            description='Test description'
        )
        self.assertEqual(len(token.key), 64)
        self.assertTrue(token.is_active)
        self.assertIsNotNone(token.created_at)
        self.assertIsNone(token.last_used_at)
    
    def test_master_token_str(self):
        """Test string representation of MasterToken"""
        token = MasterToken.objects.create(name='Test Token')
        self.assertEqual(str(token), 'Test Token (active)')
        
        token.is_active = False
        token.save()
        self.assertEqual(str(token), 'Test Token (inactive)')
    
    def test_generate_key(self):
        """Test key generation produces unique hex strings"""
        key1 = MasterToken.generate_key()
        key2 = MasterToken.generate_key()
        
        self.assertEqual(len(key1), 64)
        self.assertEqual(len(key2), 64)
        self.assertNotEqual(key1, key2)
        # Verify it's a valid hex string
        int(key1, 16)
        int(key2, 16)


class MasterTokenUserTestCase(TestCase):
    """Tests for MasterTokenUser pseudo-user class"""
    
    def setUp(self):
        self.master_token = MasterToken.objects.create(name='Test Token')
        self.account = Account.objects.create(name='Test Account')
    
    def test_master_token_user_properties(self):
        """Test MasterTokenUser has correct properties"""
        user = MasterTokenUser(master_token=self.master_token, account_id=self.account.id)
        
        self.assertTrue(user.is_authenticated)
        self.assertTrue(user.is_active)
        self.assertTrue(user.is_staff)
        self.assertTrue(user.is_superuser)
        self.assertTrue(user.is_master_token)
        self.assertTrue(user.is_super_admin)
        self.assertTrue(user.is_admin)
        self.assertEqual(user.role, 'super_admin')
    
    def test_master_token_user_permissions(self):
        """Test MasterTokenUser has all permission flags"""
        user = MasterTokenUser(master_token=self.master_token, account_id=self.account.id)
        
        self.assertTrue(user.can_view_all_clients)
        self.assertTrue(user.can_manage_all_clients)
        self.assertTrue(user.can_view_all_payments)
        self.assertTrue(user.can_manage_all_payments)
        self.assertTrue(user.can_view_all_installments)
        self.assertTrue(user.can_manage_all_installments)
    
    def test_master_token_user_account_resolution(self):
        """Test MasterTokenUser correctly resolves account"""
        user = MasterTokenUser(master_token=self.master_token, account_id=self.account.id)
        
        self.assertEqual(user.account_id, self.account.id)
        self.assertEqual(user.account.id, self.account.id)
        self.assertEqual(user.account.name, 'Test Account')
    
    def test_master_token_user_without_account(self):
        """Test MasterTokenUser without account_id"""
        user = MasterTokenUser(master_token=self.master_token, account_id=None)
        
        self.assertIsNone(user.account_id)
        self.assertIsNone(user.account)


class MasterTokenAuthenticationTestCase(TestCase):
    """Tests for MasterTokenAuthentication class"""
    
    def setUp(self):
        self.auth = MasterTokenAuthentication()
        self.master_token = MasterToken.objects.create(name='Test Token')
        self.account = Account.objects.create(name='Test Account')
    
    def _create_mock_request(self, headers=None):
        """Helper to create mock request with headers"""
        request = MagicMock()
        request.headers = headers or {}
        return request
    
    def test_authenticate_with_x_master_token_header(self):
        """Test authentication with X-Master-Token header"""
        request = self._create_mock_request({
            'X-Master-Token': self.master_token.key,
            'X-Account-ID': str(self.account.id)
        })
        
        user, token = self.auth.authenticate(request)
        
        self.assertIsInstance(user, MasterTokenUser)
        self.assertEqual(user.account_id, self.account.id)
        self.assertEqual(token.key, self.master_token.key)
    
    def test_authenticate_with_authorization_header(self):
        """Test authentication with Authorization: MasterToken header"""
        request = self._create_mock_request({
            'Authorization': f'MasterToken {self.master_token.key}',
            'X-Account-ID': str(self.account.id)
        })
        
        user, token = self.auth.authenticate(request)
        
        self.assertIsInstance(user, MasterTokenUser)
        self.assertEqual(user.account_id, self.account.id)
    
    def test_authenticate_without_account_id(self):
        """Test authentication succeeds without X-Account-ID (validated later)"""
        request = self._create_mock_request({
            'X-Master-Token': self.master_token.key
        })
        
        user, token = self.auth.authenticate(request)
        
        self.assertIsInstance(user, MasterTokenUser)
        self.assertIsNone(user.account_id)
    
    def test_authenticate_invalid_token(self):
        """Test authentication fails with invalid token"""
        from rest_framework import exceptions
        
        request = self._create_mock_request({
            'X-Master-Token': 'invalid_token_key'
        })
        
        with self.assertRaises(exceptions.AuthenticationFailed) as context:
            self.auth.authenticate(request)
        
        self.assertIn('Invalid master token', str(context.exception))
    
    def test_authenticate_inactive_token(self):
        """Test authentication fails with inactive token"""
        from rest_framework import exceptions
        
        self.master_token.is_active = False
        self.master_token.save()
        
        request = self._create_mock_request({
            'X-Master-Token': self.master_token.key
        })
        
        with self.assertRaises(exceptions.AuthenticationFailed) as context:
            self.auth.authenticate(request)
        
        self.assertIn('inactive', str(context.exception))
    
    def test_authenticate_invalid_account_id(self):
        """Test authentication fails with non-integer account_id"""
        from rest_framework import exceptions
        
        request = self._create_mock_request({
            'X-Master-Token': self.master_token.key,
            'X-Account-ID': 'not_an_integer'
        })
        
        with self.assertRaises(exceptions.AuthenticationFailed) as context:
            self.auth.authenticate(request)
        
        self.assertIn('Invalid X-Account-ID', str(context.exception))
    
    def test_authenticate_returns_none_without_token(self):
        """Test authentication returns None when no token provided"""
        request = self._create_mock_request({})
        
        result = self.auth.authenticate(request)
        
        self.assertIsNone(result)
    
    def test_last_used_at_updated(self):
        """Test last_used_at is updated on authentication"""
        self.assertIsNone(self.master_token.last_used_at)
        
        request = self._create_mock_request({
            'X-Master-Token': self.master_token.key
        })
        
        self.auth.authenticate(request)
        
        self.master_token.refresh_from_db()
        self.assertIsNotNone(self.master_token.last_used_at)


class MasterTokenAPITestCase(TestCase):
    """Integration tests for API access with MasterToken"""
    
    def setUp(self):
        self.client = APIClient()
        self.master_token = MasterToken.objects.create(name='Test Token')
        
        # Create two accounts for cross-account testing
        self.account1 = Account.objects.create(name='Account 1', email='account1@test.com')
        self.account2 = Account.objects.create(name='Account 2', email='account2@test.com')
        
        # Create employees for each account
        self.employee1 = Employee.objects.create(
            account=self.account1,
            name='Employee 1',
            email='emp1@test.com',
            role='super_admin',
            is_active=True
        )
        self.employee1.set_password('testpass123')
        self.employee1.save()
        
        self.employee2 = Employee.objects.create(
            account=self.account2,
            name='Employee 2',
            email='emp2@test.com',
            role='admin',
            is_active=True
        )
        self.employee2.set_password('testpass123')
        self.employee2.save()
        
        # Create test clients for each account
        self.client1 = Client.objects.create(
            account=self.account1,
            first_name='Client',
            last_name='One',
            email='client1@test.com'
        )
        self.client2 = Client.objects.create(
            account=self.account2,
            first_name='Client',
            last_name='Two',
            email='client2@test.com'
        )
    
    def _auth_headers(self, account_id=None):
        """Helper to get auth headers for master token"""
        headers = {'HTTP_X_MASTER_TOKEN': self.master_token.key}
        if account_id:
            headers['HTTP_X_ACCOUNT_ID'] = str(account_id)
        return headers
    
    def test_list_clients_account1(self):
        """Test listing clients for account 1"""
        response = self.client.get(
            '/api/clients/',
            **self._auth_headers(self.account1.id)
        )
        
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        results = response.json().get('results', response.json())
        self.assertEqual(len(results), 1)
        self.assertEqual(results[0]['first_name'], 'Client')
        self.assertEqual(results[0]['last_name'], 'One')
    
    def test_list_clients_account2(self):
        """Test listing clients for account 2"""
        response = self.client.get(
            '/api/clients/',
            **self._auth_headers(self.account2.id)
        )
        
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        results = response.json().get('results', response.json())
        self.assertEqual(len(results), 1)
        self.assertEqual(results[0]['first_name'], 'Client')
        self.assertEqual(results[0]['last_name'], 'Two')
    
    def test_create_client_cross_account(self):
        """Test creating a client in a specific account"""
        response = self.client.post(
            '/api/clients/',
            {
                'first_name': 'New',
                'last_name': 'Client',
                'email': 'newclient@test.com'
            },
            format='json',
            **self._auth_headers(self.account1.id)
        )
        
        self.assertEqual(response.status_code, status.HTTP_201_CREATED)
        
        # Verify client was created in account 1
        new_client = Client.objects.get(email='newclient@test.com')
        self.assertEqual(new_client.account_id, self.account1.id)
    
    def test_update_client_cross_account(self):
        """Test updating a client in a specific account"""
        response = self.client.patch(
            f'/api/clients/{self.client2.id}/',
            {'first_name': 'Updated'},
            format='json',
            **self._auth_headers(self.account2.id)
        )
        
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        
        self.client2.refresh_from_db()
        self.assertEqual(self.client2.first_name, 'Updated')
    
    def test_delete_client_cross_account(self):
        """Test deleting a client in a specific account"""
        response = self.client.delete(
            f'/api/clients/{self.client1.id}/',
            **self._auth_headers(self.account1.id)
        )
        
        self.assertEqual(response.status_code, status.HTTP_204_NO_CONTENT)
        self.assertFalse(Client.objects.filter(id=self.client1.id).exists())
    
    def test_missing_account_id_header(self):
        """Test that requests fail when X-Account-ID header is missing"""
        response = self.client.get(
            '/api/clients/',
            HTTP_X_MASTER_TOKEN=self.master_token.key
        )
        
        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)
        self.assertIn('X-Account-ID', response.json().get('detail', ''))
    
    def test_invalid_account_id(self):
        """Test that requests fail with non-existent account_id"""
        response = self.client.get(
            '/api/clients/',
            **self._auth_headers(99999)  # Non-existent account
        )
        
        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)
        self.assertIn('does not exist', response.json().get('detail', ''))
    
    def test_list_employees_cross_account(self):
        """Test listing employees for different accounts"""
        # List employees from account 1
        response = self.client.get(
            '/api/employees/',
            **self._auth_headers(self.account1.id)
        )
        
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        results = response.json().get('results', response.json())
        self.assertEqual(len(results), 1)
        self.assertEqual(results[0]['email'], 'emp1@test.com')
        
        # List employees from account 2
        response = self.client.get(
            '/api/employees/',
            **self._auth_headers(self.account2.id)
        )
        
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        results = response.json().get('results', response.json())
        self.assertEqual(len(results), 1)
        self.assertEqual(results[0]['email'], 'emp2@test.com')
    
    def test_account_isolation(self):
        """Test that master token properly isolates account data"""
        # Create a package in account 1
        package1 = Package.objects.create(
            account=self.account1,
            package_name='Package 1'
        )
        
        # Create a package in account 2
        package2 = Package.objects.create(
            account=self.account2,
            package_name='Package 2'
        )
        
        # Query account 1 - should only see Package 1
        response = self.client.get(
            '/api/packages/',
            **self._auth_headers(self.account1.id)
        )
        results = response.json().get('results', response.json())
        self.assertEqual(len(results), 1)
        self.assertEqual(results[0]['package_name'], 'Package 1')
        
        # Query account 2 - should only see Package 2
        response = self.client.get(
            '/api/packages/',
            **self._auth_headers(self.account2.id)
        )
        results = response.json().get('results', response.json())
        self.assertEqual(len(results), 1)
        self.assertEqual(results[0]['package_name'], 'Package 2')


class MasterTokenPermissionsTestCase(TestCase):
    """Test permission classes with master token"""
    
    def setUp(self):
        self.client = APIClient()
        self.master_token = MasterToken.objects.create(name='Test Token')
        self.account = Account.objects.create(name='Test Account')
    
    def _auth_headers(self):
        return {
            'HTTP_X_MASTER_TOKEN': self.master_token.key,
            'HTTP_X_ACCOUNT_ID': str(self.account.id)
        }
    
    def test_is_super_admin_permission(self):
        """Test master token passes IsSuperAdmin permission"""
        # Domain configuration requires IsSuperAdmin
        response = self.client.get(
            '/api/domains/',
            **self._auth_headers()
        )
        
        # Should succeed (not 403) - may be 200 or other status
        self.assertNotEqual(response.status_code, status.HTTP_403_FORBIDDEN)
    
    def test_is_account_member_permission(self):
        """Test master token passes IsAccountMember permission"""
        response = self.client.get(
            '/api/accounts/',
            **self._auth_headers()
        )
        
        self.assertEqual(response.status_code, status.HTTP_200_OK)


class MasterTokenManagementCommandTestCase(TestCase):
    """Tests for the create_master_token management command"""
    
    def test_create_token_command(self):
        """Test creating a token via management command"""
        from django.core.management import call_command
        from io import StringIO
        
        out = StringIO()
        call_command('create_master_token', 'Test Command Token', stdout=out)
        
        output = out.getvalue()
        self.assertIn('Master Token Created Successfully', output)
        self.assertIn('Test Command Token', output)
        
        # Verify token was created
        self.assertTrue(MasterToken.objects.filter(name='Test Command Token').exists())
    
    def test_list_tokens_command(self):
        """Test listing tokens via management command"""
        from django.core.management import call_command
        from io import StringIO
        
        # Create some tokens
        MasterToken.objects.create(name='Token 1')
        MasterToken.objects.create(name='Token 2')
        
        out = StringIO()
        call_command('create_master_token', '--list', stdout=out)
        
        output = out.getvalue()
        self.assertIn('Token 1', output)
        self.assertIn('Token 2', output)
    
    def test_revoke_token_command(self):
        """Test revoking a token via management command"""
        from django.core.management import call_command
        from io import StringIO
        
        token = MasterToken.objects.create(name='To Revoke')
        self.assertTrue(token.is_active)
        
        out = StringIO()
        call_command('create_master_token', f'--revoke={token.key}', stdout=out)
        
        token.refresh_from_db()
        self.assertFalse(token.is_active)
        self.assertIn('revoked', out.getvalue())
    
    def test_activate_token_command(self):
        """Test reactivating a token via management command"""
        from django.core.management import call_command
        from io import StringIO
        
        token = MasterToken.objects.create(name='To Activate', is_active=False)
        
        out = StringIO()
        call_command('create_master_token', f'--activate={token.key}', stdout=out)
        
        token.refresh_from_db()
        self.assertTrue(token.is_active)
        self.assertIn('reactivated', out.getvalue())
    
    def test_delete_token_command(self):
        """Test deleting a token via management command"""
        from django.core.management import call_command
        from io import StringIO
        
        token = MasterToken.objects.create(name='To Delete')
        token_key = token.key
        
        out = StringIO()
        call_command('create_master_token', f'--delete={token_key}', stdout=out)
        
        self.assertFalse(MasterToken.objects.filter(key=token_key).exists())
        self.assertIn('deleted', out.getvalue())

