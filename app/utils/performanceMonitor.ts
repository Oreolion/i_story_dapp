/**
 * In-memory performance statistics tracker for analysis operations.
 * Tracks timing, success rates, and percentile distributions.
 */

interface PerformanceRecord {
  duration: number;
  success: boolean;
  timestamp: number;
}

export interface PerformanceStats {
  operation: string;
  count: number;
  successCount: number;
  failureCount: number;
  successRate: number;
  avgDuration: number;
  minDuration: number;
  maxDuration: number;
  p50: number;
  p95: number;
  p99: number;
  lastRecordedAt: string | null;
}

const MAX_RECORDS_PER_OP = 1000;
const records: Map<string, PerformanceRecord[]> = new Map();

/**
 * Calculate percentile from a sorted array of numbers.
 * @param sorted - Array of numbers sorted in ascending order
 * @param p - Percentile to calculate (0-100)
 */
function percentile(sorted: number[], p: number): number {
  if (sorted.length === 0) return 0;
  const idx = Math.ceil((p / 100) * sorted.length) - 1;
  return sorted[Math.max(0, idx)];
}

export const performanceMonitor = {
  /**
   * Record a performance measurement for an operation.
   * @param operation - Name of the operation (e.g., 'full_analysis', 'gemini_call', 'db_upsert')
   * @param duration - Duration in milliseconds
   * @param success - Whether the operation succeeded
   */
  record(operation: string, duration: number, success: boolean): void {
    if (!records.has(operation)) {
      records.set(operation, []);
    }

    const opRecords = records.get(operation)!;
    opRecords.push({
      duration,
      success,
      timestamp: Date.now(),
    });

    // Circular buffer: keep only last MAX_RECORDS_PER_OP
    if (opRecords.length > MAX_RECORDS_PER_OP) {
      opRecords.shift();
    }
  },

  /**
   * Get performance statistics for a specific operation.
   * @param operation - Name of the operation
   */
  getStats(operation: string): PerformanceStats | null {
    const opRecords = records.get(operation);
    if (!opRecords || opRecords.length === 0) return null;

    const durations = opRecords.map(r => r.duration).sort((a, b) => a - b);
    const successCount = opRecords.filter(r => r.success).length;
    const failureCount = opRecords.length - successCount;
    const lastRecord = opRecords[opRecords.length - 1];

    return {
      operation,
      count: opRecords.length,
      successCount,
      failureCount,
      successRate: opRecords.length > 0 ? successCount / opRecords.length : 0,
      avgDuration: durations.length > 0
        ? Math.round(durations.reduce((a, b) => a + b, 0) / durations.length)
        : 0,
      minDuration: durations.length > 0 ? durations[0] : 0,
      maxDuration: durations.length > 0 ? durations[durations.length - 1] : 0,
      p50: percentile(durations, 50),
      p95: percentile(durations, 95),
      p99: percentile(durations, 99),
      lastRecordedAt: lastRecord
        ? new Date(lastRecord.timestamp).toISOString()
        : null,
    };
  },

  /**
   * Get performance statistics for all tracked operations.
   */
  getAllStats(): PerformanceStats[] {
    return Array.from(records.keys())
      .map(op => this.getStats(op))
      .filter((s): s is PerformanceStats => s !== null);
  },

  /**
   * Get list of all tracked operation names.
   */
  getOperations(): string[] {
    return Array.from(records.keys());
  },

  /**
   * Get raw records for an operation (useful for custom analysis).
   * @param operation - Name of the operation
   * @param count - Number of recent records to return (default: all)
   */
  getRecords(operation: string, count?: number): PerformanceRecord[] {
    const opRecords = records.get(operation);
    if (!opRecords) return [];
    return count ? opRecords.slice(-count) : [...opRecords];
  },

  /**
   * Clear all performance records (useful for testing).
   */
  clear(): void {
    records.clear();
  },

  /**
   * Clear records for a specific operation.
   * @param operation - Name of the operation to clear
   */
  clearOperation(operation: string): void {
    records.delete(operation);
  }
};

/**
 * Helper class for measuring operation duration with automatic recording.
 * Usage:
 *   const timer = new OperationTimer('gemini_call');
 *   // ... do work ...
 *   timer.stop(true); // records success
 */
export class OperationTimer {
  private operation: string;
  private startTime: number;
  private stopped: boolean = false;

  constructor(operation: string) {
    this.operation = operation;
    this.startTime = Date.now();
  }

  /**
   * Stop the timer and record the measurement.
   * @param success - Whether the operation succeeded
   * @returns Duration in milliseconds
   */
  stop(success: boolean): number {
    if (this.stopped) {
      throw new Error('Timer already stopped');
    }
    this.stopped = true;
    const duration = Date.now() - this.startTime;
    performanceMonitor.record(this.operation, duration, success);
    return duration;
  }

  /**
   * Get elapsed time without stopping the timer.
   */
  elapsed(): number {
    return Date.now() - this.startTime;
  }
}
