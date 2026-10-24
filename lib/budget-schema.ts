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

/** Key tax-impact figures. All fields optional — documents vary widely. */
export const taxImpactSchema = z.object({
  /** Tax rate per $1,000 of assessed value, if stated. */
  taxRatePer1000: z.number().finite().optional(),
  /** Total tax levy, if stated. */
  totalLevy: z.number().finite().optional(),
  /** Percent change in the levy/rate vs. the prior year, if stated. */
  percentChange: z.number().finite().optional(),
  /** Estimated annual impact on an average/median home, if stated. */
  averageHomeImpact: z.number().finite().optional(),
  /**
   * Plain-language tax facts pulled from the document that don't fit the
   * structured fields above (e.g. "Property tax levy rises 2.5% per year",
   * "Property taxes fund $X of the budget"). This catches the tax content
   * most budgets actually state, which is more varied than a few fixed numbers.
   */
  highlights: z.array(z.string()).optional(),
  /** Optional short note providing context for the figures above. */
  note: z.string().optional(),
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
  /** A longer, plain-language brief shown behind a "Read more" toggle. */
  extendedSummary: z.string().optional(),
  /** Key tax-impact figures, when the document reports them. */
  taxImpact: taxImpactSchema.optional(),
});

export type LineItem = z.infer<typeof lineItemSchema>;
export type RevenueItem = z.infer<typeof revenueItemSchema>;
export type YearTotal = z.infer<typeof yearTotalSchema>;
export type TaxImpact = z.infer<typeof taxImpactSchema>;
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

/**
 * Normalize a raw line-item array: coerce amounts, drop empty/invalid rows,
 * and merge entries that share the same name (case-insensitive) by summing
 * their amounts. Merging prevents duplicate/overlapping slices in the pie
 * chart (e.g. the model emitting "Police" twice). The first-seen casing of a
 * name is kept, and the original order is preserved.
 */
function normalizeLineItems(
  raw: unknown,
  nameKey: "name" | "source",
): Array<{ [k: string]: string | number }> {
  if (!Array.isArray(raw)) return [];

  const order: string[] = [];
  const byKey = new Map<string, { name: string; amount: number }>();

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

    const key = name.toLowerCase();
    const existing = byKey.get(key);
    if (existing) {
      existing.amount += amount; // merge duplicates
    } else {
      byKey.set(key, { name, amount });
      order.push(key);
    }
  }

  return order.map((key) => {
    const { name, amount } = byKey.get(key)!;
    return { [nameKey]: name, amount };
  });
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
    ...normalizeExtendedSummary(rec),
    ...normalizeTaxImpact(rec),
  };
}

function normalizeExtendedSummary(
  rec: Record<string, unknown>,
): { extendedSummary?: string } {
  const v = rec.extendedSummary ?? rec.extended_summary;
  return typeof v === "string" && v.trim() ? { extendedSummary: v.trim() } : {};
}

/** Build the taxImpact object, keeping only fields the document provided. */
function normalizeTaxImpact(
  rec: Record<string, unknown>,
): { taxImpact?: Record<string, number | string | string[]> } {
  const raw = rec.taxImpact ?? rec.tax_impact;
  if (!raw || typeof raw !== "object") return {};
  const r = raw as Record<string, unknown>;

  const out: Record<string, number | string | string[]> = {};
  const rate = parseAmount(r.taxRatePer1000 ?? r.taxRate ?? r.rate);
  const levy = parseAmount(r.totalLevy ?? r.levy);
  const pct = parseAmount(r.percentChange ?? r.percent_change);
  const home = parseAmount(r.averageHomeImpact ?? r.averageHome ?? r.homeImpact);
  if (rate !== null) out.taxRatePer1000 = rate;
  if (levy !== null) out.totalLevy = levy;
  if (pct !== null) out.percentChange = pct;
  if (home !== null) out.averageHomeImpact = home;

  const highlights = Array.isArray(r.highlights)
    ? r.highlights
        .map((h) => (typeof h === "string" ? h.trim() : ""))
        .filter((h) => h.length > 0)
    : [];
  if (highlights.length > 0) out.highlights = highlights;

  if (typeof r.note === "string" && r.note.trim()) out.note = r.note.trim();

  return Object.keys(out).length > 0 ? { taxImpact: out } : {};
}

/** Convenience: normalize then validate. Throws if the result is invalid. */
export function parseBudget(raw: unknown): BudgetData {
  return budgetDataSchema.parse(normalizeBudget(raw));
}
