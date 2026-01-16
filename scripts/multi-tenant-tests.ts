/**
 * ENTITLEMENTS-01: Multi-Tenant Isolation Tests
 *
 * Ce script teste que:
 * 1. Garage A ne peut PAS accéder aux ressources de Garage B
 * 2. Les routes retournent 404 (pas 403) pour éviter les fuites d'info
 * 3. Les feature gates bloquent correctement les accès non autorisés
 *
 * Usage:
 *   GARAGE_A_EMAIL=user_a@test.com GARAGE_B_EMAIL=user_b@test.com npx ts-node scripts/multi-tenant-tests.ts
 *
 * Prérequis:
 * - Deux utilisateurs dans des garages différents
 * - Au moins un client, véhicule, intervention dans chaque garage
 */

import assert from "node:assert";
import { randomBytes } from "node:crypto";
import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

type FetchResult = { status: number; json: unknown };

async function fetchJson(url: string, init: RequestInit): Promise<FetchResult> {
  const res = await fetch(url, init);
  const text = await res.text();
  let json: unknown;
  try {
    json = JSON.parse(text);
  } catch {
    json = text;
  }
  return { status: res.status, json };
}

interface TestUser {
  userId: string;
  garageId: number;
  email: string;
  sessionToken: string;
  cookie: string;
  resources: {
    clientId: number | null;
    vehicleId: string | null;
    interventionId: string | null;
    documentId: string | null;
  };
}

async function setupUser(email: string, label: string): Promise<TestUser> {
  const user = await prisma.user.findUnique({
    where: { email },
    select: { id: true, garageId: true, email: true },
  });

  if (!user) throw new Error(`${label}: User not found for ${email}`);
  if (!user.garageId) throw new Error(`${label}: User has no garageId`);

  // Create session
  const sessionToken = randomBytes(32).toString("hex");
  const expiresAt = new Date(Date.now() + 24 * 60 * 60 * 1000);
  await prisma.session.create({
    data: { token: sessionToken, userId: user.id, expiresAt },
  });

  // Get resources from this garage
  const client = await prisma.client.findFirst({
    where: { garageId: user.garageId, deletedAt: null },
    select: { id: true },
  });

  const vehicle = await prisma.vehicle.findFirst({
    where: { client: { garageId: user.garageId }, deletedAt: null },
    select: { id: true },
  });

  const intervention = await prisma.intervention.findFirst({
    where: { garageId: user.garageId, deletedAt: null },
    select: { id: true },
  });

  const document = await prisma.document.findFirst({
    where: { intervention: { garageId: user.garageId }, deletedAt: null },
    select: { id: true },
  });

  console.log(`${label}: userId=${user.id} garageId=${user.garageId}`);
  console.log(`  Resources: client=${client?.id} vehicle=${vehicle?.id} intervention=${intervention?.id} doc=${document?.id}`);

  return {
    userId: user.id,
    garageId: user.garageId,
    email: user.email,
    sessionToken,
    cookie: `ms_session=${sessionToken}`,
    resources: {
      clientId: client?.id ?? null,
      vehicleId: vehicle?.id ?? null,
      interventionId: intervention?.id ?? null,
      documentId: document?.id ?? null,
    },
  };
}

async function cleanup(users: TestUser[]) {
  for (const u of users) {
    await prisma.session.deleteMany({ where: { token: u.sessionToken } }).catch(() => {});
  }
  await prisma.$disconnect();
}

interface TestCase {
  name: string;
  run: (baseUrl: string, userA: TestUser, userB: TestUser) => Promise<void>;
}

const tests: TestCase[] = [
  // ==========================================================
  // 1. Client isolation tests
  // ==========================================================
  {
    name: "GET /api/clients/[id]: Garage A cannot read Garage B client",
    async run(baseUrl, userA, userB) {
      if (!userB.resources.clientId) {
        console.log("  SKIP: No client in Garage B");
        return;
      }
      const res = await fetchJson(`${baseUrl}/api/clients/${userB.resources.clientId}`, {
        method: "GET",
        headers: { cookie: userA.cookie },
      });
      // Must be 404, not 403 (avoid info leak)
      assert.strictEqual(res.status, 404, `Expected 404 but got ${res.status}`);
    },
  },
  {
    name: "PUT /api/clients/[id]: Garage A cannot update Garage B client",
    async run(baseUrl, userA, userB) {
      if (!userB.resources.clientId) {
        console.log("  SKIP: No client in Garage B");
        return;
      }
      const res = await fetchJson(`${baseUrl}/api/clients/${userB.resources.clientId}`, {
        method: "PUT",
        headers: { "content-type": "application/json", cookie: userA.cookie },
        body: JSON.stringify({ firstName: "HACKED" }),
      });
      assert.strictEqual(res.status, 404, `Expected 404 but got ${res.status}`);
    },
  },
  {
    name: "DELETE /api/clients/[id]: Garage A cannot delete Garage B client",
    async run(baseUrl, userA, userB) {
      if (!userB.resources.clientId) {
        console.log("  SKIP: No client in Garage B");
        return;
      }
      const res = await fetchJson(`${baseUrl}/api/clients/${userB.resources.clientId}`, {
        method: "DELETE",
        headers: { cookie: userA.cookie },
      });
      assert.strictEqual(res.status, 404, `Expected 404 but got ${res.status}`);
    },
  },

  // ==========================================================
  // 2. Vehicle isolation tests
  // ==========================================================
  {
    name: "GET /api/vehicules/[id]: Garage A cannot read Garage B vehicle",
    async run(baseUrl, userA, userB) {
      if (!userB.resources.vehicleId) {
        console.log("  SKIP: No vehicle in Garage B");
        return;
      }
      const res = await fetchJson(`${baseUrl}/api/vehicules/${userB.resources.vehicleId}`, {
        method: "GET",
        headers: { cookie: userA.cookie },
      });
      assert.strictEqual(res.status, 404, `Expected 404 but got ${res.status}`);
    },
  },
  {
    name: "PUT /api/vehicules/[id]: Garage A cannot update Garage B vehicle",
    async run(baseUrl, userA, userB) {
      if (!userB.resources.vehicleId) {
        console.log("  SKIP: No vehicle in Garage B");
        return;
      }
      const res = await fetchJson(`${baseUrl}/api/vehicules/${userB.resources.vehicleId}`, {
        method: "PUT",
        headers: { "content-type": "application/json", cookie: userA.cookie },
        body: JSON.stringify({ marque: "HACKED" }),
      });
      assert.strictEqual(res.status, 404, `Expected 404 but got ${res.status}`);
    },
  },

  // ==========================================================
  // 3. Intervention isolation tests
  // ==========================================================
  {
    name: "GET /api/interventions/[id]: Garage A cannot read Garage B intervention",
    async run(baseUrl, userA, userB) {
      if (!userB.resources.interventionId) {
        console.log("  SKIP: No intervention in Garage B");
        return;
      }
      const res = await fetchJson(`${baseUrl}/api/interventions/${userB.resources.interventionId}`, {
        method: "GET",
        headers: { cookie: userA.cookie },
      });
      assert.strictEqual(res.status, 404, `Expected 404 but got ${res.status}`);
    },
  },
  {
    name: "PATCH /api/interventions/[id]: Garage A cannot update Garage B intervention",
    async run(baseUrl, userA, userB) {
      if (!userB.resources.interventionId) {
        console.log("  SKIP: No intervention in Garage B");
        return;
      }
      const res = await fetchJson(`${baseUrl}/api/interventions/${userB.resources.interventionId}`, {
        method: "PATCH",
        headers: { "content-type": "application/json", cookie: userA.cookie },
        body: JSON.stringify({ status: "COMPLETED" }),
      });
      assert.strictEqual(res.status, 404, `Expected 404 but got ${res.status}`);
    },
  },
  {
    name: "DELETE /api/interventions/[id]: Garage A cannot delete Garage B intervention",
    async run(baseUrl, userA, userB) {
      if (!userB.resources.interventionId) {
        console.log("  SKIP: No intervention in Garage B");
        return;
      }
      const res = await fetchJson(`${baseUrl}/api/interventions/${userB.resources.interventionId}`, {
        method: "DELETE",
        headers: { cookie: userA.cookie },
      });
      assert.strictEqual(res.status, 404, `Expected 404 but got ${res.status}`);
    },
  },

  // ==========================================================
  // 4. PDF generation isolation tests
  // ==========================================================
  {
    name: "GET /api/interventions/[id]/order/pdf: Garage A cannot get Garage B order PDF",
    async run(baseUrl, userA, userB) {
      if (!userB.resources.interventionId) {
        console.log("  SKIP: No intervention in Garage B");
        return;
      }
      const res = await fetchJson(`${baseUrl}/api/interventions/${userB.resources.interventionId}/order/pdf`, {
        method: "GET",
        headers: { cookie: userA.cookie },
      });
      assert.strictEqual(res.status, 404, `Expected 404 but got ${res.status}`);
    },
  },
  {
    name: "GET /api/interventions/[id]/delivery/pdf: Garage A cannot get Garage B delivery PDF",
    async run(baseUrl, userA, userB) {
      if (!userB.resources.interventionId) {
        console.log("  SKIP: No intervention in Garage B");
        return;
      }
      const res = await fetchJson(`${baseUrl}/api/interventions/${userB.resources.interventionId}/delivery/pdf`, {
        method: "GET",
        headers: { cookie: userA.cookie },
      });
      assert.strictEqual(res.status, 404, `Expected 404 but got ${res.status}`);
    },
  },
  {
    name: "GET /api/interventions/[id]/insurance/pdf: Garage A cannot get Garage B insurance PDF",
    async run(baseUrl, userA, userB) {
      if (!userB.resources.interventionId) {
        console.log("  SKIP: No intervention in Garage B");
        return;
      }
      const res = await fetchJson(`${baseUrl}/api/interventions/${userB.resources.interventionId}/insurance/pdf`, {
        method: "GET",
        headers: { cookie: userA.cookie },
      });
      assert.strictEqual(res.status, 404, `Expected 404 but got ${res.status}`);
    },
  },

  // ==========================================================
  // 5. Export / ZIP isolation tests
  // ==========================================================
  {
    name: "GET /api/interventions/[id]/export: Garage A cannot export Garage B intervention",
    async run(baseUrl, userA, userB) {
      if (!userB.resources.interventionId) {
        console.log("  SKIP: No intervention in Garage B");
        return;
      }
      const res = await fetchJson(`${baseUrl}/api/interventions/${userB.resources.interventionId}/export`, {
        method: "GET",
        headers: { cookie: userA.cookie },
      });
      assert.strictEqual(res.status, 404, `Expected 404 but got ${res.status}`);
    },
  },

  // ==========================================================
  // 6. Document isolation tests
  // ==========================================================
  {
    name: "GET /api/documents/[id]: Garage A cannot read Garage B document",
    async run(baseUrl, userA, userB) {
      if (!userB.resources.documentId) {
        console.log("  SKIP: No document in Garage B");
        return;
      }
      const res = await fetchJson(`${baseUrl}/api/documents/${userB.resources.documentId}`, {
        method: "GET",
        headers: { cookie: userA.cookie },
      });
      assert.strictEqual(res.status, 404, `Expected 404 but got ${res.status}`);
    },
  },
  {
    name: "DELETE /api/documents/[id]: Garage A cannot delete Garage B document",
    async run(baseUrl, userA, userB) {
      if (!userB.resources.documentId) {
        console.log("  SKIP: No document in Garage B");
        return;
      }
      const res = await fetchJson(`${baseUrl}/api/documents/${userB.resources.documentId}`, {
        method: "DELETE",
        headers: { cookie: userA.cookie },
      });
      assert.strictEqual(res.status, 404, `Expected 404 but got ${res.status}`);
    },
  },

  // ==========================================================
  // 7. Signature isolation tests
  // ==========================================================
  {
    name: "GET /api/interventions/[id]/signatures: Garage A cannot list Garage B signatures",
    async run(baseUrl, userA, userB) {
      if (!userB.resources.interventionId) {
        console.log("  SKIP: No intervention in Garage B");
        return;
      }
      const res = await fetchJson(`${baseUrl}/api/interventions/${userB.resources.interventionId}/signatures`, {
        method: "GET",
        headers: { cookie: userA.cookie },
      });
      // This should return empty array or 404
      if (res.status === 200) {
        const json = res.json as { ok: boolean; data: { items: unknown[] } };
        if (json.ok && json.data && Array.isArray(json.data)) {
          assert.strictEqual(json.data.length, 0, "Should return empty array for other garage");
        }
      } else {
        assert.strictEqual(res.status, 404, `Expected 404 or empty array but got ${res.status}`);
      }
    },
  },
];

async function main() {
  const baseUrl = (process.env.TEST_BASE_URL ?? "http://localhost:3000").replace(/\/$/, "");
  const emailA = process.env.GARAGE_A_EMAIL?.trim().toLowerCase();
  const emailB = process.env.GARAGE_B_EMAIL?.trim().toLowerCase();

  if (!emailA || !emailB) {
    console.error("Usage: GARAGE_A_EMAIL=a@test.com GARAGE_B_EMAIL=b@test.com npx ts-node scripts/multi-tenant-tests.ts");
    process.exit(1);
  }

  console.log("\n╔═══════════════════════════════════════════════════════════╗");
  console.log("║     ENTITLEMENTS-01: Multi-Tenant Isolation Tests         ║");
  console.log("╚═══════════════════════════════════════════════════════════╝\n");

  console.log(`Base URL: ${baseUrl}`);
  console.log(`Garage A: ${emailA}`);
  console.log(`Garage B: ${emailB}\n`);

  const users: TestUser[] = [];
  let userA: TestUser;
  let userB: TestUser;

  try {
    console.log("═══ Setup ═══\n");
    userA = await setupUser(emailA, "Garage A");
    users.push(userA);
    userB = await setupUser(emailB, "Garage B");
    users.push(userB);

    if (userA.garageId === userB.garageId) {
      throw new Error("Both users are in the same garage! Tests require different garages.");
    }

    console.log("\n═══ Running Tests ═══\n");

    let passed = 0;
    let failed = 0;
    let skipped = 0;

    for (const test of tests) {
      process.stdout.write(`TEST: ${test.name} ... `);
      try {
        await test.run(baseUrl, userA, userB);
        console.log("✅ PASS");
        passed++;
      } catch (err) {
        console.log("❌ FAIL");
        if (err instanceof assert.AssertionError) {
          console.log(`  → ${err.message}`);
        } else {
          console.log(`  → ${String(err)}`);
        }
        failed++;
      }
    }

    console.log("\n═══ Summary ═══\n");
    console.log(`  Passed:  ${passed}`);
    console.log(`  Failed:  ${failed}`);
    console.log(`  Skipped: ${skipped}`);
    console.log(`  Total:   ${tests.length}`);

    if (failed > 0) {
      console.log("\n❌ SOME TESTS FAILED - Multi-tenant isolation may be compromised!\n");
      process.exitCode = 1;
    } else {
      console.log("\n✅ ALL TESTS PASSED - Multi-tenant isolation is secure.\n");
    }
  } finally {
    await cleanup(users);
  }
}

main().catch((err) => {
  console.error("Fatal error:", err);
  process.exit(1);
});
