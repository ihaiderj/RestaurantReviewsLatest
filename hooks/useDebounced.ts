import { useCallback, useRef } from 'react';

/**
 * Creates a debounced version of a function that delays invoking func until after 
 * wait milliseconds have elapsed since the last time the debounced function was invoked.
 */
export function useDebounced<T extends (...args: any[]) => any>(
  func: T,
  wait: number,
  immediate?: boolean
): T {
  const timeoutRef = useRef<NodeJS.Timeout | null>(null);
  const immediateRef = useRef<boolean>(immediate || false);

  const debouncedFunc = useCallback(
    (...args: Parameters<T>) => {
      const callNow = immediateRef.current && !timeoutRef.current;
      
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }
      
      timeoutRef.current = setTimeout(() => {
        timeoutRef.current = null;
        if (!immediateRef.current) {
          func(...args);
        }
      }, wait);
      
      if (callNow) {
        func(...args);
      }
    },
    [func, wait]
  ) as T;

  return debouncedFunc;
}

/**
 * Creates a throttled version of a function that only invokes func at most once per every wait milliseconds.
 */
export function useThrottled<T extends (...args: any[]) => any>(
  func: T,
  wait: number
): T {
  const lastCallTime = useRef<number>(0);
  const timeoutRef = useRef<NodeJS.Timeout | null>(null);

  const throttledFunc = useCallback(
    (...args: Parameters<T>) => {
      const now = Date.now();
      const timeSinceLastCall = now - lastCallTime.current;
      
      if (timeSinceLastCall >= wait) {
        // Call immediately if enough time has passed
        lastCallTime.current = now;
        func(...args);
      } else {
        // Schedule a call for the remaining time
        if (timeoutRef.current) {
          clearTimeout(timeoutRef.current);
        }
        
        timeoutRef.current = setTimeout(() => {
          lastCallTime.current = Date.now();
          func(...args);
          timeoutRef.current = null;
        }, wait - timeSinceLastCall);
      }
    },
    [func, wait]
  ) as T;

  return throttledFunc;
}

/**
 * Advanced debounce hook with cancel capability and pending state
 */
export function useAdvancedDebounced<T extends (...args: any[]) => any>(
  func: T,
  wait: number,
  options: {
    leading?: boolean;
    trailing?: boolean;
    maxWait?: number;
  } = {}
) {
  const timeoutRef = useRef<NodeJS.Timeout | null>(null);
  const maxTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const lastCallTimeRef = useRef<number>(0);
  const lastInvokeTimeRef = useRef<number>(0);
  const argsRef = useRef<Parameters<T> | null>(null);
  const pendingRef = useRef<boolean>(false);

  const { leading = false, trailing = true, maxWait } = options;

  const cancel = useCallback(() => {
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current);
      timeoutRef.current = null;
    }
    if (maxTimeoutRef.current) {
      clearTimeout(maxTimeoutRef.current);
      maxTimeoutRef.current = null;
    }
    pendingRef.current = false;
    argsRef.current = null;
  }, []);

  const flush = useCallback(() => {
    if (argsRef.current) {
      const args = argsRef.current;
      cancel();
      lastInvokeTimeRef.current = Date.now();
      return func(...args);
    }
  }, [func, cancel]);

  const debouncedFunc = useCallback(
    (...args: Parameters<T>) => {
      const time = Date.now();
      const isInvoking = shouldInvoke(time);
      
      lastCallTimeRef.current = time;
      argsRef.current = args;
      pendingRef.current = true;

      if (isInvoking) {
        if (timeoutRef.current === null) {
          return leadingEdge(time);
        }
        if (maxWait) {
          // Handle maxWait timeout
          return invokeFunc(time);
        }
      }
      
      if (timeoutRef.current === null) {
        timeoutRef.current = setTimeout(timerExpired, wait);
      }
      
      return undefined;

      function shouldInvoke(time: number): boolean {
        const timeSinceLastCall = time - lastCallTimeRef.current;
        const timeSinceLastInvoke = time - lastInvokeTimeRef.current;

        return (
          lastCallTimeRef.current === 0 || // First call
          timeSinceLastCall >= wait || // Wait time has passed
          timeSinceLastCall < 0 || // System clock moved backward
          (maxWait !== undefined && timeSinceLastInvoke >= maxWait) // Max wait exceeded
        );
      }

      function leadingEdge(time: number) {
        lastInvokeTimeRef.current = time;
        timeoutRef.current = setTimeout(timerExpired, wait);
        
        if (leading) {
          return invokeFunc(time);
        }
        
        if (maxWait) {
          maxTimeoutRef.current = setTimeout(maxDelayed, maxWait);
        }
        
        return undefined;
      }

      function invokeFunc(time: number) {
        const args = argsRef.current!;
        argsRef.current = null;
        pendingRef.current = false;
        lastInvokeTimeRef.current = time;
        return func(...args);
      }

      function timerExpired() {
        const time = Date.now();
        if (shouldInvoke(time)) {
          return trailingEdge(time);
        }
        
        // Restart timer
        const timeSinceLastCall = time - lastCallTimeRef.current;
        const timeRemaining = wait - timeSinceLastCall;
        timeoutRef.current = setTimeout(timerExpired, timeRemaining);
      }

      function trailingEdge(time: number) {
        timeoutRef.current = null;
        
        if (trailing && argsRef.current) {
          return invokeFunc(time);
        }
        
        argsRef.current = null;
        pendingRef.current = false;
        return undefined;
      }

      function maxDelayed() {
        if (timeoutRef.current) {
          clearTimeout(timeoutRef.current);
        }
        maxTimeoutRef.current = null;
        invokeFunc(Date.now());
      }
    },
    [func, wait, leading, trailing, maxWait]
  ) as T;

  const pending = useCallback(() => pendingRef.current, []);

  return { 
    debouncedFunc, 
    cancel, 
    flush, 
    pending 
  };
}

