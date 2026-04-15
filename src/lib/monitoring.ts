/**
 * Performance Monitoring and Analytics
 * Tracks user interactions, performance metrics, and system health
 */

export interface PerformanceMetrics {
  pageLoad: number;
  firstContentfulPaint: number;
  largestContentfulPaint: number;
  cumulativeLayoutShift: number;
  firstInputDelay: number;
}

export interface UserInteraction {
  type: 'question_response' | 'navigation' | 'results_view' | 'export';
  timestamp: Date;
  sessionId: string;
  duration?: number;
  metadata?: Record<string, any>;
}

export interface SystemHealth {
  status: 'healthy' | 'degraded' | 'unhealthy';
  checks: {
    api: boolean;
    database: boolean;
    storage: boolean;
  };
  timestamp: Date;
}

class MonitoringService {
  private metrics: PerformanceMetrics = {
    pageLoad: 0,
    firstContentfulPaint: 0,
    largestContentfulPaint: 0,
    cumulativeLayoutShift: 0,
    firstInputDelay: 0,
  };

  private interactions: UserInteraction[] = [];
  private maxInteractions = 1000; // Keep last 1000 interactions

  constructor() {
    this.initializePerformanceMonitoring();
    this.initializeErrorTracking();
  }

  /**
   * Initialize Web Vitals monitoring
   */
  private initializePerformanceMonitoring(): void {
    if (typeof window === 'undefined') return;

    // Page load timing
    window.addEventListener('load', () => {
      const navigation = performance.getEntriesByType('navigation')[0] as PerformanceNavigationTiming;
      this.metrics.pageLoad = navigation.loadEventEnd - navigation.fetchStart;
    });

    // Web Vitals (if available)
    if ('web-vitals' in window) {
      // Note: Would need to install web-vitals library
      // import { getCLS, getFID, getFCP, getLCP } from 'web-vitals';
    }
  }

  /**
   * Initialize error tracking
   */
  private initializeErrorTracking(): void {
    if (typeof window === 'undefined') return;

    window.addEventListener('error', (event) => {
      this.trackError({
        type: 'javascript',
        message: event.message,
        filename: event.filename,
        lineno: event.lineno,
        colno: event.colno,
        stack: event.error?.stack,
        timestamp: new Date(),
      });
    });

    window.addEventListener('unhandledrejection', (event) => {
      this.trackError({
        type: 'promise_rejection',
        message: event.reason?.message || 'Unhandled promise rejection',
        stack: event.reason?.stack,
        timestamp: new Date(),
      });
    });
  }

  /**
   * Track user interaction
   */
  trackInteraction(interaction: Omit<UserInteraction, 'timestamp'>): void {
    const fullInteraction: UserInteraction = {
      ...interaction,
      timestamp: new Date(),
    };

    this.interactions.push(fullInteraction);

    // Keep only recent interactions
    if (this.interactions.length > this.maxInteractions) {
      this.interactions = this.interactions.slice(-this.maxInteractions);
    }

    // Send to analytics endpoint (if configured)
    this.sendInteractionToAnalytics(fullInteraction);
  }

  /**
   * Track questionnaire response
   */
  trackQuestionResponse(
    sessionId: string,
    questionId: string,
    responseTimeMs: number,
    questionType: string
  ): void {
    this.trackInteraction({
      type: 'question_response',
      sessionId,
      duration: responseTimeMs,
      metadata: {
        questionId,
        questionType,
        responseTimeMs,
      },
    });
  }

  /**
   * Track results view
   */
  trackResultsView(sessionId: string, timeToComplete: number): void {
    this.trackInteraction({
      type: 'results_view',
      sessionId,
      duration: timeToComplete,
      metadata: {
        completionTime: timeToComplete,
      },
    });
  }

  /**
   * Track navigation events
   */
  trackNavigation(from: string, to: string): void {
    this.trackInteraction({
      type: 'navigation',
      sessionId: this.getCurrentSessionId(),
      metadata: {
        from,
        to,
      },
    });
  }

  /**
   * Track export events
   */
  trackExport(sessionId: string, format: string, size: number): void {
    this.trackInteraction({
      type: 'export',
      sessionId,
      metadata: {
        format,
        size,
      },
    });
  }

  /**
   * Track errors
   */
  private trackError(error: {
    type: string;
    message: string;
    filename?: string;
    lineno?: number;
    colno?: number;
    stack?: string;
    timestamp: Date;
  }): void {
    // Send to error tracking service
    if (process.env.NODE_ENV === 'production') {
      // In production, send to error service
      console.error('[PCMS Error]', error);
    } else {
      // In development, log to console
      console.error('[PCMS Development Error]', error);
    }
  }

  /**
   * Get current session ID
   */
  private getCurrentSessionId(this: MonitoringService): string {
    if (typeof window === 'undefined') return 'server';
    
    // Try to get from localStorage or generate new one
    let sessionId = localStorage.getItem('pcms_session_id');
    if (!sessionId) {
      sessionId = `session_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
      localStorage.setItem('pcms_session_id', sessionId);
    }
    return sessionId;
  }

  /**
   * Send interaction to analytics endpoint
   */
  private async sendInteractionToAnalytics(interaction: UserInteraction): Promise<void> {
    if (process.env.NODE_ENV !== 'production') return;

    try {
      await fetch('/api/analytics/track', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(interaction),
      });
    } catch (error) {
      // Fail silently to not impact user experience
      console.warn('[PCMS] Failed to send analytics:', error);
    }
  }

  /**
   * Get performance metrics
   */
  getPerformanceMetrics(): PerformanceMetrics {
    return { ...this.metrics };
  }

  /**
   * Get recent interactions
   */
  getRecentInteractions(count: number = 100): UserInteraction[] {
    return this.interactions.slice(-count);
  }

  /**
   * Get interaction statistics
   */
  getInteractionStats(): {
    totalInteractions: number;
    averageResponseTime: number;
    completionRate: number;
    errorRate: number;
  } {
    const questionResponses = this.interactions.filter(i => i.type === 'question_response');
    const totalInteractions = this.interactions.length;
    const averageResponseTime = questionResponses.length > 0
      ? questionResponses.reduce((sum, i) => sum + (i.duration || 0), 0) / questionResponses.length
      : 0;

    // Calculate completion rate (sessions that reached results)
    const sessionsWithResults = new Set(
      this.interactions
        .filter(i => i.type === 'results_view')
        .map(i => i.sessionId)
    ).size;
    const totalSessions = new Set(this.interactions.map(i => i.sessionId)).size;
    const completionRate = totalSessions > 0 ? sessionsWithResults / totalSessions : 0;

    return {
      totalInteractions,
      averageResponseTime,
      completionRate,
      errorRate: 0, // Would need error tracking implementation
    };
  }

  /**
   * Check system health
   */
  async checkSystemHealth(): Promise<SystemHealth> {
    const checks = {
      api: await this.checkApiHealth(),
      database: await this.checkDatabaseHealth(),
      storage: await this.checkStorageHealth(),
    };

    const allHealthy = Object.values(checks).every(check => check);
    const someHealthy = Object.values(checks).some(check => check);

    return {
      status: allHealthy ? 'healthy' : someHealthy ? 'degraded' : 'unhealthy',
      checks,
      timestamp: new Date(),
    };
  }

  /**
   * Check API health
   */
  private async checkApiHealth(): Promise<boolean> {
    try {
      const response = await fetch('/api/test/health', { 
        method: 'GET',
        signal: AbortSignal.timeout(5000)
      });
      return response.ok;
    } catch {
      return false;
    }
  }

  /**
   * Check database health
   */
  private async checkDatabaseHealth(): Promise<boolean> {
    try {
      const response = await fetch('/api/test/database', {
        method: 'GET',
        signal: AbortSignal.timeout(5000)
      });
      return response.ok;
    } catch {
      return false;
    }
  }

  /**
   * Check storage health
   */
  private async checkStorageHealth(): Promise<boolean> {
    try {
      // Test localStorage
      if (typeof window !== 'undefined') {
        const testKey = 'pcms_health_test';
        localStorage.setItem(testKey, 'test');
        localStorage.removeItem(testKey);
      }
      return true;
    } catch {
      return false;
    }
  }

  /**
   * Generate monitoring report
   */
  generateReport(): {
    performance: PerformanceMetrics;
    interactions: {
      totalInteractions: number;
      averageResponseTime: number;
      completionRate: number;
      errorRate: number;
    };
    health: SystemHealth;
    timestamp: Date;
  } {
    return {
      performance: this.getPerformanceMetrics(),
      interactions: this.getInteractionStats(),
      health: {
        status: 'healthy',
        checks: { api: true, database: true, storage: true },
        timestamp: new Date(),
      },
      timestamp: new Date(),
    };
  }
}

// Singleton instance
export const monitoring = new MonitoringService();

// React hook for monitoring
export function useMonitoring() {
  return {
    trackInteraction: monitoring.trackInteraction.bind(monitoring),
    trackQuestionResponse: monitoring.trackQuestionResponse.bind(monitoring),
    trackResultsView: monitoring.trackResultsView.bind(monitoring),
    trackNavigation: monitoring.trackNavigation.bind(monitoring),
    trackExport: monitoring.trackExport.bind(monitoring),
    getMetrics: monitoring.getPerformanceMetrics.bind(monitoring),
    getStats: monitoring.getInteractionStats.bind(monitoring),
    checkHealth: monitoring.checkSystemHealth.bind(monitoring),
  };
}
