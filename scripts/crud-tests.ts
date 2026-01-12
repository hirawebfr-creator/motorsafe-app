import assert from "node:assert";
import { spawnSync } from "node:child_process";
import { randomUUID } from "node:crypto";
import fs from "node:fs/promises";
import os from "node:os";
import path from "node:path";
import { PrismaClient } from "@prisma/client";

function sleep(ms: number) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

async function run() {
  const dbPath = path.join(os.tmpdir(), `motorsafe-crud-${randomUUID()}.db`);
  const databaseUrl = `file:${dbPath.replace(/\\/g, "/")}`;
  process.env.DATABASE_URL = databaseUrl;

  const migrate = spawnSync("npx", ["prisma", "migrate", "deploy"], {
    stdio: "inherit",
    shell: true,
    env: { ...process.env, DATABASE_URL: databaseUrl },
  });
  if (migrate.status !== 0) {
    throw new Error(`prisma migrate deploy failed (exit ${migrate.status ?? "unknown"})`);
  }

  const prisma = new PrismaClient();
  try {
    const garage = await prisma.garage.create({
      data: {
        name: "CRUD Garage",
        email: `crud-garage-${Date.now()}@local`,
        status: "ACTIVE",
      },
    });

    const user = await prisma.user.create({
      data: {
        email: `crud-user-${Date.now()}@local`,
        passwordHash: "test-hash",
        role: "GARAGE",
        garageId: garage.id,
      },
    });

    const client = await prisma.client.create({
      data: {
        garageId: garage.id,
        firstName: "Test",
        lastName: "Client",
        email: "client@example.com",
        phone: "0600000000",
        address: "1 rue de test",
        notes: "Created by crud-tests",
      },
    });

    const vehicle = await prisma.vehicle.create({
      data: {
        garageId: garage.id,
        clientId: client.id,
        brand: "Peugeot",
        model: "208",
        plate: `AA-${String(Date.now()).slice(-3)}-BB`,
        vin: `VIN${randomUUID().replace(/-/g, "").slice(0, 14)}`,
        fuel: "ESSENCE",
        year: 2020,
        engine: "1.2",
      },
    });

    const intervention = await prisma.intervention.create({
      data: {
        garageId: garage.id,
        vehicleId: vehicle.id,
        type: "DIAG",
        title: "Diagnostic",
        notes: "Created by crud-tests",
        amountCents: 5000,
        createdBy: user.id,
        clientIp: "127.0.0.1",
        userAgent: "crud-tests",
      },
    });

    const doc = await prisma.document.create({
      data: {
        garageId: garage.id,
        vehicleId: vehicle.id,
        interventionId: intervention.id,
        type: "UPLOAD",
        fileUrl: "https://example.com/test.pdf",
        fileName: "test.pdf",
        mime: "application/pdf",
        size: 1234,
      },
    });

    const fetchedClient = await prisma.client.findFirst({
      where: { id: client.id, garageId: garage.id, deletedAt: null },
      include: { vehicles: true },
    });
    assert.ok(fetchedClient);
    assert.strictEqual(fetchedClient.id, client.id);
    assert.strictEqual(fetchedClient.vehicles.length, 1);

    const fetchedVehicle = await prisma.vehicle.findFirst({
      where: { id: vehicle.id, garageId: garage.id, deletedAt: null },
      include: { interventions: true, documents: true },
    });
    assert.ok(fetchedVehicle);
    assert.strictEqual(fetchedVehicle.interventions.length, 1);
    assert.strictEqual(fetchedVehicle.documents.length, 1);

    const fetchedIntervention = await prisma.intervention.findFirst({
      where: { id: intervention.id, garageId: garage.id, deletedAt: null },
      include: { documents: true },
    });
    assert.ok(fetchedIntervention);
    assert.strictEqual(fetchedIntervention.documents.length, 1);

    const fetchedDoc = await prisma.document.findFirst({
      where: { id: doc.id, garageId: garage.id, deletedAt: null },
    });
    assert.ok(fetchedDoc);

    // Verify unique constraints (plate per garage)
    let uniquePlateFailed = false;
    try {
      await prisma.vehicle.create({
        data: {
          garageId: garage.id,
          clientId: client.id,
          brand: "Peugeot",
          model: "208",
          plate: vehicle.plate,
          vin: `VIN${randomUUID().replace(/-/g, "").slice(0, 14)}`,
        },
      });
    } catch {
      uniquePlateFailed = true;
    }
    assert.strictEqual(uniquePlateFailed, true);

    // eslint-disable-next-line no-console
    console.log("crud-tests: OK");
  } finally {
    await prisma.$disconnect();

    for (let attempt = 1; attempt <= 5; attempt++) {
      try {
        await fs.rm(dbPath, { force: true });
        break;
      } catch (e: any) {
        const code = typeof e?.code === "string" ? e.code : "";
        if (code === "EBUSY" || code === "EPERM") {
          await sleep(50 * attempt);
          continue;
        }
        // eslint-disable-next-line no-console
        console.warn("crud-tests: cleanup warning", e);
        break;
      }
    }
  }
}

run().catch((e) => {
  // eslint-disable-next-line no-console
  console.error("crud-tests: FAILED");
  // eslint-disable-next-line no-console
  console.error(e);
  process.exitCode = 1;
});
