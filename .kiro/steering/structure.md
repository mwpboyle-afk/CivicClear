# Project Structure — CivicLens

```
.
├── app/
│   ├── layout.tsx            # Root layout + metadata
│   ├── page.tsx              # Home: upload UI + sample button + dashboard
│   ├── globals.css           # Tailwind entry + base styles
│   └── api/
│       ├── analyze/route.ts  # PDF -> text -> Gemini -> BudgetData JSON
│       └── ask/route.ts      # question + context -> grounded Gemini answer
├── components/               # React UI (upload, dashboard, charts, chat)
├── lib/
│   ├── budget-schema.ts      # BudgetData type + Zod schema + normalizers
│   ├── pdf.ts                # pdf-parse extraction helper
│   ├── gemini.ts             # Gemini client, prompts, structured output
│   └── *.test.ts             # Unit tests co-located with source
├── public/
│   └── samples/              # Bundled Amherst FY27 budget PDF
├── .kiro/
│   ├── steering/             # product.md, tech.md, structure.md
│   ├── specs/                # Feature spec (requirements, design, tasks)
│   └── hooks/                # Agent hooks (e.g., run tests on save)
├── .env.example              # Documents GEMINI_API_KEY
└── README.md                 # Setup, test instructions, live link, Kiro write-up
```

## Where things go
- **Data shape** lives in `lib/budget-schema.ts` — the single source of truth
  for what the LLM must return and what the UI consumes.
- **Side-effectful I/O** (PDF parsing, Gemini calls) lives in `lib/` helpers so
  API routes stay thin and testable.
- **Charts** are individual components under `components/` driven purely by
  `BudgetData` props, so they are easy to unit-test with fixtures.
- **Tests** sit next to the code they cover.
