"use client";

import { useState } from "react";
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
  // Which slice/legend entry is currently hovered (null = none).
  const [hovered, setHovered] = useState<number | null>(null);

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

  const total = data.reduce((sum, d) => sum + d.amount, 0);

  // Only label a slice with its percentage when it's big enough to fit the
  // text — this avoids the overlapping-label clutter on small slices. Names
  // live in the legend and the hover tooltip instead.
  const renderPercent = (entry: { percent?: number }) => {
    const pct = entry.percent ?? 0;
    return pct >= 0.05 ? `${Math.round(pct * 100)}%` : "";
  };

  return (
    <ChartCard title={`Spending by ${label}`}>
      <ResponsiveContainer width="100%" height={340}>
        <PieChart>
          <Pie
            data={data}
            dataKey="amount"
            nameKey="name"
            cx="50%"
            cy="50%"
            outerRadius={100}
            labelLine={false}
            label={renderPercent}
            onMouseEnter={(_, i) => setHovered(i)}
            onMouseLeave={() => setHovered(null)}
            isAnimationActive={false}
          >
            {data.map((_, i) => (
              <Cell
                key={i}
                fill={COLORS[i % COLORS.length]}
                // When a slice is hovered, dim the others so the selected one
                // (and its legend entry) stands out.
                fillOpacity={hovered === null || hovered === i ? 1 : 0.25}
                stroke={hovered === i ? "#0f172a" : "#ffffff"}
                strokeWidth={hovered === i ? 2 : 1}
                style={{ transition: "fill-opacity 120ms ease" }}
              />
            ))}
          </Pie>
          <Tooltip
            formatter={(value: number) => {
              const pct = total > 0 ? ((value / total) * 100).toFixed(1) : "0";
              return [`${formatCurrencyExact(value)} (${pct}%)`, ""];
            }}
          />
          <Legend
            content={
              <InteractiveLegend
                data={data}
                hovered={hovered}
                onHover={setHovered}
              />
            }
          />
        </PieChart>
      </ResponsiveContainer>
    </ChartCard>
  );
}

/**
 * Custom legend: hovering an entry highlights it and drives the same slice
 * dimming via onHover; the entry matching the hovered slice is brightened and
 * bolded while the others are dimmed.
 */
function InteractiveLegend({
  data,
  hovered,
  onHover,
}: {
  data: Array<{ name: string; amount: number }>;
  hovered: number | null;
  onHover: (index: number | null) => void;
}) {
  return (
    <ul className="mt-2 flex flex-wrap justify-center gap-x-4 gap-y-1 text-xs">
      {data.map((entry, i) => {
        const active = hovered === i;
        const dimmed = hovered !== null && !active;
        return (
          <li
            key={entry.name}
            onMouseEnter={() => onHover(i)}
            onMouseLeave={() => onHover(null)}
            className="flex cursor-default items-center gap-1.5"
            style={{ opacity: dimmed ? 0.4 : 1, transition: "opacity 120ms ease" }}
          >
            <span
              aria-hidden="true"
              className="inline-block h-2.5 w-2.5 rounded-sm"
              style={{ backgroundColor: COLORS[i % COLORS.length] }}
            />
            <span
              className={
                active ? "font-semibold text-slate-900" : "text-slate-600"
              }
            >
              {entry.name}
            </span>
          </li>
        );
      })}
    </ul>
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
