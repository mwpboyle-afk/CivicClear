import { describe, it, expect } from "vitest";
import { selectBreakdown, largestItem } from "./budget-insights";
import type { BudgetData } from "./budget-schema";

const base: BudgetData = {
  title: "t",
  municipality: "m",
  fiscalYear: "FY",
  totalBudget: 100,
  departments: [],
  categories: [],
  revenue: [],
  expenditures: [],
  summary: "",
};

describe("selectBreakdown", () => {
  it("prefers departments when they have more line items", () => {
    const b = selectBreakdown({
      ...base,
      departments: [
        { name: "Fire", amount: 5 },
        { name: "Police", amount: 6 },
        { name: "DPW", amount: 4 },
      ],
      categories: [{ name: "Personnel", amount: 10 }],
    });
    expect(b.label).toBe("department");
    expect(b.labelPlural).toBe("departments");
    expect(b.items).toHaveLength(3);
  });

  it("prefers categories when they have more line items", () => {
    const b = selectBreakdown({
      ...base,
      departments: [{ name: "General", amount: 10 }],
      categories: [
        { name: "Personnel", amount: 5 },
        { name: "Operating", amount: 3 },
        { name: "Capital", amount: 2 },
      ],
    });
    expect(b.label).toBe("category");
    expect(b.items).toHaveLength(3);
  });

  it("prefers departments on a tie", () => {
    const b = selectBreakdown({
      ...base,
      departments: [{ name: "Fire", amount: 5 }],
      categories: [{ name: "Personnel", amount: 5 }],
    });
    expect(b.label).toBe("department");
  });

  it("returns an empty breakdown when there is no data", () => {
    const b = selectBreakdown(base);
    expect(b.items).toHaveLength(0);
    expect(largestItem(b)).toBeNull();
  });
});

describe("largestItem", () => {
  it("returns the biggest line item", () => {
    const b = selectBreakdown({
      ...base,
      departments: [
        { name: "Fire", amount: 5 },
        { name: "Education", amount: 60 },
        { name: "Police", amount: 6 },
      ],
    });
    expect(largestItem(b)).toEqual({ name: "Education", amount: 60 });
  });
});
