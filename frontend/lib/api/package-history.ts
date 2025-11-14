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

/**
 * Fetch package history for a specific client
 * 
 * TODO: Update this function when the backend endpoint is ready
 * Expected endpoint: GET /api/clients/{clientId}/package-history/
 * 
 * @param clientId - The ID of the client
 * @returns Promise with array of package history items
 */
export const getClientPackageHistory = async (clientId: number): Promise<PackageHistoryItem[]> => {
  // TODO: Uncomment when backend endpoint is ready
  // return apiFetch(`${API_BASE_URL}/clients/${clientId}/package-history/`, {
  //   method: "GET",
  // });

  // Mock data for demonstration - Remove when backend is ready
  return new Promise((resolve) => {
    setTimeout(() => {
      resolve([
        {
          id: 1,
          package_name: "Premium Package",
          payment_method: "PIF",
          payment_amount: 2500.0,
          currency: "USD",
          start_date: "2024-01-15",
          end_date: "2024-06-15",
          status: "completed",
          created_at: "2024-01-15T10:00:00Z",
        },
        {
          id: 2,
          package_name: "Standard Package",
          payment_method: "Subscription",
          payment_amount: 500.0,
          currency: "USD",
          start_date: "2023-06-01",
          end_date: "2023-12-31",
          status: "completed",
          created_at: "2023-06-01T10:00:00Z",
        },
      ]);
    }, 500);
  });
};
