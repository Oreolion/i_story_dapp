/**
 * Structured logging utility for story analysis operations.
 * Maintains an in-memory circular buffer of the last MAX_LOGS entries.
 */

export interface AnalysisLog {
  timestamp: string;
  level: 'info' | 'warn' | 'error';
  storyId: string;
  action: string;
  duration?: number;
  error?: string;
  metadata?: Record<string, unknown>;
}

const MAX_LOGS = 1000;
const logs: AnalysisLog[] = [];

function addLog(
  level: AnalysisLog['level'],
  storyId: string,
  action: string,
  duration?: number,
  error?: string,
  metadata?: Record<string, unknown>
): void {
  const log: AnalysisLog = {
    timestamp: new Date().toISOString(),
    level,
    storyId,
    action,
    ...(duration !== undefined && { duration }),
    ...(error && { error }),
    ...(metadata && Object.keys(metadata).length > 0 && { metadata }),
  };

  logs.push(log);

  // Circular buffer: remove oldest when exceeding MAX_LOGS
  if (logs.length > MAX_LOGS) {
    logs.shift();
  }

  // Also log to console for dev visibility
  const consoleMethod = level === 'error'
    ? console.error
    : level === 'warn'
      ? console.warn
      : console.log;

  const logParts = [`[Analysis:${level.toUpperCase()}]`, storyId, action];
  if (duration !== undefined) logParts.push(`${duration}ms`);
  if (error) logParts.push(`Error: ${error}`);
  if (metadata && Object.keys(metadata).length > 0) {
    logParts.push(JSON.stringify(metadata));
  }

  consoleMethod(...logParts);
}

export const analysisLogger = {
  /**
   * Log an informational message about analysis progress.
   */
  info(storyId: string, action: string, metadata?: Record<string, unknown>): void {
    addLog('info', storyId, action, undefined, undefined, metadata);
  },

  /**
   * Log a warning about non-critical issues during analysis.
   */
  warn(storyId: string, action: string, metadata?: Record<string, unknown>): void {
    addLog('warn', storyId, action, undefined, undefined, metadata);
  },

  /**
   * Log an error that occurred during analysis.
   */
  error(storyId: string, action: string, error: string, metadata?: Record<string, unknown>): void {
    addLog('error', storyId, action, undefined, error, metadata);
  },

  /**
   * Log a timed operation with its duration.
   */
  timed(storyId: string, action: string, duration: number, metadata?: Record<string, unknown>): void {
    addLog('info', storyId, action, duration, undefined, metadata);
  },

  /**
   * Get the most recent logs.
   * @param count - Number of logs to return (default: 100)
   */
  getRecentLogs(count: number = 100): AnalysisLog[] {
    return logs.slice(-count);
  },

  /**
   * Get the most recent error logs.
   * @param count - Number of error logs to return (default: 50)
   */
  getErrorLogs(count: number = 50): AnalysisLog[] {
    return logs.filter(l => l.level === 'error').slice(-count);
  },

  /**
   * Get logs filtered by story ID.
   * @param storyId - The story ID to filter by
   */
  getLogsByStoryId(storyId: string): AnalysisLog[] {
    return logs.filter(l => l.storyId === storyId);
  },

  /**
   * Get total log count.
   */
  getLogCount(): number {
    return logs.length;
  },

  /**
   * Clear all logs (useful for testing).
   */
  clear(): void {
    logs.length = 0;
  }
};
