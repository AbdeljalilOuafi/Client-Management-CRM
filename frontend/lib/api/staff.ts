import { EmployeeWithPermissions, UserRole, PermissionString } from "@/lib/types/permissions";
import { apiFetch } from "./apiClient";

const API_BASE_URL = "https://backend.onsync-test.xyz/api";

export interface EmployeeRole {
  id: string;
  name: string;
  description?: string;
  color: string;
  is_active: boolean;
  employee_count: number;
  created_at: string;
  updated_at: string;
}

export interface EmployeeRolesResponse {
  count: number;
  next: string | null;
  previous: string | null;
  results: EmployeeRole[];
}

export interface Employee {
  id: number;
  name: string;
  first_name?: string; // New field for separate first name
  last_name?: string; // New field for separate last name
  email: string;
  phone_number?: string | null;
  role: UserRole;
  job_role?: string | null;
  status?: string;
  is_active: boolean;
  account?: number;
  account_name?: string;
  can_view_all_clients?: boolean;
  can_manage_all_clients?: boolean;
  can_view_all_payments?: boolean;
  can_manage_all_payments?: boolean;
  can_view_all_installments?: boolean;
  can_manage_all_installments?: boolean;
  can_view_integrations?: boolean;
  can_manage_integrations?: boolean;
  app_access?: {
    fithq: boolean;
    gohighlevel: boolean;
  };
  gohighlevel_permissions?: string[];
  start_date?: string | null;
  end_date?: string | null;
  custom_roles?: string[];
  custom_role_names?: string[];
  custom_role_colors?: string[];
  display_role?: string;
  created_at?: string;
  updated_at?: string;
}

// Re-export for convenience
export type { EmployeeWithPermissions };

export interface EmployeesResponse {
  count: number;
  next: string | null;
  previous: string | null;
  results: Employee[];
}

export interface EmployeeStatistics {
  total_employees: number;
  active_employees: number;
  inactive_employees: number;
}

// List all employees with optional filters
export const listEmployees = async (params?: {
  status?: string;
  role?: string;
  search?: string;
  page?: number;
  page_size?: number;
}): Promise<EmployeesResponse> => {
  const queryParams = new URLSearchParams();
  
  if (params?.status && params.status !== "all") {
    queryParams.append("status", params.status);
  }
  if (params?.role && params.role !== "all") {
    queryParams.append("role", params.role);
  }
  if (params?.search) {
    queryParams.append("search", params.search);
  }
  if (params?.page) {
    queryParams.append("page", params.page.toString());
  }
  if (params?.page_size) {
    queryParams.append("page_size", params.page_size.toString());
  }

  const url = `${API_BASE_URL}/employees/${queryParams.toString() ? `?${queryParams.toString()}` : ""}`;
  
  const data = await apiFetch(url, { method: "GET" });
  
  // Log the first employee to check if permissions and app_access are included
  if (data.results && data.results.length > 0) {
    console.log("[API listEmployees] Sample employee data:", {
      id: data.results[0].id,
      name: data.results[0].name,
      can_view_all_clients: data.results[0].can_view_all_clients,
      can_manage_all_clients: data.results[0].can_manage_all_clients,
      app_access: data.results[0].app_access,
      hasPermissionFields: 'can_view_all_clients' in data.results[0],
      hasAppAccess: 'app_access' in data.results[0],
    });
  }
  
  return data;
};

// Get employee statistics
export const getEmployeeStatistics = async (): Promise<EmployeeStatistics> => {
  return apiFetch(`${API_BASE_URL}/employees/statistics/`, { method: "GET" });
};

// Get all active coaches (employees with "coach" in role or custom roles)
export const listCoaches = async (): Promise<Employee[]> => {
  const response = await listEmployees({ status: "active" });
  return response.results.filter(emp => {
    const roleMatch = emp.role?.toLowerCase().includes("coach");
    const customRoleMatch = emp.custom_role_names?.some(role => 
      role.toLowerCase().includes("coach")
    );
    return roleMatch || customRoleMatch;
  });
};

// Get all active closers (employees with "closer" in role or custom roles)
export const listClosers = async (): Promise<Employee[]> => {
  const response = await listEmployees({ status: "active" });
  return response.results.filter(emp => {
    const roleMatch = emp.role?.toLowerCase().includes("closer");
    const customRoleMatch = emp.custom_role_names?.some(role => 
      role.toLowerCase().includes("closer")
    );
    return roleMatch || customRoleMatch;
  });
};

// Get all active setters (employees with "setter" in role or custom roles)
export const listSetters = async (): Promise<Employee[]> => {
  const response = await listEmployees({ status: "active" });
  return response.results.filter(emp => {
    const roleMatch = emp.role?.toLowerCase().includes("setter");
    const customRoleMatch = emp.custom_role_names?.some(role => 
      role.toLowerCase().includes("setter")
    );
    return roleMatch || customRoleMatch;
  });
};

// Get a single employee by ID
export const getEmployee = async (id: number): Promise<Employee> => {
  return apiFetch(`${API_BASE_URL}/employees/${id}/`, { method: "GET" });
};

// Create a new employee
export const createEmployee = async (employeeData: any): Promise<Employee> => {
  console.log("[API createEmployee] Sending data:", employeeData);
  
  const result = await apiFetch(`${API_BASE_URL}/employees/`, {
    method: "POST",
    body: JSON.stringify(employeeData),
  });

  console.log("[API createEmployee] Response:", result);
  return result;
};

// Update an employee
export const updateEmployee = async (id: number, employeeData: Partial<Employee>): Promise<Employee> => {
  return apiFetch(`${API_BASE_URL}/employees/${id}/`, {
    method: "PATCH",
    body: JSON.stringify(employeeData),
  });
};

// Delete an employee
export const deleteEmployee = async (id: number): Promise<void> => {
  await apiFetch(`${API_BASE_URL}/employees/${id}/`, { method: "DELETE" });
};

// Update employee permissions
export const updateEmployeePermissions = async (
  id: number, 
  permissions: PermissionString[]
): Promise<{ message: string }> => {
  const payload = { permissions };
  
  console.log("[API] ========== UPDATE PERMISSIONS REQUEST ==========");
  console.log("[API] Employee ID:", id);
  console.log("[API] Request URL:", `${API_BASE_URL}/employees/${id}/update_permissions/`);
  console.log("[API] Request Method: POST");
  console.log("[API] Request payload:", JSON.stringify(payload, null, 2));
  console.log("[API] Permissions array:", permissions);
  console.log("[API] Raw body string:", JSON.stringify(payload));
  
  const result = await apiFetch(`${API_BASE_URL}/employees/${id}/update_permissions/`, {
    method: "POST",
    body: JSON.stringify(payload),
  });

  console.log("[API] Permission update SUCCESS:", result);
  return result;
};

// Change employee password
export const changeEmployeePassword = async (id: number, oldPassword: string, newPassword: string): Promise<{ message: string }> => {
  return apiFetch(`${API_BASE_URL}/employees/${id}/change_password/`, {
    method: "POST",
    body: JSON.stringify({ old_password: oldPassword, new_password: newPassword }),
  });
};

// ==================== EMPLOYEE ROLES API ====================

// List all employee roles with optional filters
export const listEmployeeRoles = async (params?: {
  is_active?: boolean;
  search?: string;
  ordering?: string;
  page?: number;
  page_size?: number;
}): Promise<EmployeeRolesResponse> => {
  const queryParams = new URLSearchParams();
  
  if (params?.is_active !== undefined) {
    queryParams.append("is_active", params.is_active.toString());
  }
  if (params?.search) {
    queryParams.append("search", params.search);
  }
  if (params?.ordering) {
    queryParams.append("ordering", params.ordering);
  }
  if (params?.page) {
    queryParams.append("page", params.page.toString());
  }
  if (params?.page_size) {
    queryParams.append("page_size", params.page_size.toString());
  }

  const url = `${API_BASE_URL}/employee-roles/${queryParams.toString() ? `?${queryParams.toString()}` : ""}`;
  
  return apiFetch(url, { method: "GET" });
};

// Get a single employee role by ID
export const getEmployeeRole = async (id: string): Promise<EmployeeRole> => {
  return apiFetch(`${API_BASE_URL}/employee-roles/${id}/`, { method: "GET" });
};

// Create a new employee role
export const createEmployeeRole = async (roleData: {
  name: string;
  description?: string;
  color?: string;
  is_active?: boolean;
}): Promise<EmployeeRole> => {
  return apiFetch(`${API_BASE_URL}/employee-roles/`, {
    method: "POST",
    body: JSON.stringify(roleData),
  });
};

// Update an employee role (partial update)
export const updateEmployeeRole = async (id: string, roleData: Partial<{
  name: string;
  description: string;
  color: string;
  is_active: boolean;
}>): Promise<EmployeeRole> => {
  return apiFetch(`${API_BASE_URL}/employee-roles/${id}/`, {
    method: "PATCH",
    body: JSON.stringify(roleData),
  });
};

// Delete an employee role
export const deleteEmployeeRole = async (id: string): Promise<void> => {
  await apiFetch(`${API_BASE_URL}/employee-roles/${id}/`, { method: "DELETE" });
};

// Get employees with a specific role
export const getEmployeesWithRole = async (roleId: string): Promise<Employee[]> => {
  return apiFetch(`${API_BASE_URL}/employee-roles/${roleId}/employees/`, { method: "GET" });
};
