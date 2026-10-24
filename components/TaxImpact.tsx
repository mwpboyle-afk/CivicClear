import type { BudgetData } from "@/lib/budget-schema";
import { formatCurrencyExact } from "@/lib/format";
import { ChartCard } from "./CategoryPie";

function formatRate(rate: number): string {
  return `$${rate.toLocaleString("en-US", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  })}`;
}

function formatPercent(pct: number): string {
  const sign = pct > 0 ? "+" : "";
  return `${sign}${pct.toLocaleString("en-US", { maximumFractionDigits: 2 })}%`;
}

export default function TaxImpact({ budget }: { budget: BudgetData }) {
  const t = budget.taxImpact;

  const figures: Array<{ label: string; value: string }> = [];
  if (t) {
    if (t.taxRatePer1000 !== undefined)
      figures.push({
        label: "Tax rate (per $1,000)",
        value: formatRate(t.taxRatePer1000),
      });
    if (t.totalLevy !== undefined)
      figures.push({ label: "Total levy", value: formatCurrencyExact(t.totalLevy) });
    if (t.percentChange !== undefined)
      figures.push({
        label: "Change vs. last year",
        value: formatPercent(t.percentChange),
      });
    if (t.averageHomeImpact !== undefined)
      figures.push({
        label: "Impact on an average home",
        value: formatCurrencyExact(t.averageHomeImpact),
      });
  }

  const highlights = t?.highlights ?? [];
  const hasContent = figures.length > 0 || highlights.length > 0;

  return (
    <ChartCard title="Tax Impact">
      {!hasContent ? (
        <p className="py-8 text-center text-sm text-slate-400">
          No tax information was found in this document.
        </p>
      ) : (
        <>
          {figures.length > 0 && (
            <dl className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              {figures.map((f) => (
                <div
                  key={f.label}
                  className="rounded-lg border border-slate-100 bg-slate-50 p-4"
                >
                  <dt className="text-xs font-medium text-slate-500">
                    {f.label}
                  </dt>
                  <dd className="mt-1 text-xl font-bold text-brand-dark">
                    {f.value}
                  </dd>
                </div>
              ))}
            </dl>
          )}

          {highlights.length > 0 && (
            <ul
              className={`space-y-2 ${figures.length > 0 ? "mt-4" : ""} text-sm text-slate-700`}
            >
              {highlights.map((h, i) => (
                <li key={i} className="flex gap-2">
                  <span aria-hidden="true" className="text-brand">
                    •
                  </span>
                  <span>{h}</span>
                </li>
              ))}
            </ul>
          )}

          {t?.note && <p className="mt-3 text-sm text-slate-600">{t.note}</p>}
        </>
      )}
    </ChartCard>
  );
}
