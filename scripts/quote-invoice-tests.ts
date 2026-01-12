import assert from "node:assert";
import { spawnSync } from "node:child_process";
import { randomUUID } from "node:crypto";
import fs from "node:fs/promises";
import os from "node:os";
import path from "node:path";
import { PrismaClient, type Prisma } from "@prisma/client";

function sleep(ms: number) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

async function run() {
  const dbPath = path.join(os.tmpdir(), `motorsafe-quote-invoice-${randomUUID()}.db`);
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
    const { allocateNumber } = await import("../lib/numbering");
    const { computeDefaultVatRate } = await import("../lib/tax");
    const { convertQuoteToInvoiceTx } = await import("../lib/quoteInvoice");

    const org1 = await prisma.garage.create({
      data: { name: "Test Org 1", email: `test-org1-${Date.now()}@local`, status: "ACTIVE" },
    });
    const org2 = await prisma.garage.create({
      data: { name: "Test Org 2", email: `test-org2-${Date.now()}@local`, status: "ACTIVE" },
    });

    const year = 2026;

    const a1 = await allocateNumber({
      organisationId: org1.id,
      type: "QUOTE",
      year,
      prefix: "DEV",
      padding: 4,
    });
    const a2 = await allocateNumber({
      organisationId: org1.id,
      type: "QUOTE",
      year,
      prefix: "DEV",
      padding: 4,
    });

    assert.notStrictEqual(a1.number, a2.number);
    assert.strictEqual(a2.seq, a1.seq + 1);

    const vat0 = computeDefaultVatRate(
      { defaultVatRate: 0.2 },
      { vatProfile: "PRO_UE_VAT", vatNumber: "EU123", countryCode: "DE" }
    );
    assert.strictEqual(vat0, 0);

    const client = await prisma.client.create({
      data: {
        garageId: org1.id,
        firstName: "T",
        lastName: "Client",
        vatProfile: "PARTICULIER",
        countryCode: "FR",
      },
    });

    const quote = await prisma.quote.create({
      data: {
        organisationId: org1.id,
        clientId: client.id,
        status: "ACCEPTED",
        quoteNumber: `DEV-${year}-0001`,
        quoteYear: year,
        quoteSeq: 1,
        currency: "EUR",
        vatMode: "EXCL",
        subtotalExcl: 100,
        totalVat: 20,
        totalIncl: 120,
        lines: {
          createMany: {
            data: [
              {
                description: "Test",
                qty: 1,
                unitPriceExcl: 100,
                vatRate: 0.2,
                lineTotalExcl: 100,
                lineVatAmount: 20,
                lineTotalIncl: 120,
              },
            ],
          },
        },
      },
    });

    const inv1 = await prisma.$transaction((tx: Prisma.TransactionClient) =>
      convertQuoteToInvoiceTx(tx, { organisationId: org1.id, quoteId: quote.id })
    );
    const inv2 = await prisma.$transaction((tx: Prisma.TransactionClient) =>
      convertQuoteToInvoiceTx(tx, { organisationId: org1.id, quoteId: quote.id })
    );

    assert.strictEqual(inv1.invoiceId, inv2.invoiceId);

    const cross = await prisma.quote.findFirst({
      where: { id: quote.id, organisationId: org2.id, deletedAt: null },
    });
    assert.strictEqual(cross, null);

    // eslint-disable-next-line no-console
    console.log("quote-invoice-tests: OK");
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
        console.warn("quote-invoice-tests: cleanup warning", e);
        break;
      }
    }
  }
}

run()
  .catch((e) => {
    // eslint-disable-next-line no-console
    console.error("quote-invoice-tests: FAILED");
    // eslint-disable-next-line no-console
    console.error(e);
    process.exitCode = 1;
  });
