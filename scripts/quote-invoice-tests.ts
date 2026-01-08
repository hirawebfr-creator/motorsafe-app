import assert from "node:assert";
import { PrismaClient } from "@prisma/client";
import { allocateNumber } from "../lib/numbering";
import { computeDefaultVatRate } from "../lib/tax";
import { convertQuoteToInvoiceTx } from "../lib/quoteInvoice";

const prisma = new PrismaClient();

async function run() {
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

  const inv1 = await prisma.$transaction((tx) =>
    convertQuoteToInvoiceTx(tx, { organisationId: org1.id, quoteId: quote.id })
  );
  const inv2 = await prisma.$transaction((tx) =>
    convertQuoteToInvoiceTx(tx, { organisationId: org1.id, quoteId: quote.id })
  );

  assert.strictEqual(inv1.invoiceId, inv2.invoiceId);

  const cross = await prisma.quote.findFirst({
    where: { id: quote.id, organisationId: org2.id, deletedAt: null },
  });
  assert.strictEqual(cross, null);

  // eslint-disable-next-line no-console
  console.log("quote-invoice-tests: OK");
}

run()
  .catch((e) => {
    // eslint-disable-next-line no-console
    console.error("quote-invoice-tests: FAILED");
    // eslint-disable-next-line no-console
    console.error(e);
    process.exitCode = 1;
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
