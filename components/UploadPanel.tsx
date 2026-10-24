"use client";

import { useState, useRef } from "react";

type Sample = { file: string; label: string };

export default function UploadPanel({
  onAnalyze,
  samples = [],
  onAnalyzeSample,
  loading,
  error,
  compact = false,
}: {
  onAnalyze: (file: File) => void;
  samples?: Sample[];
  onAnalyzeSample?: (sample: Sample) => void;
  loading: boolean;
  error: string | null;
  /** When true, don't force full viewport height (makes room for content below). */
  compact?: boolean;
}) {
  const [dragActive, setDragActive] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  function handleFiles(files: FileList | null) {
    if (!files || files.length === 0) return;
    onAnalyze(files[0]);
  }

  return (
    <main
      className={`mx-auto flex max-w-2xl flex-col items-center justify-center px-6 py-12 ${
        compact ? "" : "min-h-screen"
      }`}
    >
      <div className="text-center">
        <h1 className="text-5xl font-bold tracking-tight text-brand-dark">
          CivicClear
        </h1>
        <p className="mt-3 text-lg text-slate-600">
          Understand your local government&apos;s budget. Upload the plan,
          explore it through visualizations, and ask questions in plain English.
        </p>
      </div>

      <div
        className={`mt-10 w-full rounded-2xl border-2 border-dashed p-10 text-center transition ${
          dragActive
            ? "border-brand bg-blue-50"
            : "border-slate-300 bg-white"
        } ${loading ? "opacity-60" : ""}`}
        onDragOver={(e) => {
          e.preventDefault();
          setDragActive(true);
        }}
        onDragLeave={() => setDragActive(false)}
        onDrop={(e) => {
          e.preventDefault();
          setDragActive(false);
          if (!loading) handleFiles(e.dataTransfer.files);
        }}
      >
        {loading ? (
          <div className="flex flex-col items-center gap-3" role="status">
            <span
              className="h-8 w-8 animate-spin rounded-full border-4 border-slate-200 border-t-brand"
              aria-hidden="true"
            />
            <p className="text-sm font-medium text-slate-600">
              Analyzing the budget… this can take a few seconds.
            </p>
          </div>
        ) : (
          <>
            <p className="text-slate-600">
              Drag and drop a budget PDF here, or
            </p>
            <div className="mt-4 flex justify-center">
              <button
                onClick={() => inputRef.current?.click()}
                className="rounded-lg bg-brand px-5 py-2.5 text-sm font-medium text-white hover:bg-brand-dark"
              >
                Choose a PDF
              </button>
            </div>
            <input
              ref={inputRef}
              type="file"
              accept="application/pdf,.pdf"
              className="hidden"
              onChange={(e) => handleFiles(e.target.files)}
            />

            {onAnalyzeSample && samples.length > 0 && (
              <div className="mt-6 border-t border-slate-100 pt-5">
                <p className="text-sm font-medium text-slate-500">
                  Or try a sample budget:
                </p>
                <div className="mt-3 flex flex-col gap-2">
                  {samples.map((s) => (
                    <button
                      key={s.file}
                      onClick={() => onAnalyzeSample(s)}
                      className="rounded-lg border border-brand px-4 py-2.5 text-sm font-medium text-brand hover:bg-blue-50"
                    >
                      {s.label}
                    </button>
                  ))}
                </div>
              </div>
            )}
          </>
        )}
      </div>

      {error && (
        <p
          role="alert"
          className="mt-4 w-full rounded-lg bg-rose-50 px-4 py-3 text-sm text-rose-700"
        >
          {error}
        </p>
      )}

      <p className="mt-8 max-w-md text-center text-xs text-slate-400">
        CivicClear reads both text-based and scanned/image PDFs (scanned
        documents take a little longer). Your document is analyzed for this
        session only and is not stored.
      </p>
    </main>
  );
}
