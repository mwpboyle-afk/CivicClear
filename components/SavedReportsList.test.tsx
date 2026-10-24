import { describe, it, expect, vi } from "vitest";
import { render, screen, fireEvent } from "@testing-library/react";
import SavedReportsList from "./SavedReportsList";
import type { SavedReport } from "@/lib/saved-reports";
import { sampleBudget } from "@/lib/__fixtures__/budget";

const reports: SavedReport[] = [
  {
    id: "r1",
    title: "Hadley Briefing",
    municipality: "Hadley",
    fiscalYear: "FY2025",
    savedAt: Date.now(),
    budget: sampleBudget,
    text: "t",
    sections: [],
  },
];

describe("SavedReportsList", () => {
  it("renders nothing when there are no reports", () => {
    const { container } = render(
      <SavedReportsList reports={[]} onOpen={vi.fn()} onDelete={vi.fn()} />,
    );
    expect(container.firstChild).toBeNull();
  });

  it("lists saved reports and opens one", () => {
    const onOpen = vi.fn();
    render(
      <SavedReportsList reports={reports} onOpen={onOpen} onDelete={vi.fn()} />,
    );
    expect(screen.getByText("Hadley Briefing")).toBeInTheDocument();
    fireEvent.click(screen.getByRole("button", { name: /^Open$/i }));
    expect(onOpen).toHaveBeenCalledWith(reports[0]);
  });

  it("deletes a report", () => {
    const onDelete = vi.fn();
    render(
      <SavedReportsList
        reports={reports}
        onOpen={vi.fn()}
        onDelete={onDelete}
      />,
    );
    fireEvent.click(
      screen.getByRole("button", { name: /Delete Hadley Briefing/i }),
    );
    expect(onDelete).toHaveBeenCalledWith("r1");
  });
});
