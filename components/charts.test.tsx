import { describe, it, expect, vi } from "vitest";
import { render, screen } from "@testing-library/react";

// Recharts' ResponsiveContainer measures its parent, which is 0x0 in jsdom.
// Replace it with a fixed-size wrapper so charts actually render for testing.
vi.mock("recharts", async () => {
  const actual = await vi.importActual<typeof import("recharts")>("recharts");
  return {
    ...actual,
    ResponsiveContainer: ({ children }: { children: React.ReactNode }) => (
      <div style={{ width: 600, height: 320 }}>{children}</div>
    ),
  };
});

import CategoryPie from "./CategoryPie";
import RevenueVsExpense from "./RevenueVsExpense";
import YearOverYear from "./YearOverYear";
import {
  sampleBudget,
  singleYearBudget,
  categoryHeavyBudget,
} from "@/lib/__fixtures__/budget";

describe("CategoryPie", () => {
  it("renders a spending breakdown title with data", () => {
    render(<CategoryPie budget={sampleBudget} />);
    // 4 departments >= 3 categories -> labeled by department.
    expect(screen.getByText(/Spending by department/i)).toBeInTheDocument();
  });

  it("labels the chart by category when categories outnumber departments", () => {
    render(<CategoryPie budget={categoryHeavyBudget} />);
    expect(screen.getByText(/Spending by category/i)).toBeInTheDocument();
  });

  it("shows an empty state when there is no breakdown", () => {
    render(
      <CategoryPie
        budget={{ ...sampleBudget, categories: [], departments: [] }}
      />,
    );
    expect(screen.getByText(/No spending breakdown/i)).toBeInTheDocument();
  });
});

describe("RevenueVsExpense", () => {
  it("renders the revenue vs. expenditure title with data", () => {
    render(<RevenueVsExpense budget={sampleBudget} />);
    expect(screen.getByText(/Revenue vs\. Expenditure/i)).toBeInTheDocument();
  });

  it("shows an empty state when there are no totals", () => {
    render(
      <RevenueVsExpense
        budget={{
          ...sampleBudget,
          revenue: [],
          expenditures: [],
          departments: [],
          totalBudget: 0,
        }}
      />,
    );
    expect(
      screen.getByText(/No revenue or expenditure totals/i),
    ).toBeInTheDocument();
  });
});

describe("YearOverYear", () => {
  it("renders when multi-year data exists", () => {
    const { container } = render(<YearOverYear budget={sampleBudget} />);
    expect(screen.getByText(/Year-over-Year/i)).toBeInTheDocument();
    expect(container.firstChild).not.toBeNull();
  });

  it("renders nothing when there is no multi-year data", () => {
    const { container } = render(<YearOverYear budget={singleYearBudget} />);
    expect(container.firstChild).toBeNull();
  });
});
