/**
 * Test Yousign HMAC Verification
 * 
 * Run: npx ts-node scripts/test-yousign-hmac.ts
 */

import { verifyWebhookSignature } from "../lib/yousign";

// Test vectors
const testCases = [
  {
    name: "Valid signature",
    body: '{"event_id":"123","event_name":"signature_request.done"}',
    secret: "test-secret-123",
    // Pre-computed: sha256=HMAC-SHA256(body, secret)
    signature: "sha256=" + require("crypto").createHmac("sha256", "test-secret-123").update('{"event_id":"123","event_name":"signature_request.done"}').digest("hex"),
    expected: true,
  },
  {
    name: "Invalid signature",
    body: '{"event_id":"123","event_name":"signature_request.done"}',
    secret: "test-secret-123",
    signature: "sha256=invalid_signature_here",
    expected: false,
  },
  {
    name: "Empty signature",
    body: '{"event_id":"123"}',
    secret: "test-secret-123",
    signature: "",
    expected: false,
  },
  {
    name: "Empty secret",
    body: '{"event_id":"123"}',
    secret: "",
    signature: "sha256=abc",
    expected: false,
  },
];

console.log("Testing Yousign HMAC Verification\n");
console.log("=".repeat(50));

let passed = 0;
let failed = 0;

for (const tc of testCases) {
  const result = verifyWebhookSignature(tc.body, tc.signature, tc.secret);
  const status = result === tc.expected ? "✅ PASS" : "❌ FAIL";
  
  if (result === tc.expected) {
    passed++;
  } else {
    failed++;
  }
  
  console.log(`\n${status}: ${tc.name}`);
  console.log(`  Expected: ${tc.expected}, Got: ${result}`);
}

console.log("\n" + "=".repeat(50));
console.log(`Results: ${passed} passed, ${failed} failed`);

if (failed > 0) {
  process.exit(1);
}
