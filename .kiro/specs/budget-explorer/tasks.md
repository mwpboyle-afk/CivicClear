# Tasks — CivicLens Budget Explorer

- [x] 1. Scaffold the Next.js app and commit the `.kiro/` foundation
  - TypeScript Next.js (App Router), Tailwind, Vitest, ESLint
  - Steering docs (product, tech, structure) and this spec
  - Ensure `.kiro/` is NOT gitignored; placeholder landing page
  - _Requirements: non-functional / scope_

- [x] 2. Define the budget data model and validation
  - `BudgetData` type + Zod schema in `lib/budget-schema.ts`
  - Normalizer: currency strings → numbers, drop empty rows
  - Unit tests: schema accept/reject, normalization edge cases
  - _Requirements: 2.1, 2.2, 2.3_

- [x] 3. PDF text extraction API
  - `lib/pdf.ts` with `pdf-parse`; `POST /api/analyze` returns extracted text
  - Graceful errors for non-PDF / empty text; Node runtime
  - Unit tests on the extraction helper
  - _Requirements: 1.1, 1.3, 2.1_

- [x] 4. Gemini structuring — text → BudgetData JSON
  - `lib/gemini.ts` with structured JSON output + responseSchema
  - Extend `/api/analyze` to return validated `BudgetData`; `.env.example`
  - Unit tests with mocked Gemini client; prompt builder test
  - _Requirements: 2.1, 2.2, 2.3_

- [x] 5. Upload UI + sample-data button
  - Drag-drop/file-picker, loading state, "Load Amherst FY27 sample"
  - Bundle Amherst PDF in `public/samples/`; store result in session state
  - Component tests for upload + sample flow
  - _Requirements: 1.1, 1.2, 1.4_

- [x] 6. Visualization dashboard
  - KPI cards, category/department pie, revenue vs. expense, YoY (conditional)
  - Recharts, responsive Tailwind
  - Component tests: render with fixtures; YoY hidden when absent
  - _Requirements: 3.1, 3.2, 3.3, 3.4_

- [x] 7. Grounded Q&A
  - `POST /api/ask` grounded strictly in context; admits unknowns
  - Chat panel with history + loading state
  - Unit test (mocked Gemini) + component test
  - _Requirements: 4.1, 4.2, 4.3, 4.4_

- [x] 8. Agent hook + steering polish (Kiro scoring)
  - `.kiro/hooks/` hook with real workflow value (e.g., tests on save)
  - Refine steering so it demonstrably shaped the build
  - _Requirements: non-functional / scope_

- [x] 9. Polish, error states, accessibility, empty states
  - Friendly errors, a11y (labels, alt text, focus, contrast), in-app explainer
  - Component tests for error/empty states
  - _Requirements: 1.3, 5.1, 5.2, 5.3_

- [x] 10. Deploy to Vercel + submission deliverables
  - Vercel deploy with `GEMINI_API_KEY`; verify end-to-end with sample
  - README (track, setup, test instructions, live link), Kiro write-up, video script
  - Confirm `.kiro/` committed, not gitignored
  - _Requirements: non-functional / scope_
