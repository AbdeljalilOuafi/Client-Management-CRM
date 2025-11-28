/**
 * Permission System Types
 * Based on backend API documentation
 */

export type UserRole = 
  | "super_admin" 
  | "admin" 
  | "employee" 
  | "coach" 
  | "closer" 
  | "setter";

export interface Permissions {
  can_view_all_clients: boolean;
  can_manage_all_clients: boolean;
  can_view_all_payments: boolean;
  can_manage_all_payments: boolean;
  can_view_all_installments: boolean;
  can_manage_all_installments: boolean;
  can_view_integrations: boolean;
  can_manage_integrations: boolean;
}

export interface UserWithPermissions {
  id: number;
  email: string;
  name: string;
  role: UserRole;
  account_id: number;
  account_name: string;
  permissions: Permissions;
}

export interface EmployeeWithPermissions {
  id: number;
  account: number;
  account_name: string;
  name: string;
  email: string;
  role: UserRole;
  job_role?: string | null;
  status: string;
  is_active: boolean;
  phone_number?: string | null;
  can_view_all_clients: boolean;
  can_manage_all_clients: boolean;
  can_view_all_payments: boolean;
  can_manage_all_payments: boolean;
  can_view_all_installments: boolean;
  can_manage_all_installments: boolean;
  can_view_integrations: boolean;
  can_manage_integrations: boolean;
}

// Permission string types for API calls
export type PermissionString = 
  | "view_all_clients"
  | "manage_all_clients"
  | "view_all_payments"
  | "manage_all_payments"
  | "view_all_installments"
  | "manage_all_installments"
  | "view_integrations"
  | "manage_integrations";

// Page access configuration
export interface PageAccess {
  path: string;
  label: string;
  requiredRole?: UserRole[];
  requiredPermission?: keyof Permissions;
  customCheck?: (user: UserWithPermissions) => boolean;
}

// Permission check results
export interface PermissionCheckResult {
  allowed: boolean;
  reason?: string;
}
