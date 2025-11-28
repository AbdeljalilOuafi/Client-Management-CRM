"use client";

import React, { createContext, useContext, useState, useEffect } from "react";
import { UserWithPermissions, Permissions, UserRole } from "@/lib/types/permissions";
import { getStoredUser, getStoredPermissions, getCurrentUser } from "@/lib/api/auth";
import { 
  canViewPage, 
  canEditOnPage, 
  getAccessiblePages, 
  getEditablePages,
  getNavigationPages,
  PagePermission 
} from "@/lib/config/pagePermissions";

interface PermissionsContextType {
  user: UserWithPermissions | null;
  permissions: Permissions | null;
  isLoading: boolean;
  
  // Role checks
  isSuperAdmin: () => boolean;
  isAdmin: () => boolean;
  isAdminOrAbove: () => boolean;
  
  // Permission checks
  canViewAllClients: () => boolean;
  canManageAllClients: () => boolean;
  canViewAllPayments: () => boolean;
  canManageAllPayments: () => boolean;
  canViewAllInstallments: () => boolean;
  canManageAllInstallments: () => boolean;
  canViewIntegrations: () => boolean;
  canManageIntegrations: () => boolean;
  
  // Page access checks (legacy - kept for backwards compatibility)
  canAccessStaffPage: () => boolean;
  canAccessCheckInPage: () => boolean;
  
  // New page-based permission system
  canViewPage: (pageId: string) => boolean;
  canEditOnPage: (pageId: string) => boolean;
  getAccessiblePages: () => PagePermission[];
  getEditablePages: () => PagePermission[];
  getNavigationPages: () => PagePermission[];
  
  // Refresh permissions
  refreshPermissions: () => void;
}

const PermissionsContext = createContext<PermissionsContextType | undefined>(undefined);

export function PermissionsProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<UserWithPermissions | null>(null);
  const [permissions, setPermissions] = useState<Permissions | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [refreshTrigger, setRefreshTrigger] = useState(0);

  useEffect(() => {
    const loadPermissions = async () => {
      setIsLoading(true);
      // First, load from localStorage for immediate display
      const storedUser = getStoredUser();
      const storedPermissions = getStoredPermissions();
      
      console.log('[PermissionsContext] Loading permissions from localStorage:', {
        storedUser,
        storedPermissions,
        userRole: storedUser?.role,
      });
      
      if (storedUser) {
        setUser(storedUser as UserWithPermissions);
        // Use stored permissions or extract from user object
        const perms = storedPermissions || (storedUser as any).permissions;
        setPermissions(perms || null);
        
        console.log('[PermissionsContext] Permissions loaded from localStorage:', {
          role: storedUser.role,
          permissions: perms,
        });
      }
      
      // Then fetch fresh data from backend to ensure accuracy
      try {
        const token = typeof window !== "undefined" ? localStorage.getItem("auth_token") : null;
        
        if (token) {
          console.log('[PermissionsContext] Fetching fresh user data from backend...');
          const freshUser = await getCurrentUser();
          
          console.log('[PermissionsContext] Fresh user data received:', {
            id: freshUser.id,
            role: freshUser.role,
            permissions: (freshUser as any).permissions,
          });
          
          // Update localStorage with fresh data
          if (typeof window !== "undefined") {
            localStorage.setItem("user", JSON.stringify(freshUser));
          }
          
          // Update state with fresh data
          setUser(freshUser as UserWithPermissions);
          
          // Extract permissions from user object
          const freshPermissions = {
            can_view_all_clients: (freshUser as any).can_view_all_clients || false,
            can_manage_all_clients: (freshUser as any).can_manage_all_clients || false,
            can_view_all_payments: (freshUser as any).can_view_all_payments || false,
            can_manage_all_payments: (freshUser as any).can_manage_all_payments || false,
            can_view_all_installments: (freshUser as any).can_view_all_installments || false,
            can_manage_all_installments: (freshUser as any).can_manage_all_installments || false,
            can_view_integrations: (freshUser as any).can_view_integrations || false,
            can_manage_integrations: (freshUser as any).can_manage_integrations || false,
          };
          
          setPermissions(freshPermissions);
          
          console.log('[PermissionsContext] State updated with fresh data');
        }
      } catch (error) {
        console.error('[PermissionsContext] Failed to fetch fresh user data:', error);
        // Continue with localStorage data if backend fetch fails
      } finally {
        setIsLoading(false);
      }
    };

    loadPermissions();
  }, [refreshTrigger]);

  // Listen for storage changes (login/logout events)
  useEffect(() => {
    const handleStorageChange = (e: StorageEvent) => {
      // If auth_token or user changes, refresh permissions
      if (e.key === 'auth_token' || e.key === 'user') {
        console.log('[PermissionsContext] Storage change detected, refreshing permissions...');
        setRefreshTrigger(prev => prev + 1);
      }
    };

    window.addEventListener('storage', handleStorageChange);
    
    return () => {
      window.removeEventListener('storage', handleStorageChange);
    };
  }, []);

  // Role checks
  const isSuperAdmin = (): boolean => {
    return user?.role === "super_admin";
  };

  const isAdmin = (): boolean => {
    return user?.role === "admin";
  };

  const isAdminOrAbove = (): boolean => {
    return user?.role === "super_admin" || user?.role === "admin";
  };

  // Permission checks
  const canViewAllClients = (): boolean => {
    return isSuperAdmin() || permissions?.can_view_all_clients === true;
  };

  const canManageAllClients = (): boolean => {
    return isSuperAdmin() || permissions?.can_manage_all_clients === true;
  };

  const canViewAllPayments = (): boolean => {
    return isSuperAdmin() || permissions?.can_view_all_payments === true;
  };

  const canManageAllPayments = (): boolean => {
    return isSuperAdmin() || permissions?.can_manage_all_payments === true;
  };

  const canViewAllInstallments = (): boolean => {
    return isSuperAdmin() || permissions?.can_view_all_installments === true;
  };

  const canManageAllInstallments = (): boolean => {
    return isSuperAdmin() || permissions?.can_manage_all_installments === true;
  };

  const canViewIntegrations = (): boolean => {
    return isSuperAdmin() || permissions?.can_view_integrations === true;
  };

  const canManageIntegrations = (): boolean => {
    return isSuperAdmin() || permissions?.can_manage_integrations === true;
  };

  // Page access checks
  const canAccessStaffPage = (): boolean => {
    // Only admin and super_admin can see the Staff page
    return isAdminOrAbove();
  };

  const canAccessCheckInPage = (): boolean => {
    // Only super_admin can see the Check-in page
    return isSuperAdmin();
  };

  const refreshPermissions = async () => {
    try {
      console.log('[PermissionsContext] Refreshing permissions from backend...');
      
      // Fetch fresh user data from backend
      const freshUser = await getCurrentUser();
      
      console.log('[PermissionsContext] Fresh user data received:', {
        id: freshUser.id,
        role: freshUser.role,
        can_view_all_clients: (freshUser as any).can_view_all_clients,
        can_manage_all_clients: (freshUser as any).can_manage_all_clients,
      });
      
      // Update localStorage with fresh data
      if (typeof window !== "undefined") {
        localStorage.setItem("user", JSON.stringify(freshUser));
      }
      
      // Update state
      setUser(freshUser as UserWithPermissions);
      
      // Extract permissions from user object
      const freshPermissions = {
        can_view_all_clients: (freshUser as any).can_view_all_clients || false,
        can_manage_all_clients: (freshUser as any).can_manage_all_clients || false,
        can_view_all_payments: (freshUser as any).can_view_all_payments || false,
        can_manage_all_payments: (freshUser as any).can_manage_all_payments || false,
        can_view_all_installments: (freshUser as any).can_view_all_installments || false,
        can_manage_all_installments: (freshUser as any).can_manage_all_installments || false,
        can_view_integrations: (freshUser as any).can_view_integrations || false,
        can_manage_integrations: (freshUser as any).can_manage_integrations || false,
      };
      
      setPermissions(freshPermissions);
      
      console.log('[PermissionsContext] Permissions refreshed successfully:', freshPermissions);
    } catch (error) {
      console.error('[PermissionsContext] Failed to refresh permissions:', error);
      // Fall back to loading from localStorage
      const storedUser = getStoredUser();
      const storedPermissions = getStoredPermissions();
      if (storedUser) {
        setUser(storedUser as UserWithPermissions);
        const perms = storedPermissions || (storedUser as any).permissions;
        setPermissions(perms || null);
      }
    }
  };

  // New page-based permission methods
  const canViewPageMethod = (pageId: string): boolean => {
    return canViewPage(pageId, user, permissions);
  };

  const canEditOnPageMethod = (pageId: string): boolean => {
    return canEditOnPage(pageId, user, permissions);
  };

  const getAccessiblePagesMethod = (): PagePermission[] => {
    return getAccessiblePages(user, permissions);
  };

  const getEditablePagesMethod = (): PagePermission[] => {
    return getEditablePages(user, permissions);
  };

  const getNavigationPagesMethod = (): PagePermission[] => {
    const navPages = getNavigationPages();
    // Filter by what user can access
    return navPages.filter(page => canViewPage(page.id, user, permissions));
  };

  const value: PermissionsContextType = {
    user,
    permissions,
    isLoading,
    isSuperAdmin,
    isAdmin,
    isAdminOrAbove,
    canViewAllClients,
    canManageAllClients,
    canViewAllPayments,
    canManageAllPayments,
    canViewAllInstallments,
    canManageAllInstallments,
    canViewIntegrations,
    canManageIntegrations,
    canAccessStaffPage,
    canAccessCheckInPage,
    canViewPage: canViewPageMethod,
    canEditOnPage: canEditOnPageMethod,
    getAccessiblePages: getAccessiblePagesMethod,
    getEditablePages: getEditablePagesMethod,
    getNavigationPages: getNavigationPagesMethod,
    refreshPermissions,
  };

  return (
    <PermissionsContext.Provider value={value}>
      {children}
    </PermissionsContext.Provider>
  );
}

export function usePermissions(): PermissionsContextType {
  const context = useContext(PermissionsContext);
  if (context === undefined) {
    throw new Error("usePermissions must be used within a PermissionsProvider");
  }
  return context;
}
