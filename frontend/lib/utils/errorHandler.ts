/**
 * Parse and clean error messages
 * Handles HTML error responses, API errors, and network errors
 */
export function parseErrorMessage(error: unknown): string {
  // If it's a string, check if it contains HTML
  if (typeof error === 'string') {
    return cleanHtmlError(error);
  }

  // If it's an Error object
  if (error instanceof Error) {
    return cleanHtmlError(error.message);
  }

  // If it's an object with a message property
  if (error && typeof error === 'object' && 'message' in error) {
    return cleanHtmlError(String(error.message));
  }

  // Default fallback
  return 'An unexpected error occurred. Please try again.';
}

/**
 * Clean HTML tags from error messages and extract meaningful content
 */
function cleanHtmlError(message: string): string {
  // Check if the message contains HTML
  if (message.includes('<') && message.includes('>')) {
    // Try to extract the error title from common patterns
    const titleMatch = message.match(/<title>(.*?)<\/title>/i);
    if (titleMatch && titleMatch[1]) {
      const title = titleMatch[1].trim();
      
      // Parse common error patterns
      if (title.includes('Server Error (500)')) {
        return 'Server error occurred. Please try again later or contact support.';
      }
      if (title.includes('404')) {
        return 'The requested resource was not found.';
      }
      if (title.includes('403')) {
        return 'Access denied. You do not have permission to perform this action.';
      }
      if (title.includes('401')) {
        return 'Authentication required. Please log in again.';
      }
      
      // Return the cleaned title
      return title.replace(/\s*\(\d+\)\s*$/, ''); // Remove error codes like (500)
    }

    // Try to extract error from h1 tags
    const h1Match = message.match(/<h1>(.*?)<\/h1>/i);
    if (h1Match && h1Match[1]) {
      return h1Match[1].trim();
    }

    // If no specific pattern found, strip all HTML tags
    const stripped = message.replace(/<[^>]*>/g, ' ').replace(/\s+/g, ' ').trim();
    
    // If the stripped message is too long or empty, return a generic message
    if (!stripped || stripped.length > 200) {
      return 'A server error occurred. Please try again later.';
    }
    
    return stripped;
  }

  // Return the message as-is if it doesn't contain HTML
  return message || 'An error occurred. Please try again.';
}

/**
 * Get user-friendly error message based on error type
 */
export function getUserFriendlyError(error: unknown, context?: string): string {
  const baseMessage = parseErrorMessage(error);
  
  // Add context if provided
  if (context) {
    return `${context}: ${baseMessage}`;
  }
  
  return baseMessage;
}

/**
 * Check if error is a network error
 */
export function isNetworkError(error: unknown): boolean {
  if (error instanceof Error) {
    return (
      error.message.includes('fetch') ||
      error.message.includes('network') ||
      error.message.includes('NetworkError') ||
      error.message.includes('Failed to fetch')
    );
  }
  return false;
}

/**
 * Get error message for toast notifications
 */
export function getToastErrorMessage(error: unknown, defaultMessage?: string): {
  title: string;
  description: string;
} {
  const message = parseErrorMessage(error);
  
  // Check for specific error types
  if (isNetworkError(error)) {
    return {
      title: 'Connection Error',
      description: 'Unable to connect to the server. Please check your internet connection.',
    };
  }

  // Check for authentication errors
  if (message.toLowerCase().includes('authentication') || message.toLowerCase().includes('unauthorized')) {
    return {
      title: 'Authentication Error',
      description: 'Your session has expired. Please log in again.',
    };
  }

  // Check for permission errors
  if (message.toLowerCase().includes('permission') || message.toLowerCase().includes('forbidden')) {
    return {
      title: 'Permission Denied',
      description: 'You do not have permission to perform this action.',
    };
  }

  // Default error
  return {
    title: 'Error',
    description: message || defaultMessage || 'An unexpected error occurred.',
  };
}
