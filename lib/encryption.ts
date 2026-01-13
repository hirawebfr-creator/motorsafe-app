/**
 * Client Data Encryption Module
 * 
 * Uses AES-256-GCM for authenticated encryption of sensitive client data.
 * Each encrypted value includes a unique IV for security.
 * 
 * Environment variable required: ENCRYPTION_KEY (32-byte hex string = 64 chars)
 */

import { createCipheriv, createDecipheriv, randomBytes, scryptSync } from 'crypto';

const ALGORITHM = 'aes-256-gcm';
const IV_LENGTH = 16;
const ENCODING = 'base64' as const;

// Prefix to identify encrypted values (without trailing colon - added by join)
const ENCRYPTED_PREFIX = 'enc';

/**
 * Get the encryption key from environment, derive if needed
 */
function getKey(): Buffer {
  const envKey = process.env.ENCRYPTION_KEY;
  if (!envKey) {
    throw new Error('ENCRYPTION_KEY environment variable is required for data encryption');
  }
  
  // If key is 64 hex chars (32 bytes), use directly
  if (envKey.length === 64 && /^[0-9a-fA-F]+$/.test(envKey)) {
    return Buffer.from(envKey, 'hex');
  }
  
  // Otherwise derive a key using scrypt (for passphrase-based keys)
  const salt = 'motorsafe-client-data-v1';
  return scryptSync(envKey, salt, 32);
}

/**
 * Encrypt a string value using AES-256-GCM
 * Returns: enc:<iv>:<authTag>:<ciphertext> (all base64)
 */
export function encrypt(plaintext: string): string {
  if (!plaintext || plaintext.startsWith(ENCRYPTED_PREFIX)) {
    return plaintext; // Already encrypted or empty
  }
  
  const key = getKey();
  const iv = randomBytes(IV_LENGTH);
  const cipher = createCipheriv(ALGORITHM, key, iv);
  
  const encrypted = Buffer.concat([
    cipher.update(plaintext, 'utf8'),
    cipher.final(),
  ]);
  
  const authTag = cipher.getAuthTag();
  
  return [
    ENCRYPTED_PREFIX,
    iv.toString(ENCODING),
    authTag.toString(ENCODING),
    encrypted.toString(ENCODING),
  ].join(':');
}

/**
 * Decrypt a value encrypted with encrypt()
 * Handles both old format (enc::iv:tag:data with 5 parts) and new format (enc:iv:tag:data with 4 parts)
 */
export function decrypt(encryptedValue: string): string {
  if (!encryptedValue || !encryptedValue.startsWith(ENCRYPTED_PREFIX)) {
    return encryptedValue; // Not encrypted or empty
  }
  
  const parts = encryptedValue.split(':');
  
  // Handle old format with double colon (enc::iv:tag:data = 5 parts)
  // and new format (enc:iv:tag:data = 4 parts)
  let iv: string, authTag: string, encrypted: string;
  
  if (parts.length === 5 && parts[1] === '') {
    // Old format: enc::iv:tag:data
    iv = parts[2];
    authTag = parts[3];
    encrypted = parts[4];
  } else if (parts.length === 4) {
    // New format: enc:iv:tag:data
    iv = parts[1];
    authTag = parts[2];
    encrypted = parts[3];
  } else {
    console.error('Invalid encrypted format, parts:', parts.length);
    return '[DONNÉES PROTÉGÉES]';
  }
  
  try {
    const key = getKey();
    const ivBuffer = Buffer.from(iv, ENCODING);
    const authTagBuffer = Buffer.from(authTag, ENCODING);
    const encryptedBuffer = Buffer.from(encrypted, ENCODING);
    
    const decipher = createDecipheriv(ALGORITHM, key, ivBuffer);
    decipher.setAuthTag(authTagBuffer);
    
    const decrypted = Buffer.concat([
      decipher.update(encryptedBuffer),
      decipher.final(),
    ]);
    
    return decrypted.toString('utf8');
  } catch (err) {
    console.error('Decryption failed:', err);
    return '[DONNÉES PROTÉGÉES]';
  }
}

/**
 * Check if a value is encrypted
 */
export function isEncrypted(value: string): boolean {
  return value?.startsWith(ENCRYPTED_PREFIX) ?? false;
}

/**
 * Sensitive fields that should be encrypted for Client model
 */
export const CLIENT_SENSITIVE_FIELDS = [
  'firstName',
  'lastName',
  'email',
  'phone',
  'address',
  'notes',
  'vatNumber',
] as const;

export type ClientSensitiveField = typeof CLIENT_SENSITIVE_FIELDS[number];

/**
 * Encrypt all sensitive fields in a client object
 */
export function encryptClientData<T extends Record<string, unknown>>(data: T): T {
  const result = { ...data };
  
  for (const field of CLIENT_SENSITIVE_FIELDS) {
    if (field in result && typeof result[field] === 'string' && result[field]) {
      (result as Record<string, unknown>)[field] = encrypt(result[field] as string);
    }
  }
  
  return result;
}

/**
 * Decrypt all sensitive fields in a client object
 */
export function decryptClientData<T extends Record<string, unknown>>(data: T): T {
  if (!data) return data;
  
  const result = { ...data };
  
  for (const field of CLIENT_SENSITIVE_FIELDS) {
    if (field in result && typeof result[field] === 'string' && result[field]) {
      (result as Record<string, unknown>)[field] = decrypt(result[field] as string);
    }
  }
  
  return result;
}

/**
 * Decrypt an array of client objects
 */
export function decryptClients<T extends Record<string, unknown>>(clients: T[]): T[] {
  return clients.map(decryptClientData);
}

/**
 * Generate a new encryption key (for setup)
 */
export function generateEncryptionKey(): string {
  return randomBytes(32).toString('hex');
}

/**
 * Mask sensitive data for logs (show only last 4 chars)
 */
export function maskSensitive(value: string | null | undefined): string {
  if (!value) return '***';
  if (value.length <= 4) return '***';
  return '***' + value.slice(-4);
}
