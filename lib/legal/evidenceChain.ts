/**
 * LEGAL-RETENTION-01: EvidenceChain - Tamper-evident hash chain
 * 
 * Each entry contains hash of (previous_hash + payload) creating a chain.
 * Any tampering breaks the chain - detectible by verification.
 * 
 * Used for:
 * - Dispute snapshots (intervention state at dispute open)
 * - GDPR actions (anonymization, data export)
 * - Critical legal events (signature overrides, etc.)
 */

import { prisma } from "@/lib/prisma";
import { createHash } from "crypto";

export type EvidenceEventType = 
  | "dispute_open"
  | "dispute_close"
  | "anonymize"
  | "export"
  | "snapshot"
  | "signature_void"
  | "data_rectification";

export type EvidenceEntityType = 
  | "intervention"
  | "client"
  | "signature"
  | "invoice"
  | "quote";

export interface EvidenceContext {
  userId?: string;
  ip?: string;
  userAgent?: string;
  reason?: string;
}

/**
 * Compute SHA256 hash of a string
 */
function sha256(data: string): string {
  return createHash("sha256").update(data, "utf8").digest("hex");
}

/**
 * Add a new entry to the evidence chain for an entity.
 * Automatically links to previous entry (if any) creating tamper-evident chain.
 */
export async function addEvidenceEntry(params: {
  garageId: number;
  entityType: EvidenceEntityType;
  entityId: string;
  eventType: EvidenceEventType;
  payload: Record<string, unknown>;
  context?: EvidenceContext;
}): Promise<{ id: string; chainHash: string }> {
  const { garageId, entityType, entityId, eventType, payload, context } = params;

  // Find the previous entry in the chain for this entity
  const previousEntry = await prisma.evidenceChain.findFirst({
    where: { garageId, entityType, entityId },
    orderBy: { createdAt: "desc" },
    select: { chainHash: true },
  });

  // Serialize payload deterministically (sorted keys)
  const payloadStr = JSON.stringify(payload, Object.keys(payload).sort());
  const payloadHash = sha256(payloadStr);

  // Chain hash = SHA256(previousHash + payloadHash)
  const previousHash = previousEntry?.chainHash ?? null;
  const chainInput = (previousHash ?? "GENESIS") + payloadHash;
  const chainHash = sha256(chainInput);

  // Create the new entry
  const entry = await prisma.evidenceChain.create({
    data: {
      garageId,
      entityType,
      entityId,
      eventType,
      payload: payloadStr,
      payloadHash,
      previousHash,
      chainHash,
      userId: context?.userId ?? null,
      ip: context?.ip ?? null,
      userAgent: context?.userAgent ?? null,
      reason: context?.reason ?? null,
    },
    select: { id: true, chainHash: true },
  });

  return entry;
}

/**
 * Verify the integrity of the evidence chain for an entity.
 * Returns true if chain is intact, false if tampering detected.
 */
export async function verifyEvidenceChain(params: {
  garageId: number;
  entityType: EvidenceEntityType;
  entityId: string;
}): Promise<{ valid: boolean; entries: number; brokenAt?: string }> {
  const { garageId, entityType, entityId } = params;

  const entries = await prisma.evidenceChain.findMany({
    where: { garageId, entityType, entityId },
    orderBy: { createdAt: "asc" },
    select: {
      id: true,
      payload: true,
      payloadHash: true,
      previousHash: true,
      chainHash: true,
    },
  });

  if (entries.length === 0) {
    return { valid: true, entries: 0 };
  }

  let expectedPreviousHash: string | null = null;

  for (const entry of entries) {
    // Verify payload hash
    const computedPayloadHash = sha256(entry.payload);
    if (computedPayloadHash !== entry.payloadHash) {
      return { valid: false, entries: entries.length, brokenAt: entry.id };
    }

    // Verify previous hash reference
    if (entry.previousHash !== expectedPreviousHash) {
      return { valid: false, entries: entries.length, brokenAt: entry.id };
    }

    // Verify chain hash
    const chainInput = (expectedPreviousHash ?? "GENESIS") + entry.payloadHash;
    const computedChainHash = sha256(chainInput);
    if (computedChainHash !== entry.chainHash) {
      return { valid: false, entries: entries.length, brokenAt: entry.id };
    }

    // Move to next entry
    expectedPreviousHash = entry.chainHash;
  }

  return { valid: true, entries: entries.length };
}

/**
 * Get full evidence chain for an entity (for legal export).
 */
export async function getEvidenceChain(params: {
  garageId: number;
  entityType: EvidenceEntityType;
  entityId: string;
}) {
  const { garageId, entityType, entityId } = params;

  return prisma.evidenceChain.findMany({
    where: { garageId, entityType, entityId },
    orderBy: { createdAt: "asc" },
    select: {
      id: true,
      eventType: true,
      payload: true,
      payloadHash: true,
      previousHash: true,
      chainHash: true,
      userId: true,
      ip: true,
      reason: true,
      createdAt: true,
    },
  });
}

/**
 * Create a snapshot of an intervention for dispute/legal purposes.
 * Includes all related data: documents, signatures, revisions.
 */
export async function createInterventionSnapshot(interventionId: string): Promise<Record<string, unknown>> {
  const intervention = await prisma.intervention.findUnique({
    where: { id: interventionId },
    include: {
      vehicle: {
        select: {
          id: true,
          brand: true,
          model: true,
          plate: true,
          vin: true,
          fuel: true,
          year: true,
          engine: true,
        },
      },
      documents: {
        select: {
          id: true,
          type: true,
          category: true,
          fileName: true,
          fileUrl: true,
          createdAt: true,
        },
      },
      revisions: {
        orderBy: { createdAt: "asc" },
        select: {
          id: true,
          hash: true,
          payload: true,
          createdAt: true,
          createdBy: true,
        },
      },
      downloadTokens: {
        select: {
          id: true,
          purpose: true,
          createdAt: true,
          usedAt: true,
        },
      },
    },
  });

  if (!intervention) {
    throw new Error(`Intervention ${interventionId} not found`);
  }

  // Get related signature requests
  const signatures = await prisma.signatureRequest.findMany({
    where: { documentId: interventionId },
    select: {
      id: true,
      documentType: true,
      status: true,
      signerNameDeclared: true,
      signedAt: true,
      sentAt: true,
      revision: true,
      signedPdfHash: true,
      legalSnapshotHash: true,
    },
  });

  return {
    intervention: {
      id: intervention.id,
      garageId: intervention.garageId,
      vehicleId: intervention.vehicleId,
      type: intervention.type,
      status: intervention.status,
      title: intervention.title,
      notes: intervention.notes,
      tags: intervention.tags,
      hash: intervention.hash,
      payload: intervention.payload,
      createdAt: intervention.createdAt.toISOString(),
      updatedAt: intervention.updatedAt.toISOString(),
      closedAt: intervention.closedAt?.toISOString() ?? null,
      performedAt: intervention.performedAt?.toISOString() ?? null,
      odometerKm: intervention.odometerKm,
      agreementAt: intervention.agreementAt?.toISOString() ?? null,
      agreementMethod: intervention.agreementMethod,
      intakeNotes: intervention.intakeNotes,
      workNotes: intervention.workNotes,
      partsNotes: intervention.partsNotes,
    },
    vehicle: intervention.vehicle,
    documents: intervention.documents.map(d => ({
      ...d,
      createdAt: d.createdAt.toISOString(),
    })),
    revisions: intervention.revisions.map(r => ({
      ...r,
      createdAt: r.createdAt.toISOString(),
    })),
    signatures: signatures.map(s => ({
      ...s,
      signedAt: s.signedAt?.toISOString() ?? null,
      sentAt: s.sentAt?.toISOString() ?? null,
    })),
    downloadTokens: intervention.downloadTokens.map(t => ({
      ...t,
      createdAt: t.createdAt.toISOString(),
      usedAt: t.usedAt?.toISOString() ?? null,
    })),
    snapshotVersion: "1.0",
    snapshotAt: new Date().toISOString(),
  };
}

/**
 * Create a snapshot of a client for GDPR export.
 * Includes all related data: vehicles, interventions (IDs only), quotes, invoices.
 */
export async function createClientSnapshot(clientId: number): Promise<Record<string, unknown>> {
  const client = await prisma.client.findUnique({
    where: { id: clientId },
    include: {
      vehicles: {
        select: {
          id: true,
          brand: true,
          model: true,
          plate: true,
          vin: true,
          fuel: true,
          year: true,
          engine: true,
          createdAt: true,
          interventions: {
            select: {
              id: true,
              type: true,
              status: true,
              title: true,
              createdAt: true,
              closedAt: true,
            },
          },
        },
      },
      quotes: {
        select: {
          id: true,
          quoteNumber: true,
          status: true,
          totalIncl: true,
          createdAt: true,
        },
      },
      invoices: {
        select: {
          id: true,
          invoiceNumber: true,
          status: true,
          totalIncl: true,
          createdAt: true,
        },
      },
    },
  });

  if (!client) {
    throw new Error(`Client ${clientId} not found`);
  }

  return {
    client: {
      id: client.id,
      garageId: client.garageId,
      firstName: client.firstName,
      lastName: client.lastName,
      email: client.email,
      phone: client.phone,
      address: client.address,
      notes: client.notes,
      vatProfile: client.vatProfile,
      vatNumber: client.vatNumber,
      countryCode: client.countryCode,
      createdAt: client.createdAt.toISOString(),
      updatedAt: client.updatedAt.toISOString(),
    },
    vehicles: client.vehicles.map(v => ({
      ...v,
      createdAt: v.createdAt.toISOString(),
      interventions: v.interventions.map(i => ({
        ...i,
        createdAt: i.createdAt.toISOString(),
        closedAt: i.closedAt?.toISOString() ?? null,
      })),
    })),
    quotes: client.quotes.map(q => ({
      ...q,
      createdAt: q.createdAt.toISOString(),
    })),
    invoices: client.invoices.map(i => ({
      ...i,
      createdAt: i.createdAt.toISOString(),
    })),
    snapshotVersion: "1.0",
    snapshotAt: new Date().toISOString(),
  };
}
