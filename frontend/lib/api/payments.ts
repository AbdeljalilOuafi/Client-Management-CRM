import { apiFetch } from "./apiClient";

const API_BASE_URL = "https://backend.onsync-test.xyz/api";

export interface Payment {
  id: string;
  amount: number;
  paid_currency?: string; // Renamed from 'currency'
  company_currency_amount?: number; // New field for company currency amount
  exchange_rate?: number;
  native_account_currency?: string;
  account_currency?: string; // TODO: Backend - Add this field if not present
  payment_method?: string; // Account/Payment Method
  status: "paid" | "failed" | "refunded" | "disputed" | "incomplete";
  failure_reason?: string;
  payment_date: string;
  client_id?: number;
  client_name?: string;
  client_email?: string;
}

export interface PaymentsResponse {
  count: number;
  next: string | null;
  previous: string | null;
  results: Payment[];
}

export interface PaymentStatistics {
  total_payments: number;
  total_amount: number;
  paid: number;
  failed: number;
  refunded: number;
  disputed: number;
}

// List all payments with optional filters
export const listPayments = async (params?: {
  status?: string;
  client?: number;
  search?: string;
  page?: number;
  page_size?: number;
}): Promise<PaymentsResponse> => {
  const queryParams = new URLSearchParams();
  
  if (params?.status && params.status !== "all") {
    queryParams.append("status", params.status);
  }
  if (params?.client) {
    queryParams.append("client", params.client.toString());
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

  const url = `${API_BASE_URL}/payments/${queryParams.toString() ? `?${queryParams.toString()}` : ""}`;
  
  return apiFetch(url, { method: "GET" });
};

// Get payment statistics
export const getPaymentStatistics = async (): Promise<PaymentStatistics> => {
  return apiFetch(`${API_BASE_URL}/payments/statistics/`, { method: "GET" });
};

// Get a single payment by ID
export const getPayment = async (id: number): Promise<Payment> => {
  return apiFetch(`${API_BASE_URL}/payments/${id}/`, { method: "GET" });
};

// Create a new payment
export const createPayment = async (paymentData: Partial<Payment>): Promise<Payment> => {
  return apiFetch(`${API_BASE_URL}/payments/`, {
    method: "POST",
    body: JSON.stringify(paymentData),
  });
};

// Update a payment
export const updatePayment = async (id: number, paymentData: Partial<Payment>): Promise<Payment> => {
  return apiFetch(`${API_BASE_URL}/payments/${id}/`, {
    method: "PATCH",
    body: JSON.stringify(paymentData),
  });
};
