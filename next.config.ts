import type { NextConfig } from "next";

// Content Security Policy - allows scripts/styles from self and trusted sources
// Note: 'unsafe-inline' needed for Next.js inline styles and some scripts
const cspValue = [
  "default-src 'self'",
  "script-src 'self' 'unsafe-inline' 'unsafe-eval'", // unsafe-eval for dev mode
  "style-src 'self' 'unsafe-inline'",
  "img-src 'self' data: https: blob:",
  "font-src 'self' data:",
  "connect-src 'self' https://api.resend.com https://api.openai.com https://api.anthropic.com",
  "frame-ancestors 'none'", // Stricter than X-Frame-Options
  "base-uri 'self'",
  "form-action 'self'",
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
  // Permissions Policy - disable sensitive features
  {
    key: "Permissions-Policy",
    value: "camera=(), microphone=(), geolocation=(), payment=()",
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

export default nextConfig;
