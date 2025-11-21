import { EmployeeWithPermissions, UserRole, PermissionString } from "@/lib/types/permissions";

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
  app_access?: {
    onsync: boolean;
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

// Get auth token from localStorage
const getAuthToken = (): string | null => {
  if (typeof window !== "undefined") {
    return localStorage.getItem("auth_token");
  }
  return null;
};

// Get headers with auth token
const getHeaders = (): HeadersInit => {
  const token = getAuthToken();
  return {
    "Content-Type": "application/json",
    ...(token && { Authorization: `Token ${token}` }),
  };
};

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
  
  const response = await fetch(url, {
    method: "GET",
    headers: getHeaders(),
  });

  if (!response.ok) {
    throw new Error(`Failed to fetch employees: ${response.statusText}`);
  }

  const data = await response.json();
  
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

// Get a single employee by ID
export const getEmployee = async (id: number): Promise<Employee> => {
  const response = await fetch(`${API_BASE_URL}/employees/${id}/`, {
    method: "GET",
    headers: getHeaders(),
  });

  if (!response.ok) {
    throw new Error(`Failed to fetch employee: ${response.statusText}`);
  }

  return response.json();
};

// Create a new employee
export const createEmployee = async (employeeData: any): Promise<Employee> => {
  console.log("[API createEmployee] Sending data:", employeeData);
  
  const response = await fetch(`${API_BASE_URL}/employees/`, {
    method: "POST",
    headers: getHeaders(),
    body: JSON.stringify(employeeData),
  });

  if (!response.ok) {
    const errorData = await response.json();
    console.error("[API createEmployee] Error:", errorData);
    throw new Error(JSON.stringify(errorData));
  }

  const result = await response.json();
  console.log("[API createEmployee] Response:", result);
  return result;
};

// Update an employee
export const updateEmployee = async (id: number, employeeData: Partial<Employee>): Promise<Employee> => {
  const response = await fetch(`${API_BASE_URL}/employees/${id}/`, {
    method: "PATCH",
    headers: getHeaders(),
    body: JSON.stringify(employeeData),
  });

  if (!response.ok) {
    const errorData = await response.json();
    throw new Error(JSON.stringify(errorData));
  }

  return response.json();
};

// Delete an employee
export const deleteEmployee = async (id: number): Promise<void> => {
  const response = await fetch(`${API_BASE_URL}/employees/${id}/`, {
    method: "DELETE",
    headers: getHeaders(),
  });

  if (!response.ok) {
    throw new Error(`Failed to delete employee: ${response.statusText}`);
  }
};

// Update employee permissions
export const updateEmployeePermissions = async (
  id: number, 
  permissions: PermissionString[]
): Promise<{ message: string }> => {
  const payload = { permissions };
  const headers = getHeaders();
  
  console.log("[API] ========== UPDATE PERMISSIONS REQUEST ==========");
  console.log("[API] Employee ID:", id);
  console.log("[API] Request URL:", `${API_BASE_URL}/employees/${id}/update_permissions/`);
  console.log("[API] Request Method: POST");
  console.log("[API] Request Headers:", headers);
  console.log("[API] Request payload:", JSON.stringify(payload, null, 2));
  console.log("[API] Permissions array:", permissions);
  console.log("[API] Raw body string:", JSON.stringify(payload));
  
  const response = await fetch(`${API_BASE_URL}/employees/${id}/update_permissions/`, {
    method: "POST",
    headers: headers,
    body: JSON.stringify(payload),
  });

  console.log("[API] Response status:", response.status, response.statusText);
  console.log("[API] Response headers:", Object.fromEntries(response.headers.entries()));

  if (!response.ok) {
    const errorData = await response.json();
    console.error("[API] Permission update failed:", errorData);
    throw new Error(JSON.stringify(errorData));
  }

  const result = await response.json();
  console.log("[API] Permission update SUCCESS:", result);
  return result;
};

// Change employee password
export const changeEmployeePassword = async (id: number, oldPassword: string, newPassword: string): Promise<{ message: string }> => {
  const response = await fetch(`${API_BASE_URL}/employees/${id}/change_password/`, {
    method: "POST",
    headers: getHeaders(),
    body: JSON.stringify({ old_password: oldPassword, new_password: newPassword }),
  });

  if (!response.ok) {
    const errorData = await response.json();
    throw new Error(JSON.stringify(errorData));
  }

  return response.json();
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
  
  const response = await fetch(url, {
    method: "GET",
    headers: getHeaders(),
  });

  if (!response.ok) {
    throw new Error(`Failed to fetch employee roles: ${response.statusText}`);
  }

  return response.json();
};

// Get a single employee role by ID
export const getEmployeeRole = async (id: string): Promise<EmployeeRole> => {
  const response = await fetch(`${API_BASE_URL}/employee-roles/${id}/`, {
    method: "GET",
    headers: getHeaders(),
  });

  if (!response.ok) {
    throw new Error(`Failed to fetch employee role: ${response.statusText}`);
  }

  return response.json();
};

// Create a new employee role
export const createEmployeeRole = async (roleData: {
  name: string;
  description?: string;
  color?: string;
  is_active?: boolean;
}): Promise<EmployeeRole> => {
  const response = await fetch(`${API_BASE_URL}/employee-roles/`, {
    method: "POST",
    headers: getHeaders(),
    body: JSON.stringify(roleData),
  });

  if (!response.ok) {
    const errorData = await response.json();
    throw new Error(JSON.stringify(errorData));
  }

  return response.json();
};

// Update an employee role (partial update)
export const updateEmployeeRole = async (id: string, roleData: Partial<{
  name: string;
  description: string;
  color: string;
  is_active: boolean;
}>): Promise<EmployeeRole> => {
  const response = await fetch(`${API_BASE_URL}/employee-roles/${id}/`, {
    method: "PATCH",
    headers: getHeaders(),
    body: JSON.stringify(roleData),
  });

  if (!response.ok) {
    const errorData = await response.json();
    throw new Error(JSON.stringify(errorData));
  }

  return response.json();
};

// Delete an employee role
export const deleteEmployeeRole = async (id: string): Promise<void> => {
  const response = await fetch(`${API_BASE_URL}/employee-roles/${id}/`, {
    method: "DELETE",
    headers: getHeaders(),
  });

  if (!response.ok) {
    const errorData = await response.json();
    throw new Error(JSON.stringify(errorData));
  }
};

// Get employees with a specific role
export const getEmployeesWithRole = async (roleId: string): Promise<Employee[]> => {
  const response = await fetch(`${API_BASE_URL}/employee-roles/${roleId}/employees/`, {
    method: "GET",
    headers: getHeaders(),
  });

  if (!response.ok) {
    throw new Error(`Failed to fetch employees with role: ${response.statusText}`);
  }

  return response.json();
};
