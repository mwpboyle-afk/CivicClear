import { extractPdfText, NoTextLayerError, PdfExtractionError } from "./pdf";
import { structureBudget, structureBudgetFromPdf, GeminiError } from "./gemini";
import { parseBudget, type BudgetData } from "./budget-schema";

export type AnalyzeResult = {
  budget: BudgetData;
  text: string;
  scanned: boolean;
};

/** Error with an HTTP status so callers can map it to a response. */
export class AnalyzeError extends Error {
  status: number;
  constructor(message: string, status: number) {
    super(message);
    this.name = "AnalyzeError";
    this.status = status;
  }
}

/**
 * Analyze a budget PDF buffer into structured BudgetData.
 * - Fast path: extract a text layer with pdfjs-dist, then structure via Gemini.
 * - Fallback: if there's no text layer (scanned/image PDF), send the PDF bytes
 *   to Gemini's multimodal input and use its transcription to ground Q&A.
 *
 * Shared by /api/analyze (user uploads) and /api/analyze-sample (bundled PDFs
 * read from disk), so both behave identically.
 *
 * @throws AnalyzeError with an appropriate HTTP status.
 */
export async function analyzeBudgetPdf(buffer: Buffer): Promise<AnalyzeResult> {
  // 1. Try to extract a text layer.
  let text: string | null = null;
  try {
    text = await extractPdfText(buffer);
  } catch (err) {
    if (err instanceof NoTextLayerError) {
      text = null; // scanned PDF -> fall back to the image path below
    } else if (err instanceof PdfExtractionError) {
      throw new AnalyzeError(err.message, 400);
    } else {
      throw new AnalyzeError("Failed to read the PDF.", 400);
    }
  }

  // 2. Structure into BudgetData, then validate.
  try {
    if (text !== null) {
      const raw = await structureBudget(text);
      return { budget: parseBudget(raw), text, scanned: false };
    }
    const { data, transcription } = await structureBudgetFromPdf(
      buffer.toString("base64"),
    );
    return { budget: parseBudget(data), text: transcription, scanned: true };
  } catch (err) {
    if (err instanceof GeminiError) {
      throw new AnalyzeError(err.message, 502);
    }
    throw new AnalyzeError(
      "The budget could not be structured from this document. It may not be " +
        "a standard budget format.",
      502,
    );
  }
}
