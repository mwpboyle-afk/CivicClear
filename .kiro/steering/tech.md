# Tech Stack & Conventions — CivicClear

## Stack
- **Framework:** Next.js 14 (App Router) with TypeScript.
- **Styling:** Tailwind CSS.
- **Charts:** Recharts.
- **Validation:** Zod (validate all LLM output before it reaches the UI).
- **PDF parsing:** `pdfjs-dist` (legacy build) in a Node runtime API route.
  We started on `pdf-parse` but its bundled pdf.js rejected modern PDFs, so we
  switched to `pdfjs-dist`. When a PDF has no text layer (scanned/image-only),
  the analyze route falls back to sending the PDF bytes to Gemini's multimodal
  input, which reads the pages visually and returns a transcription for Q&A.
- **LLM:** Google Gemini via `@google/generative-ai`, model
  `gemini-3.5-flash-lite` (override with the `GEMINI_MODEL` env var). Older
  1.5/2.x flash models were retired/blocked for new keys; the lite model has its
  own separate free-tier daily quota.
- **Testing:** Vitest + @testing-library/react (jsdom environment).
- **Deploy:** Vercel.

## Environment
- `GEMINI_API_KEY` — required at runtime. Local dev reads it from `.env.local`;
  Vercel reads it from a project environment variable. Never commit a real key.

## Architecture
- Single Next.js app. No separate backend, no database.
- `POST /api/analyze`: PDF buffer → `pdfjs-dist` (text) → Gemini (structured
  `BudgetData` JSON) → Zod-validated response.
- `POST /api/ask`: question + budget context (structured JSON + extracted text)
  → Gemini grounded answer.
- Client holds the analyzed budget in React state for the session. Reports the
  user chooses to save are persisted in the browser via localStorage (no
  backend); they are device-local.

## LLM conventions
- Force JSON from Gemini with
  `generationConfig: { responseMimeType: "application/json", responseSchema }`.
- Always validate Gemini output with the Zod schema in `lib/budget-schema.ts`
  before trusting it. Normalize currency strings ("$1,234,567") to numbers.
- For Q&A, instruct the model to answer only from the provided context and to
  state clearly when the document does not contain the answer.
- Treat extracted PDF text and model output as untrusted input.

## Code conventions
- TypeScript strict mode. No `any` in committed code where avoidable.
- Keep API routes thin; put parsing, prompting, and validation in `lib/`.
- Use the `@/` path alias for imports from the project root.
- Co-locate unit tests next to the code as `*.test.ts(x)`.
- Keep components small and accessible: label inputs, add alt text, ensure
  keyboard focus works, and keep chart colors high-contrast.
