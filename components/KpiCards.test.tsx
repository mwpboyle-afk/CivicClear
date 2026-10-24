import { describe, it, expect } from "vitest";
import { render, screen } from "@testing-library/react";
import KpiCards from "./KpiCards";
import { sampleBudget } from "@/lib/__fixtures__/budget";

describe("KpiCards", () => {
  it("renders total budget, largest department, and count", () => {
    render(<KpiCards budget={sampleBudget} />);
    expect(screen.getByText("Total Budget")).toBeInTheDocument();
    expect(screen.getByText("$95.00M")).toBeInTheDocument();
    // Largest department is Education at $60M.
    expect(screen.getByText("Education")).toBeInTheDocument();
    expect(screen.getByText("Departments Tracked")).toBeInTheDocument();
    expect(screen.getByText("4")).toBeInTheDocument();
  });
});
