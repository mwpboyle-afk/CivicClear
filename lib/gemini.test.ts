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

  it("truncates documents longer than the character cap", () => {
    // Larger than MAX_TEXT_CHARS (600k) so clipping actually happens.
    const huge = "x".repeat(700_000);
    const prompt = buildExtractionPrompt(huge);
    // The document portion is clipped, so the whole prompt stays well under
    // the raw input length (guidance text is only a couple thousand chars).
    expect(prompt.length).toBeLessThan(huge.length);
    expect(prompt.length).toBeLessThan(270_000);
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
