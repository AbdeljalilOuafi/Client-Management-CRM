const API_BASE_URL = "https://backend.onsync-test.xyz/api";

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
    ...(token && { Authorization: `Token ${token}` }),
  };
};

export interface ImportResult {
  success: boolean;
  message: string;
  imported: number;
  skipped: number;
  errors: Array<{
    row: number;
    error: string;
  }>;
}

/**
 * Export Clients to CSV
 * GET /api/clients/export/
 */
export const exportClients = async (): Promise<void> => {
  try {
    const response = await fetch(`${API_BASE_URL}/clients/export/`, {
      method: "GET",
      headers: getHeaders(),
    });

    if (!response.ok) {
      throw new Error(`Export failed: ${response.statusText}`);
    }

    // Get filename from Content-Disposition header
    const contentDisposition = response.headers.get("Content-Disposition");
    const filename = contentDisposition
      ? contentDisposition.split("filename=")[1].replace(/"/g, "")
      : `clients_${new Date().toISOString().split("T")[0]}.csv`;

    // Create blob and download
    const blob = await response.blob();
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = filename;
    document.body.appendChild(a);
    a.click();
    window.URL.revokeObjectURL(url);
    document.body.removeChild(a);
  } catch (error) {
    console.error("[API] Export clients error:", error);
    throw error;
  }
};

/**
 * Import Clients from CSV
 * POST /api/clients/import/
 */
export const importClients = async (file: File): Promise<ImportResult> => {
  try {
    const formData = new FormData();
    formData.append("file", file);

    const response = await fetch(`${API_BASE_URL}/clients/import/`, {
      method: "POST",
      headers: getHeaders(), // Don't set Content-Type - browser sets it with boundary
      body: formData,
    });

    const result = await response.json();

    if (response.ok) {
      return {
        success: true,
        message: `Imported ${result.imported} clients. ${result.skipped} skipped.`,
        imported: result.imported,
        skipped: result.skipped,
        errors: result.errors || [],
      };
    } else {
      throw new Error(result.error || "Import failed");
    }
  } catch (error) {
    console.error("[API] Import clients error:", error);
    throw error;
  }
};

/**
 * Export Payments to CSV
 * GET /api/payments/export/
 */
export const exportPayments = async (): Promise<void> => {
  try {
    const response = await fetch(`${API_BASE_URL}/payments/export/`, {
      method: "GET",
      headers: getHeaders(),
    });

    if (!response.ok) {
      throw new Error(`Export failed: ${response.statusText}`);
    }

    // Get filename from Content-Disposition header
    const contentDisposition = response.headers.get("Content-Disposition");
    const filename = contentDisposition
      ? contentDisposition.split("filename=")[1].replace(/"/g, "")
      : `payments_${new Date().toISOString().split("T")[0]}.csv`;

    // Create blob and download
    const blob = await response.blob();
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = filename;
    document.body.appendChild(a);
    a.click();
    window.URL.revokeObjectURL(url);
    document.body.removeChild(a);
  } catch (error) {
    console.error("[API] Export payments error:", error);
    throw error;
  }
};

/**
 * Import Payments from CSV
 * POST /api/payments/import/
 */
export const importPayments = async (file: File): Promise<ImportResult> => {
  try {
    const formData = new FormData();
    formData.append("file", file);

    const response = await fetch(`${API_BASE_URL}/payments/import/`, {
      method: "POST",
      headers: getHeaders(), // Don't set Content-Type - browser sets it with boundary
      body: formData,
    });

    const result = await response.json();

    if (response.ok) {
      return {
        success: true,
        message: `Imported ${result.imported} payments. ${result.skipped} skipped.`,
        imported: result.imported,
        skipped: result.skipped,
        errors: result.errors || [],
      };
    } else {
      throw new Error(result.error || "Import failed");
    }
  } catch (error) {
    console.error("[API] Import payments error:", error);
    throw error;
  }
};
