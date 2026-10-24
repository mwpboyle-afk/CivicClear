import { NextRequest, NextResponse } from "next/server";
import { answerQuestion, GeminiError } from "@/lib/gemini";

export const runtime = "nodejs";
export const maxDuration = 60;

const MAX_QUESTION_LEN = 1000;

export async function POST(req: NextRequest) {
  let body: { question?: unknown; budget?: unknown; text?: unknown };
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Invalid request body." }, { status: 400 });
  }

  const question =
    typeof body.question === "string" ? body.question.trim() : "";
  if (!question) {
    return NextResponse.json(
      { error: "Please provide a question." },
      { status: 400 },
    );
  }
  if (question.length > MAX_QUESTION_LEN) {
    return NextResponse.json(
      { error: "That question is too long." },
      { status: 400 },
    );
  }

  // Ground the answer in both the structured budget and the raw extracted text.
  const structured = body.budget
    ? `STRUCTURED BUDGET DATA (JSON):\n${JSON.stringify(body.budget)}`
    : "";
  const rawText =
    typeof body.text === "string" && body.text.length > 0
      ? `\n\nRAW BUDGET DOCUMENT TEXT:\n${body.text}`
      : "";
  const context = `${structured}${rawText}`.trim();

  if (!context) {
    return NextResponse.json(
      { error: "No budget has been analyzed yet." },
      { status: 400 },
    );
  }

  try {
    const answer = await answerQuestion(question, context);
    return NextResponse.json({ answer });
  } catch (err) {
    if (err instanceof GeminiError) {
      return NextResponse.json({ error: err.message }, { status: 502 });
    }
    return NextResponse.json(
      { error: "Failed to answer the question." },
      { status: 502 },
    );
  }
}
