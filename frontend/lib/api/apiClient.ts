// Centralized API client with authentication handling

// Get auth token from localStorage
export const getAuthToken = (): string | null => {
  if (typeof window !== "undefined") {
    return localStorage.getItem("auth_token");
  }
  return null;
};

// Get headers with auth token
export const getHeaders = (): HeadersInit => {
  const token = getAuthToken();
  return {
    "Content-Type": "application/json",
    ...(token && { Authorization: `Token ${token}` }),
  };
};

// Handle API response with automatic 401 handling
export const handleApiResponse = async (response: Response) => {
  if (response.status === 401) {
    // Clear auth data
    if (typeof window !== "undefined") {
      localStorage.removeItem("auth_token");
      localStorage.removeItem("accountId");
      localStorage.removeItem("user");
      
      // Redirect to login
      window.location.href = "/login";
    }
    throw new Error("Unauthorized - Please log in again");
  }

  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(errorText || `Request failed with status ${response.status}`);
  }

  // Handle empty responses (204 No Content, or empty body)
  if (response.status === 204 || response.headers.get('content-length') === '0') {
    return null;
  }

  // Try to parse JSON, return null if empty
  const text = await response.text();
  return text ? JSON.parse(text) : null;
};

// Fetch wrapper with automatic auth handling
export const apiFetch = async (url: string, options: RequestInit = {}) => {
  const response = await fetch(url, {
    ...options,
    headers: {
      ...getHeaders(),
      ...options.headers,
    },
  });

  return handleApiResponse(response);
};
