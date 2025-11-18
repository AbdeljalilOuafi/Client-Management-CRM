/**
 * Page Permissions Configuration
 * 
 * This file defines all pages in the application and their permission requirements.
 * When adding a new page, simply add an entry here with the required permissions.
 */

import { UserRole } from "@/lib/types/permissions";

export interface PagePermission {
  /** Unique identifier for the page */
  id: string;
  /** Display name of the page */
  name: string;
  /** Route path */
  path: string;
  /** Icon name (from lucide-react) */
  icon: string;
  /** Description of what the page does */
  description?: string;
  /** Roles that can VIEW this page (if empty, all authenticated users can view) */
  viewRoles?: UserRole[];
  /** Roles that can EDIT/MANAGE on this page (if empty, all authenticated users can edit) */
  editRoles?: UserRole[];
  /** Specific permission flags required to VIEW (any match grants access) */
  viewPermissions?: string[];
  /** Specific permission flags required to EDIT (any match grants access) */
  editPermissions?: string[];
  /** Custom check function for complex permission logic */
  customViewCheck?: (user: any, permissions: any) => boolean;
  /** Custom check function for edit permissions */
  customEditCheck?: (user: any, permissions: any) => boolean;
  /** Whether this page should appear in navigation */
  showInNav?: boolean;
  /** Order in navigation (lower numbers appear first) */
  navOrder?: number;
  /** Parent page ID (for nested navigation) */
  parentId?: string;
}

/**
 * CENTRALIZED PAGE PERMISSIONS CONFIGURATION
 * 
 * Add new pages here with their permission requirements.
 * The system will automatically handle routing, navigation, and access control.
 */
export const PAGE_PERMISSIONS: PagePermission[] = [
  // ==================== DASHBOARD ====================
  {
    id: "dashboard",
    name: "Dashboard",
    path: "/dashboard",
    icon: "LayoutDashboard",
    description: "Overview and analytics",
    showInNav: true,
    navOrder: 1,
    // All authenticated users can view and edit dashboard
  },

  // ==================== CLIENTS ====================
  {
    id: "clients",
    name: "Clients",
    path: "/clients",
    icon: "Users",
    description: "Manage client information",
    showInNav: true,
    navOrder: 2,
    // All users can view clients page (but may only see assigned clients)
    // Edit requires manage permission
    editPermissions: ["can_manage_all_clients"],
  },

  // ==================== PAYMENTS ====================
  {
    id: "payments",
    name: "Payments",
    path: "/payments",
    icon: "CreditCard",
    description: "Track and manage payments",
    showInNav: true,
    navOrder: 3,
    // All users can view payments page
    // Edit requires manage permission
    editPermissions: ["can_manage_all_payments"],
  },

  // ==================== INSTALLMENTS ====================
  {
    id: "instalments",
    name: "Instalments",
    path: "/instalments",
    icon: "DollarSign",
    description: "Manage payment installments",
    showInNav: true,
    navOrder: 4,
    // All users can view instalments page
    // Edit requires manage permission
    editPermissions: ["can_manage_all_installments"],
  },

  // ==================== STAFF MANAGEMENT ====================
  {
    id: "staff",
    name: "Staff",
    path: "/staff",
    icon: "Users",
    description: "Manage team members and permissions",
    showInNav: true,
    navOrder: 5,
    // Only admin and super_admin can view
    viewRoles: ["admin", "super_admin"],
    // Only admin and super_admin can edit
    editRoles: ["admin", "super_admin"],
  },

  // ==================== CHECK-IN FORMS ====================
  {
    id: "check-in-forms",
    name: "Check-in Forms",
    path: "/check-in-forms",
    icon: "FileText",
    description: "Manage client check-in forms",
    showInNav: true,
    navOrder: 6,
    // Only super_admin can view
    viewRoles: ["super_admin"],
    // Only super_admin can edit
    editRoles: ["super_admin"],
  },

  // ==================== PROFILE ====================
  {
    id: "profile",
    name: "Profile",
    path: "/profile",
    icon: "User",
    description: "User profile and settings",
    showInNav: false, // Hidden from nav - accessible via UserProfileMenu at bottom of sidebar
    navOrder: 10,
    // All authenticated users can view and edit their own profile
  },

  // ==================== EXAMPLE: REPORTS (Future Page) ====================
  // Uncomment and customize when adding this page
  // {
  //   id: "reports",
  //   name: "Reports",
  //   path: "/reports",
  //   icon: "BarChart",
  //   description: "View analytics and reports",
  //   showInNav: true,
  //   navOrder: 7,
  //   // Only users with view_all permissions can see reports
  //   customViewCheck: (user, permissions) => {
  //     return permissions?.can_view_all_clients || 
  //            permissions?.can_view_all_payments || 
  //            user?.role === "admin" || 
  //            user?.role === "super_admin";
  //   },
  //   // Only admins can export/edit reports
  //   editRoles: ["admin", "super_admin"],
  // },

  // ==================== EXAMPLE: SETTINGS (Future Page) ====================
  // {
  //   id: "settings",
  //   name: "Settings",
  //   path: "/settings",
  //   icon: "Settings",
  //   description: "Application settings",
  //   showInNav: true,
  //   navOrder: 11,
  //   viewRoles: ["super_admin"],
  //   editRoles: ["super_admin"],
  // },
];

/**
 * Get page permission configuration by ID
 */
export function getPagePermission(pageId: string): PagePermission | undefined {
  return PAGE_PERMISSIONS.find(p => p.id === pageId);
}

/**
 * Get page permission configuration by path
 */
export function getPagePermissionByPath(path: string): PagePermission | undefined {
  return PAGE_PERMISSIONS.find(p => p.path === path);
}

/**
 * Get all pages that should appear in navigation
 */
export function getNavigationPages(): PagePermission[] {
  return PAGE_PERMISSIONS
    .filter(p => p.showInNav)
    .sort((a, b) => (a.navOrder || 999) - (b.navOrder || 999));
}

/**
 * Check if user can VIEW a specific page
 */
export function canViewPage(
  pageId: string,
  user: any,
  permissions: any
): boolean {
  const page = getPagePermission(pageId);
  if (!page) return false;

  // Custom check takes precedence
  if (page.customViewCheck) {
    return page.customViewCheck(user, permissions);
  }

  // Check role-based access
  if (page.viewRoles && page.viewRoles.length > 0) {
    if (!user?.role || !page.viewRoles.includes(user.role)) {
      return false;
    }
  }

  // Check permission-based access
  if (page.viewPermissions && page.viewPermissions.length > 0) {
    const hasPermission = page.viewPermissions.some(
      perm => permissions?.[perm] === true
    );
    if (!hasPermission) {
      return false;
    }
  }

  // If no restrictions, allow view
  return true;
}

/**
 * Check if user can EDIT on a specific page
 */
export function canEditOnPage(
  pageId: string,
  user: any,
  permissions: any
): boolean {
  const page = getPagePermission(pageId);
  if (!page) return false;

  // Must be able to view first
  if (!canViewPage(pageId, user, permissions)) {
    return false;
  }

  // Custom check takes precedence
  if (page.customEditCheck) {
    return page.customEditCheck(user, permissions);
  }

  // Check role-based edit access
  if (page.editRoles && page.editRoles.length > 0) {
    if (!user?.role || !page.editRoles.includes(user.role)) {
      return false;
    }
  }

  // Check permission-based edit access
  if (page.editPermissions && page.editPermissions.length > 0) {
    const hasPermission = page.editPermissions.some(
      perm => permissions?.[perm] === true
    );
    if (!hasPermission) {
      return false;
    }
  }

  // If no edit restrictions, allow edit (same as view)
  return true;
}

/**
 * Get all pages accessible to a user
 */
export function getAccessiblePages(user: any, permissions: any): PagePermission[] {
  return PAGE_PERMISSIONS.filter(page => 
    canViewPage(page.id, user, permissions)
  );
}

/**
 * Get all pages where user can edit
 */
export function getEditablePages(user: any, permissions: any): PagePermission[] {
  return PAGE_PERMISSIONS.filter(page => 
    canEditOnPage(page.id, user, permissions)
  );
}
