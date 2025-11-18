"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { usePermissions } from "@/contexts/PermissionsContext";
import { Permissions, UserRole } from "@/lib/types/permissions";

interface PermissionGuardProps {
  children: React.ReactNode;
  
  // NEW: Page-based access (recommended)
  pageId?: string;
  
  // Role-based access (legacy)
  requiredRole?: UserRole | UserRole[];
  
  // Permission-based access (any of these) (legacy)
  requiredPermission?: keyof Permissions;
  requiredPermissions?: (keyof Permissions)[];
  
  // Custom check function (legacy)
  customCheck?: (user: any, permissions: Permissions | null) => boolean;
  
  // Redirect path if access denied
  fallbackPath?: string;
  
  // Show nothing instead of redirecting
  hideOnDenied?: boolean;
}

export function PermissionGuard({
  children,
  pageId,
  requiredRole,
  requiredPermission,
  requiredPermissions,
  customCheck,
  fallbackPath = "/dashboard",
  hideOnDenied = false,
}: PermissionGuardProps) {
  const router = useRouter();
  const { user, permissions, isLoading, isSuperAdmin, canViewPage } = usePermissions();

  useEffect(() => {
    if (isLoading) return;

    // Super admin always has access
    if (isSuperAdmin()) return;

    let hasAccess = true;

    // NEW: Check page-based access (takes precedence)
    if (pageId) {
      hasAccess = canViewPage(pageId);
      if (!hasAccess && !hideOnDenied) {
        router.push(fallbackPath);
      }
      return;
    }

    // LEGACY: Check role requirement
    if (requiredRole) {
      const roles = Array.isArray(requiredRole) ? requiredRole : [requiredRole];
      hasAccess = user ? roles.includes(user.role) : false;
    }

    // Check single permission requirement
    if (hasAccess && requiredPermission && permissions) {
      hasAccess = permissions[requiredPermission] === true;
    }

    // Check multiple permissions requirement (any of them)
    if (hasAccess && requiredPermissions && permissions) {
      hasAccess = requiredPermissions.some(perm => permissions[perm] === true);
    }

    // Check custom function
    if (hasAccess && customCheck) {
      hasAccess = customCheck(user, permissions);
    }

    // Redirect if access denied
    if (!hasAccess && !hideOnDenied) {
      router.push(fallbackPath);
    }
  }, [
    user,
    permissions,
    isLoading,
    requiredRole,
    requiredPermission,
    requiredPermissions,
    customCheck,
    fallbackPath,
    hideOnDenied,
    router,
    isSuperAdmin,
  ]);

  // Show loading state
  if (isLoading) {
    return null;
  }

  // Super admin always has access
  if (isSuperAdmin()) {
    return <>{children}</>;
  }

  // Check role requirement
  if (requiredRole) {
    const roles = Array.isArray(requiredRole) ? requiredRole : [requiredRole];
    if (!user || !roles.includes(user.role)) {
      return hideOnDenied ? null : <>{children}</>;
    }
  }

  // Check single permission requirement
  if (requiredPermission && permissions) {
    if (permissions[requiredPermission] !== true) {
      return hideOnDenied ? null : <>{children}</>;
    }
  }

  // Check multiple permissions requirement
  if (requiredPermissions && permissions) {
    const hasAnyPermission = requiredPermissions.some(perm => permissions[perm] === true);
    if (!hasAnyPermission) {
      return hideOnDenied ? null : <>{children}</>;
    }
  }

  // Check custom function
  if (customCheck && !customCheck(user, permissions)) {
    return hideOnDenied ? null : <>{children}</>;
  }

  return <>{children}</>;
}
