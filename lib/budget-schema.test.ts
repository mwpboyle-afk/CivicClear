import { describe, it, expect } from "vitest";
import {
  parseAmount,
  normalizeBudget,
  parseBudget,
  budgetDataSchema,
} from "./budget-schema";

describe("parseAmount", () => {
  it("passes through finite numbers", () => {
    expect(parseAmount(1234)).toBe(1234);
    expect(parseAmount(0)).toBe(0);
    expect(parseAmount(-50.5)).toBe(-50.5);
  });

  it("rejects non-finite numbers", () => {
    expect(parseAmount(Infinity)).toBeNull();
    expect(parseAmount(NaN)).toBeNull();
  });

  it("strips dollar signs and commas", () => {
    expect(parseAmount("$1,234,567")).toBe(1234567);
    expect(parseAmount("1,234.50")).toBe(1234.5);
    expect(parseAmount("$0")).toBe(0);
  });

  it("handles accounting-style negatives", () => {
    expect(parseAmount("(1,200)")).toBe(-1200);
    expect(parseAmount("-$500")).toBe(-500);
  });

  it("handles magnitude suffixes", () => {
    expect(parseAmount("1.2M")).toBe(1_200_000);
    expect(parseAmount("3B")).toBe(3_000_000_000);
    expect(parseAmount("45k")).toBe(45_000);
  });

  it("returns null for empty/garbage input", () => {
    expect(parseAmount("")).toBeNull();
    expect(parseAmount("   ")).toBeNull();
    expect(parseAmount("N/A")).toBeNull();
    expect(parseAmount(null)).toBeNull();
    expect(parseAmount(undefined)).toBeNull();
    expect(parseAmount({})).toBeNull();
  });
});

describe("normalizeBudget", () => {
  it("coerces currency strings and drops empty rows", () => {
    const raw = {
      title: "FY27 Proposed Budget",
      municipality: "Amherst",
      fiscalYear: "2027",
      totalBudget: "$95,000,000",
      departments: [
        { name: "Fire", amount: "$5,200,000" },
        { name: "", amount: "$1,000" }, // dropped: empty name
        { name: "Police", amount: "N/A" }, // dropped: bad amount
        { name: "Schools", amount: 60000000 },
      ],
      categories: [{ name: "Personnel", amount: "$40,000,000" }],
      revenue: [{ source: "Property Tax", amount: "$70,000,000" }],
      expenditures: [{ name: "Operating", amount: "$80,000,000" }],
      summary: "A proposed budget.",
    };

    const result = normalizeBudget(raw) as any;
    expect(result.totalBudget).toBe(95_000_000);
    expect(result.departments).toHaveLength(2);
    expect(result.departments[0]).toEqual({ name: "Fire", amount: 5_200_000 });
    expect(result.departments[1]).toEqual({
      name: "Schools",
      amount: 60_000_000,
    });
    expect(result.revenue[0]).toEqual({
      source: "Property Tax",
      amount: 70_000_000,
    });
    expect(result.yearOverYear).toBeUndefined();
  });

  it("includes yearOverYear only when valid rows exist", () => {
    const withYoy = normalizeBudget({
      yearOverYear: [
        { year: "2025", total: "$90,000,000" },
        { year: "2026", total: "$92,500,000" },
      ],
    }) as any;
    expect(withYoy.yearOverYear).toHaveLength(2);
    expect(withYoy.yearOverYear[1]).toEqual({ year: "2026", total: 92_500_000 });

    const withoutYoy = normalizeBudget({ yearOverYear: [] }) as any;
    expect(withoutYoy.yearOverYear).toBeUndefined();
  });

  it("applies safe defaults for missing fields", () => {
    const result = normalizeBudget({}) as any;
    expect(result.title).toBe("Municipal Budget");
    expect(result.totalBudget).toBe(0);
    expect(result.departments).toEqual([]);
    expect(result.summary).toBe("");
  });
});

describe("parseBudget (normalize + validate)", () => {
  it("produces a schema-valid BudgetData for messy input", () => {
    const budget = parseBudget({
      title: "FY27 Proposed Budget",
      municipality: "Amherst",
      fiscalYear: "2027",
      totalBudget: "$95,000,000",
      departments: [{ name: "Fire", amount: "$5,200,000" }],
      categories: [],
      revenue: [],
      expenditures: [],
      summary: "ok",
    });
    expect(() => budgetDataSchema.parse(budget)).not.toThrow();
    expect(budget.departments[0].amount).toBe(5_200_000);
  });
});

describe("budgetDataSchema", () => {
  it("rejects malformed data", () => {
    const bad = {
      title: "x",
      municipality: "y",
      fiscalYear: "z",
      totalBudget: "not a number", // must be a number post-normalization
      departments: [],
      categories: [],
      revenue: [],
      expenditures: [],
      summary: "",
    };
    expect(() => budgetDataSchema.parse(bad)).toThrow();
  });

  it("rejects line items missing an amount", () => {
    const bad = {
      title: "x",
      municipality: "y",
      fiscalYear: "z",
      totalBudget: 1,
      departments: [{ name: "Fire" }],
      categories: [],
      revenue: [],
      expenditures: [],
      summary: "",
    };
    expect(() => budgetDataSchema.parse(bad)).toThrow();
  });
});
