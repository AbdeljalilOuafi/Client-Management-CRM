/**
 * Packages API Service
 * Handles API calls for package management
 */

import { apiFetch } from "./apiClient";

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || "https://backend.onsync-test.xyz";

export interface Package {
  id: number;
  package_name: string;
  description?: string;
  is_active?: boolean;
  checkin_form?: string | null; // UUID of the assigned check-in form
  checkin_form_title?: string; // Title of the assigned check-in form (from backend)
  onboarding_form?: string | null; // UUID of the assigned onboarding form
  onboarding_form_title?: string; // Title of the assigned onboarding form (from backend)
  review_form?: string | null; // UUID of the assigned review form
  review_form_title?: string; // Title of the assigned review form (from backend)
  created_at?: string;
  updated_at?: string;
}

/**
 * List all packages
 */
export async function listPackages(): Promise<Package[]> {
  const data = await apiFetch(`${API_BASE_URL}/api/packages/`, { method: "GET" });
  
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
 * Get a single package by ID
 */
export async function getPackage(packageId: number): Promise<Package> {
  return apiFetch(`${API_BASE_URL}/api/packages/${packageId}/`, { method: "GET" });
}

/**
 * Create a new package
 */
export async function createPackage(packageData: {
  package_name: string;
  description?: string;
  checkin_form?: string | null;
  onboarding_form?: string | null;
  review_form?: string | null;
}): Promise<Package> {
  // Get account ID from localStorage (stored separately during login)
  const accountIdString = typeof window !== "undefined" ? localStorage.getItem("accountId") : null;
  const accountId = accountIdString ? parseInt(accountIdString, 10) : null;

  console.log('[createPackage] Account ID:', accountId);

  if (!accountId || isNaN(accountId)) {
    throw new Error("Account ID not found. Please log in again.");
  }

  const payload = {
    ...packageData,
    account: accountId,
  };

  console.log('[createPackage] Final payload:', JSON.stringify(payload, null, 2));
  
  return apiFetch(`${API_BASE_URL}/api/packages/`, {
    method: "POST",
    body: JSON.stringify(payload),
  });
}

/**
 * Update an existing package
 */
export async function updatePackage(
  packageId: number,
  packageData: Partial<{
    package_name: string;
    description?: string;
    is_active?: boolean;
    checkin_form?: string | null;
    onboarding_form?: string | null;
    review_form?: string | null;
  }>
): Promise<Package> {
  return apiFetch(`${API_BASE_URL}/api/packages/${packageId}/`, {
    method: "PATCH",
    body: JSON.stringify(packageData),
  });
}

/**
 * Delete a package
 */
export async function deletePackage(packageId: number): Promise<void> {
  await apiFetch(`${API_BASE_URL}/api/packages/${packageId}/`, { method: "DELETE" });
}
