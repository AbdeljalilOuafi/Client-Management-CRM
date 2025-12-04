/**
 * Check-In Forms API Service
 * Handles all API calls for check-in forms management
 */

import { apiFetch } from "./apiClient";

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
  
  return apiFetch(url, { method: "GET" });
}

/**
 * Get a single check-in form by ID
 */
export async function getCheckInForm(formId: string): Promise<CheckInForm> {
  return apiFetch(`${API_BASE_URL}/api/checkin-forms/${formId}/`, { method: "GET" });
}

/**
 * Create a new check-in form
 */
export async function createCheckInForm(data: CreateCheckInFormData): Promise<CheckInForm> {
  return apiFetch(`${API_BASE_URL}/api/checkin-forms/`, {
    method: "POST",
    body: JSON.stringify(data),
  });
}

/**
 * Update an existing check-in form
 */
export async function updateCheckInForm(
  formId: string,
  data: UpdateCheckInFormData
): Promise<CheckInForm> {
  return apiFetch(`${API_BASE_URL}/api/checkin-forms/${formId}/`, {
    method: "PATCH",
    body: JSON.stringify(data),
  });
}

/**
 * Delete a check-in form
 */
export async function deleteCheckInForm(formId: string): Promise<void> {
  await apiFetch(`${API_BASE_URL}/api/checkin-forms/${formId}/`, { method: "DELETE" });
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
