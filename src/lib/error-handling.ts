interface PerformanceMemory {
  usedJSHeapSize: number;
  totalJSHeapSize?: number;
  jsHeapSizeLimit: number;
}

type PerformanceWithMemory = Performance & { memory?: PerformanceMemory };

export interface SystemError {
  code: string;
  message: string;
  severity: 'low' | 'medium' | 'high' | 'critical';
  category: 'network' | 'database' | 'validation' | 'logic' | 'security';
  timestamp: Date;
  context?: unknown;
  userId?: string;
  sessionId?: string;
}

export interface ErrorRecoveryStrategy {
  canRetry: boolean;
  maxRetries: number;
  retryDelay: number;
  fallbackAction?: () => Promise<unknown>;
  userMessage?: string;
}

export interface HealthChecksSummary {
  database: { healthy: boolean; details: unknown };
  localStorage: { healthy: boolean; details: unknown };
  network: { healthy: boolean; details: unknown };
  memory: { healthy: boolean; details: unknown };
  errors: { healthy: boolean; details: unknown };
}

export class ErrorHandlingService {
  private errorLog: SystemError[] = [];
  private retryAttempts: Map<string, number> = new Map();
  
  constructor() {
    // Setup global error handlers
    if (typeof window !== 'undefined') {
      window.addEventListener('error', this.handleGlobalError.bind(this));
      window.addEventListener('unhandledrejection', this.handleUnhandledRejection.bind(this));
    }
  }

  /**
   * Handles errors with appropriate recovery strategies
   */
  async handleError(error: SystemError, recoveryStrategy?: ErrorRecoveryStrategy): Promise<{ success: boolean; result?: unknown; error?: string }> {
    // Log the error
    this.logError(error);

    // Determine recovery strategy
    const strategy = recoveryStrategy || this.getDefaultRecoveryStrategy(error);

    if (!strategy.canRetry) {
      return { success: false, error: error.message };
    }

    const errorKey = `${error.code}_${error.sessionId || 'global'}`;
    const currentAttempts = this.retryAttempts.get(errorKey) || 0;

    if (currentAttempts >= strategy.maxRetries) {
      console.error(`Max retries exceeded for error: ${error.code}`);
      return { success: false, error: 'Maximum retry attempts exceeded' };
    }

    // Wait before retry
    await this.delay(strategy.retryDelay * Math.pow(2, currentAttempts)); // Exponential backoff

    // Increment retry count
    this.retryAttempts.set(errorKey, currentAttempts + 1);

    try {
      // Attempt recovery
      if (strategy.fallbackAction) {
        const result = await strategy.fallbackAction();
        this.retryAttempts.delete(errorKey); // Reset on success
        return { success: true, result };
      }
    } catch (recoveryError) {
      console.error('Recovery attempt failed:', recoveryError);
      return this.handleError(error, strategy);
    }

    return { success: false, error: 'No recovery action available' };
  }

  /**
   * Creates standardized error objects
   */
  createError(
    code: string, 
    message: string, 
    severity: SystemError['severity'], 
    category: SystemError['category'],
    context?: unknown
  ): SystemError {
    return {
      code,
      message,
      severity,
      category,
      timestamp: new Date(),
      context,
      sessionId: this.getCurrentSessionId(),
      userId: this.getCurrentUserId()
    };
  }

  /**
   * Validates system health
   */
  async validateSystemHealth(): Promise<{ healthy: boolean; issues: string[]; checks: HealthChecksSummary }> {
    const checks: HealthChecksSummary = {
      database: await this.checkDatabaseHealth(),
      localStorage: await this.checkLocalStorageHealth(),
      network: await this.checkNetworkHealth(),
      memory: this.checkMemoryUsage(),
      errors: this.checkErrorRates()
    };

    const issues: string[] = [];

    if (!checks.database.healthy) issues.push('Database connection issues');
    if (!checks.localStorage.healthy) issues.push('Local storage unavailable');
    if (!checks.network.healthy) issues.push('Network connectivity problems');
    if (!checks.memory.healthy) issues.push('High memory usage');
    if (!checks.errors.healthy) issues.push('High error rate detected');

    return {
      healthy: issues.length === 0,
      issues,
      checks
    };
  }

  /**
   * Monitors system performance and alerts on issues
   */
  startHealthMonitoring(intervalMs: number = 30000): void {
    setInterval(async () => {
      const health = await this.validateSystemHealth();
      
      if (!health.healthy) {
        console.warn('System health issues detected:', health.issues);
        this.logError(this.createError(
          'HEALTH_CHECK_FAILED',
          `System health issues: ${health.issues.join(', ')}`,
          'medium',
          'logic',
          health
        ));
      }
    }, intervalMs);
  }

  /**
   * Gets error statistics for monitoring
   */
  getErrorStatistics(timeframeMs: number = 3600000): { [key: string]: number } {
    const cutoff = new Date(Date.now() - timeframeMs);
    const recentErrors = this.errorLog.filter(error => error.timestamp > cutoff);
    
    const stats: { [key: string]: number } = {};
    
    recentErrors.forEach(error => {
      const key = `${error.category}_${error.severity}`;
      stats[key] = (stats[key] || 0) + 1;
    });

    return stats;
  }

  /**
   * Clears old error logs to prevent memory leaks
   */
  cleanupErrorLogs(maxAgeMs: number = 86400000): void { // 24 hours
    const cutoff = new Date(Date.now() - maxAgeMs);
    this.errorLog = this.errorLog.filter(error => error.timestamp > cutoff);
  }

  // Private methods
  private getDefaultRecoveryStrategy(error: SystemError): ErrorRecoveryStrategy {
    switch (error.category) {
      case 'network':
        return {
          canRetry: true,
          maxRetries: 3,
          retryDelay: 1000,
          userMessage: 'Network connection issue. Retrying...'
        };
      
      case 'database':
        return {
          canRetry: error.severity !== 'critical',
          maxRetries: 2,
          retryDelay: 2000,
          userMessage: 'Database temporarily unavailable. Using local storage.'
        };
      
      case 'validation':
        return {
          canRetry: false,
          maxRetries: 0,
          retryDelay: 0,
          userMessage: 'Invalid input. Please check your data and try again.'
        };
      
      default:
        return {
          canRetry: error.severity !== 'critical',
          maxRetries: 1,
          retryDelay: 500,
          userMessage: 'An unexpected error occurred. Please try again.'
        };
    }
  }

  private async checkDatabaseHealth(): Promise<{ healthy: boolean; details: unknown }> {
    try {
      // Check if we can make a basic database query
      const { getSupabaseClient } = await import('./supabase');
      const client = getSupabaseClient();
      
      if (!client) {
        return { healthy: false, details: 'Database client not available' };
      }

      // Simple health check query
      const startTime = Date.now();
      await client.from('sessions').select('id').limit(1);
      const responseTime = Date.now() - startTime;

      return {
        healthy: responseTime < 5000, // 5 second timeout
        details: { responseTime, available: true }
      };
    } catch (error) {
      return { healthy: false, details: error };
    }
  }

  private async checkLocalStorageHealth(): Promise<{ healthy: boolean; details: unknown }> {
    try {
      const testKey = 'health_check_test';
      const testValue = Date.now().toString();
      
      localStorage.setItem(testKey, testValue);
      const retrieved = localStorage.getItem(testKey);
      localStorage.removeItem(testKey);

      return {
        healthy: retrieved === testValue,
        details: { available: true, size: this.getLocalStorageSize() }
      };
    } catch (error) {
      return { healthy: false, details: error };
    }
  }

  private async checkNetworkHealth(): Promise<{ healthy: boolean; details: unknown }> {
    if (typeof navigator === 'undefined' || !navigator.onLine) {
      return { healthy: false, details: 'Browser offline' };
    }

    try {
      // Simple fetch to check connectivity
      const response = await fetch('/api/health', { 
        method: 'HEAD',
        cache: 'no-cache'
      }).catch(() => null);

      return {
        healthy: response !== null,
        details: { online: navigator.onLine, connection: 'available' }
      };
    } catch (error) {
      return { healthy: false, details: error };
    }
  }

  private checkMemoryUsage(): { healthy: boolean; details: unknown } {
    const perf = typeof performance !== 'undefined' ? (performance as PerformanceWithMemory) : undefined;
    if (!perf?.memory) {
      return { healthy: true, details: 'Memory API not available' };
    }

    const memory = perf.memory;
    const usedRatio = memory.usedJSHeapSize / memory.jsHeapSizeLimit;

    return {
      healthy: usedRatio < 0.8, // Less than 80% memory usage
      details: {
        used: memory.usedJSHeapSize,
        limit: memory.jsHeapSizeLimit,
        ratio: usedRatio
      }
    };
  }

  private checkErrorRates(): { healthy: boolean; details: unknown } {
    const recentErrors = this.getErrorStatistics(300000); // Last 5 minutes
    const totalErrors = Object.values(recentErrors).reduce((sum, count) => sum + count, 0);
    
    return {
      healthy: totalErrors < 10, // Less than 10 errors in 5 minutes
      details: { totalErrors, breakdown: recentErrors }
    };
  }

  private getLocalStorageSize(): string {
    try {
      let total = 0;
      for (const key in localStorage) {
        if (localStorage.hasOwnProperty(key)) {
          total += localStorage[key].length + key.length;
        }
      }
      return `${(total / 1024).toFixed(2)} KB`;
    } catch {
      return 'Unknown';
    }
  }

  private getCurrentSessionId(): string | undefined {
    return typeof localStorage !== 'undefined' 
      ? localStorage.getItem('pcms-session-id') || undefined
      : undefined;
  }

  private getCurrentUserId(): string | undefined {
    return typeof localStorage !== 'undefined' 
      ? localStorage.getItem('pcms-user-id') || undefined
      : undefined;
  }

  private logError(error: SystemError): void {
    this.errorLog.push(error);
    
    // Keep log size manageable
    if (this.errorLog.length > 1000) {
      this.errorLog = this.errorLog.slice(-500); // Keep last 500 errors
    }

    // Console logging with appropriate level
    const logMessage = `[${error.severity.toUpperCase()}] ${error.category}: ${error.message}`;
    
    switch (error.severity) {
      case 'critical':
        console.error(logMessage, error);
        break;
      case 'high':
        console.error(logMessage, error);
        break;
      case 'medium':
        console.warn(logMessage, error);
        break;
      case 'low':
        console.info(logMessage, error);
        break;
    }
  }

  private handleGlobalError(event: ErrorEvent): void {
    const error = this.createError(
      'GLOBAL_ERROR',
      event.message || 'Unknown global error',
      'high',
      'logic',
      { filename: event.filename, lineno: event.lineno, colno: event.colno }
    );
    
    this.logError(error);
  }

  private handleUnhandledRejection(event: PromiseRejectionEvent): void {
    const error = this.createError(
      'UNHANDLED_PROMISE_REJECTION',
      event.reason?.message || 'Unhandled promise rejection',
      'high',
      'logic',
      { reason: event.reason }
    );
    
    this.logError(error);
  }

  private delay(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms));
  }
}

// Singleton instance
export const errorHandlingService = new ErrorHandlingService();

// Utility functions for common error scenarios
export const createNetworkError = (message: string, context?: unknown): SystemError => 
  errorHandlingService.createError('NETWORK_ERROR', message, 'medium', 'network', context);

export const createDatabaseError = (message: string, context?: unknown): SystemError => 
  errorHandlingService.createError('DATABASE_ERROR', message, 'high', 'database', context);

export const createValidationError = (message: string, context?: unknown): SystemError => 
  errorHandlingService.createError('VALIDATION_ERROR', message, 'low', 'validation', context);

export const createSecurityError = (message: string, context?: unknown): SystemError => 
  errorHandlingService.createError('SECURITY_ERROR', message, 'critical', 'security', context);
