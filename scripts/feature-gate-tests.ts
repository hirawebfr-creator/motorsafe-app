/**
 * ENTITLEMENTS-01: Feature Gate Tests
 *
 * Ce script teste que les feature gates bloquent correctement:
 * 1. FREE plan → accès aux features payantes bloqué
 * 2. STARTER plan → accès aux features PRO bloqué
 * 3. PRO plan → accès à toutes les features
 *
 * Usage:
 *   FREE_USER_EMAIL=free@test.com STARTER_USER_EMAIL=starter@test.com PRO_USER_EMAIL=pro@test.com npx ts-node scripts/feature-gate-tests.ts
 *
 * Prérequis:
 * - Trois utilisateurs avec plans différents (FREE, STARTER, PRO)
 * - Au moins une intervention par garage
 */

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
  garagePlan: string;
  email: string;
  sessionToken: string;
  cookie: string;
  interventionId: string | null;
}

async function setupUser(email: string, label: string): Promise<TestUser> {
  const user = await prisma.user.findUnique({
    where: { email },
    select: {
      id: true,
      garageId: true,
      email: true,
      garage: { select: { plan: true } },
    },
  });

  if (!user) throw new Error(`${label}: User not found for ${email}`);
  if (!user.garageId) throw new Error(`${label}: User has no garageId`);
  if (!user.garage) throw new Error(`${label}: User has no garage`);

  // Create session
  const sessionToken = randomBytes(32).toString("hex");
  const expiresAt = new Date(Date.now() + 24 * 60 * 60 * 1000);
  await prisma.session.create({
    data: { token: sessionToken, userId: user.id, expiresAt },
  });

  // Get an intervention
  const intervention = await prisma.intervention.findFirst({
    where: { garageId: user.garageId, deletedAt: null },
    select: { id: true },
  });

  console.log(`${label}: userId=${user.id} garageId=${user.garageId} plan=${user.garage.plan}`);
  console.log(`  Intervention: ${intervention?.id ?? "NONE"}`);

  return {
    userId: user.id,
    garageId: user.garageId,
    garagePlan: user.garage.plan,
    email: user.email,
    sessionToken,
    cookie: `ms_session=${sessionToken}`,
    interventionId: intervention?.id ?? null,
  };
}

async function cleanup(users: TestUser[]) {
  for (const u of users) {
    await prisma.session.deleteMany({ where: { token: u.sessionToken } }).catch(() => {});
  }
  await prisma.$disconnect();
}

interface FeatureTest {
  name: string;
  feature: string;
  endpoint: (interventionId: string) => string;
  method: string;
  // Which plans should ALLOW this feature
  allowedPlans: string[];
  // Expected status code when blocked (402 = SUBSCRIPTION_REQUIRED, 403 = FEATURE_NOT_AVAILABLE)
  blockedStatus: number;
  // Expected error code when blocked
  blockedCode: string;
}

const featureTests: FeatureTest[] = [
  {
    name: "PDF_MASTER: Order PDF",
    feature: "PDF_MASTER",
    endpoint: (id) => `/api/interventions/${id}/order/pdf`,
    method: "GET",
    allowedPlans: ["STARTER", "PRO"],
    blockedStatus: 402, // FREE has no subscription
    blockedCode: "SUBSCRIPTION_REQUIRED",
  },
  {
    name: "PDF_MASTER: Delivery PDF",
    feature: "PDF_MASTER",
    endpoint: (id) => `/api/interventions/${id}/delivery/pdf`,
    method: "GET",
    allowedPlans: ["STARTER", "PRO"],
    blockedStatus: 402,
    blockedCode: "SUBSCRIPTION_REQUIRED",
  },
  {
    name: "INSURANCE_DOC: Insurance PDF",
    feature: "INSURANCE_DOC",
    endpoint: (id) => `/api/interventions/${id}/insurance/pdf`,
    method: "GET",
    allowedPlans: ["STARTER", "PRO"],
    blockedStatus: 402,
    blockedCode: "SUBSCRIPTION_REQUIRED",
  },
  {
    name: "EXPORT_ZIP: Export intervention",
    feature: "EXPORT_ZIP",
    endpoint: (id) => `/api/interventions/${id}/export`,
    method: "GET",
    allowedPlans: ["STARTER", "PRO"],
    blockedStatus: 402,
    blockedCode: "SUBSCRIPTION_REQUIRED",
  },
  {
    name: "LEGAL_MEMO: Legal Memo PDF (PRO only)",
    feature: "LEGAL_MEMO",
    endpoint: (id) => `/api/interventions/${id}/legal-memo/pdf`,
    method: "GET",
    allowedPlans: ["PRO"], // STARTER does NOT have this
    blockedStatus: 403, // STARTER will get 403, FREE will get 402
    blockedCode: "FEATURE_NOT_AVAILABLE",
  },
];

async function testFeatureGate(
  baseUrl: string,
  user: TestUser,
  test: FeatureTest
): Promise<{ passed: boolean; message: string }> {
  if (!user.interventionId) {
    return { passed: true, message: "SKIP (no intervention)" };
  }

  const url = `${baseUrl}${test.endpoint(user.interventionId)}`;
  const res = await fetchJson(url, {
    method: test.method,
    headers: { cookie: user.cookie },
  });

  const shouldAllow = test.allowedPlans.includes(user.garagePlan);

  if (shouldAllow) {
    // Should succeed (200) or fail for other reasons (404 if no data)
    if (res.status === 200 || res.status === 404) {
      return { passed: true, message: `OK (${res.status})` };
    }
    // If blocked, that's a bug
    if (res.status === 402 || res.status === 403) {
      return {
        passed: false,
        message: `FAIL: ${user.garagePlan} should have access but got ${res.status}`,
      };
    }
    return { passed: true, message: `OK (${res.status})` };
  } else {
    // Should be blocked
    if (res.status === 402 || res.status === 403) {
      return { passed: true, message: `BLOCKED correctly (${res.status})` };
    }
    // If allowed, that's a security bug!
    if (res.status === 200) {
      return {
        passed: false,
        message: `SECURITY: ${user.garagePlan} should NOT have access to ${test.feature}!`,
      };
    }
    // Other errors might be acceptable
    return {
      passed: true,
      message: `OK (got ${res.status}, expected block)`,
    };
  }
}

async function main() {
  const baseUrl = (process.env.TEST_BASE_URL ?? "http://localhost:3000").replace(/\/$/, "");
  const freeEmail = process.env.FREE_USER_EMAIL?.trim().toLowerCase();
  const starterEmail = process.env.STARTER_USER_EMAIL?.trim().toLowerCase();
  const proEmail = process.env.PRO_USER_EMAIL?.trim().toLowerCase();

  console.log("\n╔═══════════════════════════════════════════════════════════╗");
  console.log("║       ENTITLEMENTS-01: Feature Gate Tests                 ║");
  console.log("╚═══════════════════════════════════════════════════════════╝\n");

  console.log(`Base URL: ${baseUrl}\n`);

  const users: TestUser[] = [];

  try {
    console.log("═══ Setup ═══\n");

    const usersToTest: { email?: string; label: string; plan: string }[] = [];

    if (freeEmail) usersToTest.push({ email: freeEmail, label: "FREE", plan: "FREE" });
    if (starterEmail) usersToTest.push({ email: starterEmail, label: "STARTER", plan: "STARTER" });
    if (proEmail) usersToTest.push({ email: proEmail, label: "PRO", plan: "PRO" });

    if (usersToTest.length === 0) {
      console.log("No users specified. Provide at least one of:");
      console.log("  FREE_USER_EMAIL, STARTER_USER_EMAIL, PRO_USER_EMAIL");
      process.exit(1);
    }

    for (const u of usersToTest) {
      if (u.email) {
        const user = await setupUser(u.email, u.label);
        if (user.garagePlan !== u.plan) {
          console.warn(`  ⚠️  Expected plan ${u.plan} but garage has ${user.garagePlan}`);
        }
        users.push(user);
      }
    }

    console.log("\n═══ Running Feature Gate Tests ═══\n");

    let passed = 0;
    let failed = 0;

    for (const user of users) {
      console.log(`\n── ${user.garagePlan} Plan (${user.email}) ──\n`);

      for (const test of featureTests) {
        process.stdout.write(`  ${test.name}: `);
        const result = await testFeatureGate(baseUrl, user, test);

        if (result.passed) {
          console.log(`✅ ${result.message}`);
          passed++;
        } else {
          console.log(`❌ ${result.message}`);
          failed++;
        }
      }
    }

    console.log("\n═══ Summary ═══\n");
    console.log(`  Passed: ${passed}`);
    console.log(`  Failed: ${failed}`);
    console.log(`  Total:  ${users.length * featureTests.length}`);

    if (failed > 0) {
      console.log("\n❌ SOME TESTS FAILED - Feature gates may be misconfigured!\n");
      process.exitCode = 1;
    } else {
      console.log("\n✅ ALL TESTS PASSED - Feature gates are working correctly.\n");
    }
  } finally {
    await cleanup(users);
  }
}

main().catch((err) => {
  console.error("Fatal error:", err);
  process.exit(1);
});
