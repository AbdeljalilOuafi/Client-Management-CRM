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

// Get auth token from localStorage
const getAuthToken = (): string | null => {
  if (typeof window !== "undefined") {
    return localStorage.getItem("auth_token");
  }
  return null;
};

// Get headers with auth token
const getHeaders = (): HeadersInit => {
  const token = getAuthToken();
  return {
    "Content-Type": "application/json",
    ...(token && { Authorization: `Token ${token}` }),
  };
};

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
  
  const response = await fetch(url, {
    method: "GET",
    headers: getHeaders(),
  });

  if (!response.ok) {
    throw new Error(`Failed to fetch instalments: ${response.statusText}`);
  }

  return response.json();
};

// Get a single instalment by ID
export const getInstalment = async (id: number): Promise<Instalment> => {
  const response = await fetch(`${API_BASE_URL}/installments/${id}/`, {
    method: "GET",
    headers: getHeaders(),
  });

  if (!response.ok) {
    throw new Error(`Failed to fetch instalment: ${response.statusText}`);
  }

  return response.json();
};

// Create a new instalment
export const createInstalment = async (instalmentData: Partial<Instalment>): Promise<Instalment> => {
  const response = await fetch(`${API_BASE_URL}/installments/`, {
    method: "POST",
    headers: getHeaders(),
    body: JSON.stringify(instalmentData),
  });

  if (!response.ok) {
    const errorData = await response.json();
    throw new Error(JSON.stringify(errorData));
  }

  return response.json();
};

// Update an instalment
export const updateInstalment = async (id: number, instalmentData: Partial<Instalment>): Promise<Instalment> => {
  const response = await fetch(`${API_BASE_URL}/installments/${id}/`, {
    method: "PATCH",
    headers: getHeaders(),
    body: JSON.stringify(instalmentData),
  });

  if (!response.ok) {
    const errorData = await response.json();
    throw new Error(JSON.stringify(errorData));
  }

  return response.json();
};

// Delete an instalment
export const deleteInstalment = async (id: number): Promise<void> => {
  const response = await fetch(`${API_BASE_URL}/installments/${id}/`, {
    method: "DELETE",
    headers: getHeaders(),
  });

  if (!response.ok) {
    throw new Error(`Failed to delete instalment: ${response.statusText}`);
  }
};
