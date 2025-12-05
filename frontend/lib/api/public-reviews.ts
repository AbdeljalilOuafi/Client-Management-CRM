/**
 * Public Reviews API Service
 * No authentication required - uses UUID from reviews link
 */

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || "https://backend.onsync-test.xyz";

export interface ReviewsField {
  id: string;
  type: "text" | "number" | "select" | "textarea" | "checkbox" | "radio" | "date" | "rating";
  label: string;
  required: boolean;
  options?: string[];
  placeholder?: string;
  min?: number;
  max?: number;
}

export interface PublicReviewsData {
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
      fields: ReviewsField[];
    };
  };
  package: {
    package_name: string;
  };
}

export interface SubmitReviewsData {
  submission_data: Record<string, any>;
}

export interface SubmitReviewsResponse {
  status: "success";
  submission_id: string;
  submitted_at: string;
}

/**
 * Get reviews form data by UUID (public endpoint - no auth required)
 */
export async function getPublicReviewsForm(reviewsUuid: string): Promise<PublicReviewsData> {
  const response = await fetch(`${API_BASE_URL}/api/public/reviews/${reviewsUuid}/`, {
    method: "GET",
    headers: {
      "Content-Type": "application/json",
    },
  });

  if (!response.ok) {
    const error = await response.json().catch(() => ({ error: "Failed to load reviews form" }));
    throw new Error(error.error || error.detail || "Failed to load reviews form");
  }

  return response.json();
}

/**
 * Submit reviews form (public endpoint - no auth required)
 */
export async function submitPublicReviews(
  reviewsUuid: string,
  submissionData: Record<string, any>
): Promise<SubmitReviewsResponse> {
  const response = await fetch(`${API_BASE_URL}/api/public/reviews/${reviewsUuid}/submit/`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      submission_data: submissionData,
    }),
  });

  if (!response.ok) {
    const error = await response.json().catch(() => ({ error: "Failed to submit review" }));
    throw new Error(error.error || error.detail || "Failed to submit review");
  }

  return response.json();
}

