import { apiFetch } from "./apiClient";

const API_BASE_URL = "https://backend.onsync-test.xyz/api";

export interface Client {
  id: number;
  account_id: number;
  first_name: string;
  last_name: string;
  email: string;
  phone?: string;
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
  coach_id?: number;
  closer_id?: number;
  setter_id?: number;
  timezone?: string;
  package_type?: string;
  payment_method?: string;
  payment_amount?: number;
  latest_payment_amount?: number;
  number_months_paid?: number;
  payment_plan?: string;
  ltv?: number;
  native_currency?: string;
  day_of_month_payment?: number;
  start_date?: string;
  end_date?: string;
  next_payment_date?: string;
  latest_payment_date?: string;
  no_months?: number;
  minimum_term?: number;
  wedding_date?: string;
  coach_name?: string;
  closer?: string;
  setter?: string;
  monthly_calls?: number;
  cta_lead_origin?: string;
  stripe_customer_id?: string;
  mamo_pay_id?: string;
}

export interface ClientsResponse {
  count: number;
  next: string | null;
  previous: string | null;
  results: Client[];
}

export interface ClientStatistics {
  total_clients: number;
  active_clients: number;
  inactive_clients: number;
}


// List all clients with optional filters
export const listClients = async (params?: {
  status?: string;
  search?: string;
  page?: number;
  page_size?: number;
}): Promise<ClientsResponse> => {
  const queryParams = new URLSearchParams();
  
  // Only send status to API if it's a backend-supported value (active/inactive)
  if (params?.status && params.status !== "all" && (params.status === "active" || params.status === "inactive")) {
    queryParams.append("status", params.status);
  }
  // Note: "paused" and "pending" will be filtered client-side in the component
  if (params?.search) {
    queryParams.append("search", params.search);
  }
  if (params?.page) {
    queryParams.append("page", params.page.toString());
  }
  if (params?.page_size) {
    queryParams.append("page_size", params.page_size.toString());
  }

  const url = `${API_BASE_URL}/clients/${queryParams.toString() ? `?${queryParams.toString()}` : ""}`;
  
  return apiFetch(url, { method: "GET" });
};

// Get client statistics
export const getClientStatistics = async (): Promise<ClientStatistics> => {
  return apiFetch(`${API_BASE_URL}/clients/statistics/`, { method: "GET" });
};

// Get a single client by ID
export const getClient = async (id: number): Promise<Client> => {
  return apiFetch(`${API_BASE_URL}/clients/${id}/`, { method: "GET" });
};

// Create a new client
export const createClient = async (clientData: Partial<Client>): Promise<Client> => {
  return apiFetch(`${API_BASE_URL}/clients/`, {
    method: "POST",
    body: JSON.stringify(clientData),
  });
};

// Update a client
export const updateClient = async (id: number, clientData: Partial<Client>): Promise<Client> => {
  return apiFetch(`${API_BASE_URL}/clients/${id}/`, {
    method: "PATCH",
    body: JSON.stringify(clientData),
  });
};

// Get my clients (for employees)
export const getMyClients = async (): Promise<ClientsResponse> => {
  return apiFetch(`${API_BASE_URL}/clients/my_clients/`, { method: "GET" });
};
