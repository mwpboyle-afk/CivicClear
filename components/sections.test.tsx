import { describe, it, expect } from "vitest";
import { render, screen, fireEvent } from "@testing-library/react";
import ExtendedSummary from "./ExtendedSummary";
import TaxImpact from "./TaxImpact";
import PlannedProjects from "./PlannedProjects";
import DebtService from "./DebtService";
import { sampleBudget, richBudget } from "@/lib/__fixtures__/budget";

describe("ExtendedSummary", () => {
  it("shows the short summary and expands to the longer brief", () => {
    render(<ExtendedSummary budget={richBudget} />);
    expect(screen.getByText(sampleBudget.summary)).toBeInTheDocument();
    // Long text hidden until expanded.
    expect(screen.queryByText(/prioritizes education/i)).not.toBeInTheDocument();
    fireEvent.click(screen.getByRole("button", { name: /Read more/i }));
    expect(screen.getByText(/prioritizes education/i)).toBeInTheDocument();
    // Toggle back.
    fireEvent.click(screen.getByRole("button", { name: /Show less/i }));
    expect(screen.queryByText(/prioritizes education/i)).not.toBeInTheDocument();
  });

  it("shows no Read more when there is no extended summary", () => {
    render(<ExtendedSummary budget={sampleBudget} />);
    expect(
      screen.queryByRole("button", { name: /Read more/i }),
    ).not.toBeInTheDocument();
  });

  it("shows an empty state when there is no summary at all", () => {
    render(
      <ExtendedSummary
        budget={{ ...sampleBudget, summary: "", extendedSummary: undefined }}
      />,
    );
    expect(screen.getByText(/No summary was found/i)).toBeInTheDocument();
  });
});

describe("TaxImpact", () => {
  it("renders the tax figures when present", () => {
    render(<TaxImpact budget={richBudget} />);
    expect(screen.getByText(/Tax rate \(per \$1,000\)/i)).toBeInTheDocument();
    expect(screen.getByText("$18.50")).toBeInTheDocument();
    expect(screen.getByText("+3.2%")).toBeInTheDocument();
    expect(screen.getByText(/median-valued home/i)).toBeInTheDocument();
  });

  it("shows an empty state when no tax figures exist", () => {
    render(<TaxImpact budget={sampleBudget} />);
    expect(
      screen.getByText(/No tax-impact figures were found/i),
    ).toBeInTheDocument();
  });
});

describe("PlannedProjects", () => {
  it("lists projects with amount, description, and timeframe", () => {
    render(<PlannedProjects budget={richBudget} />);
    expect(screen.getByText("New Fire Station")).toBeInTheDocument();
    expect(screen.getByText(/Replace aging Station 2/i)).toBeInTheDocument();
    expect(screen.getByText("FY27–FY29")).toBeInTheDocument();
    expect(screen.getByText("Road Repaving Program")).toBeInTheDocument();
  });

  it("shows an empty state when there are no projects", () => {
    render(<PlannedProjects budget={sampleBudget} />);
    expect(
      screen.getByText(/No planned projects were found/i),
    ).toBeInTheDocument();
  });
});

describe("DebtService", () => {
  it("renders items, year columns, and fund groupings", () => {
    render(<DebtService budget={richBudget} />);
    expect(screen.getByText("Jones Library Renovation")).toBeInTheDocument();
    expect(screen.getByText("Water Main Replacement")).toBeInTheDocument();
    // Fund group headers.
    expect(screen.getByText("General Fund")).toBeInTheDocument();
    expect(screen.getByText("Enterprise Funds")).toBeInTheDocument();
    // Year columns from the union of all items' years.
    expect(screen.getByText("FY27")).toBeInTheDocument();
    expect(screen.getByText("FY28")).toBeInTheDocument();
  });

  it("shows an empty state when there is no debt schedule", () => {
    render(<DebtService budget={sampleBudget} />);
    expect(
      screen.getByText(/No multi-year debt-service schedule/i),
    ).toBeInTheDocument();
  });
});
