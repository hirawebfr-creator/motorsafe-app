/**
 * Yousign API v3 Client
 * Documentation: https://developers.yousign.com/docs
 */

const YOUSIGN_API_KEY = process.env.YOUSIGN_API_KEY || "";
const YOUSIGN_ENV = process.env.YOUSIGN_ENV || "sandbox";

const YOUSIGN_BASE_URL =
  YOUSIGN_ENV === "production"
    ? "https://api.yousign.app/v3"
    : "https://api-sandbox.yousign.app/v3";

// ============================================
// Types
// ============================================

export type YousignDeliveryMode = "email" | "none";

export type YousignSignatureLevel =
  | "electronic_signature"
  | "advanced_electronic_signature"
  | "advanced_electronic_signature_with_qualified_certificate"
  | "qualified_electronic_signature"
  | "qualified_electronic_signature_mode_1";

export type YousignAuthMode = "no_otp" | "otp_email" | "otp_sms";

export type YousignSignatureRequestStatus =
  | "draft"
  | "ongoing"
  | "done"
  | "declined"
  | "expired"
  | "canceled"
  | "deleted"
  | "approval";

export interface YousignFieldPosition {
  page: number;
  x: number;
  y: number;
  width?: number;
  height?: number;
}

export interface YousignSignerField {
  type: "signature" | "text" | "mention" | "checkbox" | "radio_group" | "read_only_text";
  document_id: string;
  page: number;
  x: number;
  y: number;
  width?: number;
  height?: number;
}

export interface YousignSigner {
  info: {
    first_name: string;
    last_name: string;
    email: string;
    phone_number?: string;
    locale?: "fr" | "en" | "de" | "it" | "nl" | "es" | "pl";
  };
  signature_level?: YousignSignatureLevel;
  signature_authentication_mode?: YousignAuthMode;
  fields?: YousignSignerField[];
}

export interface YousignDocument {
  id: string;
  filename: string;
  nature: string;
  content_type: string;
  sha256: string;
  is_protected: boolean;
  is_signed: boolean;
  created_at: string;
  total_pages: number;
}

export interface YousignSignatureRequest {
  id: string;
  status: YousignSignatureRequestStatus;
  name: string;
  delivery_mode: YousignDeliveryMode;
  timezone: string;
  external_id?: string;
  created_at: string;
  activated_at?: string;
  expiration_date?: string;
  documents?: YousignDocument[];
  signers?: Array<{
    id: string;
    status: string;
    info: {
      first_name: string;
      last_name: string;
      email: string;
    };
  }>;
}

export interface YousignError {
  type: string;
  detail: string;
  violations?: Array<{
    propertyPath: string;
    message: string;
  }>;
}

// ============================================
// Generic Fetch Client
// ============================================

async function yousignFetch<T>(
  endpoint: string,
  options: RequestInit = {}
): Promise<T> {
  if (!YOUSIGN_API_KEY) {
    throw new Error("YOUSIGN_API_KEY is not configured");
  }

  const url = `${YOUSIGN_BASE_URL}${endpoint}`;
  const headers: HeadersInit = {
    Authorization: `Bearer ${YOUSIGN_API_KEY}`,
    ...options.headers,
  };

  // Don't set Content-Type for FormData
  if (!(options.body instanceof FormData)) {
    (headers as Record<string, string>)["Content-Type"] = "application/json";
  }

  console.log(`[Yousign] ${options.method || "GET"} ${endpoint}`);

  const response = await fetch(url, {
    ...options,
    headers,
  });

  if (!response.ok) {
    let errorBody: YousignError | null = null;
    try {
      errorBody = await response.json();
    } catch {
      // Ignore JSON parse errors
    }

    const message = errorBody?.detail || `Yousign API error: ${response.status}`;
    console.error(`[Yousign] Error ${response.status}:`, errorBody);
    throw new Error(message);
  }

  // Handle binary responses
  const contentType = response.headers.get("content-type") || "";
  if (contentType.includes("application/pdf") || contentType.includes("application/zip") || contentType.includes("application/octet-stream")) {
    return response.arrayBuffer() as Promise<T>;
  }

  // Handle empty responses (204 No Content)
  if (response.status === 204) {
    return {} as T;
  }

  return response.json();
}

// ============================================
// Signature Request Management
// ============================================

export interface CreateSignatureRequestParams {
  name: string;
  delivery_mode?: YousignDeliveryMode;
  timezone?: string;
  external_id?: string;
  expiration_date?: string;
}

export async function createSignatureRequest(
  params: CreateSignatureRequestParams
): Promise<YousignSignatureRequest> {
  const body = {
    name: params.name,
    delivery_mode: params.delivery_mode || "email",
    timezone: params.timezone || "Europe/Paris",
    external_id: params.external_id,
    expiration_date: params.expiration_date,
  };

  return yousignFetch<YousignSignatureRequest>("/signature_requests", {
    method: "POST",
    body: JSON.stringify(body),
  });
}

// ============================================
// Document Upload
// ============================================

export interface UploadDocumentParams {
  pdfBuffer: Buffer;
  filename: string;
  nature?: "signable_document" | "attachment";
  parse_anchors?: boolean;
}

export async function uploadDocument(
  signatureRequestId: string,
  params: UploadDocumentParams
): Promise<YousignDocument> {
  const formData = new FormData();

  // Create a Blob from the buffer - convert Buffer to Uint8Array first for compatibility
  const uint8Array = new Uint8Array(params.pdfBuffer);
  const blob = new Blob([uint8Array], { type: "application/pdf" });
  formData.append("file", blob, params.filename);
  formData.append("nature", params.nature || "signable_document");

  if (params.parse_anchors) {
    formData.append("parse_anchors", "true");
  }

  return yousignFetch<YousignDocument>(
    `/signature_requests/${signatureRequestId}/documents`,
    {
      method: "POST",
      body: formData,
    }
  );
}

// ============================================
// Signer Management
// ============================================

export interface AddSignerParams {
  first_name: string;
  last_name: string;
  email: string;
  phone_number?: string;
  locale?: "fr" | "en" | "de" | "it" | "nl" | "es" | "pl";
  signature_level?: YousignSignatureLevel;
  signature_authentication_mode?: YousignAuthMode;
  fields?: YousignSignerField[];
}

export async function addSigner(
  signatureRequestId: string,
  params: AddSignerParams
): Promise<{ id: string; status: string }> {
  const body = {
    info: {
      first_name: params.first_name,
      last_name: params.last_name,
      email: params.email,
      phone_number: params.phone_number,
      locale: params.locale || "fr",
    },
    signature_level: params.signature_level || "electronic_signature",
    signature_authentication_mode: params.signature_authentication_mode || "no_otp",
    fields: params.fields,
  };

  return yousignFetch<{ id: string; status: string }>(
    `/signature_requests/${signatureRequestId}/signers`,
    {
      method: "POST",
      body: JSON.stringify(body),
    }
  );
}

// ============================================
// Activate Signature Request
// ============================================

export async function activateSignatureRequest(
  signatureRequestId: string
): Promise<YousignSignatureRequest> {
  return yousignFetch<YousignSignatureRequest>(
    `/signature_requests/${signatureRequestId}/activate`,
    {
      method: "POST",
    }
  );
}

// ============================================
// Get Signature Request
// ============================================

export async function getSignatureRequest(
  signatureRequestId: string
): Promise<YousignSignatureRequest> {
  return yousignFetch<YousignSignatureRequest>(
    `/signature_requests/${signatureRequestId}`
  );
}

// ============================================
// Download Documents
// ============================================

/**
 * Download signed documents (available when status is "done")
 * Returns a ZIP file containing all signed PDFs
 */
export async function downloadSignedDocuments(
  signatureRequestId: string
): Promise<ArrayBuffer> {
  return yousignFetch<ArrayBuffer>(
    `/signature_requests/${signatureRequestId}/documents/download`
  );
}

/**
 * Download a specific signed document
 */
export async function downloadSignedDocument(
  signatureRequestId: string,
  documentId: string
): Promise<ArrayBuffer> {
  return yousignFetch<ArrayBuffer>(
    `/signature_requests/${signatureRequestId}/documents/${documentId}/download`
  );
}

/**
 * Download audit trails (available when status is "done")
 * Returns a ZIP file containing audit trail PDFs
 */
export async function downloadAuditTrails(
  signatureRequestId: string
): Promise<ArrayBuffer> {
  return yousignFetch<ArrayBuffer>(
    `/signature_requests/${signatureRequestId}/audit_trails/download`
  );
}

// ============================================
// Cancel Signature Request
// ============================================

export async function cancelSignatureRequest(
  signatureRequestId: string,
  reason?: string
): Promise<void> {
  await yousignFetch<void>(
    `/signature_requests/${signatureRequestId}/cancel`,
    {
      method: "POST",
      body: JSON.stringify({
        reason: reason || "Annulé par l'utilisateur",
      }),
    }
  );
}

// ============================================
// Webhook Signature Verification
// ============================================

import crypto from "crypto";

/**
 * Verify Yousign webhook signature using HMAC SHA-256
 * @param rawBody - The raw request body as string
 * @param signature - The X-Yousign-Signature-256 header value
 * @param secret - The webhook secret from Yousign dashboard
 * @returns true if signature is valid
 */
export function verifyWebhookSignature(
  rawBody: string,
  signature: string,
  secret: string
): boolean {
  if (!signature || !secret) {
    console.error("[Yousign Webhook] Missing signature or secret");
    return false;
  }

  const computed = "sha256=" + crypto
    .createHmac("sha256", secret)
    .update(rawBody, "utf8")
    .digest("hex");

  // Use timing-safe comparison
  try {
    return crypto.timingSafeEqual(
      Buffer.from(computed),
      Buffer.from(signature)
    );
  } catch {
    // Lengths don't match
    return false;
  }
}

// ============================================
// Utility: Get Yousign Configuration Status
// ============================================

export function getYousignConfig() {
  return {
    isConfigured: !!YOUSIGN_API_KEY,
    environment: YOUSIGN_ENV,
    baseUrl: YOUSIGN_BASE_URL,
  };
}
