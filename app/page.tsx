"use client";

import { useState, useEffect } from "react";
import type { BudgetData } from "@/lib/budget-schema";
import UploadPanel from "@/components/UploadPanel";
import Dashboard from "@/components/Dashboard";

type Analysis = { budget: BudgetData; text: string };
type Sample = { file: string; label: string };

export default function Home() {
  const [analysis, setAnalysis] = useState<Analysis | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [samples, setSamples] = useState<Sample[]>([]);

  // Load the list of bundled sample budgets so we can offer a random one.
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

  async function analyzeRandomSample() {
    if (samples.length === 0) return;
    const pick = samples[Math.floor(Math.random() * samples.length)];
    setError(null);
    setLoading(true);
    try {
      // Analyze server-side from disk: avoids re-uploading the PDF through the
      // browser, which would hit Vercel's 4.5 MB request-body limit for the
      // larger sample files.
      const res = await fetch("/api/analyze-sample", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ file: pick.file }),
      });
      const data = await res.json();
      if (!res.ok) {
        throw new Error(
          data.error || `The sample "${pick.label}" could not be analyzed.`,
        );
      }
      setAnalysis({ budget: data.budget, text: data.text });
    } catch (err) {
      setError(err instanceof Error ? err.message : "Something went wrong.");
    } finally {
      setLoading(false);
    }
  }

  if (analysis) {
    return (
      <Dashboard
        budget={analysis.budget}
        text={analysis.text}
        onReset={() => {
          setAnalysis(null);
          setError(null);
        }}
      />
    );
  }

  return (
    <UploadPanel
      onAnalyze={analyzeFile}
      onTrySample={samples.length > 0 ? analyzeRandomSample : undefined}
      sampleCount={samples.length}
      loading={loading}
      error={error}
    />
  );
}
