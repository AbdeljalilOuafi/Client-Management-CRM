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
