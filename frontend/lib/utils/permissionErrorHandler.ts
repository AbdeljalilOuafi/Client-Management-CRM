/**
 * Permission Error Handler
 * Handles 403 and 404 errors from the API with user-friendly messages
 */

export interface ApiError {
  status: number;
  message: string;
  detail?: string;
}

export function handlePermissionError(error: any): string {
  // Handle fetch errors
  if (error instanceof Response) {
    if (error.status === 403) {
      return "You don't have permission to perform this action. Please contact your administrator.";
    }
    if (error.status === 404) {
      return "Resource not found or you don't have access to it.";
    }
    if (error.status === 401) {
      return "Your session has expired. Please log in again.";
    }
  }

  // Handle error objects
  if (error && typeof error === "object") {
    if (error.status === 403) {
      return error.detail || error.message || "You don't have permission to perform this action.";
    }
    if (error.status === 404) {
      return error.detail || error.message || "Resource not found or you don't have access to it.";
    }
    if (error.status === 401) {
      return "Your session has expired. Please log in again.";
    }
  }

  // Handle error messages
  if (typeof error === "string") {
    if (error.includes("403") || error.toLowerCase().includes("forbidden")) {
      return "You don't have permission to perform this action.";
    }
    if (error.includes("404") || error.toLowerCase().includes("not found")) {
      return "Resource not found or you don't have access to it.";
    }
    if (error.includes("401") || error.toLowerCase().includes("unauthorized")) {
      return "Your session has expired. Please log in again.";
    }
  }

  // Default error message
  return error?.message || error?.detail || "An error occurred. Please try again.";
}

export function isPermissionError(error: any): boolean {
  if (error instanceof Response) {
    return error.status === 403 || error.status === 404;
  }
  if (error && typeof error === "object") {
    return error.status === 403 || error.status === 404;
  }
  if (typeof error === "string") {
    return error.includes("403") || error.includes("404") || 
           error.toLowerCase().includes("forbidden") || 
           error.toLowerCase().includes("not found");
  }
  return false;
}

export function isAuthError(error: any): boolean {
  if (error instanceof Response) {
    return error.status === 401;
  }
  if (error && typeof error === "object") {
    return error.status === 401;
  }
  if (typeof error === "string") {
    return error.includes("401") || error.toLowerCase().includes("unauthorized");
  }
  return false;
}
