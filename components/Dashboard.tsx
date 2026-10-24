"use client";

import { useState } from "react";
import type { BudgetData } from "@/lib/budget-schema";
import KpiCards from "./KpiCards";
import CategoryPie from "./CategoryPie";
import RevenueVsExpense from "./RevenueVsExpense";
import YearOverYear from "./YearOverYear";
import ExtendedSummary from "./ExtendedSummary";
import TaxImpact from "./TaxImpact";
import ChatPanel from "./ChatPanel";
import PinnedSections, { type PinnedSection } from "./PinnedSections";

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

  const [pinned, setPinned] = useState<PinnedSection[]>([]);
  const pinnedIds = new Set(pinned.map((p) => p.id));

  function addPinned(section: PinnedSection) {
    // Ignore duplicates (same question pinned twice).
    setPinned((prev) =>
      prev.some((p) => p.id === section.id) ? prev : [...prev, section],
    );
  }

  function removePinned(id: string) {
    setPinned((prev) => prev.filter((p) => p.id !== id));
  }

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

      <div className="mb-6">
        <ExtendedSummary budget={budget} />
      </div>

      <div className="mb-6">
        <KpiCards budget={budget} />
      </div>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
        <div className="space-y-6 lg:col-span-2">
          <CategoryPie budget={budget} />
          <RevenueVsExpense budget={budget} />
          {hasYoy && <YearOverYear budget={budget} />}
          <TaxImpact budget={budget} />
          <PinnedSections sections={pinned} onRemove={removePinned} />
        </div>

        <div className="lg:col-span-1">
          <div className="lg:sticky lg:top-6">
            <ChatPanel
              budget={budget}
              text={text}
              onPin={addPinned}
              pinnedIds={pinnedIds}
            />
          </div>
        </div>
      </div>
    </div>
  );
}
