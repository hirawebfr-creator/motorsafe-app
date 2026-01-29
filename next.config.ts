import type { NextConfig } from "next";
import { withSentryConfig } from "@sentry/nextjs";

// Content Security Policy - allows scripts/styles from self and trusted sources
// Note: 'unsafe-inline' needed for Next.js inline styles and some scripts
const cspValue = [
  "default-src 'self'",
  "script-src 'self' 'unsafe-inline' 'unsafe-eval' https://js.stripe.com",
  "style-src 'self' 'unsafe-inline'",
  "img-src 'self' data: https: blob:",
  "font-src 'self' data:",
  "connect-src 'self' https://api.resend.com https://api.openai.com https://api.anthropic.com https://*.ingest.sentry.io https://api.stripe.com https://js.stripe.com",
  "frame-src 'self' https://js.stripe.com https://hooks.stripe.com",
  "frame-ancestors 'none'",
  "base-uri 'self'",
  "form-action 'self' https://checkout.stripe.com",
  "upgrade-insecure-requests",
].join("; ");

const securityHeaders = [
  // Prevent MIME type sniffing
  {
    key: "X-Content-Type-Options",
    value: "nosniff",
  },
  // Referrer policy - send origin only for cross-origin, full URL for same-origin
  {
    key: "Referrer-Policy",
    value: "strict-origin-when-cross-origin",
  },
  // Prevent clickjacking - allow embedding only from same origin
  {
    key: "X-Frame-Options",
    value: "DENY",
  },
  // XSS protection (legacy, but still useful for older browsers)
  {
    key: "X-XSS-Protection",
    value: "1; mode=block",
  },
  // Permissions Policy - disable sensitive features (except payment for Stripe)
  {
    key: "Permissions-Policy",
    value: "camera=(), microphone=(), geolocation=()",
  },
  // Content Security Policy
  {
    key: "Content-Security-Policy",
    value: cspValue,
  },
];

// HSTS header for production only (forces HTTPS)
const hstsHeader = {
  key: "Strict-Transport-Security",
  value: "max-age=31536000; includeSubDomains; preload",
};

const nextConfig: NextConfig = {
  async headers() {
    const isProduction = process.env.NODE_ENV === "production";
    const headers = isProduction
      ? [...securityHeaders, hstsHeader]
      : securityHeaders;

    return [
      {
        // Apply security headers to all routes
        source: "/:path*",
        headers,
      },
    ];
  },
};

// Sentry configuration
const sentryConfig = {
  // For all available options, see:
  // https://github.com/getsentry/sentry-webpack-plugin#options
  org: process.env.SENTRY_ORG,
  project: process.env.SENTRY_PROJECT,
  
  // Only upload source maps in production
  silent: !process.env.CI,
  
  // Upload source maps for better error traces
  widenClientFileUpload: true,
  
  // Hides source maps from generated client bundles
  hideSourceMaps: true,
  
  // Automatically tree-shake Sentry logger statements
  disableLogger: true,
  
  // Enables automatic instrumentation of Vercel Cron Monitors
  automaticVercelMonitors: false,
};

// Only wrap with Sentry if DSN is configured
const exportedConfig = process.env.SENTRY_DSN || process.env.NEXT_PUBLIC_SENTRY_DSN
  ? withSentryConfig(nextConfig, sentryConfig)
  : nextConfig;

export default exportedConfig;
