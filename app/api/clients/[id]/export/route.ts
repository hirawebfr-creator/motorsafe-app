/**
 * LEGAL-RETENTION-01: GDPR Client Data Export
 * GET /api/clients/[id]/export
 * 
 * Exports all client data as a ZIP file (GDPR right to data portability).
 * Includes: client info, vehicles, interventions (without other clients' data).
 */

import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireApprovedTenant, requireUser } from "@/lib/guards";
import { RouteError, toErrorResponse } from "@/lib/routeErrors";
import { addEvidenceEntry, createClientSnapshot } from "@/lib/legal/evidenceChain";
import { decryptClientData } from "@/lib/encryption";
import archiver from "archiver";
import { PassThrough } from "stream";
import { createHash } from "crypto";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

type Ctx = { params: Promise<{ id: string }> };

function sha256(data: Buffer | string): string {
  return createHash("sha256").update(data).digest("hex");
}

function sanitizeFilename(name: string): string {
  return name.replace(/[^a-zA-Z0-9_-]/g, "_");
}

export async function GET(req: Request, ctx: Ctx) {
  try {
    const user = requireApprovedTenant(await requireUser(req));
    const { id: idParam } = await ctx.params;
    const clientId = parseInt(idParam, 10);

    if (isNaN(clientId)) {
      throw new RouteError(400, "BAD_REQUEST", "ID client invalide");
    }

    // Get client with garage check
    const client = await prisma.client.findFirst({
      where: user.role === "ADMIN"
        ? { id: clientId, deletedAt: null }
        : { id: clientId, garageId: user.garageId ?? -1, deletedAt: null },
      include: {
        vehicles: {
          where: { deletedAt: null },
          include: {
            interventions: {
              where: { deletedAt: null },
              include: {
                documents: { where: { deletedAt: null } },
              },
            },
          },
        },
        quotes: true,
        invoices: true,
        garage: {
          select: { name: true },
        },
      },
    });

    if (!client) {
      throw new RouteError(404, "NOT_FOUND", "Client introuvable");
    }

    // Decrypt client PII
    const decryptedClient = decryptClientData(client as Record<string, unknown>);

    // Get IP for evidence chain
    const ip = req.headers.get("x-forwarded-for")?.split(",")[0].trim() 
      ?? req.headers.get("x-real-ip") 
      ?? null;
    const userAgent = req.headers.get("user-agent") ?? null;

    // Create snapshot and record in evidence chain
    const snapshot = await createClientSnapshot(clientId);
    const garageId = client.garageId ?? user.garageId ?? -1;
    
    await addEvidenceEntry({
      garageId,
      entityType: "client",
      entityId: String(clientId),
      eventType: "export",
      payload: snapshot,
      context: {
        userId: user.id,
        ip: ip ?? undefined,
        userAgent: userAgent ?? undefined,
        reason: "GDPR data export request",
      },
    });

    // Audit log
    await prisma.auditLog.create({
      data: {
        garageId,
        userId: user.id,
        action: "CLIENT_EXPORT_GDPR",
        entityType: "client",
        entityId: String(clientId),
        metadata: {
          vehicleCount: client.vehicles.length,
          interventionCount: client.vehicles.reduce((sum, v) => sum + v.interventions.length, 0),
          quoteCount: client.quotes.length,
          invoiceCount: client.invoices.length,
        },
      },
    });

    // Build ZIP
    const passThrough = new PassThrough();
    const archive = archiver("zip", { zlib: { level: 9 } });
    const chunks: Buffer[] = [];

    passThrough.on("data", (chunk) => chunks.push(chunk));
    archive.pipe(passThrough);

    // === 1. Client profile JSON ===
    const clientProfile = {
      id: decryptedClient.id,
      firstName: decryptedClient.firstName,
      lastName: decryptedClient.lastName,
      email: decryptedClient.email,
      phone: decryptedClient.phone,
      address: decryptedClient.address,
      notes: decryptedClient.notes,
      vatProfile: decryptedClient.vatProfile,
      vatNumber: decryptedClient.vatNumber,
      countryCode: decryptedClient.countryCode,
      createdAt: client.createdAt.toISOString(),
      updatedAt: client.updatedAt.toISOString(),
      garageName: client.garage?.name ?? "N/A",
    };
    const clientJson = JSON.stringify(clientProfile, null, 2);
    archive.append(clientJson, { name: "01_client.json" });

    // === 2. Vehicles JSON ===
    const vehiclesData = client.vehicles.map(v => ({
      id: v.id,
      brand: v.brand,
      model: v.model,
      plate: v.plate,
      vin: v.vin,
      fuel: v.fuel,
      year: v.year,
      engine: v.engine,
      createdAt: v.createdAt.toISOString(),
    }));
    const vehiclesJson = JSON.stringify(vehiclesData, null, 2);
    archive.append(vehiclesJson, { name: "02_vehicules.json" });

    // === 3. Interventions JSON (per vehicle) ===
    for (const vehicle of client.vehicles) {
      if (vehicle.interventions.length === 0) continue;

      const interventionsData = vehicle.interventions.map(i => ({
        id: i.id,
        type: i.type,
        status: i.status,
        title: i.title,
        notes: i.notes,
        tags: i.tags,
        odometerKm: i.odometerKm,
        createdAt: i.createdAt.toISOString(),
        closedAt: i.closedAt?.toISOString() ?? null,
        documents: i.documents.map(d => ({
          id: d.id,
          type: d.type,
          fileName: d.fileName,
          category: d.category,
          createdAt: d.createdAt.toISOString(),
        })),
      }));
      
      const filename = `03_interventions/${sanitizeFilename(vehicle.plate)}.json`;
      archive.append(JSON.stringify(interventionsData, null, 2), { name: filename });
    }

    // === 4. Quotes summary JSON ===
    if (client.quotes.length > 0) {
      const quotesData = client.quotes.map(q => ({
        id: q.id,
        quoteNumber: q.quoteNumber,
        status: q.status,
        totalIncl: q.totalIncl,
        createdAt: q.createdAt.toISOString(),
      }));
      archive.append(JSON.stringify(quotesData, null, 2), { name: "04_devis.json" });
    }

    // === 5. Invoices summary JSON ===
    if (client.invoices.length > 0) {
      const invoicesData = client.invoices.map(i => ({
        id: i.id,
        invoiceNumber: i.invoiceNumber,
        status: i.status,
        totalIncl: i.totalIncl,
        createdAt: i.createdAt.toISOString(),
      }));
      archive.append(JSON.stringify(invoicesData, null, 2), { name: "05_factures.json" });
    }

    // === 6. Audit/summary file ===
    const auditSummary = {
      exportVersion: "1.0",
      exportedAt: new Date().toISOString(),
      exportedBy: user.id,
      clientId,
      garageName: client.garage?.name ?? "N/A",
      scope: "GDPR Article 20 - Right to Data Portability",
      contents: {
        client: "01_client.json",
        vehicles: "02_vehicules.json",
        interventions: `03_interventions/*.json (${client.vehicles.length} vehicles)`,
        quotes: client.quotes.length > 0 ? "04_devis.json" : null,
        invoices: client.invoices.length > 0 ? "05_factures.json" : null,
      },
      statistics: {
        vehicleCount: client.vehicles.length,
        interventionCount: client.vehicles.reduce((sum, v) => sum + v.interventions.length, 0),
        quoteCount: client.quotes.length,
        invoiceCount: client.invoices.length,
      },
      legal: "Ce fichier contient toutes les données personnelles du client conformément au RGPD.",
    };
    archive.append(JSON.stringify(auditSummary, null, 2), { name: "00_audit.json" });

    // Finalize
    await archive.finalize();

    // Wait for all chunks
    await new Promise<void>((resolve, reject) => {
      passThrough.on("end", () => resolve());
      passThrough.on("error", reject);
    });

    const buffer = Buffer.concat(chunks);
    const clientName = sanitizeFilename(`${decryptedClient.lastName}_${decryptedClient.firstName}`);
    const filename = `export_client_${clientName}_${clientId}.zip`;

    return new NextResponse(buffer, {
      status: 200,
      headers: {
        "Content-Type": "application/zip",
        "Content-Disposition": `attachment; filename="${filename}"`,
        "Content-Length": String(buffer.length),
        "X-Content-Hash": sha256(buffer),
      },
    });
  } catch (err) {
    return toErrorResponse(err);
  }
}
