/**
 * Centralized Error Tracking
 * 
 * Captures errors to both Sentry and SystemEvent for admin visibility.
 * NO PII is logged.
 */
import { prisma } from '@/lib/prisma';
import { captureError, ErrorArea, ErrorSeverity } from './sentry';
import { redactString, safeExtras } from './redact';

interface ErrorContext {
  area: ErrorArea;
  severity?: ErrorSeverity;
  userId?: string;
  garageId?: number;
  /** Additional metadata (will be redacted) */
  metadata?: Record<string, unknown>;
  /** Operation being performed */
  operation?: string;
}

/**
 * Track an error to Sentry + SystemEvent
 * Returns the Sentry event ID for reference
 */
export async function trackError(
  error: Error,
  context: ErrorContext
): Promise<string> {
  const { area, severity = 'error', userId, garageId, metadata = {}, operation } = context;
  
  // 1. Capture to Sentry
  const sentryEventId = captureError(error, {
    area,
    severity,
    userId,
    garageId,
    extras: {
      operation,
      ...metadata,
    },
  });
  
  // 2. Log to SystemEvent (for admin dashboard)
  try {
    await prisma.systemEvent.create({
      data: {
        type: severity === 'fatal' ? 'alert' : 'health_check',
        service: area,
        status: severity === 'fatal' ? 'down' : 'degraded',
        message: redactString(error.message).slice(0, 255),
        metadata: safeExtras({
          sentryEventId,
          operation,
          garageId,
          errorName: error.name,
          ...metadata,
        }) as never,
      },
    });
  } catch {
    // Don't fail if logging fails
    console.error('[Observability] Failed to log to SystemEvent');
  }
  
  // 3. Also log to console (redacted)
  console.error(
    `[${area.toUpperCase()}] ${operation || 'Error'}:`,
    redactString(error.message)
  );
  
  return sentryEventId;
}

/**
 * Wrapper for critical operations that need tracking
 */
export async function withErrorTracking<T>(
  operation: string,
  area: ErrorArea,
  fn: () => Promise<T>,
  context?: Partial<ErrorContext>
): Promise<T> {
  try {
    return await fn();
  } catch (error) {
    await trackError(error instanceof Error ? error : new Error(String(error)), {
      area,
      operation,
      ...context,
    });
    throw error;
  }
}

/**
 * Log a critical error (FATAL level - triggers alerts)
 */
export async function trackCriticalError(
  error: Error,
  area: ErrorArea,
  operation: string,
  metadata?: Record<string, unknown>
): Promise<string> {
  return trackError(error, {
    area,
    severity: 'fatal',
    operation,
    metadata,
  });
}

/**
 * Track a warning (non-critical but noteworthy)
 */
export async function trackWarning(
  message: string,
  area: ErrorArea,
  metadata?: Record<string, unknown>
): Promise<void> {
  const redactedMessage = redactString(message);
  
  try {
    await prisma.systemEvent.create({
      data: {
        type: 'health_check',
        service: area,
        status: 'ok',
        message: `[WARN] ${redactedMessage}`.slice(0, 255),
        metadata: metadata ? (safeExtras(metadata) as never) : undefined,
      },
    });
  } catch {
    // Silent fail
  }
}

// Export for convenience
export { captureError } from './sentry';
