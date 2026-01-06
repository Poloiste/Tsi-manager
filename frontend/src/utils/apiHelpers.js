/**
 * API Helper Utilities
 * Provides error handling and logging for API requests
 */

// Development logging flag
const isDev = process.env.NODE_ENV === 'development';

// Configuration for retry logic
const RETRY_CONFIG = {
  maxRetries: 3,
  initialDelay: 1000, // 1 second
  maxDelay: 10000, // 10 seconds
  backoffMultiplier: 2
};

// Network error types
const NETWORK_ERRORS = {
  INTERNET_DISCONNECTED: 'ERR_INTERNET_DISCONNECTED',
  NAME_NOT_RESOLVED: 'ERR_NAME_NOT_RESOLVED',
  CONNECTION_REFUSED: 'ERR_CONNECTION_REFUSED',
  NETWORK_CHANGED: 'ERR_NETWORK_CHANGED',
  FAILED_TO_FETCH: 'TypeError: Failed to fetch'
};

/**
 * Check if the user is online
 * @returns {boolean} True if online, false otherwise
 */
export function isOnline() {
  return navigator.onLine;
}

/**
 * Check if error is a network error that should trigger retry
 * @param {Error} error - Error object
 * @returns {boolean} True if it's a retryable network error
 */
export function isNetworkError(error) {
  if (!error) return false;
  
  const errorMessage = error.message?.toLowerCase() || '';
  const errorName = error.name?.toLowerCase() || '';
  
  return (
    errorMessage.includes('failed to fetch') ||
    errorMessage.includes('network') ||
    errorMessage.includes('connection') ||
    errorName.includes('typeerror') ||
    error.code === 'ERR_INTERNET_DISCONNECTED' ||
    error.code === 'ERR_NAME_NOT_RESOLVED' ||
    error.code === 'ERR_CONNECTION_REFUSED' ||
    error.code === 'ERR_NETWORK_CHANGED'
  );
}

/**
 * Sleep utility for retry delays
 * @param {number} ms - Milliseconds to sleep
 * @returns {Promise<void>}
 */
function sleep(ms) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

/**
 * Calculate exponential backoff delay
 * @param {number} attemptNumber - Current attempt number (0-indexed)
 * @returns {number} Delay in milliseconds
 */
function getRetryDelay(attemptNumber) {
  const delay = Math.min(
    RETRY_CONFIG.initialDelay * Math.pow(RETRY_CONFIG.backoffMultiplier, attemptNumber),
    RETRY_CONFIG.maxDelay
  );
  // Add some jitter to prevent thundering herd
  return delay + Math.random() * 1000;
}

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
  const responseUrl = response.url;
  
  // Check if response is JSON
  if (contentType && contentType.includes('application/json')) {
    try {
      return await response.json();
    } catch (error) {
      console.error('[API] Failed to parse JSON response:', {
        url: responseUrl,
        status: response.status,
        contentType,
        error: error.message
      });
      // Use generic error message to avoid exposing internal details
      throw new Error('Invalid JSON response from server');
    }
  }
  
  // If not JSON, try to get text for better error messages
  const text = await response.text();
  const trimmedText = text.trim().toLowerCase();
  
  // Log detailed error for debugging
  console.error('[API] Non-JSON response received:', {
    url: responseUrl,
    status: response.status,
    contentType: contentType || 'unknown',
    responsePreview: text.substring(0, 200) // First 200 chars for debugging
  });
  
  // Check if it's HTML error page (case-insensitive, multiple patterns)
  if (trimmedText.startsWith('<!doctype') || 
      trimmedText.startsWith('<html') || 
      trimmedText.startsWith('<head') ||
      trimmedText.startsWith('<body') ||
      trimmedText.includes('<html')) {
    throw new Error(
      `Server returned HTML instead of JSON (status: ${response.status}). ` +
      'The API endpoint may not exist or returned an error page. ' +
      'Please verify the endpoint URL is correct.'
    );
  }
  
  // Don't include response preview in error message to avoid exposing sensitive data
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
  // Handle 405 Method Not Allowed specifically
  if (response.status === 405) {
    const error = new Error(
      `HTTP method not allowed for this endpoint (405). ` +
      `The server does not support the ${response.url.includes('?') ? response.url.split('?')[0] : response.url} ` +
      `endpoint with the ${response.headers.get('Allow') ? `specified method. Allowed methods: ${response.headers.get('Allow')}` : 'specified method'}.`
    );
    logApiError(context, error, response);
    throw error;
  }
  
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
  
  // Check if online before making request
  if (!isOnline()) {
    const error = new Error('No internet connection. Please check your network and try again.');
    error.code = NETWORK_ERRORS.INTERNET_DISCONNECTED;
    logApiError(context, error);
    throw error;
  }
  
  // Log request
  logApiRequest(method, url, options);
  
  try {
    const response = await fetch(url, options);
    return response;
  } catch (error) {
    // Enhance error with more context
    if (error.message === 'Failed to fetch') {
      error.message = 'Network request failed. This could be due to:\n' +
        '- Lost internet connection\n' +
        '- DNS resolution failure\n' +
        '- CORS or network configuration issues\n' +
        'Please check your connection and try again.';
      error.code = NETWORK_ERRORS.FAILED_TO_FETCH;
    }
    
    logApiError(context, error);
    throw error;
  }
}

/**
 * Fetches with automatic retry on network errors
 * @param {string} url - Request URL
 * @param {object} options - Fetch options
 * @param {string} context - Context for logging
 * @param {number} maxRetries - Maximum number of retries (default from config)
 * @returns {Promise<Response>} Fetch response
 */
export async function fetchWithRetry(url, options = {}, context = 'API call', maxRetries = RETRY_CONFIG.maxRetries) {
  let lastError;
  
  for (let attempt = 0; attempt <= maxRetries; attempt++) {
    try {
      const response = await fetchWithLogging(url, options, context);
      
      // If we get here, the request succeeded
      if (attempt > 0) {
        console.log(`[API Retry] Request succeeded after ${attempt} ${attempt === 1 ? 'retry' : 'retries'}: ${url}`);
      }
      
      return response;
    } catch (error) {
      lastError = error;
      
      // Don't retry on certain errors
      const shouldRetry = isNetworkError(error) && attempt < maxRetries;
      
      if (!shouldRetry) {
        throw error;
      }
      
      const delay = getRetryDelay(attempt);
      console.warn(
        `[API Retry] Attempt ${attempt + 1}/${maxRetries + 1} failed for ${url}. ` +
        `Retrying in ${Math.round(delay / 1000)}s...`,
        { error: error.message }
      );
      
      await sleep(delay);
      
      // Check if we're still offline before retrying
      if (!isOnline()) {
        console.warn('[API Retry] Still offline, waiting for connection...');
        // Wait a bit longer if offline
        await sleep(2000);
      }
    }
  }
  
  // If we get here, all retries failed
  throw lastError;
}

/**
 * Fetches JSON data with proper error handling and logging
 * Uses retry mechanism for network errors
 * @param {string} url - Request URL
 * @param {object} options - Fetch options
 * @param {string} context - Context for logging
 * @param {boolean} useRetry - Whether to use retry mechanism (default: true)
 * @returns {Promise<any>} Parsed JSON data
 */
export async function fetchJson(url, options = {}, context = 'API call', useRetry = true) {
  const fetchFunction = useRetry ? fetchWithRetry : fetchWithLogging;
  const response = await fetchFunction(url, options, context);
  
  if (!response.ok) {
    await handleApiError(response, context);
  }
  
  // safeJsonParse now throws on errors, so we can directly parse
  const data = await safeJsonParse(response);
  logApiResponse(response, data);
  
  return data;
}
