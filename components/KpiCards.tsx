import type { BudgetData } from "@/lib/budget-schema";
import { formatCurrency, formatCurrencyExact } from "@/lib/format";

function largestDepartment(budget: BudgetData): { name: string; amount: number } | null {
  const pool = budget.departments.length > 0 ? budget.departments : budget.categories;
  if (pool.length === 0) return null;
  return pool.reduce((max, d) => (d.amount > max.amount ? d : max));
}

export default function KpiCards({ budget }: { budget: BudgetData }) {
  const largest = largestDepartment(budget);
  const deptCount = budget.departments.length || budget.categories.length;

  const cards = [
    {
      label: "Total Budget",
      value: formatCurrency(budget.totalBudget),
      detail: formatCurrencyExact(budget.totalBudget),
    },
    {
      label: "Largest Department",
      value: largest ? largest.name : "—",
      detail: largest ? formatCurrencyExact(largest.amount) : "No data",
    },
    {
      label: "Departments Tracked",
      value: String(deptCount),
      detail: `${deptCount} line item${deptCount === 1 ? "" : "s"}`,
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
