import { describe, it, expect } from "vitest";
import { formatCurrency, formatCurrencyExact } from "./format";

describe("formatCurrency (compact)", () => {
  it("formats billions, millions, thousands", () => {
    expect(formatCurrency(3_000_000_000)).toBe("$3.00B");
    expect(formatCurrency(95_000_000)).toBe("$95.00M");
    expect(formatCurrency(5_200)).toBe("$5.2K");
    expect(formatCurrency(500)).toBe("$500");
  });

  it("handles zero and non-finite input", () => {
    expect(formatCurrency(0)).toBe("$0");
    expect(formatCurrency(NaN)).toBe("$0");
    expect(formatCurrency(Infinity)).toBe("$0");
  });
});

describe("formatCurrencyExact", () => {
  it("formats full currency values", () => {
    expect(formatCurrencyExact(95_000_000)).toBe("$95,000,000");
    expect(formatCurrencyExact(0)).toBe("$0");
  });
});
