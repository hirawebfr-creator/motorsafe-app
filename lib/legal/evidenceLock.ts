/**
 * EVIDENCE-LOCKDOWN-01: Evidence Lock for Dispute Mode
 *
 * When an intervention has disputeStatus = "OPEN":
 * - BLOCKED: Edit/Delete of documents, quotes, invoices, attachments
 * - ALLOWED: Append-only operations (add proof, addendum, audit events)
 *
 * This module provides guards and helpers for enforcing evidence lockdown.
 */

import { prisma } from "@/lib/prisma";
import { RouteError } from "@/lib/routeErrors";

// ============================================================================
// TYPES
// ============================================================================

export type EvidenceAction =
  | "EDIT"
  | "DELETE"
  | "ADD_PROOF"
  | "ADD_ADDENDUM"
  | "ADD_AUDIT_EVENT"
  | "GENERATE_PDF"
  | "EXPORT";

interface InterventionLockInfo {
  id: string;
  disputeStatus: string | null;
  disputeOpenedAt: Date | null;
  garageId: number | null;
}

// ============================================================================
// CORE FUNCTIONS
// ============================================================================

/**
 * Check if an intervention is locked (dispute OPEN).
 * Returns lock info or null if not found.
 */
export async function getInterventionLockStatus(
  interventionId: string
): Promise<InterventionLockInfo | null> {
  const intervention = await prisma.intervention.findUnique({
    where: { id: interventionId },
    select: {
      id: true,
      disputeStatus: true,
      disputeOpenedAt: true,
      garageId: true,
    },
  });
  return intervention;
}

/**
 * Check if intervention is currently locked.
 */
export function isLocked(lockInfo: InterventionLockInfo | null): boolean {
  return lockInfo?.disputeStatus === "OPEN";
}

/**
 * Quick check: is intervention ID locked?
 */
export async function isInterventionLocked(interventionId: string): Promise<boolean> {
  const info = await getInterventionLockStatus(interventionId);
  return isLocked(info);
}

/**
 * Determine if an action is allowed given lock status.
 * - EDIT/DELETE: blocked if locked
 * - ADD_PROOF/ADD_ADDENDUM/ADD_AUDIT_EVENT: always allowed (append-only)
 * - GENERATE_PDF: allowed (creates new version, doesn't modify existing)
 * - EXPORT: always allowed
 */
export function isActionAllowed(action: EvidenceAction, locked: boolean): boolean {
  if (!locked) return true;

  switch (action) {
    case "EDIT":
    case "DELETE":
      return false;

    case "ADD_PROOF":
    case "ADD_ADDENDUM":
    case "ADD_AUDIT_EVENT":
    case "GENERATE_PDF":
    case "EXPORT":
      return true;

    default:
      return false;
  }
}

/**
 * Assert that an action is allowed on an intervention.
 * Throws RouteError(409 CONFLICT) if locked and action not permitted.
 */
export async function assertNotLocked(
  interventionId: string,
  action: EvidenceAction,
  entityName = "élément"
): Promise<void> {
  const info = await getInterventionLockStatus(interventionId);
  const locked = isLocked(info);

  if (!isActionAllowed(action, locked)) {
    throw new RouteError(
      409,
      "EVIDENCE_LOCKED",
      `Impossible de modifier cet ${entityName} : un litige est ouvert sur cette intervention. Les preuves sont gelées.`
    );
  }
}

/**
 * Assert that action is allowed given pre-fetched lock status.
 * Use this when you already have the intervention data.
 */
export function assertNotLockedSync(
  disputeStatus: string | null | undefined,
  action: EvidenceAction,
  entityName = "élément"
): void {
  const locked = disputeStatus === "OPEN";

  if (!isActionAllowed(action, locked)) {
    throw new RouteError(
      409,
      "EVIDENCE_LOCKED",
      `Impossible de modifier cet ${entityName} : un litige est ouvert sur cette intervention. Les preuves sont gelées.`
    );
  }
}

// ============================================================================
// DOCUMENT-SPECIFIC HELPERS
// ============================================================================

/**
 * Get lock status for a document by looking up its intervention.
 */
export async function getDocumentLockStatus(
  documentId: string
): Promise<{ locked: boolean; interventionId: string | null }> {
  const doc = await prisma.document.findUnique({
    where: { id: documentId },
    select: {
      interventionId: true,
      intervention: {
        select: { disputeStatus: true },
      },
    },
  });

  if (!doc) {
    return { locked: false, interventionId: null };
  }

  return {
    locked: doc.intervention?.disputeStatus === "OPEN",
    interventionId: doc.interventionId,
  };
}

/**
 * Assert document can be edited/deleted.
 */
export async function assertDocumentNotLocked(
  documentId: string,
  action: "EDIT" | "DELETE"
): Promise<void> {
  const { locked } = await getDocumentLockStatus(documentId);

  if (locked) {
    throw new RouteError(
      409,
      "EVIDENCE_LOCKED",
      `Impossible de ${action === "DELETE" ? "supprimer" : "modifier"} ce document : un litige est ouvert sur l'intervention associée. Les preuves sont gelées.`
    );
  }
}

// ============================================================================
// QUOTE/INVOICE HELPERS
// ============================================================================

/**
 * Check if a quote is locked via its linked intervention (if any).
 * Quotes without intervention link are not locked.
 */
export async function isQuoteLocked(_quoteId: string): Promise<boolean> {
  // Quotes don't have direct interventionId, but may be linked via vehicle -> interventions
  // For now, quotes are not locked by intervention dispute
  // Future: if quote is explicitly linked to intervention, check that
  return false;
}

/**
 * Check if an invoice is locked via its linked intervention (if any).
 */
export async function isInvoiceLocked(_invoiceId: string): Promise<boolean> {
  // Same as quotes - no direct link currently
  return false;
}

// ============================================================================
// BULK HELPERS
// ============================================================================

/**
 * Get all locked intervention IDs for a garage.
 */
export async function getLockedInterventionIds(garageId: number): Promise<Set<string>> {
  const locked = await prisma.intervention.findMany({
    where: {
      garageId,
      disputeStatus: "OPEN",
    },
    select: { id: true },
  });
  return new Set(locked.map((i) => i.id));
}

/**
 * Filter out documents that are locked (for bulk operations).
 */
export async function filterUnlockedDocuments(
  documentIds: string[]
): Promise<{ allowed: string[]; blocked: string[] }> {
  const docs = await prisma.document.findMany({
    where: { id: { in: documentIds } },
    select: {
      id: true,
      intervention: {
        select: { disputeStatus: true },
      },
    },
  });

  const allowed: string[] = [];
  const blocked: string[] = [];

  for (const doc of docs) {
    if (doc.intervention?.disputeStatus === "OPEN") {
      blocked.push(doc.id);
    } else {
      allowed.push(doc.id);
    }
  }

  return { allowed, blocked };
}
