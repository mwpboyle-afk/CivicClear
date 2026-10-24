"use client";

import { useState } from "react";
import type { BudgetData } from "@/lib/budget-schema";
import UploadPanel from "@/components/UploadPanel";
import Dashboard from "@/components/Dashboard";

const SAMPLE_PDF_URL = "/samples/amherst-fy27-budget.pdf";

type Analysis = { budget: BudgetData; text: string };

export default function Home() {
  const [analysis, setAnalysis] = useState<Analysis | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

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

  async function analyzeSample() {
    setError(null);
    setLoading(true);
    try {
      const pdfRes = await fetch(SAMPLE_PDF_URL);
      if (!pdfRes.ok) {
        throw new Error(
          "The sample budget could not be loaded. Make sure the sample PDF is in public/samples/.",
        );
      }
      const blob = await pdfRes.blob();
      const file = new File([blob], "amherst-fy27-budget.pdf", {
        type: "application/pdf",
      });
      await analyzeFile(file);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Something went wrong.");
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
      onAnalyzeSample={analyzeSample}
      loading={loading}
      error={error}
    />
  );
}
