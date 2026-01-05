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
 * @returns {Promise<any>} Parsed JSON data
 * @throws {Error} If response is not valid JSON or cannot be parsed
 */
export async function safeJsonParse(response) {
  const contentType = response.headers.get('content-type');
  
  // Check if response is JSON
  if (contentType && contentType.includes('application/json')) {
    try {
      return await response.json();
    } catch (error) {
      console.error('[API] Failed to parse JSON response:', error);
      // Use generic error message to avoid exposing internal details
      throw new Error('Invalid JSON response from server');
    }
  }
  
  // If not JSON, try to get text for better error messages
  const text = await response.text();
  const trimmedText = text.trim().toLowerCase();
  
  // Check if it's HTML error page (case-insensitive, multiple patterns)
  if (trimmedText.startsWith('<!doctype') || 
      trimmedText.startsWith('<html') || 
      trimmedText.startsWith('<head') ||
      trimmedText.startsWith('<body') ||
      trimmedText.includes('<html')) {
    throw new Error(
      `Server returned HTML instead of JSON (status: ${response.status}). ` +
      'The API endpoint may not exist or returned an error page'
    );
  }
  
  // Don't include response preview to avoid exposing sensitive data
  throw new Error(
    `Unexpected response type: ${contentType || 'unknown'} (status: ${response.status}). ` +
    'Expected application/json'
  );
}

/**
 * Handles fetch API errors with proper JSON parsing and logging
 * @param {Response} response - Fetch response
 * @param {string} context - Error context for logging
 * @returns {Promise<never>} Throws an error with appropriate message
 */
export async function handleApiError(response, context = 'API call') {
  try {
    // Try to parse error response as JSON
    const errorData = await safeJsonParse(response);
    const errorMessage = errorData.error || errorData.message || `HTTP error! status: ${response.status}`;
    const error = new Error(errorMessage);
    logApiError(context, error, response);
    throw error;
  } catch (parseError) {
    // If parsing fails (non-JSON response), the parseError from safeJsonParse is already descriptive
    // Log and re-throw it
    logApiError(context, parseError, response);
    throw parseError;
  }
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
  
  // safeJsonParse now throws on errors, so we can directly parse
  const data = await safeJsonParse(response);
  logApiResponse(response, data);
  
  return data;
}
