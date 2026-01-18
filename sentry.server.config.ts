// This file configures the initialization of Sentry on the server.
// The config you add here will be used whenever the server handles a request.
// https://docs.sentry.io/platforms/javascript/guides/nextjs/

import * as Sentry from "@sentry/nextjs";

const SENTRY_DSN = process.env.SENTRY_DSN;

if (SENTRY_DSN) {
  Sentry.init({
    dsn: SENTRY_DSN,

    // Environment
    environment: process.env.SENTRY_ENVIRONMENT || process.env.NODE_ENV,

    // Performance Monitoring
    tracesSampleRate: 0.1, // 10% of transactions

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

      // Redact request body if present
      if (event.request?.data) {
        event.request.data = '[REDACTED]';
      }
      
      return event;
    },

    // Filter breadcrumbs
    beforeBreadcrumb(breadcrumb) {
      if (breadcrumb.message) {
        breadcrumb.message = redactMessage(breadcrumb.message);
      }
      if (breadcrumb.data) {
        // Redact any URLs or data that might contain PII
        const data = breadcrumb.data as Record<string, unknown>;
        if (typeof data.url === 'string') {
          data.url = redactUrl(data.url);
        }
        if (typeof data.body === 'string') {
          data.body = '[REDACTED]';
        }
      }
      return breadcrumb;
    },

    // Ignore common non-actionable errors
    ignoreErrors: [
      // Prisma connection issues (handled elsewhere)
      'PrismaClientInitializationError',
      // Rate limit (expected behavior)
      'RATE_LIMIT',
    ],
  });
}

// Redaction helpers (server-side versions)
function redactMessage(message: string): string {
  return message
    .replace(/[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}/gi, '[EMAIL]')
    .replace(/(?:\+33|0033|0)[1-9](?:[\s.-]?\d{2}){4}/g, '[PHONE]')
    .replace(/\b[A-Z]{2}[-\s]?\d{3}[-\s]?[A-Z]{2}\b/gi, '[PLATE]')
    .replace(/\b[A-HJ-NPR-Z0-9]{17}\b/gi, '[VIN]')
    .replace(/\b\d{14}\b/g, '[SIRET]');
}

function redactUrl(url: string): string {
  return url
    .replace(/\/sign\/[a-zA-Z0-9_-]+/g, '/sign/[TOKEN]')
    .replace(/\/download\/[a-z]+\/[a-zA-Z0-9_-]+/g, '/download/[TYPE]/[TOKEN]')
    .replace(/token=[a-zA-Z0-9_-]+/gi, 'token=[REDACTED]');
}
