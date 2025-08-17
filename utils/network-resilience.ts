import axios, { AxiosRequestConfig, AxiosResponse, AxiosError } from 'axios';

// Configuration for different request types
interface ResilienceConfig {
  maxRetries: number;
  baseDelay: number;
  maxDelay: number;
  enableJitter: boolean;
  timeoutMs: number;
  shouldRetry?: (error: AxiosError) => boolean;
}

// Default configurations by request type
const DEFAULT_CONFIGS: Record<string, ResilienceConfig> = {
  // Critical GET requests (restaurants, search)
  'critical-get': {
    maxRetries: 3,
    baseDelay: 1000,
    maxDelay: 8000,
    enableJitter: true,
    timeoutMs: 10000,
    shouldRetry: (error) => {
      const status = error.response?.status;
      // Retry on network errors, timeouts, and 5xx server errors
      return !status || status >= 500 || error.code === 'ECONNABORTED' || error.code === 'NETWORK_ERROR';
    }
  },
  
  // Standard GET requests (profile, categories)
  'standard-get': {
    maxRetries: 2,
    baseDelay: 800,
    maxDelay: 5000,
    enableJitter: true,
    timeoutMs: 8000,
    shouldRetry: (error) => {
      const status = error.response?.status;
      return !status || status >= 500 || error.code === 'ECONNABORTED';
    }
  },
  
  // Mutation requests (POST, PUT, DELETE) - careful with retries
  'mutation': {
    maxRetries: 1,
    baseDelay: 1500,
    maxDelay: 3000,
    enableJitter: false,
    timeoutMs: 15000,
    shouldRetry: (error) => {
      const status = error.response?.status;
      // Only retry on network/timeout errors, NOT on 4xx client errors
      return !status || error.code === 'ECONNABORTED' || error.code === 'NETWORK_ERROR';
    }
  },
  
  // File upload requests
  'upload': {
    maxRetries: 2,
    baseDelay: 2000,
    maxDelay: 10000,
    enableJitter: true,
    timeoutMs: 30000,
    shouldRetry: (error) => {
      const status = error.response?.status;
      return !status || status >= 500 || error.code === 'ECONNABORTED';
    }
  }
};

// Request tracking for cancel tokens
const activeRequests = new Map<string, AbortController>();

// Cache for debounced requests
const pendingRequests = new Map<string, Promise<any>>();

/**
 * Calculate exponential backoff delay with optional jitter
 */
function calculateDelay(
  attempt: number, 
  baseDelay: number, 
  maxDelay: number, 
  enableJitter: boolean
): number {
  // Exponential backoff: baseDelay * (2 ^ attempt)
  let delay = Math.min(baseDelay * Math.pow(2, attempt), maxDelay);
  
  if (enableJitter) {
    // Add ±25% jitter to prevent thundering herd
    const jitter = delay * 0.25 * (Math.random() - 0.5) * 2;
    delay = Math.max(0, delay + jitter);
  }
  
  return Math.floor(delay);
}

/**
 * Generate a cache key for request deduplication
 */
function getCacheKey(config: AxiosRequestConfig): string {
  const method = config.method?.toUpperCase() || 'GET';
  const url = config.url || '';
  const params = config.params ? JSON.stringify(config.params) : '';
  const data = config.data ? JSON.stringify(config.data) : '';
  
  return `${method}:${url}:${params}:${data}`;
}

/**
 * Enhanced axios request with resilience features
 */
export async function resilientRequest<T = any>(
  config: AxiosRequestConfig,
  configType: keyof typeof DEFAULT_CONFIGS = 'standard-get',
  requestId?: string
): Promise<AxiosResponse<T>> {
  const id = requestId || Math.random().toString(36).substr(2, 9);
  const resilienceConfig = DEFAULT_CONFIGS[configType];
  const controller = new AbortController();
  
  // Store request for potential cancellation
  activeRequests.set(id, controller);
  config.signal = controller.signal;
  
  // Set timeout
  config.timeout = resilienceConfig.timeoutMs;
  
  let lastError: AxiosError | null = null;
  const startTime = Date.now();
  
  for (let attempt = 1; attempt <= resilienceConfig.maxRetries + 1; attempt++) {
    try {
      // Only log retry attempts, not initial attempts
      if (attempt > 1) {
        console.log(`🎯 [${id}] Attempt ${attempt}/${resilienceConfig.maxRetries + 1}`);
      }
      
      const response = await axios(config);
      
      // Cleanup
      activeRequests.delete(id);
      
      // Log success only for retries
      if (attempt > 1) {
        const totalTime = Date.now() - startTime;
        console.log(`✅ [${id}] Request succeeded after ${attempt} attempts (${totalTime}ms)`);
      }
      
      return response;
      
    } catch (error) {
      if (axios.isAxiosError(error)) {
        lastError = error;
        
        // Check if request was cancelled
        if (error.code === 'ERR_CANCELED') {
          console.log(`❌ [${id}] Request cancelled`);
          throw error;
        }
        
        // Check if we should retry
        const shouldRetry = attempt <= resilienceConfig.maxRetries && 
                           resilienceConfig.shouldRetry?.(error);
        
        if (shouldRetry) {
          const delay = calculateDelay(
            attempt - 1,
            resilienceConfig.baseDelay,
            resilienceConfig.maxDelay,
            resilienceConfig.enableJitter
          );
          
          console.log(`⏳ [${id}] Retrying in ${delay}ms...`);
          console.log(`💡 [${id}] Retry reason: ${getRetryReason(error)}`);
          
          await new Promise(resolve => setTimeout(resolve, delay));
          continue;
        }
      }
      
      // Cleanup on final failure
      activeRequests.delete(id);
      throw error;
    }
  }
  
  // Cleanup
  activeRequests.delete(id);
  
  if (lastError && axios.isAxiosError(lastError)) {
    const enhancedError = new Error(
      `Request failed after ${resilienceConfig.maxRetries + 1} attempts: ${lastError.message}`
    );
    (enhancedError as any).originalError = lastError;
    (enhancedError as any).attempts = resilienceConfig.maxRetries + 1;
    (enhancedError as any).totalTime = Date.now() - startTime;
    throw enhancedError;
  }
  
  throw lastError;
}

/**
 * Get human-readable retry reason
 */
function getRetryReason(error: AxiosError): string {
  if (error.code === 'ECONNABORTED') return 'Timeout';
  if (error.code === 'NETWORK_ERROR') return 'Network error';
  if (!error.response) return 'No response received';
  if (error.response.status >= 500) return `Server error (${error.response.status})`;
  return 'Retryable error';
}

/**
 * Cancel all active requests
 */
export function cancelAllRequests(): void {
  console.log(`🛑 Cancelling ${activeRequests.size} active requests`);
  
  for (const [requestId, controller] of activeRequests.entries()) {
    console.log(`❌ Cancelling request: ${requestId}`);
    controller.abort();
  }
  
  activeRequests.clear();
}

/**
 * Cancel specific request by ID
 */
export function cancelRequest(requestId: string): boolean {
  const controller = activeRequests.get(requestId);
  if (controller) {
    console.log(`❌ Cancelling specific request: ${requestId}`);
    controller.abort();
    activeRequests.delete(requestId);
    return true;
  }
  return false;
}

/**
 * Debounced request - prevents duplicate requests
 */
export async function debouncedRequest<T = any>(
  config: AxiosRequestConfig,
  configType: keyof typeof DEFAULT_CONFIGS = 'standard-get',
  debounceMs: number = 300
): Promise<AxiosResponse<T>> {
  const cacheKey = getCacheKey(config);
  const requestId = Math.random().toString(36).substr(2, 9);
  
  // Check if there's already a pending request
  const existingRequest = pendingRequests.get(cacheKey);
  if (existingRequest) {
    console.log(`🔄 [${requestId}] Using debounced request for ${config.method?.toUpperCase()} ${config.url}`);
    return existingRequest;
  }
  
  console.log(`🎯 [${requestId}] Starting new debounced request for ${config.method?.toUpperCase()} ${config.url}`);
  
  // Create new request with debounce delay
  const debouncedPromise = new Promise<AxiosResponse<T>>(async (resolve, reject) => {
    // Wait for debounce period
    await new Promise(r => setTimeout(r, debounceMs));
    
    try {
      const response = await resilientRequest<T>(config, configType, requestId);
      resolve(response);
    } catch (error) {
      reject(error);
    } finally {
      // Cleanup cache
      pendingRequests.delete(cacheKey);
    }
  });
  
  // Cache the promise
  pendingRequests.set(cacheKey, debouncedPromise);
  
  return debouncedPromise;
}

/**
 * Batch requests with optimal concurrency
 */
export async function batchRequests<T = any>(
  requests: Array<{ config: AxiosRequestConfig; configType?: keyof typeof DEFAULT_CONFIGS }>,
  maxConcurrency: number = 3
): Promise<Array<AxiosResponse<T> | Error>> {
  console.log(`📦 Starting batch of ${requests.length} requests with max concurrency: ${maxConcurrency}`);
  
  const results: Array<AxiosResponse<T> | Error> = [];
  const executing: Array<Promise<any>> = [];
  
  for (let i = 0; i < requests.length; i++) {
    const { config, configType = 'standard-get' } = requests[i];
    const requestId = `batch-${i}-${Math.random().toString(36).substr(2, 6)}`;
    
    const promise = resilientRequest<T>(config, configType, requestId)
      .then(response => {
        results[i] = response;
      })
      .catch(error => {
        results[i] = error;
      })
      .finally(() => {
        // Remove from executing array
        const index = executing.indexOf(promise);
        if (index > -1) {
          executing.splice(index, 1);
        }
      });
    
    executing.push(promise);
    
    // Wait if we've reached max concurrency
    if (executing.length >= maxConcurrency) {
      await Promise.race(executing);
    }
  }
  
  // Wait for all remaining requests
  await Promise.all(executing);
  
  const successCount = results.filter(r => !(r instanceof Error)).length;
  const errorCount = results.length - successCount;
  
  console.log(`✅ Batch completed: ${successCount} success, ${errorCount} errors`);
  
  return results;
}

/**
 * Network health checker
 */
export class NetworkHealthMonitor {
  private static instance: NetworkHealthMonitor;
  private isHealthy: boolean = true;
  private lastCheck: number = 0;
  private checkInterval: number = 120000; // 2 minutes instead of 30 seconds
  private healthListeners: Array<(isHealthy: boolean) => void> = [];
  private consecutiveFailures: number = 0;
  private maxFailures: number = 3; // Need 3 consecutive failures to mark as unhealthy
  
  static getInstance(): NetworkHealthMonitor {
    if (!NetworkHealthMonitor.instance) {
      NetworkHealthMonitor.instance = new NetworkHealthMonitor();
    }
    return NetworkHealthMonitor.instance;
  }
  
  async checkHealth(): Promise<boolean> {
    const now = Date.now();
    
    // Skip if checked recently
    if (now - this.lastCheck < this.checkInterval) {
      return this.isHealthy;
    }
    
    this.lastCheck = now;
    
    try {
      const startTime = Date.now();
      const response = await resilientRequest({
        method: 'GET',
        url: '/api/restaurants/cuisine-types/',
        timeout: 5000
      }, 'standard-get');
      
      const latency = Date.now() - startTime;
      const wasHealthy = this.isHealthy;
      // Check if response is successful and contains data
      const isCurrentlyHealthy = response.status === 200 && 
                                response.data && 
                                Array.isArray(response.data) && 
                                response.data.length > 0 &&
                                latency < 10000;
      
      // Reset consecutive failures on success
      if (isCurrentlyHealthy) {
        this.consecutiveFailures = 0;
        this.isHealthy = true;
      } else {
        // Increment failure count
        this.consecutiveFailures++;
        // Only mark as unhealthy after max failures
        this.isHealthy = this.consecutiveFailures < this.maxFailures;
      }
      
      // Only log when health status changes
      if (wasHealthy !== this.isHealthy) {
        if (this.isHealthy) {
          console.log(`💓 Network health restored to HEALTHY (${latency}ms)`);
        } else {
          console.log(`💓 Network health changed to UNHEALTHY after ${this.consecutiveFailures} consecutive failures (${latency}ms)`);
        }
      }
      
      // Notify listeners if health status changed
      if (wasHealthy !== this.isHealthy) {
        this.notifyHealthChange();
      }
      
      return this.isHealthy;
      
    } catch (error) {
      const wasHealthy = this.isHealthy;
      
      // Increment failure count
      this.consecutiveFailures++;
      // Only mark as unhealthy after max failures
      this.isHealthy = this.consecutiveFailures < this.maxFailures;
      
      // Only log when health status changes
      if (wasHealthy !== this.isHealthy) {
        if (axios.isAxiosError(error)) {
          if (error.code === 'NETWORK_ERROR') {
            console.log(`🏥 Network health check failed: No internet connection (${this.consecutiveFailures}/${this.maxFailures} failures)`);
          } else if (error.code === 'ECONNABORTED') {
            console.log(`🏥 Network health check failed: Connection timeout (${this.consecutiveFailures}/${this.maxFailures} failures)`);
          } else if (error.response?.status) {
            console.log(`🏥 Network health check failed: Server error (${error.response.status}) (${this.consecutiveFailures}/${this.maxFailures} failures)`);
          } else {
            console.log(`🏥 Network health check failed: ${error.message} (${this.consecutiveFailures}/${this.maxFailures} failures)`);
          }
        } else {
          console.log(`🏥 Network health check failed: ${error} (${this.consecutiveFailures}/${this.maxFailures} failures)`);
        }
      }
      
      if (wasHealthy !== this.isHealthy) {
        this.notifyHealthChange();
      }
      
      return this.isHealthy;
    }
  }
  
  addHealthListener(listener: (isHealthy: boolean) => void): void {
    this.healthListeners.push(listener);
  }
  
  removeHealthListener(listener: (isHealthy: boolean) => void): void {
    const index = this.healthListeners.indexOf(listener);
    if (index > -1) {
      this.healthListeners.splice(index, 1);
    }
  }
  
  private notifyHealthChange(): void {
    console.log(`🔔 Network health changed to: ${this.isHealthy ? 'HEALTHY' : 'UNHEALTHY'}`);
    this.healthListeners.forEach(listener => {
      try {
        listener(this.isHealthy);
      } catch (error) {
        console.error('Error in health listener:', error);
      }
    });
  }
  
  getHealthStatus(): { isHealthy: boolean; lastCheck: number; consecutiveFailures: number } {
    return {
      isHealthy: this.isHealthy,
      lastCheck: this.lastCheck,
      consecutiveFailures: this.consecutiveFailures
    };
  }
  
  // Manual reset method for testing or manual recovery
  resetHealth(): void {
    this.isHealthy = true;
    this.consecutiveFailures = 0;
    this.lastCheck = 0;
    console.log('💓 Network health manually reset to HEALTHY');
  }
}

/**
 * Performance telemetry collector
 */
export class PerformanceTelemetry {
  private static metrics: Array<{
    timestamp: number;
    url: string;
    method: string;
    duration: number;
    status: number | null;
    error: string | null;
    attempts: number;
    configType: string;
  }> = [];
  
  static recordMetric(
    url: string,
    method: string,
    duration: number,
    status: number | null,
    error: string | null,
    attempts: number,
    configType: string
  ): void {
    this.metrics.push({
      timestamp: Date.now(),
      url,
      method,
      duration,
      status,
      error,
      attempts,
      configType
    });
    
    // Keep only last 1000 metrics to prevent memory bloat
    if (this.metrics.length > 1000) {
      this.metrics.splice(0, this.metrics.length - 1000);
    }
  }
  
  static getMetrics(): typeof PerformanceTelemetry.metrics {
    return [...this.metrics];
  }
  
  static getLatencyBuckets(): Record<string, number> {
    const buckets = {
      'fast-0-2s': 0,
      'good-2-5s': 0,
      'slow-5-10s': 0,
      'very-slow-10s+': 0
    };
    
    this.metrics.forEach(metric => {
      if (metric.duration < 2000) buckets['fast-0-2s']++;
      else if (metric.duration < 5000) buckets['good-2-5s']++;
      else if (metric.duration < 10000) buckets['slow-5-10s']++;
      else buckets['very-slow-10s+']++;
    });
    
    return buckets;
  }
  
  static getErrorRates(): Record<string, number> {
    const total = this.metrics.length;
    if (total === 0) return { errorRate: 0, networkErrors: 0, serverErrors: 0, clientErrors: 0 };
    
    const errorCounts = this.metrics.reduce((acc, metric) => {
      if (metric.error) {
        acc.total++;
        if (metric.error.includes('Network') || metric.error.includes('timeout')) {
          acc.network++;
        } else if (metric.status && metric.status >= 500) {
          acc.server++;
        } else if (metric.status && metric.status >= 400) {
          acc.client++;
        }
      }
      return acc;
    }, { total: 0, network: 0, server: 0, client: 0 });
    
    return {
      errorRate: (errorCounts.total / total) * 100,
      networkErrors: (errorCounts.network / total) * 100,
      serverErrors: (errorCounts.server / total) * 100,
      clientErrors: (errorCounts.client / total) * 100
    };
  }
  
  static logPerformanceSummary(): void {
    const buckets = this.getLatencyBuckets();
    const errorRates = this.getErrorRates();
    
    console.log('📊 PERFORMANCE TELEMETRY SUMMARY:');
    console.log(`   📈 Total requests: ${this.metrics.length}`);
    console.log(`   ⚡ Fast (0-2s): ${buckets['fast-0-2s']}`);
    console.log(`   ✅ Good (2-5s): ${buckets['good-2-5s']}`);
    console.log(`   🐌 Slow (5-10s): ${buckets['slow-5-10s']}`);
    console.log(`   🚨 Very slow (10s+): ${buckets['very-slow-10s+']}`);
    console.log(`   💥 Error rate: ${errorRates.errorRate.toFixed(1)}%`);
    console.log(`   🌐 Network errors: ${errorRates.networkErrors.toFixed(1)}%`);
    console.log(`   🖥️ Server errors: ${errorRates.serverErrors.toFixed(1)}%`);
    console.log(`   📱 Client errors: ${errorRates.clientErrors.toFixed(1)}%`);
  }
}

