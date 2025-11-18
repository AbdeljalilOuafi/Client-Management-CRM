import { EmployeeWithPermissions, UserRole, PermissionString } from "@/lib/types/permissions";

const API_BASE_URL = "https://backend.onsync-test.xyz/api";

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

  return response.json();
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
export const createEmployee = async (employeeData: {
  name: string;
  email: string;
  password: string;
  role: string;
  job_role?: string;
  phone_number?: string;
  status?: string;
  is_active?: boolean;
}): Promise<Employee> => {
  const response = await fetch(`${API_BASE_URL}/employees/`, {
    method: "POST",
    headers: getHeaders(),
    body: JSON.stringify(employeeData),
  });

  if (!response.ok) {
    const errorData = await response.json();
    throw new Error(JSON.stringify(errorData));
  }

  return response.json();
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
  const response = await fetch(`${API_BASE_URL}/employees/${id}/update_permissions/`, {
    method: "POST",
    headers: getHeaders(),
    body: JSON.stringify({ permissions }),
  });

  if (!response.ok) {
    const errorData = await response.json();
    throw new Error(JSON.stringify(errorData));
  }

  return response.json();
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
