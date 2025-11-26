/**
 * Packages API Service
 * Handles API calls for package management
 */

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || "https://backend.onsync-test.xyz";

export interface Package {
  id: number;
  package_name: string;
  description?: string;
  is_active?: boolean;
  created_at?: string;
  updated_at?: string;
}

/**
 * Get auth token from localStorage
 */
function getAuthToken(): string | null {
  if (typeof window !== "undefined") {
    return localStorage.getItem("auth_token");
  }
  return null;
}

/**
 * Build headers for API requests
 */
function getHeaders(): HeadersInit {
  const token = getAuthToken();
  return {
    "Content-Type": "application/json",
    ...(token && { Authorization: `Token ${token}` }),
  };
}

/**
 * List all packages
 */
export async function listPackages(): Promise<Package[]> {
  const response = await fetch(`${API_BASE_URL}/api/packages/`, {
    method: "GET",
    headers: getHeaders(),
  });

  if (!response.ok) {
    const error = await response.json().catch(() => ({ detail: "Failed to fetch packages" }));
    throw new Error(error.detail || error.message || "Failed to fetch packages");
  }

  const data = await response.json();
  
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
  const response = await fetch(`${API_BASE_URL}/api/packages/${packageId}/`, {
    method: "GET",
    headers: getHeaders(),
  });

  if (!response.ok) {
    const error = await response.json().catch(() => ({ detail: "Failed to fetch package" }));
    throw new Error(error.detail || error.message || "Failed to fetch package");
  }

  return response.json();
}

/**
 * Create a new package
 */
export async function createPackage(packageData: {
  package_name: string;
  description?: string;
}): Promise<Package> {
  // Get account ID from localStorage
  const userDataString = typeof window !== "undefined" ? localStorage.getItem("user") : null;
  const userData = userDataString ? JSON.parse(userDataString) : null;
  const accountId = userData?.account_id;

  console.log('[createPackage] User data:', userData);
  console.log('[createPackage] Account ID:', accountId);

  if (!accountId) {
    throw new Error("Account ID not found. Please log in again.");
  }

  const payload = {
    ...packageData,
    account: accountId,
  };

  console.log('[createPackage] Final payload:', JSON.stringify(payload, null, 2));
  
  const response = await fetch(`${API_BASE_URL}/api/packages/`, {
    method: "POST",
    headers: getHeaders(),
    body: JSON.stringify(payload),
  });

  if (!response.ok) {
    const errorData = await response.json().catch(() => ({ detail: "Failed to create package" }));
    console.error('[createPackage] Error response:', errorData);
    console.error('[createPackage] Response status:', response.status);
    
    // Extract detailed error message
    let errorMessage = "Failed to create package";
    
    if (response.status === 500) {
      errorMessage = "Server error: The backend encountered an issue while creating the package. Please contact support or check the backend logs.";
    } else if (errorData.detail) {
      errorMessage = errorData.detail;
    } else if (errorData.package_name) {
      errorMessage = `Package name: ${errorData.package_name[0]}`;
    } else if (errorData.description) {
      errorMessage = `Description: ${errorData.description[0]}`;
    } else if (errorData.account) {
      errorMessage = `Account: ${errorData.account[0]}`;
    } else if (typeof errorData === 'object') {
      errorMessage = JSON.stringify(errorData);
    }
    
    throw new Error(errorMessage);
  }

  return response.json();
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
  }>
): Promise<Package> {
  const response = await fetch(`${API_BASE_URL}/api/packages/${packageId}/`, {
    method: "PATCH",
    headers: getHeaders(),
    body: JSON.stringify(packageData),
  });

  if (!response.ok) {
    const error = await response.json().catch(() => ({ detail: "Failed to update package" }));
    throw new Error(error.detail || error.message || "Failed to update package");
  }

  return response.json();
}

/**
 * Delete a package
 */
export async function deletePackage(packageId: number): Promise<void> {
  const response = await fetch(`${API_BASE_URL}/api/packages/${packageId}/`, {
    method: "DELETE",
    headers: getHeaders(),
  });

  if (!response.ok) {
    const error = await response.json().catch(() => ({ detail: "Failed to delete package" }));
    throw new Error(error.detail || error.message || "Failed to delete package");
  }
}
