"use client";

import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  CartesianGrid,
  ResponsiveContainer,
  Cell,
} from "recharts";
import type { BudgetData } from "@/lib/budget-schema";
import { formatCurrency, formatCurrencyExact } from "@/lib/format";
import { ChartCard } from "./CategoryPie";

export default function RevenueVsExpense({ budget }: { budget: BudgetData }) {
  const totalRevenue = budget.revenue.reduce((s, r) => s + r.amount, 0);
  const totalExpense =
    budget.expenditures.reduce((s, e) => s + e.amount, 0) ||
    budget.departments.reduce((s, d) => s + d.amount, 0) ||
    budget.totalBudget;

  if (totalRevenue === 0 && totalExpense === 0) {
    return (
      <ChartCard title="Revenue vs. Expenditure">
        <p className="py-12 text-center text-sm text-slate-400">
          No revenue or expenditure totals found in this document.
        </p>
      </ChartCard>
    );
  }

  const data = [
    { name: "Revenue", amount: totalRevenue, fill: "#15803d" },
    { name: "Expenditure", amount: totalExpense, fill: "#be123c" },
  ];

  return (
    <ChartCard title="Revenue vs. Expenditure">
      <ResponsiveContainer width="100%" height={320}>
        <BarChart data={data} margin={{ top: 8, right: 16, bottom: 8, left: 8 }}>
          <CartesianGrid strokeDasharray="3 3" vertical={false} />
          <XAxis dataKey="name" />
          <YAxis tickFormatter={(v: number) => formatCurrency(v)} width={70} />
          <Tooltip formatter={(value: number) => formatCurrencyExact(value)} />
          <Bar dataKey="amount" radius={[6, 6, 0, 0]}>
            {data.map((d, i) => (
              <Cell key={i} fill={d.fill} />
            ))}
          </Bar>
        </BarChart>
      </ResponsiveContainer>
    </ChartCard>
  );
}
