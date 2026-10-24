"use client";

import { useState } from "react";
import type { BudgetData } from "@/lib/budget-schema";
import {
  saveReport,
  newReportId,
  type SavedReport,
} from "@/lib/saved-reports";
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
  initialReport,
}: {
  budget: BudgetData;
  text: string;
  onReset: () => void;
  /** When reopening a saved report, its stored title/sections/id. */
  initialReport?: SavedReport;
}) {
  const hasYoy = !!budget.yearOverYear && budget.yearOverYear.length >= 2;

  const [pinned, setPinned] = useState<PinnedSection[]>(
    initialReport?.sections ?? [],
  );
  const [reportTitle, setReportTitle] = useState(
    initialReport?.title ?? budget.title,
  );
  const [editingTitle, setEditingTitle] = useState(false);
  const [reportId] = useState(initialReport?.id ?? newReportId());
  const [savedAt, setSavedAt] = useState<number | null>(
    initialReport?.savedAt ?? null,
  );
  const pinnedIds = new Set(pinned.map((p) => p.id));

  function addPinned(section: PinnedSection) {
    setPinned((prev) =>
      prev.some((p) => p.id === section.id) ? prev : [...prev, section],
    );
  }

  function downloadPdf() {
    // Print-to-PDF: print CSS (globals.css) hides the chat and app chrome,
    // leaving the charts + report sections. The browser's print dialog lets
    // the user "Save as PDF".
    window.print();
  }

  function handleSave() {
    const now = Date.now();
    saveReport({
      id: reportId,
      title: reportTitle,
      municipality: budget.municipality,
      fiscalYear: budget.fiscalYear,
      savedAt: now,
      budget,
      text,
      sections: pinned,
    });
    setSavedAt(now);
  }

  return (
    <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6">
      <header className="mb-6 flex flex-wrap items-start justify-between gap-4">
        <div className="min-w-0 flex-1">
          <p className="text-sm font-medium text-brand">
            {budget.municipality} · {budget.fiscalYear}
          </p>
          {editingTitle ? (
            <input
              value={reportTitle}
              onChange={(e) => setReportTitle(e.target.value)}
              onBlur={() => setEditingTitle(false)}
              onKeyDown={(e) => {
                if (e.key === "Enter") setEditingTitle(false);
              }}
              aria-label="Report title"
              autoFocus
              className="w-full rounded border border-slate-300 px-2 py-1 text-2xl font-bold text-slate-900 focus:border-brand focus:outline-none"
            />
          ) : (
            <h1 className="group flex items-center gap-2 text-2xl font-bold text-slate-900">
              {reportTitle}
              <button
                onClick={() => setEditingTitle(true)}
                aria-label="Edit report title"
                className="no-print text-sm font-normal text-slate-400 opacity-0 transition hover:text-brand group-hover:opacity-100"
              >
                ✎ Edit
              </button>
            </h1>
          )}
        </div>
        <div className="no-print flex shrink-0 flex-wrap items-center gap-2">
          <button
            onClick={handleSave}
            className="rounded-lg border border-brand px-4 py-2 text-sm font-medium text-brand hover:bg-blue-50"
          >
            Save report
          </button>
          <button
            onClick={downloadPdf}
            className="rounded-lg bg-brand px-4 py-2 text-sm font-medium text-white hover:bg-brand-dark"
          >
            Download PDF
          </button>
          <button
            onClick={onReset}
            className="rounded-lg border border-slate-300 px-4 py-2 text-sm font-medium text-slate-600 hover:bg-slate-50"
          >
            Analyze another budget
          </button>
        </div>
      </header>

      {savedAt && (
        <p className="no-print mb-4 text-xs text-slate-400">
          Saved to this browser · {new Date(savedAt).toLocaleString()}
        </p>
      )}

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
          <PinnedSections sections={pinned} onChange={setPinned} />
        </div>

        <div className="no-print lg:col-span-1">
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
