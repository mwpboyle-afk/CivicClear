import type { BudgetData } from "@/lib/budget-schema";

export const sampleBudget: BudgetData = {
  title: "FY27 Town Manager's Proposed Municipal Budget",
  municipality: "Amherst",
  fiscalYear: "FY2027",
  totalBudget: 95_000_000,
  departments: [
    { name: "Education", amount: 60_000_000 },
    { name: "Public Safety", amount: 12_000_000 },
    { name: "Public Works", amount: 8_000_000 },
    { name: "Administration", amount: 5_000_000 },
  ],
  categories: [
    { name: "Personnel", amount: 55_000_000 },
    { name: "Operating", amount: 25_000_000 },
    { name: "Capital", amount: 15_000_000 },
  ],
  revenue: [
    { source: "Property Tax", amount: 70_000_000 },
    { source: "State Aid", amount: 20_000_000 },
    { source: "Local Receipts", amount: 5_000_000 },
  ],
  expenditures: [{ name: "Operating Budget", amount: 90_000_000 }],
  yearOverYear: [
    { year: "FY25", total: 90_000_000 },
    { year: "FY26", total: 92_500_000 },
    { year: "FY27", total: 95_000_000 },
  ],
  summary: "A proposed municipal budget for the town of Amherst.",
};

export const singleYearBudget: BudgetData = {
  ...sampleBudget,
  yearOverYear: undefined,
};

/** A budget populated with the extended summary, tax impact, and projects. */
export const richBudget: BudgetData = {
  ...sampleBudget,
  extendedSummary:
    "The FY27 budget prioritizes education and public safety. Notable changes " +
    "include a new capital program and modest growth in operating costs.",
  taxImpact: {
    taxRatePer1000: 18.5,
    totalLevy: 70_000_000,
    percentChange: 3.2,
    averageHomeImpact: 240,
    highlights: [
      "Property tax levy rises 2.5% annually under Prop 2½.",
      "New growth adds $275,000 to the levy.",
    ],
    note: "Estimated for a median-valued home.",
  },
  plannedProjects: [
    {
      name: "New Fire Station",
      amount: 2_500_000,
      description: "Replace aging Station 2.",
      timeframe: "FY27–FY29",
    },
    { name: "Road Repaving Program", amount: 1_200_000 },
  ],
  debtService: [
    {
      name: "Jones Library Renovation",
      fund: "General Fund",
      years: [
        { year: "FY27", amount: 1_182_845 },
        { year: "FY28", amount: 1_123_350 },
      ],
    },
    {
      name: "Water Main Replacement",
      fund: "Enterprise Funds",
      years: [{ year: "FY27", amount: 98_050 }],
    },
  ],
};

/**
 * A budget where categories outnumber departments (the inverse of the typical
 * case). Used to verify the KPI cards and the pie chart agree on which
 * breakdown to show.
 */
export const categoryHeavyBudget: BudgetData = {
  ...sampleBudget,
  departments: [
    { name: "General Government", amount: 40_000_000 },
    { name: "Enterprise", amount: 55_000_000 },
  ],
  categories: [
    { name: "Personnel", amount: 45_000_000 },
    { name: "Operating", amount: 20_000_000 },
    { name: "Capital", amount: 15_000_000 },
    { name: "Debt Service", amount: 10_000_000 },
    { name: "Benefits", amount: 5_000_000 },
  ],
};
