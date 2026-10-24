import { NextRequest, NextResponse } from "next/server";
import { analyzeBudgetPdf, AnalyzeError } from "@/lib/analyze";

// pdfjs-dist requires the Node runtime (not edge).
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

  try {
    const result = await analyzeBudgetPdf(buffer);
    return NextResponse.json(result);
  } catch (err) {
    if (err instanceof AnalyzeError) {
      return NextResponse.json({ error: err.message }, { status: err.status });
    }
    return NextResponse.json(
      { error: "Something went wrong analyzing the PDF." },
      { status: 500 },
    );
  }
}
