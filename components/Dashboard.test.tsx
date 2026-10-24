import { describe, it, expect, vi } from "vitest";
import { render, screen, fireEvent } from "@testing-library/react";

// Stabilize Recharts in jsdom.
vi.mock("recharts", async () => {
  const actual = await vi.importActual<typeof import("recharts")>("recharts");
  return {
    ...actual,
    ResponsiveContainer: ({ children }: { children: React.ReactNode }) => (
      <div style={{ width: 600, height: 320 }}>{children}</div>
    ),
  };
});

import Dashboard from "./Dashboard";
import { sampleBudget, singleYearBudget } from "@/lib/__fixtures__/budget";

describe("Dashboard", () => {
  it("renders header, summary, and reset control", () => {
    render(
      <Dashboard budget={sampleBudget} text="raw text" onReset={vi.fn()} />,
    );
    expect(
      screen.getByText(/FY27 Town Manager's Proposed Municipal Budget/i),
    ).toBeInTheDocument();
    expect(
      screen.getByText(/proposed municipal budget for the town of Amherst/i),
    ).toBeInTheDocument();
    expect(
      screen.getByRole("button", { name: /Analyze another budget/i }),
    ).toBeInTheDocument();
    // Chat panel is present.
    expect(screen.getByText(/Ask about this budget/i)).toBeInTheDocument();
  });

  it("calls onReset when the reset button is clicked", () => {
    const onReset = vi.fn();
    render(
      <Dashboard budget={sampleBudget} text="raw" onReset={onReset} />,
    );
    fireEvent.click(
      screen.getByRole("button", { name: /Analyze another budget/i }),
    );
    expect(onReset).toHaveBeenCalledOnce();
  });

  it("hides the year-over-year section for single-year budgets", () => {
    render(
      <Dashboard budget={singleYearBudget} text="raw" onReset={vi.fn()} />,
    );
    expect(screen.queryByText(/Year-over-Year/i)).not.toBeInTheDocument();
  });
});
