import {
  GoogleGenerativeAI,
  SchemaType,
  type GenerativeModel,
  type ResponseSchema,
} from "@google/generative-ai";

// gemini-1.5-flash and the 2.x models were retired / blocked for new API keys.
// gemini-3.5-flash is confirmed available for new keys and supports JSON
// structured output + grounded text. Override with GEMINI_MODEL if your key has
// access to a different model (e.g. gemini-3.8-flash when it's not overloaded).
const MODEL_NAME = process.env.GEMINI_MODEL || "gemini-3.5-flash";

/** Max characters of PDF text to send to the model (keeps us within context). */
const MAX_TEXT_CHARS = 120_000;

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
    "If a section is not present, return an empty array for it. Do not invent",
    "numbers.",
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
      responseMimeType: "application/json",
      responseSchema: budgetResponseSchema,
    },
  });

  let raw: string;
  try {
    const result = await model.generateContent(buildExtractionPrompt(text));
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
    const result = await model.generateContent(prompt);
    return result.response.text().trim();
  } catch (err) {
    throw new GeminiError(
      `The model failed to answer: ${
        err instanceof Error ? err.message : "unknown error"
      }`,
    );
  }
}
