/**
 * Sentry Integration for MotorSafe
 * 
 * Provides error tracking with automatic PII redaction.
 * Areas: stripe, email, sign, pdf, zip, lookup, ai
 */
import * as Sentry from '@sentry/nextjs';
import { redactError, safeExtras } from './redact';

export type ErrorArea = 'stripe' | 'email' | 'sign' | 'pdf' | 'zip' | 'lookup' | 'ai' | 'auth' | 'db' | 'general';
export type ErrorSeverity = 'info' | 'warning' | 'error' | 'fatal';

interface CaptureOptions {
  area: ErrorArea;
  severity?: ErrorSeverity;
  extras?: Record<string, unknown>;
  tags?: Record<string, string>;
  /** User ID (not email) for tracking without PII */
  userId?: string;
  /** Garage ID for tenant context */
  garageId?: number;
}

/**
 * Capture an error with proper redaction and tagging
 */
export function captureError(error: Error, options: CaptureOptions): string {
  const { area, severity = 'error', extras = {}, tags = {}, userId, garageId } = options;
  
  // Redact the error message and extras
  const redactedError = redactError(error);
  const redactedExtras = safeExtras(extras);
  
  // Set scope for this error
  Sentry.withScope((scope) => {
    // Set tags for filtering
    scope.setTag('area', area);
    scope.setTag('severity', severity);
    
    // Add custom tags
    for (const [key, value] of Object.entries(tags)) {
      scope.setTag(key, value);
    }
    
    // Set user context without PII
    if (userId || garageId) {
      scope.setUser({
        id: userId,
        // Use garageId as segment for filtering by tenant
        segment: garageId ? `garage-${garageId}` : undefined,
      });
    }
    
    // Add redacted extras
    scope.setExtras(redactedExtras);
    
    // Set level based on severity
    switch (severity) {
      case 'fatal':
        scope.setLevel('fatal');
        break;
      case 'error':
        scope.setLevel('error');
        break;
      case 'warning':
        scope.setLevel('warning');
        break;
      case 'info':
        scope.setLevel('info');
        break;
    }
    
    // Capture the redacted error
    Sentry.captureException(redactedError);
  });
  
  // Return the error ID for reference
  return Sentry.lastEventId() || 'unknown';
}

/**
 * Capture a message (not an error)
 */
export function captureMessage(
  message: string,
  options: Omit<CaptureOptions, 'severity'> & { severity?: 'info' | 'warning' }
): void {
  const { area, severity = 'info', extras = {}, tags = {}, userId, garageId } = options;
  
  // Redact message
  const redactedMessage = message.replace(/[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}/gi, '[EMAIL]');
  
  Sentry.withScope((scope) => {
    scope.setTag('area', area);
    scope.setLevel(severity);
    
    for (const [key, value] of Object.entries(tags)) {
      scope.setTag(key, value);
    }
    
    if (userId || garageId) {
      scope.setUser({
        id: userId,
        segment: garageId ? `garage-${garageId}` : undefined,
      });
    }
    
    scope.setExtras(safeExtras(extras));
    
    Sentry.captureMessage(redactedMessage);
  });
}

/**
 * Add a breadcrumb (with redaction)
 */
export function addBreadcrumb(
  message: string,
  category: ErrorArea,
  data?: Record<string, unknown>
): void {
  Sentry.addBreadcrumb({
    message: message.replace(/[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}/gi, '[EMAIL]'),
    category,
    data: data ? safeExtras(data) : undefined,
    level: 'info',
  });
}

/**
 * Set user context (without PII)
 */
export function setUserContext(userId: string, garageId?: number): void {
  Sentry.setUser({
    id: userId,
    segment: garageId ? `garage-${garageId}` : undefined,
  });
}

/**
 * Clear user context (on logout)
 */
export function clearUserContext(): void {
  Sentry.setUser(null);
}

// Re-export Sentry for direct access when needed
export { Sentry };
