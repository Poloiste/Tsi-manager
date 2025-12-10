import {
  rateLimit,
  debounce,
  preventDeepRecursion,
  circuitBreaker,
  guardStateUpdates,
  createDebugLogger
} from './guardUtils';

describe('guardUtils', () => {
  beforeEach(() => {
    jest.useFakeTimers();
  });

  afterEach(() => {
    jest.runOnlyPendingTimers();
    jest.useRealTimers();
  });

  describe('rateLimit', () => {
    it('should allow first call immediately', () => {
      const fn = jest.fn(() => 'result');
      const limited = rateLimit(fn, 100, 'test');
      
      const result = limited();
      expect(fn).toHaveBeenCalledTimes(1);
      expect(result).toBe('result');
    });

    it('should block rapid successive calls and return last result', () => {
      const fn = jest.fn(() => 'result');
      const limited = rateLimit(fn, 100, 'test');
      
      const result1 = limited();
      const result2 = limited(); // Should be blocked
      const result3 = limited(); // Should be blocked
      
      expect(fn).toHaveBeenCalledTimes(1);
      expect(result1).toBe('result');
      expect(result2).toBe('result'); // Returns last valid result
      expect(result3).toBe('result'); // Returns last valid result
    });

    it('should allow calls after minimum interval', () => {
      const fn = jest.fn(() => 'result');
      const limited = rateLimit(fn, 100, 'test');
      
      limited();
      jest.advanceTimersByTime(100);
      limited();
      
      expect(fn).toHaveBeenCalledTimes(2);
    });

    it('should warn on excessive calls per second', () => {
      const consoleWarn = jest.spyOn(console, 'warn').mockImplementation();
      const fn = jest.fn(() => 'result');
      const limited = rateLimit(fn, 1, 'test');
      
      // Call 21 times rapidly
      for (let i = 0; i < 21; i++) {
        jest.advanceTimersByTime(2);
        limited();
      }
      
      expect(consoleWarn).toHaveBeenCalled();
      consoleWarn.mockRestore();
    });
  });

  describe('debounce', () => {
    it('should delay function execution', () => {
      const fn = jest.fn();
      const debounced = debounce(fn, 300);
      
      debounced();
      expect(fn).not.toHaveBeenCalled();
      
      jest.advanceTimersByTime(300);
      expect(fn).toHaveBeenCalledTimes(1);
    });

    it('should cancel previous calls when called rapidly', () => {
      const fn = jest.fn();
      const debounced = debounce(fn, 300);
      
      debounced();
      jest.advanceTimersByTime(100);
      debounced();
      jest.advanceTimersByTime(100);
      debounced();
      
      jest.advanceTimersByTime(300);
      expect(fn).toHaveBeenCalledTimes(1);
    });
  });

  describe('preventDeepRecursion', () => {
    it('should allow normal function calls', () => {
      const fn = jest.fn((x) => x * 2);
      const protectedFn = preventDeepRecursion(fn, 'test', 100);
      
      const result = protectedFn(5);
      expect(result).toBe(10);
      expect(fn).toHaveBeenCalledTimes(1);
    });

    it('should throw on deep recursion', () => {
      let callCount = 0;
      const recursiveFn = function(n, protectedFn) {
        callCount++;
        if (n > 0) return protectedFn(n - 1, protectedFn);
        return n;
      };
      
      const protectedFn = preventDeepRecursion((n, fn) => recursiveFn(n, fn), 'test', 10);
      
      expect(() => protectedFn(20, protectedFn)).toThrow('Maximum call stack depth exceeded');
    });

    it('should enforce recovery period after overflow', () => {
      let callCount = 0;
      const recursiveFn = function(n, protectedFn) {
        callCount++;
        if (n > 0) return protectedFn(n - 1, protectedFn);
        return n;
      };
      
      const protectedFn = preventDeepRecursion((n, fn) => recursiveFn(n, fn), 'test', 10);
      
      // First overflow
      expect(() => protectedFn(20, protectedFn)).toThrow('Maximum call stack depth exceeded');
      
      // Immediate retry should fail with recovery message
      expect(() => protectedFn(5, protectedFn)).toThrow('recovery period');
      
      // After recovery period, should work
      jest.advanceTimersByTime(1000);
      const result = protectedFn(3, protectedFn);
      expect(result).toBe(0);
    });

    it('should handle async functions', async () => {
      const asyncFn = jest.fn(async (x) => x * 2);
      const protectedFn = preventDeepRecursion(asyncFn, 'test', 100);
      
      const result = await protectedFn(5);
      expect(result).toBe(10);
    });
  });

  describe('circuitBreaker', () => {
    it('should allow successful calls', async () => {
      const fn = jest.fn(async () => 'success');
      const protectedFn = circuitBreaker(fn, { threshold: 3, name: 'test' });
      
      const result = await protectedFn();
      expect(result).toBe('success');
      expect(fn).toHaveBeenCalledTimes(1);
    });

    it('should open circuit after threshold failures', async () => {
      const fn = jest.fn(async () => {
        throw new Error('failure');
      });
      const protectedFn = circuitBreaker(fn, { threshold: 3, name: 'test' });
      
      // Fail 3 times to reach threshold
      for (let i = 0; i < 3; i++) {
        try {
          await protectedFn();
        } catch (e) {
          // Expected
        }
      }
      
      // Circuit should now be open
      await expect(protectedFn()).rejects.toThrow('Circuit breaker open');
    });

    it('should reset after timeout', async () => {
      const fn = jest.fn(async () => {
        throw new Error('failure');
      });
      const protectedFn = circuitBreaker(fn, { 
        threshold: 2, 
        resetTimeout: 1000, 
        name: 'test' 
      });
      
      // Open circuit
      try { await protectedFn(); } catch (e) {}
      try { await protectedFn(); } catch (e) {}
      
      // Should be blocked
      await expect(protectedFn()).rejects.toThrow('Circuit breaker open');
      
      // Wait for reset
      jest.advanceTimersByTime(1000);
      
      // Should allow calls again (though they still fail)
      try {
        await protectedFn();
      } catch (e) {
        expect(e.message).not.toBe('Circuit breaker open');
      }
    });
  });

  describe('guardStateUpdates', () => {
    it('should call setState normally', () => {
      const setState = jest.fn();
      const guarded = guardStateUpdates(setState, 'test', 50);
      
      guarded('newValue');
      expect(setState).toHaveBeenCalledWith('newValue');
    });

    it('should warn on excessive updates', () => {
      const consoleError = jest.spyOn(console, 'error').mockImplementation();
      const setState = jest.fn();
      const guarded = guardStateUpdates(setState, 'test', 10);
      
      // Call 20 times
      for (let i = 0; i < 20; i++) {
        guarded(`value${i}`);
      }
      
      // Advance timer to trigger warning
      jest.advanceTimersByTime(1000);
      
      expect(consoleError).toHaveBeenCalled();
      consoleError.mockRestore();
    });
  });

  describe('createDebugLogger', () => {
    it('should create logger with correct methods', () => {
      const logger = createDebugLogger('TEST');
      
      expect(logger).toHaveProperty('log');
      expect(logger).toHaveProperty('warn');
      expect(logger).toHaveProperty('error');
      expect(logger).toHaveProperty('trace');
    });

    it('should log with prefix in development', () => {
      const consoleLog = jest.spyOn(console, 'log').mockImplementation();
      const originalEnv = process.env.NODE_ENV;
      
      // Ensure we're in development mode
      process.env.NODE_ENV = 'development';
      
      // Create logger AFTER setting env
      const logger = createDebugLogger('TEST');
      logger.log('message');
      
      expect(consoleLog).toHaveBeenCalledWith('[TEST]', 'message');
      
      process.env.NODE_ENV = originalEnv;
      consoleLog.mockRestore();
    });
  });
});
