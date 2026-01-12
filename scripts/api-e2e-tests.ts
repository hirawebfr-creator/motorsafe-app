import assert from "node:assert";
import { randomBytes, randomUUID } from "node:crypto";
import { PrismaClient } from "@prisma/client";

type ApiOk<T> = { ok: true; data: T };
type ApiErr = { ok: false; error: { code?: string; message?: string; details?: unknown } };

type Client = { id: number };
type Vehicle = { id: string };
type Intervention = { id: string };

type Paginated<T> = { items: T[]; page: number; pageSize: number; total: number };

type FetchResult<T> = { status: number; json: ApiOk<T> | ApiErr | unknown };

type MeData = { user: { email: string } };

async function fetchJson<T>(url: string, init: RequestInit): Promise<FetchResult<T>> {
  const res = await fetch(url, init);
  const text = await res.text();
  let json: any;
  try {
    json = JSON.parse(text);
  } catch {
    json = text;
  }
  return { status: res.status, json };
}

function isApiOk<T>(v: any): v is ApiOk<T> {
  return Boolean(v && typeof v === "object" && v.ok === true && "data" in v);
}

function isApiErr(v: any): v is ApiErr {
  return Boolean(v && typeof v === "object" && v.ok === false && v.error);
}

async function run() {
  const baseUrl = (process.env.TEST_BASE_URL ?? "http://localhost:3000").replace(/\/$/, "");
  const testEmail = String(process.env.TEST_USER_EMAIL ?? "").trim().toLowerCase();

  if (!testEmail) {
    throw new Error("Missing env TEST_USER_EMAIL (ex: TEST_USER_EMAIL=you@domain.com)");
  }

  const prisma = new PrismaClient();
  let sessionToken: string | null = null;

  try {
    const user = await prisma.user.findUnique({
      where: { email: testEmail },
      include: { garage: true },
    });

    assert.ok(user, `User not found for email ${testEmail}`);

    const isAdmin = user.role === "ADMIN";
    let adminGarageId: number | null = null;
    if (isAdmin) {
      adminGarageId = user.garageId ?? null;
      if (!adminGarageId) {
        const g = await prisma.garage.findFirst({
          where: { status: "ACTIVE" },
          select: { id: true },
          orderBy: { createdAt: "desc" },
        });
        adminGarageId = g?.id ?? null;
      }

      assert.ok(adminGarageId, "ADMIN requires a target garageId to run create tests");
    }

    // Create a fresh session (no password needed)
    sessionToken = randomBytes(32).toString("hex");
    const expiresAt = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000);
    await prisma.session.create({
      data: { token: sessionToken, userId: user.id, expiresAt },
    });

    const cookie = `ms_session=${sessionToken}`;

    // 1) Auth sanity
    {
      const me = await fetchJson<MeData>(`${baseUrl}/api/me`, {
        method: "GET",
        headers: { cookie },
      });
      assert.strictEqual(me.status, 200);
      assert.ok(isApiOk<MeData>(me.json), "Expected ok:true from /api/me");
      assert.ok(me.json.data.user.email, "Expected /api/me to return user");
    }

    // 2) Client create or fallback to existing
    let clientId: number | null = null;
    {
      const uniqueName = `Test Client ${new Date().toISOString()} ${randomUUID().slice(0, 8)}`;
      const created = await fetchJson<Client>(`${baseUrl}/api/clients`, {
        method: "POST",
        headers: { "content-type": "application/json", cookie },
        body: JSON.stringify({
          name: uniqueName.replace(/\s+/g, " "),
          email: `autotest-${Date.now()}@example.com`,
          phone: "0600000000",
          ...(isAdmin ? { garageId: adminGarageId } : {}),
        }),
      });

      if (created.status === 201 && isApiOk<Client>(created.json)) {
        clientId = created.json.data.id;
      } else if (created.status === 403 && isApiErr(created.json) && created.json.error?.code === "LIMIT_REACHED") {
        // Plan limit reached: not a bug; fallback to first existing client.
        const list = await fetchJson<Paginated<Client>>(`${baseUrl}/api/clients?page=1&pageSize=50`, {
          method: "GET",
          headers: { cookie },
        });
        assert.strictEqual(list.status, 200);
        assert.ok(isApiOk<Paginated<Client>>(list.json));
        clientId = list.json.data.items[0]?.id ?? null;
      } else {
        throw new Error(`Client create failed: status=${created.status} body=${JSON.stringify(created.json)}`);
      }

      assert.ok(clientId, "No clientId available (cannot continue)");
    }

    // 3) Vehicle create or fallback to existing
    let vehicleId: string | null = null;
    {
      const plate = `TT-${String(Date.now()).slice(-3)}-E2`;
      const created = await fetchJson<Vehicle>(`${baseUrl}/api/vehicules`, {
        method: "POST",
        headers: { "content-type": "application/json", cookie },
        body: JSON.stringify({
          clientId,
          brand: "Peugeot",
          model: "208",
          plate,
          vin: "",
          fuel: "",
          engine: "",
          year: 2020,
          ...(isAdmin ? { garageId: adminGarageId } : {}),
        }),
      });

      if (created.status === 201 && isApiOk<Vehicle>(created.json)) {
        vehicleId = created.json.data.id;
      } else if (created.status === 403 && isApiErr(created.json) && created.json.error?.code === "LIMIT_REACHED") {
        const list = await fetchJson<Paginated<Vehicle>>(`${baseUrl}/api/vehicules?page=1&pageSize=50&clientId=${clientId}`, {
          method: "GET",
          headers: { cookie },
        });
        assert.strictEqual(list.status, 200);
        assert.ok(isApiOk<Paginated<Vehicle>>(list.json));
        vehicleId = list.json.data.items[0]?.id ?? null;
      } else {
        throw new Error(`Vehicle create failed: status=${created.status} body=${JSON.stringify(created.json)}`);
      }

      assert.ok(vehicleId, "No vehicleId available (cannot continue)");
    }

    // 4) Intervention create
    {
      const created = await fetchJson<Intervention>(`${baseUrl}/api/interventions`, {
        method: "POST",
        headers: { "content-type": "application/json", cookie },
        body: JSON.stringify({
          vehicleId,
          type: "Diag",
          title: "AutoTest Diagnostic",
          notes: "",
          performedAt: "",
          ecuType: "",
          softwareVersion: "",
          checksum: "",
          amountCents: 5000,
          ...(isAdmin ? { garageId: adminGarageId } : {}),
        }),
      });

      if (created.status !== 201 || !isApiOk<Intervention>(created.json)) {
        throw new Error(`Intervention create failed: status=${created.status} body=${JSON.stringify(created.json)}`);
      }
    }

    // 5) List endpoints sanity
    {
      const [clients, vehicules, interventions] = await Promise.all([
        fetchJson<Paginated<Client>>(`${baseUrl}/api/clients?page=1&pageSize=20`, { method: "GET", headers: { cookie } }),
        fetchJson<Paginated<Vehicle>>(`${baseUrl}/api/vehicules?page=1&pageSize=20`, { method: "GET", headers: { cookie } }),
        fetchJson<Paginated<Intervention>>(`${baseUrl}/api/interventions?page=1&pageSize=20`, { method: "GET", headers: { cookie } }),
      ]);

      assert.strictEqual(clients.status, 200);
      assert.strictEqual(vehicules.status, 200);
      assert.strictEqual(interventions.status, 200);

      assert.ok(isApiOk<Paginated<Client>>(clients.json));
      assert.ok(isApiOk<Paginated<Vehicle>>(vehicules.json));
      assert.ok(isApiOk<Paginated<Intervention>>(interventions.json));
    }

    // eslint-disable-next-line no-console
    console.log("api-e2e-tests: OK");
  } finally {
    if (sessionToken) {
      await prisma.session.deleteMany({ where: { token: sessionToken } });
    }
    await prisma.$disconnect();
  }
}

run().catch((e) => {
  // eslint-disable-next-line no-console
  console.error("api-e2e-tests: FAILED");
  // eslint-disable-next-line no-console
  console.error(e);
  process.exitCode = 1;
});
