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
