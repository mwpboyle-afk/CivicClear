// @vitest-environment node
import { describe, it, expect, vi, beforeEach } from "vitest";

vi.mock("@/lib/gemini", () => ({
  GeminiError: class GeminiError extends Error {},
  answerQuestion: vi.fn(),
}));

import { answerQuestion, GeminiError } from "@/lib/gemini";
import { POST } from "./route";
import { sampleBudget } from "@/lib/__fixtures__/budget";

function makeRequest(body: unknown): Request {
  return new Request("http://localhost/api/ask", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });
}

describe("POST /api/ask", () => {
  beforeEach(() => vi.clearAllMocks());

  it("returns a grounded answer and includes context in the prompt", async () => {
    (answerQuestion as any).mockResolvedValue("The fire budget is $5.2M.");
    const res = await POST(
      makeRequest({
        question: "How much for fire?",
        budget: sampleBudget,
        text: "Fire Department: $5,200,000",
      }) as any,
    );
    expect(res.status).toBe(200);
    const body = await res.json();
    expect(body.answer).toContain("$5.2M");

    // The context passed to the model must include both structured + raw text.
    const [, context] = (answerQuestion as any).mock.calls[0];
    expect(context).toContain("STRUCTURED BUDGET DATA");
    expect(context).toContain("Fire Department: $5,200,000");
  });

  it("returns 400 when the question is missing", async () => {
    const res = await POST(makeRequest({ budget: sampleBudget }) as any);
    expect(res.status).toBe(400);
  });

  it("returns 400 when no budget context is provided", async () => {
    const res = await POST(makeRequest({ question: "hi" }) as any);
    expect(res.status).toBe(400);
  });

  it("returns 502 when the model fails", async () => {
    (answerQuestion as any).mockRejectedValue(
      new (GeminiError as any)("rate limit"),
    );
    const res = await POST(
      makeRequest({ question: "q", budget: sampleBudget, text: "t" }) as any,
    );
    expect(res.status).toBe(502);
  });
});
