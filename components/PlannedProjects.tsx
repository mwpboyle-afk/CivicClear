import type { BudgetData } from "@/lib/budget-schema";
import { formatCurrencyExact } from "@/lib/format";
import { ChartCard } from "./CategoryPie";

export default function PlannedProjects({ budget }: { budget: BudgetData }) {
  const projects = budget.plannedProjects ?? [];

  return (
    <ChartCard title="Planned Projects">
      {projects.length === 0 ? (
        <p className="py-8 text-center text-sm text-slate-400">
          No planned projects were found in this document.
        </p>
      ) : (
        <ul className="divide-y divide-slate-100">
          {projects.map((p, i) => (
            <li key={i} className="py-3">
              <div className="flex items-start justify-between gap-4">
                <p className="font-medium text-slate-800">{p.name}</p>
                {p.amount !== undefined && (
                  <p className="shrink-0 font-semibold text-brand-dark">
                    {formatCurrencyExact(p.amount)}
                  </p>
                )}
              </div>
              {p.description && (
                <p className="mt-1 text-sm text-slate-600">{p.description}</p>
              )}
              {p.timeframe && (
                <p className="mt-1 text-xs font-medium uppercase tracking-wide text-slate-400">
                  {p.timeframe}
                </p>
              )}
            </li>
          ))}
        </ul>
      )}
    </ChartCard>
  );
}
