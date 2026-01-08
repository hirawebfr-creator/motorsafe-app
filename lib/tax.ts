export type VatMode = "EXCL" | "INCL";

export type VatProfile =
  | "PARTICULIER"
  | "PRO_FR"
  | "PRO_UE_VAT"
  | "EXPORT"
  | "EXONERE";

export function round2(n: number): number {
  // Avoid typical floating issues by rounding to cents.
  return Math.round((n + Number.EPSILON) * 100) / 100;
}

export function computeDefaultVatRate(
  org: { defaultVatRate: number },
  client: { vatProfile?: string | null; countryCode?: string | null; vatNumber?: string | null }
): number {
  const profile = (client.vatProfile ?? "PARTICULIER") as VatProfile;

  // Minimal rule-set aligned with spec/tests:
  // - PRO_UE_VAT => 0% (reverse charge)
  // - EXPORT => 0%
  // - EXONERE => 0%
  // Otherwise => org default
  if (profile === "PRO_UE_VAT" || profile === "EXPORT" || profile === "EXONERE") return 0;

  return org.defaultVatRate;
}

export function computeLineTotals(
  qty: number,
  unitPriceExcl: number,
  vatRate: number
): { lineTotalExcl: number; lineVatAmount: number; lineTotalIncl: number } {
  const safeQty = Number.isFinite(qty) ? qty : 0;
  const safePrice = Number.isFinite(unitPriceExcl) ? unitPriceExcl : 0;
  const safeVat = Number.isFinite(vatRate) ? vatRate : 0;

  const lineTotalExcl = round2(safeQty * safePrice);
  const lineVatAmount = round2(lineTotalExcl * safeVat);
  const lineTotalIncl = round2(lineTotalExcl + lineVatAmount);

  return { lineTotalExcl, lineVatAmount, lineTotalIncl };
}

export function computeDocTotals(
  lines: Array<{ qty: number; unitPriceExcl: number; vatRate: number }>
): { subtotalExcl: number; totalVat: number; totalIncl: number } {
  let subtotalExcl = 0;
  let totalVat = 0;
  let totalIncl = 0;

  for (const line of lines) {
    const totals = computeLineTotals(line.qty, line.unitPriceExcl, line.vatRate);
    subtotalExcl += totals.lineTotalExcl;
    totalVat += totals.lineVatAmount;
    totalIncl += totals.lineTotalIncl;
  }

  return {
    subtotalExcl: round2(subtotalExcl),
    totalVat: round2(totalVat),
    totalIncl: round2(totalIncl),
  };
}
