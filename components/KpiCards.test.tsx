import { describe, it, expect } from "vitest";
import { render, screen } from "@testing-library/react";
import KpiCards from "./KpiCards";
import { sampleBudget, categoryHeavyBudget } from "@/lib/__fixtures__/budget";

describe("KpiCards", () => {
  it("renders total budget, largest department, and count", () => {
    render(<KpiCards budget={sampleBudget} />);
    expect(screen.getByText("Total Budget")).toBeInTheDocument();
    expect(screen.getByText("$95.00M")).toBeInTheDocument();
    // 4 departments >= 3 categories, so the departments breakdown is used.
    expect(screen.getByText("Largest Department")).toBeInTheDocument();
    expect(screen.getByText("Education")).toBeInTheDocument();
    expect(screen.getByText("Departments Tracked")).toBeInTheDocument();
    expect(screen.getByText("4")).toBeInTheDocument();
  });

  it("uses the categories breakdown when categories outnumber departments", () => {
    render(<KpiCards budget={categoryHeavyBudget} />);
    // 5 categories > 2 departments, so cards describe categories and count 5.
    expect(screen.getByText("Largest Category")).toBeInTheDocument();
    expect(screen.getByText("Categories Tracked")).toBeInTheDocument();
    expect(screen.getByText("5")).toBeInTheDocument();
  });
});
