import { describe, it, expect, beforeEach } from "vitest";
import {
  loadReports,
  saveReport,
  deleteReport,
  newReportId,
  type SavedReport,
} from "./saved-reports";
import { sampleBudget } from "./__fixtures__/budget";

function makeReport(id: string, savedAt: number): SavedReport {
  return {
    id,
    title: `Report ${id}`,
    municipality: "Hadley",
    fiscalYear: "FY2025",
    savedAt,
    budget: sampleBudget,
    text: "raw text",
    sections: [],
  };
}

describe("saved-reports (localStorage)", () => {
  beforeEach(() => {
    window.localStorage.clear();
  });

  it("returns an empty list when nothing is saved", () => {
    expect(loadReports()).toEqual([]);
  });

  it("saves and loads a report", () => {
    saveReport(makeReport("a", 1000));
    const loaded = loadReports();
    expect(loaded).toHaveLength(1);
    expect(loaded[0].id).toBe("a");
    expect(loaded[0].budget.municipality).toBe("Amherst");
  });

  it("orders reports newest first", () => {
    saveReport(makeReport("old", 1000));
    saveReport(makeReport("new", 5000));
    const loaded = loadReports();
    expect(loaded.map((r) => r.id)).toEqual(["new", "old"]);
  });

  it("replaces a report saved under the same id", () => {
    saveReport(makeReport("a", 1000));
    saveReport({ ...makeReport("a", 2000), title: "Updated" });
    const loaded = loadReports();
    expect(loaded).toHaveLength(1);
    expect(loaded[0].title).toBe("Updated");
  });

  it("deletes a report by id", () => {
    saveReport(makeReport("a", 1000));
    saveReport(makeReport("b", 2000));
    const after = deleteReport("a");
    expect(after.map((r) => r.id)).toEqual(["b"]);
    expect(loadReports().map((r) => r.id)).toEqual(["b"]);
  });

  it("tolerates corrupt storage", () => {
    window.localStorage.setItem("civiclens.savedReports", "{not json");
    expect(loadReports()).toEqual([]);
  });

  it("generates unique-ish ids", () => {
    expect(newReportId()).not.toBe(newReportId());
  });
});
