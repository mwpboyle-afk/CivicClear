"use client";

import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  Tooltip,
  CartesianGrid,
  ResponsiveContainer,
} from "recharts";
import type { BudgetData } from "@/lib/budget-schema";
import { formatCurrency, formatCurrencyExact } from "@/lib/format";
import { ChartCard } from "./CategoryPie";

/**
 * Year-over-year total budget trend. Returns null when the document has no
 * multi-year data, so the dashboard can hide this section gracefully.
 */
export default function YearOverYear({ budget }: { budget: BudgetData }) {
  const data = budget.yearOverYear;
  if (!data || data.length < 2) return null;

  return (
    <ChartCard title="Year-over-Year Total Budget">
      <ResponsiveContainer width="100%" height={320}>
        <LineChart data={data} margin={{ top: 8, right: 16, bottom: 8, left: 8 }}>
          <CartesianGrid strokeDasharray="3 3" />
          <XAxis dataKey="year" />
          <YAxis tickFormatter={(v: number) => formatCurrency(v)} width={70} />
          <Tooltip formatter={(value: number) => formatCurrencyExact(value)} />
          <Line
            type="monotone"
            dataKey="total"
            stroke="#1d4ed8"
            strokeWidth={3}
            dot={{ r: 4 }}
          />
        </LineChart>
      </ResponsiveContainer>
    </ChartCard>
  );
}
