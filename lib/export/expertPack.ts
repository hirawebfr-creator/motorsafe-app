/**
 * INSURANCE-READY-EXPORT-03: Expert Pack Data Collection
 * 
 * Collects and structures data for the Expert Dossier PDF:
 * - Timeline of events (reception, diagnosis, work, delivery)
 * - Key photos with metadata
 * - Q&A standardized section
 * - Integrity references
 */

import { prisma } from "@/lib/prisma";

// ============================================
// TYPES
// ============================================

export interface TimelineItem {
  timestamp: Date;
  eventType: string;
  title: string;
  description: string;
  author: string; // "GARAGE" | "SYSTEM" | "CLIENT"
  attachmentRef?: string; // e.g., "PHOTO-03", "DOC-OR-V1"
}

export interface PhotoItem {
  id: string;
  url: string;
  category: string; // "ENTREE", "SORTIE", "DIAGNOSTIC", "PIECES"
  fileName: string;
  createdAt: Date;
  sizeBytes: number;
  reference: string; // e.g., "PHOTO-01"
}

export interface QAItem {
  question: string;
  answer: string;
  source: string; // Which field the answer came from
}

export interface ExpertPackData {
  timeline: TimelineItem[];
  photos: PhotoItem[];
  qa: QAItem[];
  summary: {
    motif: string;
    interventionType: string;
    result: string;
    signedDocsCount: number;
  };
}

// ============================================
// TIMELINE BUILDER
// ============================================

export async function buildExpertTimeline(
  interventionId: string,
  garageId: number
): Promise<TimelineItem[]> {
  const intervention = await prisma.intervention.findFirst({
    where: { id: interventionId, garageId, deletedAt: null },
    select: {
      id: true,
      createdAt: true,
      performedAt: true,
      closedAt: true,
      status: true,
      type: true,
      tags: true,
      notes: true,
      intakeNotes: true,
      workNotes: true,
      partsNotes: true,
      agreementAt: true,
      agreementMethod: true,
      odometerKm: true,
      repairOrder: {
        select: { id: true, createdAt: true, signedAt: true },
      },
      returnReport: {
        select: { id: true, createdAt: true, signedAt: true, notes: true },
      },
      documents: {
        where: { deletedAt: null },
        select: { id: true, type: true, category: true, fileName: true, createdAt: true },
        orderBy: { createdAt: "asc" },
      },
      vehicle: {
        select: { plate: true, brand: true, model: true },
      },
    },
  });

  if (!intervention) return [];

  const timeline: TimelineItem[] = [];

  // 1. Creation / Reception
  timeline.push({
    timestamp: intervention.createdAt,
    eventType: "RECEPTION",
    title: "Réception du véhicule",
    description: `${intervention.vehicle.brand || ""} ${intervention.vehicle.model || ""} - ${intervention.vehicle.plate}${intervention.odometerKm ? ` - ${intervention.odometerKm.toLocaleString("fr-FR")} km` : ""}`,
    author: "GARAGE",
  });

  // 2. Intake notes
  if (intervention.intakeNotes) {
    timeline.push({
      timestamp: intervention.createdAt,
      eventType: "INTAKE_NOTES",
      title: "Notes de réception",
      description: intervention.intakeNotes,
      author: "GARAGE",
    });
  }

  // 3. Photos at intake
  const entryPhotos = intervention.documents.filter(
    (d) => d.category === "ENTREE" && d.type === "UPLOAD"
  );
  if (entryPhotos.length > 0) {
    timeline.push({
      timestamp: entryPhotos[0].createdAt,
      eventType: "PHOTOS_ENTREE",
      title: `Photos réception (${entryPhotos.length})`,
      description: entryPhotos.map((p) => p.fileName).slice(0, 3).join(", ") + (entryPhotos.length > 3 ? "..." : ""),
      author: "GARAGE",
      attachmentRef: `PHOTOS-ENTREE (${entryPhotos.length})`,
    });
  }

  // 4. Diagnostic docs
  const diagDocs = intervention.documents.filter((d) => d.category === "DIAGNOSTIC");
  if (diagDocs.length > 0) {
    timeline.push({
      timestamp: diagDocs[0].createdAt,
      eventType: "DIAGNOSTIC",
      title: "Diagnostic effectué",
      description: `${diagDocs.length} document(s) de diagnostic`,
      author: "GARAGE",
      attachmentRef: `DIAG-${diagDocs.length}`,
    });
  }

  // 5. Client agreement
  if (intervention.agreementAt) {
    timeline.push({
      timestamp: intervention.agreementAt,
      eventType: "AGREEMENT",
      title: "Accord client obtenu",
      description: `Méthode: ${intervention.agreementMethod || "Non précisé"}`,
      author: "CLIENT",
    });
  }

  // 6. Repair Order created
  if (intervention.repairOrder) {
    timeline.push({
      timestamp: intervention.repairOrder.createdAt,
      eventType: "REPAIR_ORDER_CREATED",
      title: "Ordre de réparation créé",
      description: "Document OR généré",
      author: "GARAGE",
      attachmentRef: "DOC-OR",
    });

    if (intervention.repairOrder.signedAt) {
      timeline.push({
        timestamp: intervention.repairOrder.signedAt,
        eventType: "REPAIR_ORDER_SIGNED",
        title: "Ordre de réparation signé",
        description: "Signature client confirmée",
        author: "CLIENT",
        attachmentRef: "DOC-OR-SIGNED",
      });
    }
  }

  // 7. Work notes
  if (intervention.workNotes) {
    timeline.push({
      timestamp: intervention.performedAt || intervention.createdAt,
      eventType: "WORK_PERFORMED",
      title: "Travaux effectués",
      description: intervention.workNotes,
      author: "GARAGE",
    });
  }

  // 8. Parts notes
  if (intervention.partsNotes) {
    timeline.push({
      timestamp: intervention.performedAt || intervention.createdAt,
      eventType: "PARTS_REPLACED",
      title: "Pièces remplacées",
      description: intervention.partsNotes,
      author: "GARAGE",
    });
  }

  // 9. Exit photos
  const exitPhotos = intervention.documents.filter(
    (d) => d.category === "SORTIE" && d.type === "UPLOAD"
  );
  if (exitPhotos.length > 0) {
    timeline.push({
      timestamp: exitPhotos[0].createdAt,
      eventType: "PHOTOS_SORTIE",
      title: `Photos restitution (${exitPhotos.length})`,
      description: exitPhotos.map((p) => p.fileName).slice(0, 3).join(", ") + (exitPhotos.length > 3 ? "..." : ""),
      author: "GARAGE",
      attachmentRef: `PHOTOS-SORTIE (${exitPhotos.length})`,
    });
  }

  // 10. Return Report
  if (intervention.returnReport) {
    timeline.push({
      timestamp: intervention.returnReport.createdAt,
      eventType: "RETURN_REPORT_CREATED",
      title: "PV de restitution créé",
      description: intervention.returnReport.notes || "Véhicule prêt pour restitution",
      author: "GARAGE",
      attachmentRef: "DOC-PV",
    });

    if (intervention.returnReport.signedAt) {
      timeline.push({
        timestamp: intervention.returnReport.signedAt,
        eventType: "RETURN_REPORT_SIGNED",
        title: "PV de restitution signé",
        description: "Kilométrage sortie: voir PV de restitution",
        author: "CLIENT",
        attachmentRef: "DOC-PV-SIGNED",
      });
    }
  }

  // 11. Intervention closed
  if (intervention.closedAt) {
    timeline.push({
      timestamp: intervention.closedAt,
      eventType: "CLOSED",
      title: "Intervention clôturée",
      description: `Statut final: ${intervention.status}`,
      author: "GARAGE",
    });
  }

  // Sort by timestamp
  timeline.sort((a, b) => a.timestamp.getTime() - b.timestamp.getTime());

  return timeline;
}

// ============================================
// PHOTOS COLLECTOR
// ============================================

export async function collectKeyPhotos(
  interventionId: string,
  garageId: number,
  limit: number = 20
): Promise<PhotoItem[]> {
  const documents = await prisma.document.findMany({
    where: {
      interventionId,
      garageId,
      deletedAt: null,
      type: "UPLOAD",
      mime: { startsWith: "image/" },
    },
    select: {
      id: true,
      fileUrl: true,
      fileName: true,
      category: true,
      createdAt: true,
      size: true,
    },
    orderBy: [
      { category: "asc" }, // Group by category
      { createdAt: "asc" },
    ],
    take: limit,
  });

  return documents.map((doc, index) => ({
    id: doc.id,
    url: doc.fileUrl,
    category: doc.category || "DIVERS",
    fileName: doc.fileName,
    createdAt: doc.createdAt,
    sizeBytes: doc.size,
    reference: `PHOTO-${String(index + 1).padStart(2, "0")}`,
  }));
}

// ============================================
// Q&A BUILDER
// ============================================

interface InterventionForQA {
  intakeNotes: string | null;
  workNotes: string | null;
  partsNotes: string | null;
  notes: string | null;
  odometerKm: number | null;
  status: string;
  agreementAt: Date | null;
  agreementMethod: string | null;
  repairOrder: {
    signedAt: Date | null;
  } | null;
  returnReport: {
    signedAt: Date | null;
    notes: string | null;
  } | null;
}

export async function buildExpertQA(
  interventionId: string,
  garageId: number
): Promise<QAItem[]> {
  const intervention = await prisma.intervention.findFirst({
    where: { id: interventionId, garageId, deletedAt: null },
    select: {
      intakeNotes: true,
      workNotes: true,
      partsNotes: true,
      notes: true,
      odometerKm: true,
      status: true,
      agreementAt: true,
      agreementMethod: true,
      repairOrder: {
        select: { signedAt: true },
      },
      returnReport: {
        select: { signedAt: true, notes: true },
      },
    },
  });

  if (!intervention) return [];

  const qa: QAItem[] = [];

  // Q1: Vehicle condition at arrival
  qa.push({
    question: "Le véhicule était-il roulant à l'arrivée ?",
    answer: intervention.intakeNotes
      ? extractRollingStatus(intervention.intakeNotes)
      : "Non renseigné",
    source: "intakeNotes",
  });

  // Q2: Defects noted at intake
  qa.push({
    question: "Quels défauts ont été constatés à la réception ?",
    answer: intervention.intakeNotes || "Non renseigné",
    source: "intakeNotes",
  });

  // Q3: Tests performed
  qa.push({
    question: "Quels tests ont été effectués ?",
    answer: intervention.notes || "Non renseigné",
    source: "notes",
  });

  // Q4: Parts replaced
  qa.push({
    question: "Quelles pièces ont été remplacées ?",
    answer: intervention.partsNotes || "Non renseigné",
    source: "partsNotes",
  });

  // Q5: Work performed
  qa.push({
    question: "Quels travaux ont été réalisés ?",
    answer: intervention.workNotes || "Non renseigné",
    source: "workNotes",
  });

  // Q6: Reserves at delivery
  qa.push({
    question: "Quelles réserves à la restitution ?",
    answer: intervention.returnReport?.notes || "Aucune réserve",
    source: "returnReport.notes",
  });

  // Q7: Client validation
  const hasSignature = Boolean(
    intervention.repairOrder?.signedAt || intervention.returnReport?.signedAt
  );
  qa.push({
    question: "Le client a-t-il validé et signé ?",
    answer: hasSignature
      ? `Oui - ${formatSignatureMethod(intervention)}`
      : "Non renseigné",
    source: "signedAt",
  });

  return qa;
}

function extractRollingStatus(notes: string): string {
  const lowerNotes = notes.toLowerCase();
  if (lowerNotes.includes("non roulant") || lowerNotes.includes("remorque") || lowerNotes.includes("dépannage")) {
    return "Non - Véhicule arrivé en remorquage/dépannage";
  }
  if (lowerNotes.includes("roulant") || lowerNotes.includes("conduit") || lowerNotes.includes("arrivé par")) {
    return "Oui - Véhicule roulant à l'arrivée";
  }
  return "Information non explicite dans les notes";
}

function formatSignatureMethod(intervention: InterventionForQA): string {
  const parts: string[] = [];
  if (intervention.repairOrder?.signedAt) {
    parts.push("OR signé");
  }
  if (intervention.returnReport?.signedAt) {
    parts.push("PV restitution signé");
  }
  if (intervention.agreementMethod) {
    parts.push(`Accord: ${intervention.agreementMethod}`);
  }
  return parts.join(", ") || "Signature électronique";
}

// ============================================
// FULL PACK BUILDER
// ============================================

export async function buildExpertPackData(
  interventionId: string,
  garageId: number
): Promise<ExpertPackData | null> {
  // Fetch intervention for summary
  const intervention = await prisma.intervention.findFirst({
    where: { id: interventionId, garageId, deletedAt: null },
    select: {
      type: true,
      tags: true,
      notes: true,
      status: true,
      documents: {
        where: { deletedAt: null, type: "SIGNED_DOCUMENT" },
        select: { id: true },
      },
    },
  });

  if (!intervention) return null;

  const [timeline, photos, qa] = await Promise.all([
    buildExpertTimeline(interventionId, garageId),
    collectKeyPhotos(interventionId, garageId),
    buildExpertQA(interventionId, garageId),
  ]);

  return {
    timeline,
    photos,
    qa,
    summary: {
      motif: intervention.notes || "Non renseigné",
      interventionType: intervention.tags.length > 0 ? intervention.tags.join(", ") : intervention.type,
      result: formatStatus(intervention.status),
      signedDocsCount: intervention.documents.length,
    },
  };
}

function formatStatus(status: string): string {
  switch (status) {
    case "DONE":
      return "Terminé avec succès";
    case "OPEN":
      return "En cours";
    case "DRAFT":
      return "Brouillon";
    case "CANCELED":
      return "Annulé";
    default:
      return status;
  }
}
