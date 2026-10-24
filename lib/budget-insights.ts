import type { BudgetData, LineItem } from "./budget-schema";

export type Breakdown = {
  /** The chosen spending line items (departments or categories). */
  items: LineItem[];
  /** Singular noun for the chosen breakdown, e.g. "department" or "category". */
  label: string;
  /** Plural noun, e.g. "departments" or "categories". */
  labelPlural: string;
};

/**
 * Pick a single spending breakdown to drive BOTH the KPI cards and the pie
 * chart, so their counts always agree. We prefer whichever breakdown has more
 * detail (more line items); departments win ties since they're the more
 * meaningful cut for a municipal budget.
 */
export function selectBreakdown(budget: BudgetData): Breakdown {
  const depts = budget.departments;
  const cats = budget.categories;

  const useDepartments = depts.length >= cats.length;
  const items = useDepartments ? depts : cats;
  const label = useDepartments ? "department" : "category";
  const labelPlural = useDepartments ? "departments" : "categories";
  return { items, label, labelPlural };
}

/** The single largest line item in the chosen breakdown, or null if empty. */
export function largestItem(breakdown: Breakdown): LineItem | null {
  if (breakdown.items.length === 0) return null;
  return breakdown.items.reduce((max, d) => (d.amount > max.amount ? d : max));
}
