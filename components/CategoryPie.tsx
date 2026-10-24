"use client";

import {
  PieChart,
  Pie,
  Cell,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from "recharts";
import type { BudgetData } from "@/lib/budget-schema";
import { formatCurrencyExact } from "@/lib/format";
import { selectBreakdown } from "@/lib/budget-insights";

// High-contrast, color-blind-friendly palette.
const COLORS = [
  "#1d4ed8",
  "#0891b2",
  "#15803d",
  "#b45309",
  "#be123c",
  "#7c3aed",
  "#0f766e",
  "#a16207",
  "#9d174d",
  "#334155",
];

export default function CategoryPie({ budget }: { budget: BudgetData }) {
  // Use the same breakdown as the KPI cards so the counts always agree.
  const { items: source, label } = selectBreakdown(budget);

  if (source.length === 0) {
    return (
      <ChartCard title="Spending Breakdown">
        <p className="py-12 text-center text-sm text-slate-400">
          No spending breakdown found in this document.
        </p>
      </ChartCard>
    );
  }

  // Keep the top 9 and group the rest into "Other" so the chart stays legible.
  const sorted = [...source].sort((a, b) => b.amount - a.amount);
  const top = sorted.slice(0, 9);
  const rest = sorted.slice(9);
  const data = [...top];
  if (rest.length > 0) {
    data.push({
      name: "Other",
      amount: rest.reduce((sum, d) => sum + d.amount, 0),
    });
  }

  return (
    <ChartCard title={`Spending by ${label}`}>
      <ResponsiveContainer width="100%" height={320}>
        <PieChart>
          <Pie
            data={data}
            dataKey="amount"
            nameKey="name"
            cx="50%"
            cy="50%"
            outerRadius={110}
            label={(entry) => entry.name}
          >
            {data.map((_, i) => (
              <Cell key={i} fill={COLORS[i % COLORS.length]} />
            ))}
          </Pie>
          <Tooltip
            formatter={(value: number) => formatCurrencyExact(value)}
          />
          <Legend />
        </PieChart>
      </ResponsiveContainer>
    </ChartCard>
  );
}

export function ChartCard({
  title,
  children,
}: {
  title: string;
  children: React.ReactNode;
}) {
  return (
    <div className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
      <h3 className="mb-3 text-base font-semibold text-slate-700">{title}</h3>
      {children}
    </div>
  );
}
