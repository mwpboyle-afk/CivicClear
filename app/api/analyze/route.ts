import { NextRequest, NextResponse } from "next/server";
import { extractPdfText, PdfExtractionError } from "@/lib/pdf";
import { structureBudget, GeminiError } from "@/lib/gemini";
import { parseBudget } from "@/lib/budget-schema";

// pdf-parse requires the Node runtime (not edge).
export const runtime = "nodejs";
// Budget analysis can take a while; allow a generous server duration on Vercel.
export const maxDuration = 60;

export async function POST(req: NextRequest) {
  let buffer: Buffer;
  try {
    const formData = await req.formData();
    const file = formData.get("file");
    if (!file || typeof file === "string") {
      return NextResponse.json(
        { error: "No PDF file was provided." },
        { status: 400 },
      );
    }
    const arrayBuffer = await (file as File).arrayBuffer();
    buffer = Buffer.from(arrayBuffer);
  } catch {
    return NextResponse.json(
      { error: "Could not read the uploaded file." },
      { status: 400 },
    );
  }

  // 1. Extract text from the PDF.
  let text: string;
  try {
    text = await extractPdfText(buffer);
  } catch (err) {
    if (err instanceof PdfExtractionError) {
      return NextResponse.json({ error: err.message }, { status: 400 });
    }
    return NextResponse.json(
      { error: "Failed to extract text from the PDF." },
      { status: 400 },
    );
  }

  // 2. Structure the text into BudgetData via Gemini, then validate.
  try {
    const raw = await structureBudget(text);
    const budget = parseBudget(raw);
    return NextResponse.json({ budget, text });
  } catch (err) {
    if (err instanceof GeminiError) {
      return NextResponse.json({ error: err.message }, { status: 502 });
    }
    // Zod or other validation failure.
    return NextResponse.json(
      {
        error:
          "The budget could not be structured from this document. It may not " +
          "be a standard budget format.",
      },
      { status: 502 },
    );
  }
}
