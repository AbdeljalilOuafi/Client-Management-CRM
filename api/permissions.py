from rest_framework import permissions


def is_master_token_user(user):
    """Helper function to check if user is a MasterTokenUser"""
    return getattr(user, 'is_master_token', False)


def get_resolved_account_id(request, view):
    """
    Get the resolved account_id from the view if using AccountResolutionMixin,
    otherwise fall back to request.user.account_id.
    """
    if hasattr(view, 'get_resolved_account_id'):
        return view.get_resolved_account_id()
    return request.user.account_id


class IsAccountMember(permissions.BasePermission):
    """
    Ensures the user belongs to an account and can only access their account's data.
    Master token users are always allowed (they specify account via X-Account-ID header).
    """
    def has_permission(self, request, view):
        if not request.user.is_authenticated:
            return False
        # Master token users are always allowed at permission level
        # Account validation is done in the mixin
        if is_master_token_user(request.user):
            return True
        return hasattr(request.user, 'account')

    def has_object_permission(self, request, view, obj):
        # Master token users can access any object in the specified account
        if is_master_token_user(request.user):
            account_id = get_resolved_account_id(request, view)
            if hasattr(obj, 'account_id'):
                return obj.account_id == account_id
            return True
        
        # Check if object has account_id
        if hasattr(obj, 'account_id'):
            return obj.account_id == request.user.account_id
        # For Employee objects
        if hasattr(obj, 'account'):
            return obj.account_id == request.user.account_id
        return False


class IsSuperAdminOrAdmin(permissions.BasePermission):
    """
    Only Super Admin or Admin can access.
    Master token users have super_admin privileges.
    """
    def has_permission(self, request, view):
        if not request.user.is_authenticated:
            return False
        # Master token users have super_admin privileges
        if is_master_token_user(request.user):
            return True
        return request.user.is_admin


class IsSuperAdmin(permissions.BasePermission):
    """
    Only Super Admin can access.
    Master token users have super_admin privileges.
    """
    def has_permission(self, request, view):
        if not request.user.is_authenticated:
            return False
        # Master token users have super_admin privileges
        if is_master_token_user(request.user):
            return True
        return request.user.is_super_admin


class CanManageEmployees(permissions.BasePermission):
    """
    Super Admin and Admin can manage employees.
    Admin cannot delete/modify Super Admin.
    Master token users have full access.
    """
    def has_permission(self, request, view):
        if not request.user.is_authenticated:
            return False
        # Master token users can manage all employees
        if is_master_token_user(request.user):
            return True
        return request.user.is_admin

    def has_object_permission(self, request, view, obj):
        # Master token users can do anything
        if is_master_token_user(request.user):
            return True
        
        # Super Admin can do anything
        if request.user.is_super_admin:
            return True
        
        # Admin cannot modify/delete Super Admin
        if request.user.role == 'admin' and obj.is_super_admin:
            if view.action in ['update', 'partial_update', 'destroy']:
                return False
        
        return request.user.account_id == obj.account_id


class IsSelfOrAdmin(permissions.BasePermission):
    """
    Employees can update their own profile, or Admin/SuperAdmin can update any.
    Master token users can update any employee.
    """
    def has_object_permission(self, request, view, obj):
        # Master token users can update any employee
        if is_master_token_user(request.user):
            return True
        
        # Admin/SuperAdmin can access anyone in their account
        if request.user.is_admin:
            return request.user.account_id == obj.account_id
        
        # Regular employees can only access themselves
        return obj.id == request.user.id


class CanViewClients(permissions.BasePermission):
    """
    Permission to view clients:
    - Master token: always allowed
    - Super admin: always allowed
    - User with can_view_all_clients: always allowed  
    - Otherwise: ViewSet filters to only assigned clients
    """
    def has_permission(self, request, view):
        if not request.user.is_authenticated:
            return False
        # Master token can view all
        if is_master_token_user(request.user):
            return True
        # Super admin can view all
        if request.user.is_super_admin:
            return True
        # User with explicit permission can view all
        if getattr(request.user, 'can_view_all_clients', False):
            return True
        # Others can view but ViewSet will filter to assigned only
        return True


class CanManageClients(permissions.BasePermission):
    """
    Permission to create/update/delete clients:
    - Master token: always allowed
    - Super admin: always allowed
    - User with can_manage_all_clients: always allowed
    - Otherwise: not allowed to create, can only update/delete assigned (checked in ViewSet)
    """
    def has_permission(self, request, view):
        if not request.user.is_authenticated:
            return False
        # Master token can manage all
        if is_master_token_user(request.user):
            return True
        # Super admin can manage all
        if request.user.is_super_admin:
            return True
        # User with explicit permission can manage all
        if getattr(request.user, 'can_manage_all_clients', False):
            return True
        # For create action, deny if no manage permission
        if view.action == 'create':
            return False
        # For update/delete, allow but ViewSet will check assignment
        return True
    
    def has_object_permission(self, request, view, obj):
        """Check if user can modify this specific client"""
        # Master token can manage all
        if is_master_token_user(request.user):
            return True
        if request.user.is_super_admin:
            return True
        if getattr(request.user, 'can_manage_all_clients', False):
            return True
        # Check if client is assigned to user
        return (obj.coach_id == request.user.id or 
                obj.closer_id == request.user.id or 
                obj.setter_id == request.user.id)


class CanViewPayments(permissions.BasePermission):
    """
    Permission to view payments:
    - Master token: always allowed
    - Super admin: always allowed
    - User with can_view_all_payments: always allowed
    - Otherwise: ViewSet filters to payments for assigned clients only
    """
    def has_permission(self, request, view):
        if not request.user.is_authenticated:
            return False
        # Master token can view all
        if is_master_token_user(request.user):
            return True
        if request.user.is_super_admin:
            return True
        if getattr(request.user, 'can_view_all_payments', False):
            return True
        return True


class CanManagePayments(permissions.BasePermission):
    """
    Permission to create/update/delete payments:
    - Master token: always allowed
    - Super admin: always allowed
    - User with can_manage_all_payments: always allowed
    - Otherwise: not allowed
    """
    def has_permission(self, request, view):
        if not request.user.is_authenticated:
            return False
        # Master token can manage all
        if is_master_token_user(request.user):
            return True
        if request.user.is_super_admin:
            return True
        if getattr(request.user, 'can_manage_all_payments', False):
            return True
        return False


class CanViewInstallments(permissions.BasePermission):
    """
    Permission to view installments:
    - Master token: always allowed
    - Super admin: always allowed
    - User with can_view_all_installments: always allowed
    - Otherwise: ViewSet filters to installments for assigned clients only
    """
    def has_permission(self, request, view):
        if not request.user.is_authenticated:
            return False
        # Master token can view all
        if is_master_token_user(request.user):
            return True
        if request.user.is_super_admin:
            return True
        if getattr(request.user, 'can_view_all_installments', False):
            return True
        return True


class CanManageInstallments(permissions.BasePermission):
    """
    Permission to create/update/delete installments:
    - Master token: always allowed
    - Super admin: always allowed
    - User with can_manage_all_installments: always allowed
    - Otherwise: not allowed
    """
    def has_permission(self, request, view):
        if not request.user.is_authenticated:
            return False
        # Master token can manage all
        if is_master_token_user(request.user):
            return True
        if request.user.is_super_admin:
            return True
        if getattr(request.user, 'can_manage_all_installments', False):
            return True
        return False
