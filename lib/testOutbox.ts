/**
 * Test Outbox - In-memory storage for mock emails
 * Used in test mode to capture sent emails for verification
 */

export interface TestEmail {
  id: string;
  to: string;
  subject: string;
  html: string;
  sentAt: Date;
  metadata?: Record<string, unknown>;
}

// In-memory storage (cleared between test runs)
const outbox: TestEmail[] = [];

/**
 * Add an email to the test outbox
 */
export function addToOutbox(email: Omit<TestEmail, "id" | "sentAt">): TestEmail {
  const entry: TestEmail = {
    ...email,
    id: `test_${Date.now()}_${Math.random().toString(36).slice(2)}`,
    sentAt: new Date(),
  };
  outbox.push(entry);
  return entry;
}

/**
 * Get all emails from the outbox
 */
export function getOutbox(): TestEmail[] {
  return [...outbox];
}

/**
 * Get emails sent to a specific address
 */
export function getEmailsTo(to: string): TestEmail[] {
  return outbox.filter((e) => e.to.toLowerCase() === to.toLowerCase());
}

/**
 * Find email containing a specific string in HTML body
 */
export function findEmailContaining(substring: string): TestEmail | undefined {
  return outbox.find((e) => e.html.includes(substring));
}

/**
 * Extract signing URL from an email body
 */
export function extractSigningUrl(email: TestEmail): string | null {
  // Look for href="...sign/..." pattern
  const match = email.html.match(/href="([^"]*\/sign\/[^"]*)"/);
  return match ? match[1] : null;
}

/**
 * Clear the outbox (call between tests)
 */
export function clearOutbox(): void {
  outbox.length = 0;
}

/**
 * Get the last email sent
 */
export function getLastEmail(): TestEmail | undefined {
  return outbox[outbox.length - 1];
}

/**
 * Check if test mode is enabled
 */
export function isTestMode(): boolean {
  return process.env.EMAIL_PROVIDER === "mock" || process.env.NODE_ENV === "test";
}
