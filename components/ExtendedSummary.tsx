"use client";

import { useState } from "react";
import type { BudgetData } from "@/lib/budget-schema";

/**
 * Shows the short summary, with an expandable "Read more" that reveals the
 * longer extendedSummary when the document supports one.
 */
export default function ExtendedSummary({ budget }: { budget: BudgetData }) {
  const [expanded, setExpanded] = useState(false);

  if (!budget.summary && !budget.extendedSummary) {
    return (
      <div className="rounded-xl border border-slate-200 bg-white p-4 text-sm text-slate-400">
        No summary was found in this document.
      </div>
    );
  }

  const hasMore = !!budget.extendedSummary;

  return (
    <div className="rounded-xl border border-blue-100 bg-blue-50 p-4 text-sm text-slate-700">
      {budget.summary && <p>{budget.summary}</p>}

      {hasMore && expanded && (
        <p className="mt-3 whitespace-pre-wrap border-t border-blue-100 pt-3">
          {budget.extendedSummary}
        </p>
      )}

      {hasMore && (
        <button
          onClick={() => setExpanded((v) => !v)}
          aria-expanded={expanded}
          className="mt-2 text-sm font-medium text-brand hover:text-brand-dark"
        >
          {expanded ? "Show less" : "Read more"}
        </button>
      )}
    </div>
  );
}
