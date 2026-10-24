import type { BudgetData, DebtItem } from "@/lib/budget-schema";
import { formatCurrency } from "@/lib/format";
import { ChartCard } from "./CategoryPie";

/** Collect the distinct years across all debt items, in first-seen order. */
function collectYears(items: DebtItem[]): string[] {
  const seen: string[] = [];
  for (const item of items) {
    for (const y of item.years) {
      if (!seen.includes(y.year)) seen.push(y.year);
    }
  }
  return seen;
}

/** Group items by fund; items without a fund go under "Other". */
function groupByFund(items: DebtItem[]): Array<[string, DebtItem[]]> {
  const groups = new Map<string, DebtItem[]>();
  for (const item of items) {
    const key = item.fund || "Other";
    if (!groups.has(key)) groups.set(key, []);
    groups.get(key)!.push(item);
  }
  return Array.from(groups.entries());
}

function amountFor(item: DebtItem, year: string): number | null {
  const match = item.years.find((y) => y.year === year);
  return match ? match.amount : null;
}

export default function DebtService({ budget }: { budget: BudgetData }) {
  const items = budget.debtService ?? [];

  if (items.length === 0) {
    return (
      <ChartCard title="Debt Service">
        <p className="py-8 text-center text-sm text-slate-400">
          No multi-year debt-service schedule was found in this document.
        </p>
      </ChartCard>
    );
  }

  const years = collectYears(items);
  const groups = groupByFund(items);

  return (
    <ChartCard title="Debt Service by Year">
      <div className="overflow-x-auto">
        <table className="w-full border-collapse text-sm">
          <thead>
            <tr className="border-b border-slate-200 text-left text-xs text-slate-500">
              <th className="py-2 pr-4 font-medium">Item</th>
              {years.map((y) => (
                <th key={y} className="px-2 py-2 text-right font-medium">
                  {y}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {groups.map(([fund, groupItems]) => (
              <FundGroup
                key={fund}
                fund={fund}
                items={groupItems}
                years={years}
                showFundHeader={groups.length > 1 || fund !== "Other"}
              />
            ))}
          </tbody>
        </table>
      </div>
    </ChartCard>
  );
}

function FundGroup({
  fund,
  items,
  years,
  showFundHeader,
}: {
  fund: string;
  items: DebtItem[];
  years: string[];
  showFundHeader: boolean;
}) {
  return (
    <>
      {showFundHeader && (
        <tr className="bg-slate-50">
          <td
            colSpan={years.length + 1}
            className="px-1 py-1.5 text-xs font-semibold uppercase tracking-wide text-slate-500"
          >
            {fund}
          </td>
        </tr>
      )}
      {items.map((item, i) => (
        <tr key={i} className="border-b border-slate-100">
          <td className="py-2 pr-4 text-slate-700">{item.name}</td>
          {years.map((y) => {
            const amount = amountFor(item, y);
            return (
              <td
                key={y}
                className="px-2 py-2 text-right tabular-nums text-slate-600"
              >
                {amount === null ? "—" : formatCurrency(amount)}
              </td>
            );
          })}
        </tr>
      ))}
    </>
  );
}
