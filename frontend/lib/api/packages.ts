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
  
  console.log('[listPackages] Raw API response:', data);
  
  // Handle both paginated response (with results array) and direct array
  let packages: Package[];
  if (Array.isArray(data)) {
    packages = data;
  } else if (data.results && Array.isArray(data.results)) {
    packages = data.results;
  } else {
    packages = [];
  }
  
  // Log the first package to see its structure
  if (packages.length > 0) {
    console.log('[listPackages] First package structure:', JSON.stringify(packages[0], null, 2));
    console.log('[listPackages] Available fields:', Object.keys(packages[0]));
  }
  
  return packages;
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
  const url = `${API_BASE_URL}/api/packages/${packageId}/`;
  console.log('[updatePackage] URL:', url);
  console.log('[updatePackage] Package ID:', packageId);
  console.log('[updatePackage] Data being sent:', JSON.stringify(packageData, null, 2));
  
  const result = await apiFetch(url, {
    method: "PATCH",
    body: JSON.stringify(packageData),
  });
  
  console.log('[updatePackage] Response:', result);
  return result;
}

/**
 * Delete a package
 */
export async function deletePackage(packageId: number): Promise<void> {
  await apiFetch(`${API_BASE_URL}/api/packages/${packageId}/`, { method: "DELETE" });
}
