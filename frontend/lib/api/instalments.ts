import { apiFetch } from "./apiClient";

const API_BASE_URL = "https://backend.onsync-test.xyz/api";

export interface Instalment {
  id: number;
  account: number;
  account_name: string;
  client: number;
  client_name: string;
  invoice_id?: string | null;
  stripe_customer_id?: string | null;
  stripe_account?: string | null;
  amount: string;
  currency: string;
  status: "open" | "paid" | "failed" | "closed";
  instalment_number?: number | null;
  schedule_date: string;
  date_created: string;
  date_updated: string;
}

export interface InstalmentsResponse {
  count: number;
  next: string | null;
  previous: string | null;
  results: Instalment[];
}

// List all instalments with optional filters
export const listInstalments = async (params?: {
  status?: string;
  client?: number;
  page?: number;
  page_size?: number;
}): Promise<InstalmentsResponse> => {
  const queryParams = new URLSearchParams();
  
  if (params?.status && params.status !== "all") {
    queryParams.append("status", params.status);
  }
  if (params?.client) {
    queryParams.append("client", params.client.toString());
  }
  if (params?.page) {
    queryParams.append("page", params.page.toString());
  }
  if (params?.page_size) {
    queryParams.append("page_size", params.page_size.toString());
  }

  const url = `${API_BASE_URL}/installments/${queryParams.toString() ? `?${queryParams.toString()}` : ""}`;
  
  return apiFetch(url, { method: "GET" });
};

// Get a single instalment by ID
export const getInstalment = async (id: number): Promise<Instalment> => {
  return apiFetch(`${API_BASE_URL}/installments/${id}/`, { method: "GET" });
};

// Create a new instalment
export const createInstalment = async (instalmentData: Partial<Instalment>): Promise<Instalment> => {
  return apiFetch(`${API_BASE_URL}/installments/`, {
    method: "POST",
    body: JSON.stringify(instalmentData),
  });
};

// Update an instalment
export const updateInstalment = async (id: number, instalmentData: Partial<Instalment>): Promise<Instalment> => {
  return apiFetch(`${API_BASE_URL}/installments/${id}/`, {
    method: "PATCH",
    body: JSON.stringify(instalmentData),
  });
};

// Delete an instalment
export const deleteInstalment = async (id: number): Promise<void> => {
  await apiFetch(`${API_BASE_URL}/installments/${id}/`, { method: "DELETE" });
};
