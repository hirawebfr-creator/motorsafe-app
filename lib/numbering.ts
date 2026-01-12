import { prisma } from "@/lib/prisma";
import type { Prisma } from "@prisma/client";

export type NumberingType = "QUOTE" | "INVOICE";

export async function allocateNumberTx(
  tx: Prisma.TransactionClient,
  params: {
  organisationId: number;
  type: NumberingType;
  year: number;
  prefix: string;
  padding: number;
  }
): Promise<{ number: string; year: number; seq: number }> {
  const { organisationId, type, year, prefix, padding } = params;

  if (!Number.isInteger(year) || year < 2000 || year > 9999) {
    throw new Error("Invalid year");
  }

  const safePrefix = String(prefix || "").trim();
  const safePadding = Number.isFinite(padding) ? Math.max(1, Math.min(12, Math.floor(padding))) : 4;

  const sequence = await tx.numberSequence.upsert({
    where: {
      organisationId_type_year: {
        organisationId,
        type,
        year,
      },
    },
    create: {
      organisationId,
      type,
      year,
      nextNumber: 1,
    },
    update: {},
  });

  const seq = sequence.nextNumber;

  await tx.numberSequence.update({
    where: { id: sequence.id },
    data: { nextNumber: seq + 1 },
  });

  const padded = String(seq).padStart(safePadding, "0");
  const number = `${safePrefix}-${year}-${padded}`;

  return { number, year, seq };
}

export async function allocateNumber(params: {
  organisationId: number;
  type: NumberingType;
  year: number;
  prefix: string;
  padding: number;
}): Promise<{ number: string; year: number; seq: number }> {
  return prisma.$transaction((tx: Prisma.TransactionClient) => allocateNumberTx(tx, params));
}
