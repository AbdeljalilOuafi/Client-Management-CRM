import { apiFetch } from "./apiClient";

const API_BASE_URL = "https://backend.onsync-test.xyz/api";

export interface ClientDetailsResponse {
  client: {
    id: number;
    account: number;
    account_name: string;
    first_name: string;
    last_name: string;
    email: string;
    status: "active" | "inactive" | "paused" | "pending";
    address?: string;
    instagram_handle?: string;
    ghl_id?: string;
    coaching_app_id?: string;
    trz_id?: string;
    client_start_date?: string;
    client_end_date?: string;
    dob?: string;
    country?: string;
    state?: string;
    currency?: string;
    gender?: string;
    lead_origin?: string;
    notice_given?: boolean;
    no_more_payments?: boolean;
    timezone?: string;
    coach?: number;
    coach_name?: string;
    closer?: number;
    closer_name?: string;
    setter?: number;
    setter_name?: string;
  };
  package_info: {
    package_type?: string;
    status?: string;
    start_date?: string;
    end_date?: string;
    minimum_term?: number;
    review_type?: string;
    payment_schedule?: string;
    payments_left?: number;
  };
  payment_info: {
    payment_method?: string;
    payment_amount?: number;
    latest_payment_amount?: number;
    latest_payment_date?: string;
    next_payment_date?: string;
    ltv?: number;
    currency?: string;
    day_of_month?: number;
    no_more_payments?: boolean;
    number_of_months?: number;
    number_of_months_paid?: number;
  };
}

/**
 * Fetch detailed payment information for a specific client
 * 
 * @param clientId - The ID of the client
 * @returns Promise with client details, package info, and payment info
 */
export const getClientPaymentDetails = async (clientId: number): Promise<ClientDetailsResponse> => {
  return apiFetch(`${API_BASE_URL}/clients/${clientId}/payment-details/`, {
    method: "GET",
  });
};
