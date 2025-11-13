const API_BASE_URL = "https://backend.onsync-test.xyz/api";

export interface LoginCredentials {
  email: string;
  password: string;
}

export interface LoginResponse {
  token: string;
  user: {
    id: number;
    email: string;
    name: string;
    role: string;
    account_id: number;
    account_name: string;
  };
}

export interface User {
  id: number;
  email: string;
  name: string;
  role: string;
  account_id: number;
  account_name: string;
}

export interface SignupData {
  account: {
    name: string;
    email: string;
    ceo_name: string;
    niche?: string;
    location?: string;
    website_url?: string;
    timezone?: string;
  };
  user: {
    name: string;
    email: string;
    password: string;
    phone_number?: string;
    job_role?: string;
  };
}

export interface SignupResponse {
  message: string;
  token: string;
  account: {
    id: number;
    name: string;
    email: string;
  };
  user: {
    id: number;
    email: string;
    name: string;
    role: string;
  };
}

// Signup
export const signup = async (signupData: SignupData): Promise<SignupResponse> => {
  const response = await fetch(`${API_BASE_URL}/auth/signup/`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify(signupData),
  });

  if (!response.ok) {
    const errorData = await response.json();
    throw new Error(errorData.error || "Signup failed");
  }

  const data = await response.json();
  
  // Store token and account info in localStorage
  if (typeof window !== "undefined") {
    localStorage.setItem("auth_token", data.token);
    localStorage.setItem("accountId", data.account.id.toString());
    localStorage.setItem("user", JSON.stringify({
      id: data.user.id,
      email: data.user.email,
      name: data.user.name,
      role: data.user.role,
      account_id: data.account.id,
      account_name: data.account.name,
    }));
  }

  return data;
};

// Login
export const login = async (credentials: LoginCredentials): Promise<LoginResponse> => {
  try {
    const response = await fetch(`${API_BASE_URL}/auth/login/`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(credentials),
    });

    if (!response.ok) {
      let errorMessage = "Login failed";
      try {
        const errorData = await response.json();
        errorMessage = errorData.error || errorData.detail || errorData.message || `Login failed (${response.status})`;
      } catch {
        errorMessage = `Login failed with status ${response.status}`;
      }
      throw new Error(errorMessage);
    }

    const data = await response.json();
    
    // Store token and account info in localStorage
    if (typeof window !== "undefined") {
      localStorage.setItem("auth_token", data.token);
      localStorage.setItem("accountId", data.user.account_id.toString());
      localStorage.setItem("user", JSON.stringify(data.user));
    }

    return data;
  } catch (error) {
    if (error instanceof Error) {
      throw error;
    }
    throw new Error("Network error: Unable to connect to the server");
  }
};

// Logout
export const logout = async (): Promise<void> => {
  const token = typeof window !== "undefined" ? localStorage.getItem("auth_token") : null;

  if (token) {
    try {
      await fetch(`${API_BASE_URL}/auth/logout/`, {
        method: "POST",
        headers: {
          Authorization: `Token ${token}`,
        },
      });
    } catch (error) {
      console.error("Logout error:", error);
    }
  }

  // Clear local storage
  if (typeof window !== "undefined") {
    localStorage.removeItem("auth_token");
    localStorage.removeItem("accountId");
    localStorage.removeItem("user");
  }
};

// Get current user
export const getCurrentUser = async (): Promise<User> => {
  const token = typeof window !== "undefined" ? localStorage.getItem("auth_token") : null;

  if (!token) {
    throw new Error("No authentication token found");
  }

  const response = await fetch(`${API_BASE_URL}/auth/me/`, {
    method: "GET",
    headers: {
      Authorization: `Token ${token}`,
    },
  });

  if (!response.ok) {
    throw new Error("Failed to fetch current user");
  }

  return response.json();
};

// Check if user is authenticated
export const isAuthenticated = (): boolean => {
  if (typeof window !== "undefined") {
    return !!localStorage.getItem("auth_token");
  }
  return false;
};

// Get stored user
export const getStoredUser = (): User | null => {
  if (typeof window !== "undefined") {
    const userStr = localStorage.getItem("user");
    if (userStr) {
      try {
        return JSON.parse(userStr);
      } catch {
        return null;
      }
    }
  }
  return null;
};

// Get stored account ID
export const getAccountId = (): number | null => {
  if (typeof window !== "undefined") {
    const accountId = localStorage.getItem("accountId");
    if (accountId) {
      const parsed = parseInt(accountId, 10);
      return isNaN(parsed) ? null : parsed;
    }
  }
  return null;
};
