import {
  GoogleGenerativeAI,
  SchemaType,
  type GenerativeModel,
  type ResponseSchema,
} from "@google/generative-ai";

// gemini-1.5-flash and the 2.x models were retired / blocked for new API keys.
// gemini-3.5-flash-lite is confirmed available for new keys, supports JSON
// structured output + grounded text, and has its own separate free-tier daily
// quota (helpful when the full flash model's quota/availability is exhausted).
// Override with GEMINI_MODEL (e.g. gemini-3.5-flash for higher quality, or
// gemini-3.8-flash) when your key/quota allows.
const MODEL_NAME = process.env.GEMINI_MODEL || "gemini-3.5-flash-lite";

/**
 * Max characters of PDF text to send to the model. This is a self-imposed
 * guard, not a Gemini limit. It's a balance: too small and we miss content
 * deeper in large budgets; too large (e.g. the full 400k+ chars of a 300-page
 * PDF) and extraction quality drops — the model returns thin, inconsistent
 * results. 250k covers well beyond a typical budget's summary/overview section
 * while keeping extraction reliable.
 */
const MAX_TEXT_CHARS = 250_000;

export class GeminiError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "GeminiError";
  }
}

export function getApiKey(): string {
  const key = process.env.GEMINI_API_KEY;
  if (!key) {
    throw new GeminiError(
      "GEMINI_API_KEY is not set. Add it to .env.local (local) or your " +
        "Vercel project environment variables.",
    );
  }
  return key;
}

function getClient(): GoogleGenerativeAI {
  return new GoogleGenerativeAI(getApiKey());
}

/** How many extra attempts to make when the model is temporarily overloaded. */
const MAX_RETRIES = 3;

function isTransient(err: unknown): boolean {
  const msg = err instanceof Error ? err.message : String(err);
  // Do NOT retry hard daily-quota exhaustion: the quota won't reset for hours,
  // so retrying only wastes time and (on metered plans) money.
  if (/quota|per day|PerDay|billing/i.test(msg)) return false;
  // Retry only genuinely transient conditions: 503 overload, 500 server error,
  // and short-window 429 rate limits that are not daily-quota exhaustion.
  return (
    /\b(503|500)\b/.test(msg) ||
    /overloaded|high demand|UNAVAILABLE/i.test(msg) ||
    /\b429\b/.test(msg)
  );
}

const sleep = (ms: number) => new Promise((r) => setTimeout(r, ms));

/**
 * Call a Gemini model with exponential backoff on transient errors (503/429).
 * Gemini's flash models intermittently return "high demand" 503s; retrying a
 * few times with backoff makes the user-facing flow far more reliable.
 */
async function generateWithRetry<T>(fn: () => Promise<T>): Promise<T> {
  let lastErr: unknown;
  for (let attempt = 0; attempt <= MAX_RETRIES; attempt++) {
    try {
      return await fn();
    } catch (err) {
      lastErr = err;
      if (attempt === MAX_RETRIES || !isTransient(err)) break;
      // 0.8s, 1.6s, 3.2s (+ jitter)
      const delay = 800 * 2 ** attempt + Math.random() * 300;
      await sleep(delay);
    }
  }
  throw lastErr;
}

/** The structured-output schema mirrors BudgetData in budget-schema.ts. */
const budgetResponseSchema: ResponseSchema = {
  type: SchemaType.OBJECT,
  properties: {
    title: { type: SchemaType.STRING },
    municipality: { type: SchemaType.STRING },
    fiscalYear: { type: SchemaType.STRING },
    totalBudget: { type: SchemaType.NUMBER },
    departments: {
      type: SchemaType.ARRAY,
      items: {
        type: SchemaType.OBJECT,
        properties: {
          name: { type: SchemaType.STRING },
          amount: { type: SchemaType.NUMBER },
        },
        required: ["name", "amount"],
      },
    },
    categories: {
      type: SchemaType.ARRAY,
      items: {
        type: SchemaType.OBJECT,
        properties: {
          name: { type: SchemaType.STRING },
          amount: { type: SchemaType.NUMBER },
        },
        required: ["name", "amount"],
      },
    },
    revenue: {
      type: SchemaType.ARRAY,
      items: {
        type: SchemaType.OBJECT,
        properties: {
          source: { type: SchemaType.STRING },
          amount: { type: SchemaType.NUMBER },
        },
        required: ["source", "amount"],
      },
    },
    expenditures: {
      type: SchemaType.ARRAY,
      items: {
        type: SchemaType.OBJECT,
        properties: {
          name: { type: SchemaType.STRING },
          amount: { type: SchemaType.NUMBER },
        },
        required: ["name", "amount"],
      },
    },
    yearOverYear: {
      type: SchemaType.ARRAY,
      items: {
        type: SchemaType.OBJECT,
        properties: {
          year: { type: SchemaType.STRING },
          total: { type: SchemaType.NUMBER },
        },
        required: ["year", "total"],
      },
    },
    summary: { type: SchemaType.STRING },
    extendedSummary: { type: SchemaType.STRING },
    taxImpact: {
      type: SchemaType.OBJECT,
      properties: {
        taxRatePer1000: { type: SchemaType.NUMBER },
        totalLevy: { type: SchemaType.NUMBER },
        percentChange: { type: SchemaType.NUMBER },
        averageHomeImpact: { type: SchemaType.NUMBER },
        highlights: {
          type: SchemaType.ARRAY,
          items: { type: SchemaType.STRING },
        },
        note: { type: SchemaType.STRING },
      },
    },
  },
  required: [
    "title",
    "municipality",
    "fiscalYear",
    "totalBudget",
    "departments",
    "categories",
    "revenue",
    "expenditures",
    "summary",
  ],
};

/**
 * Schema for the image/scanned-PDF path. Same as budgetResponseSchema plus a
 * `transcription` field: since there's no extractable text layer to ground the
 * chat on, we ask the model to also transcribe the document so /api/ask has
 * raw context to work with.
 */
const budgetWithTranscriptionSchema: ResponseSchema = {
  type: SchemaType.OBJECT,
  properties: {
    ...(budgetResponseSchema.properties as Record<string, unknown>),
    transcription: { type: SchemaType.STRING },
  } as ResponseSchema["properties"],
  required: budgetResponseSchema.required,
};

export function buildExtractionPrompt(text: string): string {
  const clipped =
    text.length > MAX_TEXT_CHARS ? text.slice(0, MAX_TEXT_CHARS) : text;
  return [
    "You are a municipal-budget analyst. Extract structured data from the",
    "following municipal budget document text. Return ONLY data supported by",
    "the document. Use dollar amounts as plain numbers (no symbols, no commas).",
    "",
    "Guidance:",
    "- title: the budget document's title.",
    "- municipality: the city/town/county the budget is for.",
    "- fiscalYear: the primary fiscal year (e.g. 'FY2027').",
    "- totalBudget: the overall total budget/appropriation amount.",
    "- departments: spending by department/function (e.g. Fire, Police, DPW).",
    "- categories: spending by category/object (e.g. Personnel, Operating).",
    "- revenue: revenue by source (e.g. Property Tax, State Aid).",
    "- expenditures: major expenditure groupings.",
    "- yearOverYear: only include if the document shows totals for multiple",
    "  years; otherwise return an empty array.",
    "- summary: 2-3 plain-language sentences a resident could understand.",
    "- extendedSummary: a longer plain-language brief (1-2 short paragraphs)",
    "  explaining the budget's priorities and notable changes. Omit if the",
    "  document doesn't support more than the short summary.",
    "- taxImpact: how the budget affects taxes. Most budgets discuss taxes even",
    "  if not as a single table, so look across the whole document (revenue",
    "  sections, levy discussions, tax-rate notes). Fill any of these when",
    "  stated: taxRatePer1000 (rate per $1,000 of assessed value), totalLevy",
    "  (total property tax levy), percentChange (levy/rate change vs prior",
    "  year), averageHomeImpact (annual $ change for a typical home). ALSO fill",
    "  'highlights': a list of short plain-language tax facts you find — e.g.",
    "  'Property tax levy rises 2.5% annually', 'Property taxes fund $X of the",
    "  budget', 'New growth adds $Y', 'Debt exclusions add $Z to the levy'.",
    "  Only omit taxImpact entirely if the document truly says nothing about",
    "  taxes or the tax levy.",
    "Do not invent numbers. If a listed section is not present, return an empty",
    "array for it (or omit the optional objects).",
    "",
    "DOCUMENT TEXT:",
    clipped,
  ].join("\n");
}

/**
 * Ask Gemini to structure raw budget text into JSON. Returns parsed JSON
 * (untyped); the caller must normalize + Zod-validate it.
 */
export async function structureBudget(text: string): Promise<unknown> {
  const model: GenerativeModel = getClient().getGenerativeModel({
    model: MODEL_NAME,
    generationConfig: {
      // Extraction is a data task, not a creative one: temperature 0 makes the
      // model pick its most-likely reading, maximizing run-to-run consistency.
      temperature: 0,
      responseMimeType: "application/json",
      responseSchema: budgetResponseSchema,
    },
  });

  let raw: string;
  try {
    const result = await generateWithRetry(() =>
      model.generateContent(buildExtractionPrompt(text)),
    );
    raw = result.response.text();
  } catch (err) {
    throw new GeminiError(
      `The model failed to analyze the budget: ${
        err instanceof Error ? err.message : "unknown error"
      }`,
    );
  }

  try {
    return JSON.parse(raw);
  } catch {
    throw new GeminiError("The model returned data that was not valid JSON.");
  }
}

export function buildPdfExtractionPrompt(): string {
  return [
    "You are a municipal-budget analyst. The attached PDF is a municipal",
    "budget. Some or all of it may be scanned images rather than selectable",
    "text, so read the document visually. Extract structured data and return",
    "ONLY data supported by the document. Use dollar amounts as plain numbers",
    "(no symbols, no commas).",
    "",
    "Guidance:",
    "- title: the budget document's title.",
    "- municipality: the city/town/county the budget is for.",
    "- fiscalYear: the primary fiscal year (e.g. 'FY2027').",
    "- totalBudget: the overall total budget/appropriation amount.",
    "- departments: spending by department/function (e.g. Fire, Police, DPW).",
    "- categories: spending by category/object (e.g. Personnel, Operating).",
    "- revenue: revenue by source (e.g. Property Tax, State Aid).",
    "- expenditures: major expenditure groupings.",
    "- yearOverYear: only include if the document shows totals for multiple",
    "  years; otherwise return an empty array.",
    "- summary: 2-3 plain-language sentences a resident could understand.",
    "- extendedSummary: a longer plain-language brief (1-2 short paragraphs).",
    "  Omit if unsupported.",
    "- taxImpact: how the budget affects taxes. Fill any stated figures",
    "  (taxRatePer1000, totalLevy, percentChange, averageHomeImpact) AND a",
    "  'highlights' list of short plain-language tax facts found anywhere in the",
    "  document (levy changes, tax percentages, how much taxes fund). Only omit",
    "  if the document says nothing about taxes.",
    "- transcription: a plain-text transcription of the budget tables and key",
    "  figures you read, so the data can be referenced later. Keep it factual.",
    "Do not invent numbers. If a listed section is not present, return an empty",
    "array for it (or omit the optional objects).",
  ].join("\n");
}

/**
 * Structure a budget directly from PDF bytes using Gemini's multimodal input.
 * Used as a fallback for scanned/image-only PDFs that have no extractable text
 * layer. Gemini reads the pages visually (OCR + structuring in one call).
 *
 * Returns the parsed JSON (untyped) including a `transcription` string. The
 * caller must strip `transcription` out, then normalize + Zod-validate the rest.
 */
export async function structureBudgetFromPdf(
  base64Pdf: string,
): Promise<{ data: unknown; transcription: string }> {
  const model = getClient().getGenerativeModel({
    model: MODEL_NAME,
    generationConfig: {
      // Deterministic extraction (see structureBudget).
      temperature: 0,
      responseMimeType: "application/json",
      responseSchema: budgetWithTranscriptionSchema,
    },
  });

  let raw: string;
  try {
    const result = await generateWithRetry(() =>
      model.generateContent([
        { inlineData: { data: base64Pdf, mimeType: "application/pdf" } },
        { text: buildPdfExtractionPrompt() },
      ]),
    );
    raw = result.response.text();
  } catch (err) {
    throw new GeminiError(
      `The model failed to analyze the scanned PDF: ${
        err instanceof Error ? err.message : "unknown error"
      }`,
    );
  }

  let parsed: Record<string, unknown>;
  try {
    parsed = JSON.parse(raw) as Record<string, unknown>;
  } catch {
    throw new GeminiError("The model returned data that was not valid JSON.");
  }

  const transcription =
    typeof parsed.transcription === "string" ? parsed.transcription : "";
  // Hand the caller the budget fields separately from the transcription.
  const { transcription: _omit, ...data } = parsed;
  return { data, transcription };
}

export function buildAnswerPrompt(
  question: string,
  context: string,
): { systemInstruction: string; prompt: string } {
  return {
    systemInstruction: [
      "You are a helpful assistant that answers questions about a specific",
      "municipal budget. Answer ONLY using the provided budget context.",
      "If the answer is not in the context, say you cannot find it in this",
      "budget document. Be concise, use plain language, and include specific",
      "dollar figures when they are present in the context.",
    ].join(" "),
    prompt: [
      "BUDGET CONTEXT:",
      context,
      "",
      `QUESTION: ${question}`,
    ].join("\n"),
  };
}

/** Answer a question grounded strictly in the provided budget context. */
export async function answerQuestion(
  question: string,
  context: string,
): Promise<string> {
  const { systemInstruction, prompt } = buildAnswerPrompt(
    question,
    context.length > MAX_TEXT_CHARS ? context.slice(0, MAX_TEXT_CHARS) : context,
  );

  const model = getClient().getGenerativeModel({
    model: MODEL_NAME,
    systemInstruction,
  });

  try {
    const result = await generateWithRetry(() =>
      model.generateContent(prompt),
    );
    return result.response.text().trim();
  } catch (err) {
    throw new GeminiError(
      `The model failed to answer: ${
        err instanceof Error ? err.message : "unknown error"
      }`,
    );
  }
}
