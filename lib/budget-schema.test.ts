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

describe("normalizeBudget — dedup line items", () => {
  it("merges departments with the same name (case-insensitive)", () => {
    const result = normalizeBudget({
      departments: [
        { name: "Police", amount: 1000 },
        { name: "Fire", amount: 500 },
        { name: "police", amount: 200 }, // merges into "Police"
        { name: "POLICE", amount: 50 }, // merges too
      ],
    }) as any;
    expect(result.departments).toHaveLength(2);
    // First-seen casing is kept; amounts summed.
    expect(result.departments[0]).toEqual({ name: "Police", amount: 1250 });
    expect(result.departments[1]).toEqual({ name: "Fire", amount: 500 });
  });

  it("merges revenue sources with the same name", () => {
    const result = normalizeBudget({
      revenue: [
        { source: "Property Tax", amount: 100 },
        { source: "property tax", amount: 25 },
      ],
    }) as any;
    expect(result.revenue).toHaveLength(1);
    expect(result.revenue[0]).toEqual({ source: "Property Tax", amount: 125 });
  });
});

describe("normalizeBudget — extended summary", () => {
  it("includes a non-empty extended summary", () => {
    const r = normalizeBudget({ extendedSummary: "  A longer brief.  " }) as any;
    expect(r.extendedSummary).toBe("A longer brief.");
  });
  it("omits an empty extended summary", () => {
    const r = normalizeBudget({ extendedSummary: "   " }) as any;
    expect(r.extendedSummary).toBeUndefined();
  });
});

describe("normalizeBudget — tax impact", () => {
  it("keeps only figures present in the document", () => {
    const r = normalizeBudget({
      taxImpact: {
        taxRatePer1000: "$18.50",
        totalLevy: "$70,000,000",
        percentChange: "3.2",
        note: "Based on the proposed levy.",
      },
    }) as any;
    expect(r.taxImpact).toEqual({
      taxRatePer1000: 18.5,
      totalLevy: 70_000_000,
      percentChange: 3.2,
      note: "Based on the proposed levy.",
    });
    expect(r.taxImpact.averageHomeImpact).toBeUndefined();
  });

  it("keeps tax highlights and drops empty ones", () => {
    const r = normalizeBudget({
      taxImpact: {
        highlights: ["Levy rises 2.5% annually", "  ", "", "New growth $275k"],
      },
    }) as any;
    expect(r.taxImpact.highlights).toEqual([
      "Levy rises 2.5% annually",
      "New growth $275k",
    ]);
  });

  it("keeps taxImpact when only highlights are present", () => {
    const r = normalizeBudget({
      taxImpact: { highlights: ["Property taxes fund most of the budget"] },
    }) as any;
    expect(r.taxImpact.highlights).toHaveLength(1);
  });

  it("omits taxImpact entirely when no figures or highlights are present", () => {
    const r = normalizeBudget({ taxImpact: { note: "" } }) as any;
    expect(r.taxImpact).toBeUndefined();
  });
});

describe("normalizeBudget — planned projects", () => {
  it("normalizes projects and drops nameless entries", () => {
    const r = normalizeBudget({
      plannedProjects: [
        {
          name: "New Fire Station",
          amount: "$2,500,000",
          description: "Replace Station 2",
          timeframe: "FY27-FY29",
        },
        { amount: 100 }, // dropped: no name
        { title: "Road Repaving", cost: "1.2M" }, // alt keys
      ],
    }) as any;
    expect(r.plannedProjects).toHaveLength(2);
    expect(r.plannedProjects[0]).toEqual({
      name: "New Fire Station",
      amount: 2_500_000,
      description: "Replace Station 2",
      timeframe: "FY27-FY29",
    });
    expect(r.plannedProjects[1]).toEqual({
      name: "Road Repaving",
      amount: 1_200_000,
    });
  });

  it("omits plannedProjects when none are valid", () => {
    const r = normalizeBudget({ plannedProjects: [{ amount: 5 }] }) as any;
    expect(r.plannedProjects).toBeUndefined();
  });

  it("treats a zero amount as no amount (avoids a misleading $0)", () => {
    const r = normalizeBudget({
      plannedProjects: [{ name: "New School", amount: 0 }],
    }) as any;
    expect(r.plannedProjects).toHaveLength(1);
    expect(r.plannedProjects[0]).toEqual({ name: "New School" });
    expect(r.plannedProjects[0].amount).toBeUndefined();
  });
});

describe("parseBudget — new optional fields validate", () => {
  it("accepts a budget with tax impact and projects", () => {
    const budget = parseBudget({
      title: "t",
      municipality: "m",
      fiscalYear: "FY",
      totalBudget: 100,
      departments: [],
      categories: [],
      revenue: [],
      expenditures: [],
      summary: "s",
      extendedSummary: "longer",
      taxImpact: { taxRatePer1000: 18.5 },
      plannedProjects: [{ name: "Project A", amount: 1000 }],
    });
    expect(() => budgetDataSchema.parse(budget)).not.toThrow();
    expect(budget.taxImpact?.taxRatePer1000).toBe(18.5);
    expect(budget.plannedProjects?.[0].name).toBe("Project A");
  });
});

describe("normalizeBudget — debt service", () => {
  it("normalizes items, coerces year amounts, and keeps fund groupings", () => {
    const r = normalizeBudget({
      debtService: [
        {
          name: "Jones Library Renovation",
          fund: "General Fund",
          years: [
            { year: "FY27", amount: "1,182,845" },
            { year: "FY28", amount: "$1,123,350" },
          ],
        },
        {
          name: "Water Main",
          years: [{ year: "FY27", amount: 98050 }],
        },
      ],
    }) as any;
    expect(r.debtService).toHaveLength(2);
    expect(r.debtService[0]).toEqual({
      name: "Jones Library Renovation",
      fund: "General Fund",
      years: [
        { year: "FY27", amount: 1_182_845 },
        { year: "FY28", amount: 1_123_350 },
      ],
    });
    // No fund provided -> fund omitted.
    expect(r.debtService[1].fund).toBeUndefined();
  });

  it("drops items with no name or no valid year rows", () => {
    const r = normalizeBudget({
      debtService: [
        { fund: "X", years: [{ year: "FY27", amount: 1 }] }, // no name
        { name: "Bad", years: [{ year: "", amount: "n/a" }] }, // no valid years
        { name: "Good", years: [{ year: "FY27", amount: 500 }] },
      ],
    }) as any;
    expect(r.debtService).toHaveLength(1);
    expect(r.debtService[0].name).toBe("Good");
  });

  it("omits debtService entirely when nothing valid remains", () => {
    const r = normalizeBudget({ debtService: [{ name: "X", years: [] }] }) as any;
    expect(r.debtService).toBeUndefined();
  });
});