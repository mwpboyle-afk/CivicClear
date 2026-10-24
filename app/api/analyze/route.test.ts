// @vitest-environment node
import { describe, it, expect, vi, beforeEach } from "vitest";
import { budgetDataSchema } from "@/lib/budget-schema";

// Mock the heavy I/O dependencies so the route logic can be tested in isolation.
vi.mock("@/lib/pdf", () => ({
  PdfExtractionError: class PdfExtractionError extends Error {},
  extractPdfText: vi.fn(),
}));
vi.mock("@/lib/gemini", () => ({
  GeminiError: class GeminiError extends Error {},
  structureBudget: vi.fn(),
}));

import { extractPdfText, PdfExtractionError } from "@/lib/pdf";
import { structureBudget, GeminiError } from "@/lib/gemini";
import { POST } from "./route";

function makeRequest(file: File | null): Request {
  const form = new FormData();
  if (file) form.set("file", file);
  return new Request("http://localhost/api/analyze", {
    method: "POST",
    body: form,
  });
}

const validRawBudget = {
  title: "FY27 Proposed Budget",
  municipality: "Amherst",
  fiscalYear: "FY2027",
  totalBudget: "$95,000,000",
  departments: [{ name: "Fire", amount: "$5,200,000" }],
  categories: [{ name: "Personnel", amount: "$40,000,000" }],
  revenue: [{ source: "Property Tax", amount: "$70,000,000" }],
  expenditures: [{ name: "Operating", amount: "$80,000,000" }],
  summary: "A proposed budget for the town.",
};

describe("POST /api/analyze", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("returns schema-valid BudgetData for a good PDF", async () => {
    (extractPdfText as any).mockResolvedValue("some extracted budget text");
    (structureBudget as any).mockResolvedValue(validRawBudget);

    const file = new File([new Uint8Array([1, 2, 3])], "budget.pdf", {
      type: "application/pdf",
    });
    const res = await POST(makeRequest(file) as any);
    expect(res.status).toBe(200);

    const body = await res.json();
    expect(() => budgetDataSchema.parse(body.budget)).not.toThrow();
    expect(body.budget.departments[0].amount).toBe(5_200_000);
    expect(body.text).toBe("some extracted budget text");
  });

  it("returns 400 when no file is provided", async () => {
    const res = await POST(makeRequest(null) as any);
    expect(res.status).toBe(400);
    const body = await res.json();
    expect(body.error).toBeTruthy();
  });

  it("returns 400 when PDF extraction fails", async () => {
    (extractPdfText as any).mockRejectedValue(
      new (PdfExtractionError as any)("bad pdf"),
    );
    const file = new File([new Uint8Array([1])], "x.pdf");
    const res = await POST(makeRequest(file) as any);
    expect(res.status).toBe(400);
  });

  it("returns 502 when the model call fails", async () => {
    (extractPdfText as any).mockResolvedValue("text");
    (structureBudget as any).mockRejectedValue(
      new (GeminiError as any)("model unavailable"),
    );
    const file = new File([new Uint8Array([1])], "x.pdf");
    const res = await POST(makeRequest(file) as any);
    expect(res.status).toBe(502);
  });

  it("is resilient: sparse model output still yields valid BudgetData", async () => {
    // normalizeBudget applies safe defaults, so even minimal output validates.
    (extractPdfText as any).mockResolvedValue("text");
    (structureBudget as any).mockResolvedValue({ municipality: "Amherst" });
    const file = new File([new Uint8Array([1])], "x.pdf");
    const res = await POST(makeRequest(file) as any);
    expect(res.status).toBe(200);
    const body = await res.json();
    expect(() => budgetDataSchema.parse(body.budget)).not.toThrow();
    expect(body.budget.municipality).toBe("Amherst");
  });
});
