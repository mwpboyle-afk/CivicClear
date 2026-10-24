import type { BudgetData } from "@/lib/budget-schema";
import { formatCurrency, formatCurrencyExact } from "@/lib/format";
import { selectBreakdown, largestItem } from "@/lib/budget-insights";

export default function KpiCards({ budget }: { budget: BudgetData }) {
  const breakdown = selectBreakdown(budget);
  const largest = largestItem(breakdown);
  const count = breakdown.items.length;
  // Capitalize the breakdown label for the card title.
  const titleNoun =
    breakdown.label.charAt(0).toUpperCase() + breakdown.label.slice(1);
  const pluralTitle =
    breakdown.labelPlural.charAt(0).toUpperCase() +
    breakdown.labelPlural.slice(1);

  const cards = [
    {
      label: "Total Budget",
      value: formatCurrency(budget.totalBudget),
      detail: formatCurrencyExact(budget.totalBudget),
    },
    {
      label: `Largest ${titleNoun}`,
      value: largest ? largest.name : "—",
      detail: largest ? formatCurrencyExact(largest.amount) : "No data",
    },
    {
      label: `${pluralTitle} Tracked`,
      value: String(count),
      detail: `${count} line item${count === 1 ? "" : "s"}`,
    },
  ];

  return (
    <section aria-label="Key budget figures" className="grid grid-cols-1 gap-4 sm:grid-cols-3">
      {cards.map((c) => (
        <div
          key={c.label}
          className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm"
        >
          <p className="text-sm font-medium text-slate-500">{c.label}</p>
          <p className="mt-1 truncate text-2xl font-bold text-brand-dark" title={c.value}>
            {c.value}
          </p>
          <p className="mt-1 text-xs text-slate-400">{c.detail}</p>
        </div>
      ))}
    </section>
  );
}
