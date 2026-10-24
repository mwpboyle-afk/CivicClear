"use client";

import type { BudgetData } from "@/lib/budget-schema";
import KpiCards from "./KpiCards";
import CategoryPie from "./CategoryPie";
import RevenueVsExpense from "./RevenueVsExpense";
import YearOverYear from "./YearOverYear";
import ChatPanel from "./ChatPanel";

export default function Dashboard({
  budget,
  text,
  onReset,
}: {
  budget: BudgetData;
  text: string;
  onReset: () => void;
}) {
  const hasYoy = !!budget.yearOverYear && budget.yearOverYear.length >= 2;

  return (
    <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6">
      <header className="mb-6 flex flex-wrap items-start justify-between gap-4">
        <div>
          <p className="text-sm font-medium text-brand">
            {budget.municipality} · {budget.fiscalYear}
          </p>
          <h1 className="text-2xl font-bold text-slate-900">{budget.title}</h1>
        </div>
        <button
          onClick={onReset}
          className="rounded-lg border border-slate-300 px-4 py-2 text-sm font-medium text-slate-600 hover:bg-slate-50"
        >
          Analyze another budget
        </button>
      </header>

      {budget.summary && (
        <div className="mb-6 rounded-xl border border-blue-100 bg-blue-50 p-4 text-sm text-slate-700">
          {budget.summary}
        </div>
      )}

      <div className="mb-6">
        <KpiCards budget={budget} />
      </div>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
        <div className="space-y-6 lg:col-span-2">
          <CategoryPie budget={budget} />
          <RevenueVsExpense budget={budget} />
          {hasYoy && <YearOverYear budget={budget} />}
        </div>

        <div className="lg:col-span-1">
          <ChatPanel budget={budget} text={text} />
        </div>
      </div>
    </div>
  );
}
