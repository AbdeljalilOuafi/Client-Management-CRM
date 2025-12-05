/**
 * Public Onboarding API Service
 * No authentication required - uses UUID from onboarding link
 */

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || "https://backend.onsync-test.xyz";

export interface OnboardingField {
  id: string;
  type: "text" | "number" | "select" | "textarea" | "checkbox" | "radio" | "date";
  label: string;
  required: boolean;
  options?: string[];
  placeholder?: string;
  min?: number;
  max?: number;
}

export interface PublicOnboardingData {
  client: {
    first_name: string;
    last_name: string | null;
    email: string;
  };
  form: {
    id: string;
    title: string;
    description: string;
    form_schema: {
      fields: OnboardingField[];
    };
  };
  package: {
    package_name: string;
  };
}

export interface SubmitOnboardingData {
  submission_data: Record<string, any>;
}

export interface SubmitOnboardingResponse {
  status: "success";
  submission_id: string;
  submitted_at: string;
}

/**
 * Get onboarding form data by UUID (public endpoint - no auth required)
 */
export async function getPublicOnboardingForm(onboardingUuid: string): Promise<PublicOnboardingData> {
  const url = `${API_BASE_URL}/api/public/onboarding/${onboardingUuid}/`;
  console.log("[Public Onboarding] Fetching form from:", url);
  
  const response = await fetch(url, {
    method: "GET",
    headers: {
      "Content-Type": "application/json",
    },
  });

  console.log("[Public Onboarding] Response status:", response.status);

  if (!response.ok) {
    const error = await response.json().catch(() => ({ error: "Failed to load onboarding form" }));
    console.error("[Public Onboarding] Error:", error);
    throw new Error(error.error || error.detail || "Failed to load onboarding form");
  }

  return response.json();
}

/**
 * Submit onboarding form (public endpoint - no auth required)
 */
export async function submitPublicOnboarding(
  onboardingUuid: string,
  submissionData: Record<string, any>
): Promise<SubmitOnboardingResponse> {
  const url = `${API_BASE_URL}/api/public/onboarding/${onboardingUuid}/submit/`;
  console.log("[Public Onboarding] Submitting to:", url);
  
  const response = await fetch(url, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      submission_data: submissionData,
    }),
  });

  console.log("[Public Onboarding] Submit response status:", response.status);

  if (!response.ok) {
    const error = await response.json().catch(() => ({ error: "Failed to submit onboarding form" }));
    console.error("[Public Onboarding] Submit error:", error);
    throw new Error(error.error || error.detail || "Failed to submit onboarding form");
  }

  return response.json();
}

