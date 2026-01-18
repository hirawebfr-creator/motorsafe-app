// This file configures the initialization of Sentry on the client.
// The config you add here will be used whenever a users loads a page in their browser.
// https://docs.sentry.io/platforms/javascript/guides/nextjs/

import * as Sentry from "@sentry/nextjs";

const SENTRY_DSN = process.env.NEXT_PUBLIC_SENTRY_DSN;

if (SENTRY_DSN) {
  Sentry.init({
    dsn: SENTRY_DSN,

    // Environment
    environment: process.env.NEXT_PUBLIC_SENTRY_ENVIRONMENT || process.env.NODE_ENV,

    // Performance Monitoring
    tracesSampleRate: 0.1, // 10% of transactions

    // Session Replay (disabled by default - can enable for debugging)
    replaysSessionSampleRate: 0,
    replaysOnErrorSampleRate: 0.1, // 10% of errors get replay

    // Don't send PII
    sendDefaultPii: false,

    // Before sending, ensure no PII leaks
    beforeSend(event) {
      // Redact any potential PII in the event
      if (event.message) {
        event.message = redactMessage(event.message);
      }
      
      if (event.exception?.values) {
        for (const exception of event.exception.values) {
          if (exception.value) {
            exception.value = redactMessage(exception.value);
          }
        }
      }
      
      // Remove any user email/name that might have slipped through
      if (event.user) {
        delete event.user.email;
        delete event.user.username;
        delete event.user.ip_address;
      }
      
      return event;
    },

    // Filter breadcrumbs
    beforeBreadcrumb(breadcrumb) {
      // Redact URLs that might contain tokens or IDs
      if (breadcrumb.data?.url) {
        breadcrumb.data.url = redactUrl(breadcrumb.data.url as string);
      }
      if (breadcrumb.message) {
        breadcrumb.message = redactMessage(breadcrumb.message);
      }
      return breadcrumb;
    },

    // Ignore common non-actionable errors
    ignoreErrors: [
      // Browser extensions
      /Extensions/,
      /extension/,
      // Network errors from user's connection
      'Failed to fetch',
      'Load failed',
      'NetworkError',
      // User navigation
      'AbortError',
      // Safari specific
      'cancelled',
    ],
  });
}

// Redaction helpers (client-side versions)
function redactMessage(message: string): string {
  return message
    .replace(/[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}/gi, '[EMAIL]')
    .replace(/(?:\+33|0033|0)[1-9](?:[\s.-]?\d{2}){4}/g, '[PHONE]')
    .replace(/\b[A-Z]{2}[-\s]?\d{3}[-\s]?[A-Z]{2}\b/gi, '[PLATE]')
    .replace(/\b[A-HJ-NPR-Z0-9]{17}\b/gi, '[VIN]');
}

function redactUrl(url: string): string {
  try {
    const parsed = new URL(url, window.location.origin);
    // Redact tokens in paths
    const redactedPath = parsed.pathname
      .replace(/\/sign\/[a-zA-Z0-9_-]+/g, '/sign/[TOKEN]')
      .replace(/\/download\/[a-z]+\/[a-zA-Z0-9_-]+/g, '/download/[TYPE]/[TOKEN]');
    parsed.pathname = redactedPath;
    // Remove all query params (might contain sensitive data)
    parsed.search = '';
    return parsed.toString();
  } catch {
    return '[INVALID_URL]';
  }
}
