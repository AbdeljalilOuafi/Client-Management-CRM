import { apiFetch } from "./apiClient";

const API_BASE_URL = "https://backend.onsync-test.xyz/api";

export interface PackageHistoryItem {
  id: number;
  package_name: string;
  payment_method: string;
  payment_amount: number;
  currency: string;
  start_date: string;
  end_date?: string;
  status: string;
  created_at: string;
}

export interface PackageHistoryResponse {
  client_id: number;
  client_name: string;
  total_inactive_packages: number;
  earliest_package_start: string | null;
  latest_package_end: string | null;
  packages: PackageHistoryItem[];
}

/**
 * Fetch package history for a specific client
 * 
 * @param clientId - The ID of the client
 * @returns Promise with array of package history items
 */
export const getClientPackageHistory = async (clientId: number): Promise<PackageHistoryItem[]> => {
  const response: PackageHistoryResponse = await apiFetch(`${API_BASE_URL}/clients/${clientId}/package-history/`, {
    method: "GET",
  });
  
  // Extract packages array from response
  return response.packages || [];
};
