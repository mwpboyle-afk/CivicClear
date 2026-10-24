# Product Vision — CivicLens

## What it is
CivicLens is a web app that makes municipal budgets understandable to ordinary
residents. Local governments publish their budgets as long, dense PDFs that few
people can realistically read. CivicLens turns one of those PDFs into something
a resident can actually use:

1. **Upload** a municipal budget PDF (or try a bundled sample, picked at random).
2. **Explore** the budget through clear visualizations — KPI cards, a
   spending-by-category pie chart, revenue vs. expenditure, and a
   year-over-year comparison when the document contains multi-year data.
3. **Ask** plain-English questions and get answers grounded strictly in the
   uploaded document.

## Who it is for
- Residents who want to understand where their tax dollars go.
- Journalists and local advocates who need to quickly interrogate a budget.
- Town meeting members and civic groups preparing for budget discussions.

## Hackathon context
- Event: Hackachusetts.
- Track: **Civic Services**.
- Hard deadline: submission by 8 PM on the build day.
- Judging weights *how effectively Kiro was used*, so the `.kiro/` artifacts
  (this steering, the spec, and hooks) are first-class deliverables.

## Product principles
- **Grounded, not generative guessing.** Q&A answers must come from the
  document. If the budget does not contain the answer, say so.
- **Instant demo.** A judge can click "Try a sample budget" to analyze a random
  bundled budget and land on a populated dashboard in seconds — showing the app
  generalizes across municipalities, not just one hardcoded document.
- **Accessible and plain-language.** Avoid jargon. Charts need labels, alt
  text, and sufficient color contrast.
- **Scope discipline.** This is a hackathon prototype. Favor a working,
  demoable end-to-end flow over robustness, persistence, or auth.
