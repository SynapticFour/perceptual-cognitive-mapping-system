/**
 * Worker Manager - Manages Web Workers for computational tasks
 */

import type { WorkerMessage, WorkerResponse } from './worker';

export class WorkerManager {
  private workers: Map<string, Worker> = new Map();
  private pendingTasks: Map<string, {
    resolve: (value: any) => void;
    reject: (error: Error) => void;
    timeout: NodeJS.Timeout;
  }> = new Map();
  private workerPool: Worker[] = [];
  private maxWorkers = 2;
  private taskQueue: Array<{
    message: WorkerMessage;
    resolve: (value: any) => void;
    reject: (error: Error) => void;
  }> = [];

  constructor() {
    this.initializeWorkerPool();
  }

  /**
   * Initialize worker pool
   */
  private initializeWorkerPool(): void {
    for (let i = 0; i < this.maxWorkers; i++) {
      const worker = new Worker(new URL('./worker.ts', import.meta.url));
      worker.onmessage = this.handleWorkerMessage.bind(this);
      worker.onerror = this.handleWorkerError.bind(this);
      this.workerPool.push(worker);
    }
  }

  /**
   * Handle worker messages
   */
  private handleWorkerMessage(event: MessageEvent<WorkerResponse>): void {
    const { id, result, error } = event.data;
    const pending = this.pendingTasks.get(id);

    if (pending) {
      clearTimeout(pending.timeout);
      this.pendingTasks.delete(id);

      if (error) {
        pending.reject(new Error(error));
      } else {
        pending.resolve(result);
      }
    }
  }

  /**
   * Handle worker errors
   */
  private handleWorkerError(event: ErrorEvent): void {
    console.error('[WorkerManager] Worker error:', event.error);
    
    // Reject all pending tasks for this worker
    for (const [id, task] of this.pendingTasks.entries()) {
      task.reject(new Error('Worker error occurred'));
      clearTimeout(task.timeout);
    }
    this.pendingTasks.clear();
  }

  /**
   * Execute task using worker pool
   */
  async executeTask<T>(type: WorkerMessage['type'], data: any): Promise<T> {
    return new Promise<T>((resolve, reject) => {
      const id = `task_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
      const message: WorkerMessage = { type, data, id };

      // Add timeout
      const timeout = setTimeout(() => {
        this.pendingTasks.delete(id);
        reject(new Error('Task timeout'));
      }, 30000); // 30 second timeout

      this.pendingTasks.set(id, { resolve, reject, timeout });

      // Try to execute immediately if worker available
      if (this.workerPool.length > 0) {
        const worker = this.workerPool.pop()!;
        worker.postMessage(message);
      } else {
        // Queue task if no workers available
        this.taskQueue.push({ message, resolve, reject });
      }
    });
  }

  /**
   * Return worker to pool
   */
  private returnWorkerToPool(worker: Worker): void {
    if (this.taskQueue.length > 0) {
      // Execute next queued task
      const task = this.taskQueue.shift()!;
      worker.postMessage(task.message);
      this.pendingTasks.set(task.message.id, {
        resolve: task.resolve,
        reject: task.reject,
        timeout: setTimeout(() => {
          this.pendingTasks.delete(task.message.id);
          task.reject(new Error('Task timeout'));
        }, 30000),
      });
    } else {
      // Return to pool
      this.workerPool.push(worker);
    }
  }

  /**
   * Calculate PCA using worker
   */
  async calculatePCA(data: number[][]): Promise<{
    components: number[][];
    explainedVariance: number[];
    mean: number[];
  }> {
    return this.executeTask('pca_calculation', data);
  }

  /**
   * Calculate density grid using worker
   */
  async calculateDensityGrid(
    points: { x: number; y: number }[],
    width: number,
    height: number,
    cellSize: number
  ): Promise<{
    grid: number[][];
    cols: number;
    rows: number;
  }> {
    return this.executeTask('density_grid', { points, width, height, cellSize });
  }

  /**
   * Mine patterns using worker
   */
  async minePatterns(data: any[]): Promise<{
    patterns: Array<{
      type: string;
      confidence: number;
      items: any[];
    }>;
  }> {
    return this.executeTask('pattern_mining', data);
  }

  /**
   * Get worker pool status
   */
  getStatus(): {
    activeWorkers: number;
    queuedTasks: number;
    pendingTasks: number;
  } {
    return {
      activeWorkers: this.maxWorkers - this.workerPool.length,
      queuedTasks: this.taskQueue.length,
      pendingTasks: this.pendingTasks.size,
    };
  }

  /**
   * Cleanup workers
   */
  terminate(): void {
    // Clear all pending tasks
    for (const [id, task] of this.pendingTasks.entries()) {
      task.reject(new Error('Worker manager terminated'));
      clearTimeout(task.timeout);
    }
    this.pendingTasks.clear();

    // Reject queued tasks
    for (const task of this.taskQueue) {
      task.reject(new Error('Worker manager terminated'));
    }
    this.taskQueue.length = 0;

    // Terminate all workers
    for (const worker of this.workerPool) {
      worker.terminate();
    }
    this.workerPool.length = 0;
  }
}

// Singleton instance
export const workerManager = new WorkerManager();

// React hook for worker operations
export function useWorkerManager() {
  return {
    calculatePCA: workerManager.calculatePCA.bind(workerManager),
    calculateDensityGrid: workerManager.calculateDensityGrid.bind(workerManager),
    minePatterns: workerManager.minePatterns.bind(workerManager),
    getStatus: workerManager.getStatus.bind(workerManager),
  };
}
