/** Formatting helpers shared across chart and KPI components. */

export function formatCurrency(amount: number): string {
  if (!Number.isFinite(amount)) return "$0";
  const abs = Math.abs(amount);
  // Compact for large figures so charts/cards stay readable.
  if (abs >= 1_000_000_000) {
    return `$${(amount / 1_000_000_000).toFixed(2)}B`;
  }
  if (abs >= 1_000_000) {
    return `$${(amount / 1_000_000).toFixed(2)}M`;
  }
  if (abs >= 1_000) {
    return `$${(amount / 1_000).toFixed(1)}K`;
  }
  return `$${amount.toLocaleString("en-US")}`;
}

/** Full, exact currency (for tooltips and detail views). */
export function formatCurrencyExact(amount: number): string {
  if (!Number.isFinite(amount)) return "$0";
  return amount.toLocaleString("en-US", {
    style: "currency",
    currency: "USD",
    maximumFractionDigits: 0,
  });
}
