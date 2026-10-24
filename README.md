# CivicLens — Municipal Budget Explorer

**Hackachusetts track: Civic Services**

Municipal budgets are published as long, dense PDFs that most residents can't
realistically read. **CivicLens** turns a budget PDF into something a resident
can actually use:

1. **Upload** a municipal budget PDF (or load the bundled Amherst FY27 sample).
2. **Explore** it through visualizations — KPI cards, a spending pie chart,
   revenue vs. expenditure, and a year-over-year trend when the document has
   multi-year data.
3. **Ask** plain-English questions and get answers grounded strictly in the
   document.

Live demo: _add your Vercel URL here_

## How it works

```
Upload PDF ──► /api/analyze ──► pdfjs-dist (PDF → text)
                              └► Gemini (text → structured BudgetData JSON)
                              └► Zod validation + currency normalization
                                           │
                                           ▼
                              Dashboard: KPIs • pie • revenue vs. expense • YoY
                                           │
Ask a question ──► /api/ask ──► Gemini (answer grounded in the budget context)
```

- No database — an analyzed budget lives in the browser for the session.
- No vector store — municipal budgets are small enough to pass the full
  extracted text + structured JSON directly as context.

## Tech stack

- **Next.js 14** (App Router, TypeScript) — one app, deployed to Vercel
- **pdfjs-dist** — PDF text extraction (handles modern PDFs with xref streams)
- **Google Gemini** (`gemini-3.5-flash`, set `GEMINI_MODEL` to override) via
  `@google/generative-ai` — structured extraction + grounded Q&A
- **Zod** — validates and normalizes all model output
- **Recharts** + **Tailwind CSS** — visualizations and UI
- **Vitest** + **@testing-library/react** — tests

## Getting started

### Prerequisites

- Node.js 18+ (developed on Node 20+)
- A Google Gemini API key (free tier): https://aistudio.google.com/app/apikey

### Setup

```bash
npm install
cp .env.example .env.local   # then put your key in .env.local
```

`.env.local`:

```
GEMINI_API_KEY=your_key_here
```

### Run

```bash
npm run dev      # http://localhost:3000
```

### Enable the sample button (optional)

Place the Amherst FY27 budget PDF at
`public/samples/amherst-fy27-budget.pdf` (see `public/samples/README.md`).

## Testing

```bash
npm test         # run the Vitest suite once
npm run test:watch
npm run lint
npm run build    # production build / type-check
```

The suite covers currency normalization, the Zod schema, PDF extraction (against
a real PDF fixture), both API routes (with the model mocked), and the UI
components (upload, dashboard, charts, and the grounded chat flow).

## Deploying to Vercel

1. Push this repo to GitHub.
2. Import it into Vercel.
3. Add a project environment variable: `GEMINI_API_KEY`.
4. Deploy. The app runs the API routes in the Node runtime (required by
   `pdfjs-dist`); this is already configured via `runtime = "nodejs"` and
   `serverComponentsExternalPackages`.

## How we used Kiro

See **[KIRO.md](./KIRO.md)** for the full write-up (spec-driven development,
steering docs, and agent hooks). All Kiro artifacts live in the committed
[`.kiro/`](./.kiro) directory:

- `.kiro/steering/` — product, tech, and structure guidance that shaped the build
- `.kiro/specs/budget-explorer/` — requirements, design, and tasks
- `.kiro/hooks/` — agent hooks (run tests on save; build after task completion)

## Scope & limitations

- Hackathon prototype: single session, no auth, no persistence.
- Reads **text-based** PDFs. Scanned/image-only PDFs (needing OCR) are out of
  scope and produce a clear error.
- Extraction quality depends on the model and the document's structure; all
  figures shown come from the uploaded document, not invented.

## License

MIT
