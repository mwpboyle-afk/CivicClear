import { describe, it, expect } from "vitest";
import { buildExtractionPrompt, buildAnswerPrompt } from "./gemini";

describe("buildExtractionPrompt", () => {
  it("includes the document text and extraction guidance", () => {
    const prompt = buildExtractionPrompt("TOTAL BUDGET: $95,000,000");
    expect(prompt).toContain("TOTAL BUDGET: $95,000,000");
    expect(prompt).toContain("municipal-budget analyst");
    expect(prompt).toContain("yearOverYear");
    expect(prompt).toContain("Do not invent");
  });

  it("truncates very long documents", () => {
    const huge = "x".repeat(200_000);
    const prompt = buildExtractionPrompt(huge);
    // The clipped text must be shorter than the raw input.
    expect(prompt.length).toBeLessThan(huge.length + 2000);
  });
});

describe("buildAnswerPrompt", () => {
  it("grounds the model in context and includes the question", () => {
    const { systemInstruction, prompt } = buildAnswerPrompt(
      "How much for fire?",
      "Fire Department: $5,200,000",
    );
    expect(systemInstruction).toContain("ONLY");
    expect(systemInstruction.toLowerCase()).toContain("cannot find it");
    expect(prompt).toContain("Fire Department: $5,200,000");
    expect(prompt).toContain("How much for fire?");
  });
});
