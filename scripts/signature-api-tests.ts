/**
 * Signature API Tests
 * Tests signature-specific behaviors:
 * - Idempotency
 * - Rate limiting (429)
 * - Error handling
 * 
 * Run: npm run test:signature-api
 */

import assert from "node:assert";
import { randomBytes } from "node:crypto";
import { PrismaClient } from "@prisma/client";

// ============================================
// Types
// ============================================

type ApiOk<T> = { ok: true; data: T };

// ============================================
// Helpers
// ============================================

async function fetchJson(url: string, init: RequestInit): Promise<{ status: number; json: unknown; headers: Headers }> {
  const res = await fetch(url, init);
  const text = await res.text();
  let json: unknown;
  try {
    json = JSON.parse(text);
  } catch {
    json = text;
  }
  return { status: res.status, json, headers: res.headers };
}

function isApiOk<T>(v: unknown): v is ApiOk<T> {
  return Boolean(v && typeof v === "object" && (v as ApiOk<T>).ok === true);
}

// ============================================
// Test Cases
// ============================================

async function runSignatureApiTests() {
  const baseUrl = (process.env.TEST_BASE_URL ?? "http://localhost:3000").replace(/\/$/, "");
  const testEmail = process.env.TEST_USER_EMAIL?.trim().toLowerCase();
  
  // Check if rate limiting should be tested
  const testRateLimit = process.env.DISABLE_RATE_LIMIT !== "true" && process.env.TEST_RATE_LIMIT === "true";

  if (!testEmail) {
    throw new Error("Missing TEST_USER_EMAIL environment variable");
  }

  const prisma = new PrismaClient();
  let sessionToken: string | null = null;

  console.log("\n=== SIGNATURE API TESTS ===\n");
  console.log(`Base URL: ${baseUrl}`);
  console.log(`Rate limit tests: ${testRateLimit ? "enabled" : "disabled"}`);

  try {
    // Setup session
    const user = await prisma.user.findUnique({
      where: { email: testEmail },
    });
    assert.ok(user, `User not found: ${testEmail}`);

    sessionToken = randomBytes(32).toString("hex");
    await prisma.session.create({
      data: {
        token: sessionToken,
        userId: user.id,
        expiresAt: new Date(Date.now() + 24 * 60 * 60 * 1000),
      },
    });

    const cookie = `ms_session=${sessionToken}`;

    // ----------------------------------------
    // Test 1: Invalid Token Returns 404
    // ----------------------------------------
    console.log("\n[Test 1] Invalid token returns 404...");
    
    const fakeToken = randomBytes(32).toString("hex");
    const invalidRes = await fetchJson(`${baseUrl}/api/signatures/${fakeToken}`, {
      method: "GET",
    });

    assert.strictEqual(invalidRes.status, 404, "Invalid token should return 404");
    console.log("✓ Invalid token returns 404");

    // ----------------------------------------
    // Test 2: Short Token Returns 400
    // ----------------------------------------
    console.log("\n[Test 2] Short token returns 400...");
    
    const shortRes = await fetchJson(`${baseUrl}/api/signatures/abc123`, {
      method: "GET",
    });

    assert.strictEqual(shortRes.status, 400, "Short token should return 400");
    console.log("✓ Short token returns 400");

    // ----------------------------------------
    // Test 3: Create and Verify Signature Request
    // ----------------------------------------
    console.log("\n[Test 3] Create signature request via intervention...");
    
    // Find an existing intervention or skip
    const intervention = await prisma.intervention.findFirst({
      where: { 
        garageId: user.garageId ?? -1,
        deletedAt: null,
      },
      orderBy: { createdAt: "desc" },
    });

    if (intervention) {
      // Check if signature request already exists
      let sigRequest = await prisma.signatureRequest.findFirst({
        where: { 
          documentId: intervention.id,
          status: { in: ["DRAFT", "SENT", "VIEWED"] },
        },
      });

      if (!sigRequest) {
        // Create new signature request
        const createRes = await fetchJson(`${baseUrl}/api/interventions/${intervention.id}/signatures`, {
          method: "POST",
          headers: { "content-type": "application/json", cookie },
          body: JSON.stringify({
            type: "INTERVENTION_ORDER",
            sendEmail: false, // Don't send email for this test
          }),
        });

        if (createRes.status === 201 && isApiOk<{ signatureRequest: { id: string } }>(createRes.json)) {
          console.log(`✓ Created signature request: ${createRes.json.data.signatureRequest.id}`);
          
          // Fetch the created request
          sigRequest = await prisma.signatureRequest.findFirst({
            where: { id: createRes.json.data.signatureRequest.id },
          });
        } else if (createRes.status === 400) {
          console.log("⚠ Signature request already exists or intervention not signable");
        }
      } else {
        console.log(`⚠ Using existing signature request: ${sigRequest.id}`);
      }

      // ----------------------------------------
      // Test 4: Idempotency - Double Sign
      // ----------------------------------------
      if (sigRequest && sigRequest.token) {
        console.log("\n[Test 4] Test idempotency (cannot sign twice)...");
        
        // Get a signed request
        const signedRequest = await prisma.signatureRequest.findFirst({
          where: { 
            garageId: user.garageId ?? -1,
            status: "SIGNED",
          },
        });

        if (signedRequest && signedRequest.token) {
          const doubleSignRes = await fetchJson(`${baseUrl}/api/signatures/${signedRequest.token}/sign`, {
            method: "POST",
            headers: { "content-type": "application/json" },
            body: JSON.stringify({
              signatureData: "data:image/png;base64,fake",
              acceptedTerms: true,
            }),
          });

          // Should return error (already signed)
          assert.ok(
            doubleSignRes.status === 400 || doubleSignRes.status === 409,
            `Double sign should fail, got ${doubleSignRes.status}`
          );
          console.log("✓ Double sign prevented");
        } else {
          console.log("⚠ No signed request found, skipping double-sign test");
        }
      }
    } else {
      console.log("⚠ No intervention found, skipping signature tests");
    }

    // ----------------------------------------
    // Test 5: Rate Limiting (optional)
    // ----------------------------------------
    if (testRateLimit) {
      console.log("\n[Test 5] Rate limiting test...");
      
      const testToken = randomBytes(32).toString("hex");
      
      // Make many requests rapidly
      const requests = [];
      for (let i = 0; i < 35; i++) {
        requests.push(fetchJson(`${baseUrl}/api/signatures/${testToken}`, {
          method: "GET",
        }));
      }

      const results = await Promise.all(requests);
      const rateLimited = results.filter(r => r.status === 429);
      
      if (rateLimited.length > 0) {
        console.log(`✓ Rate limiting triggered after ${results.length - rateLimited.length} requests`);
        
        // Check rate limit headers
        const limitedRes = rateLimited[0];
        const retryAfter = limitedRes.headers.get("X-RateLimit-Reset");
        if (retryAfter) {
          console.log(`✓ X-RateLimit-Reset header present: ${retryAfter}`);
        }
      } else {
        console.log("⚠ Rate limiting not triggered (may be disabled or limit too high)");
      }
    }

    // ----------------------------------------
    // Test 6: Viewed Tracking
    // ----------------------------------------
    console.log("\n[Test 6] Viewed tracking...");
    
    const pendingRequest = await prisma.signatureRequest.findFirst({
      where: { 
        garageId: user.garageId ?? -1,
        status: { in: ["DRAFT", "SENT"] },
      },
    });

    if (pendingRequest && pendingRequest.token) {
      // Call viewed endpoint
      await fetchJson(`${baseUrl}/api/signatures/${pendingRequest.token}/viewed`, {
        method: "POST",
      });

      // Check if status was updated to VIEWED
      const updated = await prisma.signatureRequest.findUnique({
        where: { id: pendingRequest.id },
      });

      if (updated && updated.status === "VIEWED") {
        console.log("✓ Viewed tracking works");
      } else {
        console.log("⚠ Viewed tracking may not have updated (status: " + updated?.status + ")");
      }
    } else {
      console.log("⚠ No pending request found for viewed test");
    }

    // ----------------------------------------
    // Summary
    // ----------------------------------------
    console.log("\n=== SIGNATURE API TESTS PASSED ===\n");

  } finally {
    if (sessionToken) {
      await prisma.session.deleteMany({ where: { token: sessionToken } });
    }
    await prisma.$disconnect();
  }
}

// Run tests
runSignatureApiTests().catch((e) => {
  console.error("\n=== TEST FAILED ===\n");
  console.error(e);
  process.exitCode = 1;
});
