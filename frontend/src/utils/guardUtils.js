/**
 * Utility functions for preventing infinite loops and stack overflows
 * These guards help protect against recursive calls and excessive re-renders
 */

/**
 * Creates a rate-limited version of a function that prevents excessive calls
 * @param {Function} fn - Function to rate limit
 * @param {number} minInterval - Minimum interval between calls in ms
 * @param {string} name - Name for debugging
 * @returns {Function} Rate-limited function
 */
export function rateLimit(fn, minInterval = 100, name = 'anonymous') {
  let lastCallTime = 0;
  let callCount = 0;
  const MAX_CALLS_PER_SECOND = 20;
  const RESET_INTERVAL = 1000;
  
  let resetTimer = null;
  
  return function(...args) {
    const now = Date.now();
    
    // Reset call counter every second
    if (!resetTimer) {
      resetTimer = setTimeout(() => {
        callCount = 0;
        resetTimer = null;
      }, RESET_INTERVAL);
    }
    
    // Increment call counter
    callCount++;
    
    // Check if we're exceeding the call limit
    if (callCount > MAX_CALLS_PER_SECOND) {
      console.warn(
        `[guardUtils] Function "${name}" called ${callCount} times in ${RESET_INTERVAL}ms. ` +
        `This might indicate an infinite loop. Blocking further calls.`
      );
      return;
    }
    
    // Check minimum interval
    const timeSinceLastCall = now - lastCallTime;
    if (timeSinceLastCall < minInterval) {
      if (process.env.NODE_ENV === 'development') {
        console.debug(
          `[guardUtils] Rate limit: "${name}" called too frequently ` +
          `(${timeSinceLastCall}ms < ${minInterval}ms)`
        );
      }
      return;
    }
    
    lastCallTime = now;
    return fn.apply(this, args);
  };
}

/**
 * Creates a debounced version of a function that delays execution
 * Useful for preventing excessive API calls or state updates
 * @param {Function} fn - Function to debounce
 * @param {number} delay - Delay in ms
 * @returns {Function} Debounced function
 */
export function debounce(fn, delay = 300) {
  let timeoutId = null;
  
  return function(...args) {
    if (timeoutId) {
      clearTimeout(timeoutId);
    }
    
    timeoutId = setTimeout(() => {
      fn.apply(this, args);
      timeoutId = null;
    }, delay);
  };
}

/**
 * Detects potential infinite loops by tracking function call depth
 * @param {Function} fn - Function to wrap
 * @param {string} name - Function name for debugging
 * @param {number} maxDepth - Maximum allowed call depth
 * @returns {Function} Protected function
 */
export function preventDeepRecursion(fn, name = 'anonymous', maxDepth = 100) {
  let currentDepth = 0;
  
  return function(...args) {
    currentDepth++;
    
    if (currentDepth > maxDepth) {
      console.error(
        `[guardUtils] Maximum call depth exceeded for "${name}". ` +
        `Current depth: ${currentDepth}. This indicates an infinite recursion.`
      );
      currentDepth = 0; // Reset to allow recovery
      throw new Error(`Maximum call stack depth exceeded in ${name}`);
    }
    
    try {
      const result = fn.apply(this, args);
      
      // Handle promises
      if (result && typeof result.then === 'function') {
        return result.finally(() => {
          currentDepth--;
        });
      }
      
      currentDepth--;
      return result;
    } catch (error) {
      currentDepth--;
      throw error;
    }
  };
}

/**
 * Creates a circuit breaker that stops calling a function after too many failures
 * Useful for preventing repeated failed API calls
 * @param {Function} fn - Function to protect
 * @param {Object} options - Configuration options
 * @returns {Function} Protected function
 */
export function circuitBreaker(fn, options = {}) {
  const {
    threshold = 5, // Number of failures before opening circuit
    resetTimeout = 60000, // Time before attempting to close circuit (ms)
    name = 'anonymous'
  } = options;
  
  let failureCount = 0;
  let circuitOpen = false;
  let resetTimer = null;
  
  return async function(...args) {
    // If circuit is open, don't call the function
    if (circuitOpen) {
      console.warn(`[guardUtils] Circuit breaker open for "${name}". Call blocked.`);
      throw new Error(`Circuit breaker open for ${name}`);
    }
    
    try {
      const result = await fn.apply(this, args);
      
      // Success - reset failure count
      failureCount = 0;
      if (resetTimer) {
        clearTimeout(resetTimer);
        resetTimer = null;
      }
      
      return result;
    } catch (error) {
      failureCount++;
      
      if (failureCount >= threshold) {
        circuitOpen = true;
        console.error(
          `[guardUtils] Circuit breaker opened for "${name}" after ${failureCount} failures. ` +
          `Will retry in ${resetTimeout}ms.`
        );
        
        // Schedule circuit close attempt
        resetTimer = setTimeout(() => {
          circuitOpen = false;
          failureCount = 0;
          console.log(`[guardUtils] Circuit breaker reset for "${name}". Retrying...`);
        }, resetTimeout);
      }
      
      throw error;
    }
  };
}

/**
 * Tracks state update frequency to detect potential infinite re-render loops
 * Returns a wrapped setState function that warns on excessive updates
 * @param {Function} setState - React setState function
 * @param {string} stateName - Name of the state for debugging
 * @param {number} maxUpdatesPerSecond - Maximum allowed updates per second
 * @returns {Function} Protected setState function
 */
export function guardStateUpdates(setState, stateName = 'unknown', maxUpdatesPerSecond = 50) {
  let updateCount = 0;
  let resetTimer = null;
  
  return function(value) {
    updateCount++;
    
    // Reset counter every second
    if (!resetTimer) {
      resetTimer = setTimeout(() => {
        if (updateCount > maxUpdatesPerSecond) {
          console.error(
            `[guardUtils] State "${stateName}" was updated ${updateCount} times in 1 second. ` +
            `This might indicate an infinite re-render loop.`
          );
        }
        updateCount = 0;
        resetTimer = null;
      }, 1000);
    }
    
    return setState(value);
  };
}

/**
 * Development-only logger that includes call stack information
 * Useful for debugging where unexpected calls are coming from
 */
export function createDebugLogger(prefix = '') {
  const isDev = process.env.NODE_ENV === 'development';
  
  return {
    log: (...args) => {
      if (isDev) {
        console.log(`[${prefix}]`, ...args);
      }
    },
    warn: (...args) => {
      if (isDev) {
        console.warn(`[${prefix}]`, ...args);
      }
    },
    error: (...args) => {
      console.error(`[${prefix}]`, ...args);
    },
    trace: (...args) => {
      if (isDev) {
        console.log(`[${prefix}]`, ...args);
        console.trace('Call stack:');
      }
    }
  };
}
