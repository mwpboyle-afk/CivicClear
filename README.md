# CivicClear — Municipal Budget Explorer

**Hackachusetts track: Civic Services**

**Live demo: https://sundai-hack.vercel.app**

Municipal budgets are published as long, dense PDFs that most residents can't
realistically read. **CivicClear** turns a budget PDF into something a resident
can actually use:

1. **Upload** a municipal budget PDF (or pick a bundled sample town).
2. **Explore** it through visualizations — KPI cards, a spending pie chart,
   revenue vs. expenditure, and a year-over-year trend.
3. **Ask** plain-English questions and get answers grounded in the document.
4. **Build a report** — pin any answer as a section, add your own notes/lists,
   rename and reorder sections, then save it or export the whole thing to PDF.

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

## Features

- **Automatic analysis** of an uploaded budget PDF into a visual dashboard
  (KPIs, spending pie, revenue vs. expenditure, year-over-year).
- **Grounded Q&A** — ask about the budget and get answers drawn only from the
  document (it says so when the answer isn't there).
- **Report builder** — pin any chat answer as a section, add custom
  notes/lists, rename and drag-to-reorder sections, and edit the report title.
- **Save & reopen** reports (stored in your browser) and **export to PDF**.
- **Scanned PDFs** supported via a Gemini vision fallback when there's no text
  layer.

## Tech stack

Next.js 14 (App Router, TypeScript), Google Gemini, pdfjs-dist, Zod, Recharts,
Tailwind CSS, @dnd-kit, Vitest. Deployed on Vercel.

## Run it locally

Requires Node.js 18+ and a [Google Gemini API key](https://aistudio.google.com/app/apikey).

```bash
npm install
cp .env.example .env.local        # add your GEMINI_API_KEY to .env.local
npm run dev                       # http://localhost:3000
```

Then upload a municipal budget PDF, or pick one of the bundled sample towns.

```bash
npm test                          # run the test suite
```

## How we used Kiro

See **[KIRO.md](./KIRO.md)** for the full write-up. All Kiro artifacts are in
the committed [`.kiro/`](./.kiro) directory: steering docs, the feature spec
(requirements, design, tasks), and agent hooks.

## Notes

- Reads both text-based and scanned/image PDFs (scanned documents take a little
  longer). All figures come from the uploaded document.
- To stay within the model's context window, the app sends up to the first
  ~250,000 characters of extracted text (roughly 125–160 budget pages) per
  analysis. Small-to-mid-size budgets fit in full; for very large budgets
  (hundreds of pages) the dashboard reflects the earlier sections, and content
  past the cap may not appear. This cap is a single constant (`MAX_TEXT_CHARS`
  in `lib/gemini.ts`) and can be raised.
- Hackathon prototype, built as a proof of concept (no accounts). Saved reports
  are stored in your browser (localStorage) — they persist on that device but
  aren't shared across devices or users.

## Sample data & credits

The bundled sample budgets are public municipal records published by their
respective Massachusetts towns, included only as demo input. CivicClear claims
no ownership of these documents.

- **Town of Hadley, MA** — FY25 Town Administrator's Budget
- **Town of Winchester, MA** — FY27 Budget Book
- **Turners Falls, MA**Town Operating Budget — Schedule III

<!-- If you have the source URLs, add them here, e.g.
  - Town of Hadley, MA — FY25 Budget: <url>
-->

## License

MIT
