/**
 * PII Redaction for Observability
 * 
 * CRITICAL: Never log client data (emails, phones, plates, VIN, names)
 * This module provides safe redaction for Sentry and internal logs.
 */

// Patterns for PII detection
const PII_PATTERNS = {
  // Email addresses
  email: /[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}/gi,
  
  // French phone numbers (various formats)
  phone: /(?:\+33|0033|0)[1-9](?:[\s.-]?\d{2}){4}/g,
  
  // French license plates (AA-123-BB, AB-123-CD, 123-AB-45)
  plate: /\b[A-Z]{2}[-\s]?\d{3}[-\s]?[A-Z]{2}\b|\b\d{1,4}[-\s]?[A-Z]{1,3}[-\s]?\d{2}\b/gi,
  
  // VIN (17 characters alphanumeric, no I, O, Q)
  vin: /\b[A-HJ-NPR-Z0-9]{17}\b/gi,
  
  // Names (basic pattern - capitalized words that might be names)
  // Only applied to known name fields, not general text
  potentialName: /\b[A-ZÀÂÄÉÈÊËÏÎÔÙÛÜŸŒÆÇ][a-zàâäéèêëïîôùûüÿœæç]+(?:\s+[A-ZÀÂÄÉÈÊËÏÎÔÙÛÜŸŒÆÇ][a-zàâäéèêëïîôùûüÿœæç]+)+\b/g,
  
  // SIRET/SIREN
  siret: /\b\d{14}\b|\b\d{9}\b/g,
  
  // Credit card (basic detection)
  creditCard: /\b\d{4}[\s-]?\d{4}[\s-]?\d{4}[\s-]?\d{4}\b/g,
  
  // IBAN
  iban: /\b[A-Z]{2}\d{2}[\s]?([A-Z0-9]{4}[\s]?){4,7}[A-Z0-9]{1,4}\b/gi,
};

// Fields that should always be redacted
const SENSITIVE_FIELD_NAMES = [
  'email', 'mail', 'courriel',
  'phone', 'tel', 'telephone', 'mobile', 'portable',
  'plate', 'plaque', 'immatriculation', 'registration',
  'vin', 'vehicleVin', 'numSerie',
  'name', 'nom', 'prenom', 'firstName', 'lastName', 'fullName',
  'siret', 'siren',
  'address', 'adresse', 'rue', 'street',
  'password', 'motDePasse', 'pwd', 'secret',
  'token', 'apiKey', 'accessToken', 'refreshToken',
  'creditCard', 'cardNumber', 'cvv', 'cvc',
  'iban', 'bic', 'bankAccount',
  'signerEmail', 'signerName', 'signerNameDeclared',
  'clientName', 'clientEmail', 'clientPhone',
  'ownerName', 'ownerEmail',
];

/**
 * Redact a single string value
 */
export function redactString(value: string): string {
  let redacted = value;
  
  // Apply all PII patterns
  redacted = redacted.replace(PII_PATTERNS.email, '[EMAIL_REDACTED]');
  redacted = redacted.replace(PII_PATTERNS.phone, '[PHONE_REDACTED]');
  redacted = redacted.replace(PII_PATTERNS.plate, '[PLATE_REDACTED]');
  redacted = redacted.replace(PII_PATTERNS.vin, '[VIN_REDACTED]');
  redacted = redacted.replace(PII_PATTERNS.siret, '[SIRET_REDACTED]');
  redacted = redacted.replace(PII_PATTERNS.creditCard, '[CARD_REDACTED]');
  redacted = redacted.replace(PII_PATTERNS.iban, '[IBAN_REDACTED]');
  
  return redacted;
}

/**
 * Check if a field name is sensitive
 */
function isSensitiveField(fieldName: string): boolean {
  const lower = fieldName.toLowerCase();
  return SENSITIVE_FIELD_NAMES.some(sensitive => 
    lower.includes(sensitive.toLowerCase())
  );
}

/**
 * Redact an object deeply, removing PII from values
 */
export function redactObject<T>(obj: T, depth = 0): T {
  // Prevent infinite recursion
  if (depth > 10) return '[MAX_DEPTH]' as T;
  
  if (obj === null || obj === undefined) return obj;
  
  if (typeof obj === 'string') {
    return redactString(obj) as T;
  }
  
  if (typeof obj === 'number' || typeof obj === 'boolean') {
    return obj;
  }
  
  if (Array.isArray(obj)) {
    return obj.map(item => redactObject(item, depth + 1)) as T;
  }
  
  if (typeof obj === 'object') {
    const redacted: Record<string, unknown> = {};
    
    for (const [key, value] of Object.entries(obj)) {
      // Completely redact sensitive field names
      if (isSensitiveField(key)) {
        redacted[key] = '[REDACTED]';
      } else if (typeof value === 'string') {
        redacted[key] = redactString(value);
      } else if (typeof value === 'object' && value !== null) {
        redacted[key] = redactObject(value, depth + 1);
      } else {
        redacted[key] = value;
      }
    }
    
    return redacted as T;
  }
  
  return obj;
}

/**
 * Redact error object for Sentry
 */
export function redactError(error: Error): Error {
  const redactedMessage = redactString(error.message);
  const redactedStack = error.stack ? redactString(error.stack) : undefined;
  
  const redactedError = new Error(redactedMessage);
  redactedError.name = error.name;
  if (redactedStack) {
    redactedError.stack = redactedStack;
  }
  
  return redactedError;
}

/**
 * Create safe extras for Sentry context
 */
export function safeExtras(extras: Record<string, unknown>): Record<string, unknown> {
  return redactObject(extras);
}

/**
 * Safe console.error wrapper that redacts PII
 */
export function safeLogError(message: string, ...args: unknown[]): void {
  const redactedMessage = redactString(message);
  const redactedArgs = args.map(arg => {
    if (typeof arg === 'string') return redactString(arg);
    if (typeof arg === 'object' && arg !== null) return redactObject(arg);
    return arg;
  });
  
  console.error(redactedMessage, ...redactedArgs);
}

/**
 * Create a breadcrumb message without PII
 */
export function safeBreadcrumb(message: string, data?: Record<string, unknown>): {
  message: string;
  data?: Record<string, unknown>;
} {
  return {
    message: redactString(message),
    data: data ? redactObject(data) : undefined,
  };
}
