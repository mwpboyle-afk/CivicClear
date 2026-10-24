import { z } from "zod";

/**
 * The structured shape of a municipal budget. This is the single source of
 * truth: the LLM must produce data that fits this shape, and the UI consumes
 * exactly this. Keep this in sync with the Gemini responseSchema in gemini.ts.
 */

export const lineItemSchema = z.object({
  name: z.string().min(1),
  amount: z.number().finite(),
});

export const revenueItemSchema = z.object({
  source: z.string().min(1),
  amount: z.number().finite(),
});

export const yearTotalSchema = z.object({
  year: z.string().min(1),
  total: z.number().finite(),
});

export const budgetDataSchema = z.object({
  title: z.string(),
  municipality: z.string(),
  fiscalYear: z.string(),
  totalBudget: z.number().finite(),
  departments: z.array(lineItemSchema),
  categories: z.array(lineItemSchema),
  revenue: z.array(revenueItemSchema),
  expenditures: z.array(lineItemSchema),
  yearOverYear: z.array(yearTotalSchema).optional(),
  summary: z.string(),
});

export type LineItem = z.infer<typeof lineItemSchema>;
export type RevenueItem = z.infer<typeof revenueItemSchema>;
export type YearTotal = z.infer<typeof yearTotalSchema>;
export type BudgetData = z.infer<typeof budgetDataSchema>;

/**
 * Coerce a currency-ish value into a finite number.
 * Handles strings like "$1,234,567", "1,234.50", "(1,200)" (accounting
 * negative), "1.2M", "3B", and plain numbers. Returns null when it cannot
 * produce a finite number.
 */
export function parseAmount(value: unknown): number | null {
  if (typeof value === "number") {
    return Number.isFinite(value) ? value : null;
  }
  if (typeof value !== "string") {
    return null;
  }

  let s = value.trim();
  if (s === "") return null;

  // Accounting-style negatives: (1,200) => -1200
  let negative = false;
  if (/^\(.*\)$/.test(s)) {
    negative = true;
    s = s.slice(1, -1);
  }
  if (s.includes("-")) {
    negative = true;
  }

  // Detect magnitude suffixes (K/M/B) before stripping letters.
  let multiplier = 1;
  const suffixMatch = s.match(/([kmb])\s*$/i);
  if (suffixMatch) {
    const suffix = suffixMatch[1].toLowerCase();
    multiplier = suffix === "k" ? 1e3 : suffix === "m" ? 1e6 : 1e9;
  }

  // Keep only digits and the decimal point.
  const cleaned = s.replace(/[^0-9.]/g, "");
  if (cleaned === "" || cleaned === ".") return null;

  const parsed = Number(cleaned);
  if (!Number.isFinite(parsed)) return null;

  const result = parsed * multiplier * (negative ? -1 : 1);
  return Number.isFinite(result) ? result : null;
}

/** Normalize a raw line-item array: coerce amounts, drop empty/invalid rows. */
function normalizeLineItems(
  raw: unknown,
  nameKey: "name" | "source",
): Array<{ [k: string]: string | number }> {
  if (!Array.isArray(raw)) return [];
  const out: Array<{ [k: string]: string | number }> = [];
  for (const item of raw) {
    if (!item || typeof item !== "object") continue;
    const rec = item as Record<string, unknown>;
    const name =
      typeof rec[nameKey] === "string"
        ? (rec[nameKey] as string).trim()
        : typeof rec.name === "string"
          ? (rec.name as string).trim()
          : typeof rec.source === "string"
            ? (rec.source as string).trim()
            : "";
    const amount = parseAmount(rec.amount);
    if (!name || amount === null) continue;
    out.push({ [nameKey]: name, amount });
  }
  return out;
}

/**
 * Take loosely-typed LLM output and coerce it toward BudgetData: normalize all
 * amounts, drop empty rows, and default missing fields. The result should be
 * passed through budgetDataSchema.parse to guarantee correctness.
 */
export function normalizeBudget(raw: unknown): unknown {
  const rec = (raw && typeof raw === "object" ? raw : {}) as Record<
    string,
    unknown
  >;

  const yoyRaw = rec.yearOverYear ?? rec.yearoveryear;
  let yearOverYear: Array<{ year: string; total: number }> | undefined;
  if (Array.isArray(yoyRaw)) {
    const rows = yoyRaw
      .map((item) => {
        if (!item || typeof item !== "object") return null;
        const r = item as Record<string, unknown>;
        const year =
          typeof r.year === "string"
            ? r.year.trim()
            : r.year != null
              ? String(r.year).trim()
              : "";
        const total = parseAmount(r.total ?? r.amount);
        if (!year || total === null) return null;
        return { year, total };
      })
      .filter((x): x is { year: string; total: number } => x !== null);
    yearOverYear = rows.length > 0 ? rows : undefined;
  }

  const totalBudget = parseAmount(rec.totalBudget ?? rec.total);

  return {
    title: typeof rec.title === "string" ? rec.title : "Municipal Budget",
    municipality:
      typeof rec.municipality === "string" ? rec.municipality : "Unknown",
    fiscalYear:
      typeof rec.fiscalYear === "string"
        ? rec.fiscalYear
        : rec.fiscalYear != null
          ? String(rec.fiscalYear)
          : "Unknown",
    totalBudget: totalBudget ?? 0,
    departments: normalizeLineItems(rec.departments, "name"),
    categories: normalizeLineItems(rec.categories, "name"),
    revenue: normalizeLineItems(rec.revenue, "source"),
    expenditures: normalizeLineItems(rec.expenditures, "name"),
    ...(yearOverYear ? { yearOverYear } : {}),
    summary: typeof rec.summary === "string" ? rec.summary : "",
  };
}

/** Convenience: normalize then validate. Throws if the result is invalid. */
export function parseBudget(raw: unknown): BudgetData {
  return budgetDataSchema.parse(normalizeBudget(raw));
}
