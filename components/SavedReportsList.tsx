"use client";

import type { SavedReport } from "@/lib/saved-reports";

export default function SavedReportsList({
  reports,
  onOpen,
  onDelete,
}: {
  reports: SavedReport[];
  onOpen: (report: SavedReport) => void;
  onDelete: (id: string) => void;
}) {
  if (reports.length === 0) return null;

  return (
    <div className="mt-10 w-full">
      <h2 className="mb-3 text-sm font-semibold uppercase tracking-wide text-slate-500">
        Saved reports
      </h2>
      <ul className="space-y-2">
        {reports.map((r) => (
          <li
            key={r.id}
            className="flex items-center justify-between gap-4 rounded-lg border border-slate-200 bg-white px-4 py-3"
          >
            <button
              onClick={() => onOpen(r)}
              className="min-w-0 flex-1 text-left"
            >
              <p className="truncate text-sm font-medium text-slate-800">
                {r.title}
              </p>
              <p className="truncate text-xs text-slate-400">
                {r.municipality} · {r.fiscalYear} ·{" "}
                {new Date(r.savedAt).toLocaleDateString()}
              </p>
            </button>
            <div className="flex shrink-0 gap-2">
              <button
                onClick={() => onOpen(r)}
                className="rounded-md bg-brand px-3 py-1.5 text-xs font-medium text-white hover:bg-brand-dark"
              >
                Open
              </button>
              <button
                onClick={() => onDelete(r.id)}
                aria-label={`Delete ${r.title}`}
                className="rounded-md border border-slate-200 px-3 py-1.5 text-xs font-medium text-slate-500 hover:bg-slate-50"
              >
                Delete
              </button>
            </div>
          </li>
        ))}
      </ul>
      <p className="mt-2 text-xs text-slate-400">
        Saved reports are stored in this browser only.
      </p>
    </div>
  );
}
