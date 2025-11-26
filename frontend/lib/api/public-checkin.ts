/**
 * Public Check-In API Service
 * No authentication required - uses UUID from email link
 */

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || "https://backend.onsync-test.xyz";

export interface CheckInField {
  id: string;
  type: "text" | "number" | "select" | "textarea" | "checkbox" | "radio" | "date";
  label: string;
  required: boolean;
  options?: string[];
  placeholder?: string;
  min?: number;
  max?: number;
}

export interface PublicCheckInData {
  client: {
    first_name: string;
    last_name: string;
    email: string;
  };
  form: {
    id: string;
    title: string;
    description: string;
    form_schema: {
      fields: CheckInField[];
    };
  };
  package: {
    package_name: string;
  };
}

export interface SubmitCheckInData {
  submission_data: Record<string, any>;
}

export interface SubmitCheckInResponse {
  status: string;
  submission_id: string;
  submitted_at: string;
}

/**
 * Get check-in form data by UUID (public endpoint - no auth required)
 */
export async function getPublicCheckInForm(checkinUuid: string): Promise<PublicCheckInData> {
  const response = await fetch(`${API_BASE_URL}/api/public/checkin/${checkinUuid}/`, {
    method: "GET",
    headers: {
      "Content-Type": "application/json",
    },
  });

  if (!response.ok) {
    const error = await response.json().catch(() => ({ error: "Failed to load check-in form" }));
    throw new Error(error.error || error.detail || "Failed to load check-in form");
  }

  return response.json();
}

/**
 * Submit check-in form (public endpoint - no auth required)
 */
export async function submitPublicCheckIn(
  checkinUuid: string,
  submissionData: Record<string, any>
): Promise<SubmitCheckInResponse> {
  const response = await fetch(`${API_BASE_URL}/api/public/checkin/${checkinUuid}/submit/`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      submission_data: submissionData,
    }),
  });

  if (!response.ok) {
    const error = await response.json().catch(() => ({ error: "Failed to submit check-in" }));
    throw new Error(error.error || error.detail || "Failed to submit check-in");
  }

  return response.json();
}
