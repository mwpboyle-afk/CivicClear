# CivicLens — Municipal Budget Explorer

**Hackachusetts track: Civic Services**

**Live demo: https://sundai-hack.vercel.app**

Municipal budgets are published as long, dense PDFs that most residents can't
realistically read. **CivicLens** turns a budget PDF into something a resident
can actually use:

1. **Upload** a municipal budget PDF (or try a bundled sample).
2. **Explore** it through visualizations — KPI cards, a spending pie chart,
   revenue vs. expenditure, and a year-over-year trend.
3. **Ask** plain-English questions and get answers grounded in the document.

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

## Tech stack

Next.js 14 (App Router, TypeScript), Google Gemini, pdfjs-dist, Zod, Recharts,
Tailwind CSS, Vitest. Deployed on Vercel.

## Run it locally

Requires Node.js 18+ and a [Google Gemini API key](https://aistudio.google.com/app/apikey).

```bash
npm install
cp .env.example .env.local        # add your GEMINI_API_KEY to .env.local
npm run dev                       # http://localhost:3000
```

Then upload a municipal budget PDF, or click **Try a sample budget**.

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
- Hackathon prototype: single session, no accounts, no persistence.

## License

MIT
