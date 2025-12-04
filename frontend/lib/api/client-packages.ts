/**
 * Client Packages API Service
 * Handles API calls for client package management
 */

import { apiFetch } from "./apiClient";

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || "https://backend.onsync-test.xyz";

export interface ClientPackage {
  id: number;
  account: number;
  client: number;
  client_name: string;
  package: number;
  package_name: string;
  status: "pending" | "active" | "inactive";
  start_date?: string;
  end_date?: string;
  created_at: string;
  updated_at: string;
}

export interface CreateClientPackageData {
  client: number;
  package: number;
  status: "pending" | "active" | "inactive";
  start_date?: string;
  end_date?: string | null;
}

export interface UpdateClientPackageData {
  status?: "pending" | "active" | "inactive";
  start_date?: string;
  end_date?: string | null;
}

export interface ClientPackageFilters {
  client?: number;
  status?: "pending" | "active" | "inactive";
  package?: number;
}

/**
 * List all client packages with optional filters
 * GET /api/client-packages/
 */
export async function listClientPackages(
  filters?: ClientPackageFilters
): Promise<ClientPackage[]> {
  const params = new URLSearchParams();
  
  if (filters?.client) {
    params.append("client", filters.client.toString());
  }
  if (filters?.status) {
    params.append("status", filters.status);
  }
  if (filters?.package) {
    params.append("package", filters.package.toString());
  }

  const queryString = params.toString();
  const url = queryString 
    ? `${API_BASE_URL}/api/client-packages/?${queryString}` 
    : `${API_BASE_URL}/api/client-packages/`;
  
  const data = await apiFetch(url, { method: "GET" });
  
  // Handle both paginated response (with results array) and direct array
  if (Array.isArray(data)) {
    return data;
  } else if (data.results && Array.isArray(data.results)) {
    return data.results;
  } else {
    return [];
  }
}

/**
 * Get a specific client package by ID
 * GET /api/client-packages/{id}/
 */
export async function getClientPackage(id: number): Promise<ClientPackage> {
  return apiFetch(`${API_BASE_URL}/api/client-packages/${id}/`, { method: "GET" });
}

/**
 * Create a new client package
 * POST /api/client-packages/
 */
export async function createClientPackage(
  data: CreateClientPackageData
): Promise<ClientPackage> {
  return apiFetch(`${API_BASE_URL}/api/client-packages/`, {
    method: "POST",
    body: JSON.stringify(data),
  });
}

/**
 * Update a client package (partial update)
 * PATCH /api/client-packages/{id}/
 */
export async function updateClientPackage(
  id: number,
  data: UpdateClientPackageData
): Promise<ClientPackage> {
  return apiFetch(`${API_BASE_URL}/api/client-packages/${id}/`, {
    method: "PATCH",
    body: JSON.stringify(data),
  });
}

/**
 * Delete a client package
 * DELETE /api/client-packages/{id}/
 */
export async function deleteClientPackage(id: number): Promise<void> {
  await apiFetch(`${API_BASE_URL}/api/client-packages/${id}/`, { method: "DELETE" });
}

/**
 * Activate a pending client package
 * Convenience function that updates status to "active"
 */
export async function activateClientPackage(id: number): Promise<ClientPackage> {
  return updateClientPackage(id, { status: "active" });
}

/**
 * Deactivate an active client package
 * Convenience function that updates status to "inactive"
 */
export async function deactivateClientPackage(id: number): Promise<ClientPackage> {
  return updateClientPackage(id, { status: "inactive" });
}
