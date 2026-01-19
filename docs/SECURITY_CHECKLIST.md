# Security Checklist — Motorsafe

> **SECURITY-AUDIT-01**: Comprehensive security hardening for multi-tenant SaaS
>
> Last Updated: 2025-01-17

## 🔐 Multi-Tenant Isolation (CRITICAL)

### Principle: No Garage Sees/Edits Another's Data

Every database query for tenanted resources MUST include a `garageId` filter.

```typescript
// ✅ CORRECT: Always scope by garageId
const client = await prisma.client.findFirst({
  where: {
    id: clientId,
    deletedAt: null,
    ...(user.role === "ADMIN" ? {} : { garageId: user.garageId ?? -1 }),
  },
});

// ❌ WRONG: No garageId check = cross-tenant data leak
const client = await prisma.client.findUnique({
  where: { id: clientId },
});
```

### New Helper Functions (lib/guards.ts)

```typescript
// Assert record belongs to tenant (throws 404, not 403!)
import { assertRecordBelongsToTenant, tenantWhere } from "@/lib/guards";

// Option 1: Check after fetch
const client = await prisma.client.findUnique({ where: { id } });
assertRecordBelongsToTenant(client, user.garageId, "Client");

// Option 2: Build scoped where clause
const where = tenantWhere(user, { status: "ACTIVE", deletedAt: null });
const clients = await prisma.client.findMany({ where });
```

### Tables Requiring garageId Scope

| Table | Field | Notes |
|-------|-------|-------|
| `Client` | `garageId` | All client data |
| `Vehicle` | `garageId` | Via client relationship |
| `Intervention` | `garageId` | All intervention records |
| `Document` | `garageId` | Uploaded files metadata |
| `Quote` | `organisationId` | Use `organisationWhere()` |
| `Invoice` | `organisationId` | Use `organisationWhere()` |
| `InvoiceLine` | via Invoice | Cascade from parent |
| `QuoteLine` | via Quote | Cascade from parent |
| `SignatureRequest` | `garageId` | E-signature requests |
| `LoanContract` | `garageId` | Courtesy vehicle loans |
| `User` | `garageId` | Team members |
| `AutomationRule` | `garageId` | Workflow automations |
| `NotificationSettings` | `garageId` | Email prefs |

### Tables NOT Tenant-Scoped (Global/Admin)

| Table | Reason |
|-------|--------|
| `Garage` | Top-level tenant entity |
| `Session` | Auth sessions (userId scoped) |
| `AuditLog` | Can be cross-tenant for ADMIN |
| `SupportTicket` | Support system |
| `KbArticle` | Public knowledge base |
| `Changelog` | Public announcements |
| `MaintenanceWindow` | System-wide |

---

## 🛡️ Authentication & Authorization

### Route Protection Matrix

| Route Pattern | Auth Required | Role Check | Tenant Scope |
|---------------|---------------|------------|--------------|
| `/api/admin/*` | ✅ | `requireRole(["ADMIN"])` | N/A |
| `/api/cron/*` | ✅ Header | `CRON_SECRET` | N/A |
| `/api/public/*` | ❌ | Rate limited | N/A |
| `/api/kb/*` | ❌ | Public read | N/A |
| `/api/signatures/[token]/*` | ❌ | Token-based | Via token |
| `/api/clients/*` | ✅ | `requireApprovedTenant` | garageId |
| `/api/vehicules/*` | ✅ | `requireApprovedTenant` | garageId |
| `/api/interventions/*` | ✅ | `requireApprovedTenant` | garageId |
| `/api/quotes/*` | ✅ | `requireApprovedTenant` | organisationId |
| `/api/invoices/*` | ✅ | `requireApprovedTenant` | organisationId |
| `/api/uploads/*` | ✅ | `requireApprovedTenant` | Path prefix |

### Standard Route Pattern

```typescript
export async function GET(req: Request, ctx: { params: Promise<{ id: string }> }) {
  try {
    // 1. Authenticate
    const user = requireApprovedTenant(await requireUser(req));

    // 2. Parse params
    const { id } = await ctx.params;

    // 3. Fetch with tenant scope (CRITICAL!)
    const record = await prisma.myTable.findFirst({
      where: {
        id,
        deletedAt: null,
        ...(user.role === "ADMIN" ? {} : { garageId: user.garageId ?? -1 }),
      },
    });

    // 4. Return 404 if not found (NEVER 403 for security!)
    if (!record) {
      return NextResponse.json(failure("Introuvable"), { status: 404 });
    }

    return NextResponse.json(success(record));
  } catch (err) {
    return toErrorResponse(err);
  }
}
```

### Security Response Codes

| Situation | Code | Reason |
|-----------|------|--------|
| Not logged in | 401 | `UNAUTHORIZED` |
| Account pending | 403 | `FORBIDDEN` |
| Wrong tenant | **404** | Prevents enumeration |
| Resource not found | 404 | `NOT_FOUND` |
| Feature not available | 402 | `SUBSCRIPTION_REQUIRED` |
| Rate limited | 429 | `RATE_LIMITED` |

---

## 🔒 HTTP Security Headers

Configured in `next.config.ts`:

```typescript
// Applied to all routes
const securityHeaders = [
  { key: "X-Content-Type-Options", value: "nosniff" },
  { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
  { key: "X-Frame-Options", value: "DENY" },
  { key: "X-XSS-Protection", value: "1; mode=block" },
  { key: "Permissions-Policy", value: "camera=(), microphone=(), geolocation=(), payment=()" },
  { key: "Content-Security-Policy", value: cspValue },
];

// Production only
const hstsHeader = {
  key: "Strict-Transport-Security",
  value: "max-age=31536000; includeSubDomains; preload",
};
```

### Content Security Policy

```
default-src 'self';
script-src 'self' 'unsafe-inline' 'unsafe-eval';
style-src 'self' 'unsafe-inline';
img-src 'self' data: https: blob:;
font-src 'self' data:;
connect-src 'self' https://api.resend.com https://api.openai.com https://api.anthropic.com https://*.ingest.sentry.io;
frame-ancestors 'none';
base-uri 'self';
form-action 'self';
upgrade-insecure-requests;
```

---

## 🍪 Cookie Security

Configured in `lib/auth.ts`:

```typescript
res.cookies.set(SESSION_COOKIE, token, {
  httpOnly: true,              // Prevents XSS access
  sameSite: "lax",             // CSRF protection
  secure: process.env.NODE_ENV === "production",  // HTTPS only in prod
  path: "/",
  expires: expiresAt,          // 30 days TTL
});
```

---

## 📁 Upload Security

### Path Prefix Enforcement

All uploaded files MUST be prefixed with the garage's ID:

```
uploads/{garageId}/{timestamp}-{filename}
```

### Download Endpoint Security (`/api/uploads/file/[...key]`)

```typescript
// 1. Verify auth
const user = requireApprovedTenant(await requireUser(req));

// 2. Block path traversal
if (key.includes("..")) {
  return NextResponse.json(failure("Chemin invalide"), { status: 400 });
}

// 3. Verify path prefix matches user's garageId
if (user.role !== "ADMIN") {
  const expectedPrefix = `uploads/${user.garageId}/`;
  if (!key.startsWith(expectedPrefix)) {
    return NextResponse.json(failure("Fichier introuvable"), { status: 404 });
  }
}
```

---

## 🔍 PII Redaction (Observability)

Configured in `lib/observability/redact.ts`:

### Redacted Patterns

| Pattern | Replacement |
|---------|-------------|
| Email addresses | `[EMAIL_REDACTED]` |
| Phone numbers (FR) | `[PHONE_REDACTED]` |
| License plates | `[PLATE_REDACTED]` |
| VIN (17 chars) | `[VIN_REDACTED]` |
| SIRET/SIREN | `[SIRET_REDACTED]` |
| Credit cards | `[CARD_REDACTED]` |
| IBAN | `[IBAN_REDACTED]` |

### Sensitive Field Names (Always Redacted)

```typescript
const SENSITIVE_FIELD_NAMES = [
  'email', 'phone', 'mobile', 'plate', 'vin',
  'name', 'firstName', 'lastName',
  'siret', 'address', 'password', 'token', 'apiKey',
  'creditCard', 'iban', 'signerEmail', 'clientName'
];
```

### Usage

```typescript
import { redactForSentry } from "@/lib/observability";

// Auto-redact before sending to Sentry
Sentry.captureException(error, {
  extra: redactForSentry({ clientEmail, vehiclePlate, vin }),
});
```

---

## 🧪 Security Testing

### Multi-Tenant E2E Tests

Run isolation tests to verify no cross-tenant data leaks:

```bash
# Set up two test users in different garages
GARAGE_A_EMAIL=user_a@test.com \
GARAGE_B_EMAIL=user_b@test.com \
npx ts-node scripts/multi-tenant-tests.ts
```

### Test Coverage

- ✅ Client isolation (GET/PUT/DELETE)
- ✅ Vehicle isolation (GET/PUT)
- ✅ Intervention isolation (GET/PATCH/DELETE)
- ✅ Document isolation (GET/DELETE)
- ✅ Quote isolation (GET/PUT/PDF)
- ✅ Invoice isolation (GET/PUT/PDF)
- ✅ PDF generation isolation
- ✅ Signature request isolation
- ✅ Upload file access isolation
- ✅ Path traversal attack prevention
- ✅ Team member isolation

---

## ✅ Pre-Deploy Security Checklist

Before every production deploy:

- [ ] All tenanted routes use `garageId` or `organisationId` scope
- [ ] All error responses use 404 (not 403) for missing/wrong tenant
- [ ] No `console.log` with PII in production code
- [ ] Security headers verified with securityheaders.com
- [ ] Cookie flags correct (httpOnly, secure, sameSite)
- [ ] Rate limiting on public endpoints
- [ ] CRON routes protected by `CRON_SECRET`
- [ ] Multi-tenant tests pass
- [ ] Dependencies updated (check `npm audit`)

---

## 🚨 Incident Response

### Suspected Data Leak

1. Check `AuditLog` for suspicious cross-garage access
2. Review Sentry for errors with `NOT_FOUND` vs `FORBIDDEN`
3. Verify route has proper `garageId` scope

### SQL to Audit Cross-Tenant Access

```sql
-- Find interventions accessed by wrong garage
SELECT al.* 
FROM "AuditLog" al
JOIN "Intervention" i ON al."entityId" = i.id AND al."entityType" = 'Intervention'
JOIN "User" u ON al."userId" = u.id
WHERE i."garageId" != u."garageId"
  AND u.role != 'ADMIN';
```

---

## 📚 References

- [OWASP Top 10](https://owasp.org/Top10/)
- [OWASP ASVS](https://owasp.org/www-project-application-security-verification-standard/)
- [Next.js Security](https://nextjs.org/docs/app/building-your-application/configuring/security-headers)
- [Prisma Security](https://www.prisma.io/docs/orm/prisma-client/queries/raw-database-access)
