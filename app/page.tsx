"use client";

import { useState, useEffect } from "react";
import type { BudgetData } from "@/lib/budget-schema";
import UploadPanel from "@/components/UploadPanel";
import Dashboard from "@/components/Dashboard";
import SavedReportsList from "@/components/SavedReportsList";
import {
  loadReports,
  deleteReport,
  type SavedReport,
} from "@/lib/saved-reports";

type Analysis = { budget: BudgetData; text: string; report?: SavedReport };
type Sample = { file: string; label: string };

export default function Home() {
  const [analysis, setAnalysis] = useState<Analysis | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [samples, setSamples] = useState<Sample[]>([]);
  const [saved, setSaved] = useState<SavedReport[]>([]);

  // Load bundled sample budgets.
  useEffect(() => {
    let cancelled = false;
    fetch("/samples/manifest.json")
      .then((res) => (res.ok ? res.json() : { samples: [] }))
      .then((data) => {
        if (cancelled) return;
        const list = Array.isArray(data?.samples) ? data.samples : [];
        setSamples(
          list.filter(
            (s: unknown): s is Sample =>
              !!s &&
              typeof (s as Sample).file === "string" &&
              typeof (s as Sample).label === "string",
          ),
        );
      })
      .catch(() => {
        if (!cancelled) setSamples([]);
      });
    return () => {
      cancelled = true;
    };
  }, []);

  // Load saved reports from localStorage (client-only).
  useEffect(() => {
    setSaved(loadReports());
  }, []);

  async function analyzeFile(file: File) {
    setError(null);
    setLoading(true);
    try {
      const form = new FormData();
      form.set("file", file);
      const res = await fetch("/api/analyze", { method: "POST", body: form });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Failed to analyze the PDF.");
      setAnalysis({ budget: data.budget, text: data.text });
    } catch (err) {
      setError(err instanceof Error ? err.message : "Something went wrong.");
    } finally {
      setLoading(false);
    }
  }

  async function analyzeSample(sample: Sample) {
    setError(null);
    setLoading(true);
    try {
      // Analyze server-side from disk: avoids re-uploading the PDF through the
      // browser, which would hit Vercel's 4.5 MB request-body limit for the
      // larger sample files.
      const res = await fetch("/api/analyze-sample", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ file: sample.file }),
      });
      const data = await res.json();
      if (!res.ok) {
        throw new Error(
          data.error || `The sample "${sample.label}" could not be analyzed.`,
        );
      }
      setAnalysis({ budget: data.budget, text: data.text });
    } catch (err) {
      setError(err instanceof Error ? err.message : "Something went wrong.");
    } finally {
      setLoading(false);
    }
  }

  function openSaved(report: SavedReport) {
    setAnalysis({ budget: report.budget, text: report.text, report });
  }

  function removeSaved(id: string) {
    setSaved(deleteReport(id));
  }

  function reset() {
    setAnalysis(null);
    setError(null);
    setSaved(loadReports()); // refresh in case a report was just saved
  }

  if (analysis) {
    return (
      <Dashboard
        budget={analysis.budget}
        text={analysis.text}
        initialReport={analysis.report}
        onReset={reset}
      />
    );
  }

  return (
    <div>
      <UploadPanel
        onAnalyze={analyzeFile}
        samples={samples}
        onAnalyzeSample={analyzeSample}
        loading={loading}
        error={error}
        compact={saved.length > 0}
      />
      {saved.length > 0 && (
        <div className="mx-auto max-w-2xl px-6 pb-16">
          <SavedReportsList
            reports={saved}
            onOpen={openSaved}
            onDelete={removeSaved}
          />
        </div>
      )}
    </div>
  );
}
