import { describe, it, expect } from "vitest";
import { deriveSectionTitle } from "./section-title";

describe("deriveSectionTitle", () => {
  it("strips filler/question words and title-cases the rest", () => {
    expect(deriveSectionTitle("Is there anything about taxes?")).toBe("Taxes");
    expect(deriveSectionTitle("What about the planned projects?")).toBe(
      "Planned Projects",
    );
    expect(deriveSectionTitle("Tell me about debt service")).toBe(
      "Debt Service",
    );
  });

  it("drops the word 'budget' as filler", () => {
    expect(deriveSectionTitle("How is the budget revenue split?")).toBe(
      "Revenue Split",
    );
  });

  it("falls back gracefully for all-filler or empty questions", () => {
    expect(deriveSectionTitle("")).toBe("Question");
    expect(deriveSectionTitle("what is it?")).not.toBe("");
  });

  it("truncates very long titles", () => {
    const long = deriveSectionTitle(
      "infrastructure stormwater culverts bridges roads sidewalks drainage",
    );
    expect(long.length).toBeLessThanOrEqual(41);
  });
});
