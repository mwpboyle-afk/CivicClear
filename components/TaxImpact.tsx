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

  return (
    <ChartCard title="Tax Impact">
      {figures.length === 0 ? (
        <p className="py-8 text-center text-sm text-slate-400">
          No tax-impact figures were found in this document.
        </p>
      ) : (
        <>
          <dl className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            {figures.map((f) => (
              <div
                key={f.label}
                className="rounded-lg border border-slate-100 bg-slate-50 p-4"
              >
                <dt className="text-xs font-medium text-slate-500">{f.label}</dt>
                <dd className="mt-1 text-xl font-bold text-brand-dark">
                  {f.value}
                </dd>
              </div>
            ))}
          </dl>
          {t?.note && <p className="mt-3 text-sm text-slate-600">{t.note}</p>}
        </>
      )}
    </ChartCard>
  );
}
