import { z } from "zod";

export const DateRangeSchema = z.object({
  from: z
    .string()
    .regex(/^\d{4}-\d{2}-\d{2}$/)
    .optional(),
  to: z
    .string()
    .regex(/^\d{4}-\d{2}-\d{2}$/)
    .optional(),
});

export function parseDateRange(url: URL) {
  const parsed = DateRangeSchema.safeParse({
    from: url.searchParams.get("from") ?? undefined,
    to: url.searchParams.get("to") ?? undefined,
  });
  if (!parsed.success) return { ok: false as const, error: parsed.error.flatten() };

  const now = new Date();
  const defaultTo = new Date(now);
  const defaultFrom = new Date(now);
  defaultFrom.setDate(defaultFrom.getDate() - 30);

  const fromStr = parsed.data.from ?? defaultFrom.toISOString().slice(0, 10);
  const toStr = parsed.data.to ?? defaultTo.toISOString().slice(0, 10);

  const from = new Date(`${fromStr}T00:00:00.000Z`);
  const to = new Date(`${toStr}T23:59:59.999Z`);

  if (Number.isNaN(from.getTime()) || Number.isNaN(to.getTime())) {
    return { ok: false as const, error: { formErrors: ["Dates invalides"], fieldErrors: {} } };
  }

  if (from > to) {
    return { ok: false as const, error: { formErrors: ["'from' doit être <= 'to'"], fieldErrors: {} } };
  }

  return { ok: true as const, from, to, fromStr, toStr };
}
