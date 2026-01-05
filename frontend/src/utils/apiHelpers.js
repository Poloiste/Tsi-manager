/**
 * API Helper Utilities
 * Provides error handling and logging for API requests
 */

// Development logging flag
const isDev = process.env.NODE_ENV === 'development';

/**
 * Logs API request details in development mode
 * @param {string} method - HTTP method
 * @param {string} url - Request URL
 * @param {object} options - Fetch options
 */
export function logApiRequest(method, url, options = {}) {
  if (isDev) {
    let parsedBody;
    if (options.body) {
      try {
        parsedBody = typeof options.body === 'string' ? JSON.parse(options.body) : options.body;
      } catch (error) {
        parsedBody = options.body; // Keep as string if parsing fails
      }
    }
    
    console.log(`[API Request] ${method} ${url}`, {
      headers: options.headers,
      body: parsedBody,
    });
  }
}

/**
 * Logs API response details in development mode
 * @param {Response} response - Fetch response
 * @param {any} data - Response data
 */
export function logApiResponse(response, data) {
  if (isDev) {
    console.log(`[API Response] ${response.status} ${response.url}`, {
      ok: response.ok,
      contentType: response.headers.get('content-type'),
      data,
    });
  }
}

/**
 * Logs API errors
 * @param {string} context - Error context (function/component name)
 * @param {Error} error - Error object
 * @param {Response} response - Fetch response (optional)
 */
export function logApiError(context, error, response = null) {
  console.error(`[API Error] ${context}:`, {
    message: error.message,
    status: response?.status,
    url: response?.url,
    error,
  });
}

/**
 * Safely parses JSON response with proper error handling
 * Handles cases where response is HTML instead of JSON (e.g., 404 pages)
 * @param {Response} response - Fetch response
 * @returns {Promise<any>} Parsed JSON or error object
 */
export async function safeJsonParse(response) {
  const contentType = response.headers.get('content-type');
  
  // Check if response is JSON
  if (contentType && contentType.includes('application/json')) {
    try {
      return await response.json();
    } catch (error) {
      console.error('[API] Failed to parse JSON response:', error);
      return {
        error: 'Invalid JSON response',
        details: error.message,
      };
    }
  }
  
  // If not JSON, try to get text for better error messages
  try {
    const text = await response.text();
    // Check if it's HTML error page
    if (text.startsWith('<!DOCTYPE') || text.startsWith('<html')) {
      return {
        error: `Server returned HTML instead of JSON (status: ${response.status})`,
        details: 'The API endpoint may not exist or returned an error page',
      };
    }
    return {
      error: `Unexpected response type: ${contentType || 'unknown'}`,
      details: text.substring(0, 200), // Limit text length
    };
  } catch (error) {
    return {
      error: 'Failed to read response',
      details: error.message,
    };
  }
}

/**
 * Handles fetch API errors with proper JSON parsing and logging
 * @param {Response} response - Fetch response
 * @param {string} context - Error context for logging
 * @returns {Promise<never>} Throws an error with appropriate message
 */
export async function handleApiError(response, context = 'API call') {
  let errorData;
  
  try {
    errorData = await safeJsonParse(response);
  } catch (error) {
    logApiError(context, error, response);
    throw new Error(`HTTP error! status: ${response.status}`);
  }
  
  const errorMessage = errorData.error || errorData.message || `HTTP error! status: ${response.status}`;
  const error = new Error(errorMessage);
  
  logApiError(context, error, response);
  throw error;
}

/**
 * Enhanced fetch wrapper with logging and error handling
 * @param {string} url - Request URL
 * @param {object} options - Fetch options
 * @param {string} context - Context for logging
 * @returns {Promise<Response>} Fetch response
 */
export async function fetchWithLogging(url, options = {}, context = 'API call') {
  const method = options.method || 'GET';
  
  // Log request
  logApiRequest(method, url, options);
  
  try {
    const response = await fetch(url, options);
    return response;
  } catch (error) {
    logApiError(context, error);
    throw error;
  }
}

/**
 * Fetches JSON data with proper error handling and logging
 * @param {string} url - Request URL
 * @param {object} options - Fetch options
 * @param {string} context - Context for logging
 * @returns {Promise<any>} Parsed JSON data
 */
export async function fetchJson(url, options = {}, context = 'API call') {
  const response = await fetchWithLogging(url, options, context);
  
  if (!response.ok) {
    await handleApiError(response, context);
  }
  
  const data = await safeJsonParse(response);
  
  // Check if safeJsonParse returned an error object
  if (data && data.error) {
    const error = new Error(data.error);
    if (data.details) {
      error.details = data.details;
    }
    logApiError(context, error, response);
    throw error;
  }
  
  logApiResponse(response, data);
  
  return data;
}
