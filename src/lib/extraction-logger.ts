export interface LogEntry {
  timestamp: string;
  level: 'INFO' | 'WARN' | 'ERROR' | 'DEBUG';
  platform?: string;
  operation: string;
  message: string;
  details?: any;
  duration_ms?: number;
}

/**
 * Logger utility for extraction operations
 */
export class ExtractionLogger {
  private static instance: ExtractionLogger;
  
  private constructor() {}
  
  static getInstance(): ExtractionLogger {
    if (!ExtractionLogger.instance) {
      ExtractionLogger.instance = new ExtractionLogger();
    }
    return ExtractionLogger.instance;
  }
  
  private log(entry: LogEntry) {
    const logMessage = `[${entry.timestamp}] ${entry.level} - ${entry.operation}: ${entry.message}`;
    
    switch (entry.level) {
      case 'ERROR':
        console.error(logMessage, entry.details || '');
        break;
      case 'WARN':
        console.warn(logMessage, entry.details || '');
        break;
      case 'DEBUG':
        if (process.env.NODE_ENV === 'development') {
          console.debug(logMessage, entry.details || '');
        }
        break;
      default:
        console.log(logMessage, entry.details || '');
    }
  }
  
  info(operation: string, message: string, details?: any, platform?: string) {
    this.log({
      timestamp: new Date().toISOString(),
      level: 'INFO',
      operation,
      message,
      details,
      platform
    });
  }
  
  warn(operation: string, message: string, details?: any, platform?: string) {
    this.log({
      timestamp: new Date().toISOString(),
      level: 'WARN',
      operation,
      message,
      details,
      platform
    });
  }
  
  error(operation: string, message: string, details?: any, platform?: string) {
    this.log({
      timestamp: new Date().toISOString(),
      level: 'ERROR',
      operation,
      message,
      details,
      platform
    });
  }
  
  debug(operation: string, message: string, details?: any, platform?: string) {
    this.log({
      timestamp: new Date().toISOString(),
      level: 'DEBUG',
      operation,
      message,
      details,
      platform
    });
  }
  
  /**
   * Log extraction attempt with timing
   */
  extractionStart(platform: string, id: string, url: string) {
    this.info(
      'extraction_start',
      `Starting extraction for ${platform}`,
      { id, url },
      platform
    );
  }
  
  /**
   * Log successful extraction
   */
  extractionSuccess(platform: string, id: string, duration_ms: number, savedPath: string) {
    this.info(
      'extraction_success',
      `Successfully extracted ${platform} content`,
      { id, duration_ms, savedPath },
      platform
    );
  }
  
  /**
   * Log extraction failure
   */
  extractionFailure(platform: string, id: string, error: Error, duration_ms: number) {
    this.error(
      'extraction_failure',
      `Failed to extract ${platform} content: ${error.message}`,
      { id, error: error.stack, duration_ms },
      platform
    );
  }
  
  /**
   * Log retry attempt
   */
  retryAttempt(operation: string, attempt: number, maxRetries: number, error: Error) {
    this.warn(
      'retry_attempt',
      `Retry ${attempt}/${maxRetries} for ${operation}: ${error.message}`,
      { attempt, maxRetries, error: error.message }
    );
  }
  
  /**
   * Log API rate limiting
   */
  rateLimited(platform: string, retryAfter?: number) {
    this.warn(
      'rate_limited',
      `Rate limited by ${platform} API`,
      { retryAfter },
      platform
    );
  }
  
  /**
   * Log environment issues
   */
  environmentIssue(issue: string, details?: any) {
    this.warn(
      'environment_issue',
      issue,
      details
    );
  }
}

// Export singleton instance
export const logger = ExtractionLogger.getInstance();