/**
 * Check-In Forms API Service
 * Handles all API calls for check-in forms management
 */

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || "https://backend.onsync-test.xyz";

// Types based on API documentation
export interface CheckInFormField {
  id: string;
  type: "text" | "number" | "select" | "textarea" | "checkbox" | "radio" | "date";
  label: string;
  required: boolean;
  options?: string[];
  placeholder?: string;
  min?: number;
  max?: number;
}

export interface CheckInFormSchema {
  fields: CheckInFormField[];
}

export interface CheckInSchedule {
  id: string;
  schedule_type: "SAME_DAY" | "INDIVIDUAL_DAYS";
  schedule_day?: string;
  schedule_time: string;
  timezone: string;
  is_active: boolean;
}

export interface CheckInForm {
  id: string;
  title: string;
  description: string | null;
  form_type?: "onboarding" | "checkins" | "reviews";
  package: number;
  package_name: string;
  form_schema: CheckInFormSchema;
  is_active: boolean;
  created_at: string;
  updated_at: string;
  schedule?: CheckInSchedule;
}

export interface CreateCheckInFormData {
  package?: number;
  title: string;
  description?: string;
  form_type?: "onboarding" | "checkins" | "reviews";
  form_schema?: CheckInFormSchema;
  is_active?: boolean;
  schedule_data?: {
    schedule_type: "SAME_DAY" | "INDIVIDUAL_DAYS";
    day_of_week?: string;
    time: string;
    timezone: string;
    is_active: boolean;
  };
}

export interface UpdateCheckInFormData {
  title?: string;
  description?: string;
  form_schema?: CheckInFormSchema;
  is_active?: boolean;
}

export interface PaginatedResponse<T> {
  count: number;
  next: string | null;
  previous: string | null;
  results: T[];
}

/**
 * Get auth token from localStorage
 */
function getAuthToken(): string | null {
  if (typeof window !== "undefined") {
    return localStorage.getItem("auth_token");
  }
  return null;
}

/**
 * Build headers for API requests
 */
function getHeaders(): HeadersInit {
  const token = getAuthToken();
  return {
    "Content-Type": "application/json",
    ...(token && { Authorization: `Token ${token}` }),
  };
}

/**
 * List all check-in forms with optional filters
 */
export async function listCheckInForms(params?: {
  package?: number;
  is_active?: boolean;
  search?: string;
  ordering?: string;
  page?: number;
  page_size?: number;
}): Promise<PaginatedResponse<CheckInForm>> {
  const queryParams = new URLSearchParams();
  
  if (params) {
    if (params.package !== undefined) queryParams.append("package", params.package.toString());
    if (params.is_active !== undefined) queryParams.append("is_active", params.is_active.toString());
    if (params.search) queryParams.append("search", params.search);
    if (params.ordering) queryParams.append("ordering", params.ordering);
    if (params.page) queryParams.append("page", params.page.toString());
    if (params.page_size) queryParams.append("page_size", params.page_size.toString());
  }

  const url = `${API_BASE_URL}/api/checkin-forms/${queryParams.toString() ? `?${queryParams.toString()}` : ""}`;
  
  const response = await fetch(url, {
    method: "GET",
    headers: getHeaders(),
  });

  if (!response.ok) {
    const error = await response.json().catch(() => ({ detail: "Failed to fetch forms" }));
    throw new Error(error.detail || error.message || "Failed to fetch forms");
  }

  return response.json();
}

/**
 * Get a single check-in form by ID
 */
export async function getCheckInForm(formId: string): Promise<CheckInForm> {
  const response = await fetch(`${API_BASE_URL}/api/checkin-forms/${formId}/`, {
    method: "GET",
    headers: getHeaders(),
  });

  if (!response.ok) {
    const error = await response.json().catch(() => ({ detail: "Failed to fetch form" }));
    throw new Error(error.detail || error.message || "Failed to fetch form");
  }

  return response.json();
}

/**
 * Create a new check-in form
 */
export async function createCheckInForm(data: CreateCheckInFormData): Promise<CheckInForm> {
  const response = await fetch(`${API_BASE_URL}/api/checkin-forms/`, {
    method: "POST",
    headers: getHeaders(),
    body: JSON.stringify(data),
  });

  if (!response.ok) {
    const error = await response.json().catch(() => ({ detail: "Failed to create form" }));
    console.error("Backend error response:", error);
    throw new Error(JSON.stringify(error) || "Failed to create form");
  }

  return response.json();
}

/**
 * Update an existing check-in form
 */
export async function updateCheckInForm(
  formId: string,
  data: UpdateCheckInFormData
): Promise<CheckInForm> {
  const response = await fetch(`${API_BASE_URL}/api/checkin-forms/${formId}/`, {
    method: "PATCH",
    headers: getHeaders(),
    body: JSON.stringify(data),
  });

  if (!response.ok) {
    const error = await response.json().catch(() => ({ detail: "Failed to update form" }));
    throw new Error(error.detail || error.message || "Failed to update form");
  }

  return response.json();
}

/**
 * Delete a check-in form
 */
export async function deleteCheckInForm(formId: string): Promise<void> {
  const response = await fetch(`${API_BASE_URL}/api/checkin-forms/${formId}/`, {
    method: "DELETE",
    headers: getHeaders(),
  });

  if (!response.ok) {
    const error = await response.json().catch(() => ({ detail: "Failed to delete form" }));
    throw new Error(error.detail || error.message || "Failed to delete form");
  }
}

/**
 * Toggle form active status
 */
export async function toggleFormStatus(formId: string, isActive: boolean): Promise<CheckInForm> {
  return updateCheckInForm(formId, { is_active: isActive });
}

/**
 * Duplicate a form
 */
export async function duplicateCheckInForm(formId: string): Promise<CheckInForm> {
  // First get the form
  const originalForm = await getCheckInForm(formId);
  
  // Create new form with same data but new title
  const newFormData: CreateCheckInFormData = {
    package: originalForm.package,
    title: `${originalForm.title} (Copy)`,
    description: originalForm.description || undefined,
    form_schema: originalForm.form_schema,
    is_active: false, // Start as inactive
    schedule_data: {
      schedule_type: originalForm.schedule?.schedule_type || "SAME_DAY",
      day_of_week: originalForm.schedule?.schedule_day,
      time: originalForm.schedule?.schedule_time || "09:00:00",
      timezone: originalForm.schedule?.timezone || "UTC",
      is_active: false,
    },
  };

  return createCheckInForm(newFormData);
}
