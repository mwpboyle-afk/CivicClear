// @vitest-environment node
import { describe, it, expect } from "vitest";
import fs from "node:fs";
import path from "node:path";
import { extractPdfText, PdfExtractionError } from "./pdf";

const FIXTURE = path.join(__dirname, "__fixtures__", "sample.pdf");

describe("extractPdfText", () => {
  it("extracts text from a real PDF fixture", async () => {
    const buffer = fs.readFileSync(FIXTURE);
    const text = await extractPdfText(buffer);
    expect(text.length).toBeGreaterThan(0);
    expect(text).toContain("Budget Test 123");
  });

  it("throws on an empty buffer", async () => {
    await expect(extractPdfText(Buffer.alloc(0))).rejects.toBeInstanceOf(
      PdfExtractionError,
    );
  });

  it("throws on a non-PDF buffer (missing %PDF header)", async () => {
    await expect(
      extractPdfText(Buffer.from("this is not a pdf", "utf8")),
    ).rejects.toBeInstanceOf(PdfExtractionError);
  });
});
