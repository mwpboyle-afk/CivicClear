import type { BudgetData } from "./budget-schema";
import type { PinnedSection } from "@/components/PinnedSections";

/**
 * A saved report, persisted in the browser's localStorage. No backend/account
 * needed — saves live in the current browser on the current device. Clearing
 * browser data removes them, and they are not shared across devices or users.
 */
export type SavedReport = {
  id: string;
  title: string;
  municipality: string;
  fiscalYear: string;
  savedAt: number; // epoch ms
  budget: BudgetData;
  text: string;
  sections: PinnedSection[];
};

const STORAGE_KEY = "civiclens.savedReports";

function canUseStorage(): boolean {
  return typeof window !== "undefined" && !!window.localStorage;
}

/** Read all saved reports, newest first. Returns [] on any error. */
export function loadReports(): SavedReport[] {
  if (!canUseStorage()) return [];
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    if (!Array.isArray(parsed)) return [];
    return (parsed as SavedReport[])
      .filter((r) => r && typeof r.id === "string")
      .sort((a, b) => b.savedAt - a.savedAt);
  } catch {
    return [];
  }
}

function writeAll(reports: SavedReport[]): void {
  if (!canUseStorage()) return;
  try {
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(reports));
  } catch {
    // Storage full or unavailable — fail silently (prototype behavior).
  }
}

/**
 * Save (or update) a report. If a report with the same id exists it is
 * replaced; otherwise a new one is added. Returns the updated list.
 */
export function saveReport(report: SavedReport): SavedReport[] {
  const existing = loadReports().filter((r) => r.id !== report.id);
  const next = [report, ...existing];
  writeAll(next);
  return next;
}

/** Delete a report by id. Returns the updated list. */
export function deleteReport(id: string): SavedReport[] {
  const next = loadReports().filter((r) => r.id !== id);
  writeAll(next);
  return next;
}

/** Generate a stable-ish id for a new report. */
export function newReportId(): string {
  return `report-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
}
