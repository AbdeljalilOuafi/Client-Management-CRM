/**
 * Check-In Forms API Service
 * Handles all API calls for check-in forms management
 */

import { apiFetch } from "./apiClient";

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || "https://backend.onsync-test.xyz";

// Form type options - matches backend FORM_TYPE_CHOICES
export type FormType = "checkins" | "onboarding" | "reviews";

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

// Schedule for check-in forms (day-based)
export interface CheckInSchedule {
  id: string;
  schedule_type: "SAME_DAY" | "INDIVIDUAL_DAYS";
  schedule_day?: string;
  schedule_time: string;
  timezone: string;
  is_active: boolean;
}

// Schedule for reviews forms (interval-based)
export interface ReviewsSchedule {
  id: string;
  interval_type: "weekly" | "monthly";
  interval_count: number;
  time: string;
  timezone: string;
  is_active: boolean;
  last_triggered_at?: string | null;
  webhook_job_ids?: number[];
  created_at?: string;
  updated_at?: string;
}

// Schedule data for creating check-in forms
export interface CheckinScheduleInput {
  schedule_type: "SAME_DAY" | "INDIVIDUAL_DAYS";
  day_of_week?: string;
  time: string;
  timezone: string;
  is_active: boolean;
}

// Schedule data for creating reviews forms
export interface ReviewsScheduleInput {
  interval_type: "weekly" | "monthly";
  interval_count: number;
  time: string;
  timezone: string;
}

export interface CheckInForm {
  id: string;
  title: string;
  description: string | null;
  form_type: FormType;
  form_type_display: string;
  package: number | null;
  package_name: string | null;
  form_schema: CheckInFormSchema;
  is_active: boolean;
  created_at: string;
  updated_at: string;
  schedule?: CheckInSchedule | ReviewsSchedule;
  submission_count?: number;
}

export interface CreateCheckInFormData {
  title: string;
  form_type: FormType;
  package?: number | null;
  description?: string;
  form_schema?: CheckInFormSchema;
  is_active?: boolean;
  schedule_data?: CheckinScheduleInput | ReviewsScheduleInput;
}

export interface UpdateCheckInFormData {
  title?: string;
  description?: string;
  package?: number | null;
  form_schema?: CheckInFormSchema;
  is_active?: boolean;
}

export interface PaginatedResponse<T> {
  count: number;
  next: string | null;
  previous: string | null;
  results: T[];
}

// Parameters for listing forms
export interface ListFormsParams {
  package?: number;
  form_type?: FormType;
  is_active?: boolean;
  search?: string;
  ordering?: string;
  page?: number;
  page_size?: number;
}

/**
 * List all check-in forms with optional filters
 */
export async function listCheckInForms(params?: ListFormsParams): Promise<PaginatedResponse<CheckInForm>> {
  const queryParams = new URLSearchParams();
  
  if (params) {
    if (params.package !== undefined) queryParams.append("package", params.package.toString());
    if (params.form_type) queryParams.append("form_type", params.form_type);
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
  
  // Build schedule_data based on form type
  let scheduleData: CheckinScheduleInput | ReviewsScheduleInput | undefined;
  
  if (originalForm.form_type === "reviews" && originalForm.schedule) {
    const reviewsSchedule = originalForm.schedule as ReviewsSchedule;
    scheduleData = {
      interval_type: reviewsSchedule.interval_type || "monthly",
      interval_count: reviewsSchedule.interval_count || 1,
      time: reviewsSchedule.time || "09:00:00",
      timezone: reviewsSchedule.timezone || "UTC",
    };
  } else if (originalForm.form_type === "checkins" && originalForm.schedule) {
    const checkinSchedule = originalForm.schedule as CheckInSchedule;
    scheduleData = {
      schedule_type: checkinSchedule.schedule_type || "SAME_DAY",
      day_of_week: checkinSchedule.schedule_day,
      time: checkinSchedule.schedule_time || "09:00:00",
      timezone: checkinSchedule.timezone || "UTC",
      is_active: false,
    };
  }
  // Onboarding forms don't have schedules
  
  // Create new form with same data but new title
  const newFormData: CreateCheckInFormData = {
    title: `${originalForm.title} (Copy)`,
    form_type: originalForm.form_type,
    package: originalForm.package,
    description: originalForm.description || undefined,
    form_schema: originalForm.form_schema,
    is_active: false, // Start as inactive
    ...(scheduleData && { schedule_data: scheduleData }),
  };

  return createCheckInForm(newFormData);
}
