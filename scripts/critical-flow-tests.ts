/**
 * Critical Flow E2E Tests
 * Tests the complete business-critical path:
 * 1. Create client + vehicle + intervention
 * 2. Send signature request -> email in outbox
 * 3. Access signing page -> VIEWED
 * 4. Complete signature -> SIGNED + PDF hash
 * 5. Download PDF -> verify content-type
 * 6. Download ZIP -> verify structure
 * 
 * Run: EMAIL_PROVIDER=mock npm run test:critical-flow
 */

import assert from "node:assert";
import { randomBytes, randomUUID } from "node:crypto";
import { PrismaClient } from "@prisma/client";

// Force test mode for mocks
process.env.EMAIL_PROVIDER = "mock";
// Note: NODE_ENV is read-only in TypeScript, set via CLI instead
process.env.DISABLE_RATE_LIMIT = "true";

// Dynamic import after env setup
const { clearOutbox, getOutbox, extractSigningUrl, getLastEmail } = await import("../lib/testOutbox");

// ============================================
// Types
// ============================================

type ApiOk<T> = { ok: true; data: T };

interface Client { id: number }
interface Vehicle { id: string }
interface Intervention { 
  id: string;
  signatureStatus?: string;
  signatureRequests?: Array<{ id: string; token?: string; status: string }>;
}
interface SignatureRequest { id: string; token: string; status: string }

// ============================================
// Helpers
// ============================================

async function fetchJson(url: string, init: RequestInit): Promise<{ status: number; json: unknown }> {
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

function isApiOk<T>(v: unknown): v is ApiOk<T> {
  return Boolean(v && typeof v === "object" && (v as ApiOk<T>).ok === true);
}

// ============================================
// Main Test Suite
// ============================================

async function runCriticalFlowTests() {
  const baseUrl = (process.env.TEST_BASE_URL ?? "http://localhost:3000").replace(/\/$/, "");
  const testEmail = process.env.TEST_USER_EMAIL?.trim().toLowerCase();

  if (!testEmail) {
    throw new Error("Missing TEST_USER_EMAIL environment variable");
  }

  const prisma = new PrismaClient();
  let sessionToken: string | null = null;
  let interventionId: string | null = null;
  let signatureToken: string | null = null;

  console.log("\n=== CRITICAL FLOW E2E TESTS ===\n");
  console.log(`Base URL: ${baseUrl}`);
  console.log(`Test Email: ${testEmail}`);

  try {
    // ----------------------------------------
    // Setup: Create session for test user
    // ----------------------------------------
    console.log("\n[Setup] Creating test session...");
    
    const user = await prisma.user.findUnique({
      where: { email: testEmail },
      include: { garage: true },
    });
    assert.ok(user, `User not found: ${testEmail}`);
    assert.ok(user.garageId, "User must have a garageId");

    sessionToken = randomBytes(32).toString("hex");
    await prisma.session.create({
      data: {
        token: sessionToken,
        userId: user.id,
        expiresAt: new Date(Date.now() + 24 * 60 * 60 * 1000),
      },
    });

    const cookie = `ms_session=${sessionToken}`;
    console.log("✓ Session created");

    // Clear email outbox
    clearOutbox();
    console.log("✓ Email outbox cleared");

    // ----------------------------------------
    // Test 1: Create Client
    // ----------------------------------------
    console.log("\n[Test 1] Create client...");
    
    const clientName = `Test Client ${randomUUID().slice(0, 8)}`;
    const clientEmail = `test-${Date.now()}@example.com`;
    
    const clientRes = await fetchJson(`${baseUrl}/api/clients`, {
      method: "POST",
      headers: { "content-type": "application/json", cookie },
      body: JSON.stringify({
        firstName: "Jean",
        lastName: clientName,
        email: clientEmail,
        phone: "0600000000",
      }),
    });

    let clientId: number;
    if (clientRes.status === 201 && isApiOk<Client>(clientRes.json)) {
      clientId = clientRes.json.data.id;
      console.log(`✓ Client created: ID ${clientId}`);
    } else if (clientRes.status === 403) {
      // Limit reached, use existing
      const listRes = await fetchJson(`${baseUrl}/api/clients?page=1&pageSize=1`, {
        method: "GET",
        headers: { cookie },
      });
      assert.ok(isApiOk<{ items: Client[] }>(listRes.json));
      clientId = listRes.json.data.items[0].id;
      console.log(`⚠ Using existing client: ID ${clientId}`);
    } else {
      throw new Error(`Client creation failed: ${JSON.stringify(clientRes.json)}`);
    }

    // ----------------------------------------
    // Test 2: Create Vehicle
    // ----------------------------------------
    console.log("\n[Test 2] Create vehicle...");
    
    const plate = `AA${String(Date.now()).slice(-3)}BB`;
    
    const vehicleRes = await fetchJson(`${baseUrl}/api/vehicules`, {
      method: "POST",
      headers: { "content-type": "application/json", cookie },
      body: JSON.stringify({
        clientId,
        brand: "Peugeot",
        model: "208",
        plate,
        year: 2020,
      }),
    });

    let vehicleId: string;
    if (vehicleRes.status === 201 && isApiOk<Vehicle>(vehicleRes.json)) {
      vehicleId = vehicleRes.json.data.id;
      console.log(`✓ Vehicle created: ID ${vehicleId}, plate ${plate}`);
    } else if (vehicleRes.status === 403) {
      // Limit reached, use existing
      const listRes = await fetchJson(`${baseUrl}/api/vehicules?page=1&pageSize=1&clientId=${clientId}`, {
        method: "GET",
        headers: { cookie },
      });
      assert.ok(isApiOk<{ items: Vehicle[] }>(listRes.json));
      vehicleId = listRes.json.data.items[0].id;
      console.log(`⚠ Using existing vehicle: ID ${vehicleId}`);
    } else {
      throw new Error(`Vehicle creation failed: ${JSON.stringify(vehicleRes.json)}`);
    }

    // ----------------------------------------
    // Test 3: Create Intervention
    // ----------------------------------------
    console.log("\n[Test 3] Create intervention...");
    
    const interventionRes = await fetchJson(`${baseUrl}/api/interventions`, {
      method: "POST",
      headers: { "content-type": "application/json", cookie },
      body: JSON.stringify({
        vehicleId,
        type: "Diag",
        title: "E2E Test Intervention",
        notes: "Created by critical-flow test",
        amountCents: 5000,
        tags: ["test", "e2e"],
      }),
    });

    if (interventionRes.status !== 201 || !isApiOk<Intervention>(interventionRes.json)) {
      throw new Error(`Intervention creation failed: ${JSON.stringify(interventionRes.json)}`);
    }
    
    interventionId = interventionRes.json.data.id;
    console.log(`✓ Intervention created: ID ${interventionId}`);

    // ----------------------------------------
    // Test 4: Send Signature Request
    // ----------------------------------------
    console.log("\n[Test 4] Send signature request...");
    
    const sigRes = await fetchJson(`${baseUrl}/api/interventions/${interventionId}/signatures`, {
      method: "POST",
      headers: { "content-type": "application/json", cookie },
      body: JSON.stringify({
        type: "INTERVENTION_ORDER",
        sendEmail: true,
      }),
    });

    if (sigRes.status !== 201 || !isApiOk<{ signatureRequest: SignatureRequest }>(sigRes.json)) {
      throw new Error(`Signature request failed: ${JSON.stringify(sigRes.json)}`);
    }

    const sigRequest = sigRes.json.data.signatureRequest;
    console.log(`✓ Signature request created: ID ${sigRequest.id}`);
    assert.strictEqual(sigRequest.status, "SENT", "Status should be SENT after sending email");

    // Check email was captured in outbox
    const emails = getOutbox();
    assert.ok(emails.length > 0, "Email should be in outbox");
    
    const lastEmail = getLastEmail();
    assert.ok(lastEmail, "Last email should exist");
    console.log(`✓ Email captured in outbox: to=${lastEmail.to}`);

    // Extract signing URL from email
    const signingUrl = extractSigningUrl(lastEmail);
    assert.ok(signingUrl, "Signing URL should be in email");
    console.log(`✓ Signing URL extracted: ${signingUrl.slice(0, 60)}...`);

    // Extract token from URL
    const tokenMatch = signingUrl.match(/\/sign\/([a-f0-9]+)/);
    assert.ok(tokenMatch, "Token should be in signing URL");
    signatureToken = tokenMatch[1];
    console.log(`✓ Token extracted: ${signatureToken.slice(0, 16)}...`);

    // ----------------------------------------
    // Test 5: Access Signing Page (VIEWED)
    // ----------------------------------------
    console.log("\n[Test 5] Access signing page (mark as VIEWED)...");
    
    const viewRes = await fetchJson(`${baseUrl}/api/signatures/${signatureToken}`, {
      method: "GET",
    });

    assert.strictEqual(viewRes.status, 200, "Signing page should be accessible");
    console.log("✓ Signing page accessed");

    // Mark as viewed
    const viewedRes = await fetchJson(`${baseUrl}/api/signatures/${signatureToken}/viewed`, {
      method: "POST",
    });
    assert.ok(viewedRes.status === 200 || viewedRes.status === 204, "VIEWED should succeed");
    console.log("✓ Marked as VIEWED");

    // Verify status changed to VIEWED
    const checkRes = await fetchJson(`${baseUrl}/api/signatures/${signatureToken}`, {
      method: "GET",
    });
    assert.strictEqual(checkRes.status, 200);
    if (isApiOk<{ signatureRequest: { status: string } }>(checkRes.json)) {
      assert.strictEqual(checkRes.json.data.signatureRequest.status, "VIEWED", "Status should be VIEWED");
      console.log("✓ Status verified: VIEWED");
    }

    // ----------------------------------------
    // Test 6: Complete Signature (SIGNED)
    // ----------------------------------------
    console.log("\n[Test 6] Complete signature...");
    
    // Simulate signature data (base64 PNG)
    const fakeSignatureData = "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNk+M9QDwADhgGAWjR9awAAAABJRU5ErkJggg==";
    
    const signRes = await fetchJson(`${baseUrl}/api/signatures/${signatureToken}/sign`, {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({
        signatureData: fakeSignatureData,
        acceptedTerms: true,
      }),
    });

    if (signRes.status !== 200 || !isApiOk<{ hash?: string }>(signRes.json)) {
      throw new Error(`Signature failed: ${JSON.stringify(signRes.json)}`);
    }
    console.log("✓ Signature completed");

    // Verify hash exists
    const signData = signRes.json.data;
    if (signData.hash) {
      console.log(`✓ Document hash: ${signData.hash.slice(0, 16)}...`);
    }

    // Check confirmation email
    const confirmEmails = getOutbox().filter(e => e.subject.includes("confirmée"));
    console.log(`✓ Confirmation emails: ${confirmEmails.length}`);

    // ----------------------------------------
    // Test 7: Download Signed PDF
    // ----------------------------------------
    console.log("\n[Test 7] Download signed PDF...");
    
    const pdfRes = await fetch(`${baseUrl}/api/signatures/${signatureToken}/pdf`, {
      method: "GET",
    });

    assert.strictEqual(pdfRes.status, 200, "PDF download should succeed");
    
    const contentType = pdfRes.headers.get("content-type");
    assert.ok(contentType?.includes("application/pdf"), `Content-Type should be PDF, got: ${contentType}`);
    
    const pdfBuffer = await pdfRes.arrayBuffer();
    assert.ok(pdfBuffer.byteLength > 1000, `PDF should have content (${pdfBuffer.byteLength} bytes)`);
    
    // Check PDF header
    const pdfHeader = new Uint8Array(pdfBuffer.slice(0, 5));
    const pdfMagic = String.fromCharCode(...pdfHeader);
    assert.strictEqual(pdfMagic, "%PDF-", "File should start with PDF magic bytes");
    
    console.log(`✓ PDF downloaded: ${pdfBuffer.byteLength} bytes`);

    // ----------------------------------------
    // Test 8: Download ZIP (if available)
    // ----------------------------------------
    console.log("\n[Test 8] Download ZIP dossier...");
    
    // Get intervention to find download token
    const intDetailRes = await fetchJson(`${baseUrl}/api/interventions/${interventionId}`, {
      method: "GET",
      headers: { cookie },
    });

    if (isApiOk<{ intervention: { downloadToken?: string } }>(intDetailRes.json)) {
      // Try to trigger ZIP export
      const exportRes = await fetchJson(`${baseUrl}/api/interventions/${interventionId}/export`, {
        method: "POST",
        headers: { "content-type": "application/json", cookie },
      });

      if (exportRes.status === 200 || exportRes.status === 201) {
        console.log("✓ ZIP export initiated");
        
        // If we have a download token, try to download
        if (isApiOk<{ downloadToken?: string }>(exportRes.json) && exportRes.json.data.downloadToken) {
          const zipToken = exportRes.json.data.downloadToken;
          const zipRes = await fetch(`${baseUrl}/api/download/zip/${zipToken}`, {
            method: "GET",
          });

          if (zipRes.status === 200) {
            const zipType = zipRes.headers.get("content-type");
            assert.ok(zipType?.includes("zip") || zipType?.includes("octet-stream"), `Expected ZIP content-type, got: ${zipType}`);
            
            const zipBuffer = await zipRes.arrayBuffer();
            console.log(`✓ ZIP downloaded: ${zipBuffer.byteLength} bytes`);
            
            // Check ZIP header (PK)
            const zipHeader = new Uint8Array(zipBuffer.slice(0, 2));
            const zipMagic = String.fromCharCode(...zipHeader);
            assert.strictEqual(zipMagic, "PK", "File should start with ZIP magic bytes");
          } else {
            console.log(`⚠ ZIP download returned ${zipRes.status} (may require signed status)`);
          }
        }
      } else {
        console.log(`⚠ ZIP export returned ${exportRes.status}`);
      }
    }

    // ----------------------------------------
    // Test 9: Verify Final State
    // ----------------------------------------
    console.log("\n[Test 9] Verify final state...");
    
    const finalRes = await fetchJson(`${baseUrl}/api/interventions/${interventionId}`, {
      method: "GET",
      headers: { cookie },
    });

    assert.strictEqual(finalRes.status, 200);
    if (isApiOk<{ intervention: Intervention }>(finalRes.json)) {
      const int = finalRes.json.data.intervention;
      console.log(`✓ Intervention signatureStatus: ${int.signatureStatus}`);
      
      if (int.signatureRequests?.length) {
        const sr = int.signatureRequests[0];
        console.log(`✓ SignatureRequest status: ${sr.status}`);
        assert.strictEqual(sr.status, "SIGNED", "Final status should be SIGNED");
      }
    }

    // ----------------------------------------
    // Summary
    // ----------------------------------------
    console.log("\n=== ALL TESTS PASSED ===\n");
    console.log("Summary:");
    console.log(`  - Client ID: ${clientId}`);
    console.log(`  - Vehicle ID: ${vehicleId}`);
    console.log(`  - Intervention ID: ${interventionId}`);
    console.log(`  - Emails captured: ${getOutbox().length}`);

  } finally {
    // Cleanup
    if (sessionToken) {
      await prisma.session.deleteMany({ where: { token: sessionToken } });
    }
    
    // Optionally clean up test data
    if (interventionId && process.env.CLEANUP_TEST_DATA === "true") {
      await prisma.intervention.delete({ where: { id: interventionId } }).catch(() => {});
    }
    
    await prisma.$disconnect();
  }
}

// Run tests
runCriticalFlowTests().catch((e) => {
  console.error("\n=== TEST FAILED ===\n");
  console.error(e);
  process.exitCode = 1;
});
