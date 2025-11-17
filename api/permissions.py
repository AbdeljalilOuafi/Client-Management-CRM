from rest_framework import permissions


class IsAccountMember(permissions.BasePermission):
    """
    Ensures the user belongs to an account and can only access their account's data.
    """
    def has_permission(self, request, view):
        return request.user.is_authenticated and hasattr(request.user, 'account')

    def has_object_permission(self, request, view, obj):
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
    """
    def has_permission(self, request, view):
        return request.user.is_authenticated and request.user.is_admin


class IsSuperAdmin(permissions.BasePermission):
    """
    Only Super Admin can access.
    """
    def has_permission(self, request, view):
        return request.user.is_authenticated and request.user.is_super_admin


class CanManageEmployees(permissions.BasePermission):
    """
    Super Admin and Admin can manage employees.
    Admin cannot delete/modify Super Admin.
    """
    def has_permission(self, request, view):
        return request.user.is_authenticated and request.user.is_admin

    def has_object_permission(self, request, view, obj):
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
    """
    def has_object_permission(self, request, view, obj):
        # Admin/SuperAdmin can access anyone in their account
        if request.user.is_admin:
            return request.user.account_id == obj.account_id
        
        # Regular employees can only access themselves
        return obj.id == request.user.id


class CanViewClients(permissions.BasePermission):
    """
    Permission to view clients:
    - Super admin: always allowed
    - User with can_view_all_clients: always allowed  
    - Otherwise: ViewSet filters to only assigned clients
    """
    def has_permission(self, request, view):
        if not request.user.is_authenticated:
            return False
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
    - Super admin: always allowed
    - User with can_manage_all_clients: always allowed
    - Otherwise: not allowed to create, can only update/delete assigned (checked in ViewSet)
    """
    def has_permission(self, request, view):
        if not request.user.is_authenticated:
            return False
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
    - Super admin: always allowed
    - User with can_view_all_payments: always allowed
    - Otherwise: ViewSet filters to payments for assigned clients only
    """
    def has_permission(self, request, view):
        if not request.user.is_authenticated:
            return False
        if request.user.is_super_admin:
            return True
        if getattr(request.user, 'can_view_all_payments', False):
            return True
        return True


class CanManagePayments(permissions.BasePermission):
    """
    Permission to create/update/delete payments:
    - Super admin: always allowed
    - User with can_manage_all_payments: always allowed
    - Otherwise: not allowed
    """
    def has_permission(self, request, view):
        if not request.user.is_authenticated:
            return False
        if request.user.is_super_admin:
            return True
        if getattr(request.user, 'can_manage_all_payments', False):
            return True
        return False


class CanViewInstallments(permissions.BasePermission):
    """
    Permission to view installments:
    - Super admin: always allowed
    - User with can_view_all_installments: always allowed
    - Otherwise: ViewSet filters to installments for assigned clients only
    """
    def has_permission(self, request, view):
        if not request.user.is_authenticated:
            return False
        if request.user.is_super_admin:
            return True
        if getattr(request.user, 'can_view_all_installments', False):
            return True
        return True


class CanManageInstallments(permissions.BasePermission):
    """
    Permission to create/update/delete installments:
    - Super admin: always allowed
    - User with can_manage_all_installments: always allowed
    - Otherwise: not allowed
    """
    def has_permission(self, request, view):
        if not request.user.is_authenticated:
            return False
        if request.user.is_super_admin:
            return True
        if getattr(request.user, 'can_manage_all_installments', False):
            return True
        return False
