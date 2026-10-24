# How we used Kiro to build CivicClear

CivicClear was built in the **Kiro IDE** using a **spec-driven** workflow, backed
by **steering docs** and **agent hooks**. Everything referenced here is
committed under [`.kiro/`](./.kiro).

## Which Kiro tools we used

- **Kiro IDE** — primary tool. We drove the whole build through the IDE agent:
  scaffolding, writing the spec, implementing each task, and running tests and
  builds in-session.
- **Agent hooks** — automated our test/build feedback loop (see below).
- **Steering** — gave the agent persistent project context so we didn't have to
  restate conventions on every turn.

## Spec-driven development

Before writing code, we had Kiro formalize the idea into a spec under
[`.kiro/specs/budget-explorer/`](./.kiro/specs/budget-explorer):

- **`requirements.md`** — user stories with acceptance criteria in
  EARS-style "WHEN/THEN/IF" form (upload, structured extraction, visual
  exploration, grounded Q&A, accessibility).
- **`design.md`** — architecture, the `BudgetData` data model, the two API
  routes, the Gemini integration, error/empty states, and the testing strategy.
- **`tasks.md`** — ten incremental tasks, each tied back to specific
  requirements, each producing a demoable increment.

**Why it helped:** the spec turned a vague prompt ("an app to understand
municipal budgets") into a concrete, buildable plan. Each task had a clear
objective and a "done" definition, so the agent could implement one slice at a
time and verify it before moving on, instead of producing a big unverified blob.

**Spec vs. vibe coding:** we vibe-coded one thing — the exact PDF library — and
it bit us. The original plan used `pdf-parse`, but its bundled pdf.js (v1.10.100)
rejected modern PDFs with "bad XRef entry." Because the *spec* had already named
`pdfjs-dist` as the fallback and the *design* kept extraction isolated in
`lib/pdf.ts` behind a stable function signature, swapping the implementation was
a contained, low-risk change — the tests and the rest of the app didn't move.
That contrast (planned seams held; the unplanned guess broke) is exactly why we
leaned on the spec.

## Steering docs

[`.kiro/steering/`](./.kiro/steering) holds three always-on documents:

- **`product.md`** — the product vision and principles (grounded answers,
  instant demo, plain language, scope discipline).
- **`tech.md`** — the stack and hard conventions: force JSON from Gemini with a
  `responseSchema`, always Zod-validate model output, normalize currency
  strings, keep API routes thin with logic in `lib/`.
- **`structure.md`** — where things go (data shape in `budget-schema.ts`, I/O in
  `lib/`, charts as prop-driven components, co-located tests).

**Biggest-impact strategy:** the rule in `tech.md` to **always validate LLM
output against a Zod schema and normalize it first**. LLMs return messy money
("$1,234,567", "(1,200)", "1.2M"). Because steering made "normalize → validate"
a standing rule, every code path that touches model output goes through
`normalizeBudget` + `budgetDataSchema`, and the resilience tests fall out of
that rule naturally.

## Agent hooks

[`.kiro/hooks/`](./.kiro/hooks) contains two hooks that automated our feedback
loop during a time-boxed hackathon:

- **`test-on-save.json`** (`PostFileSave`, matches `\.(ts|tsx)$`) — runs the
  Vitest suite whenever a TypeScript file is saved, so a regression surfaces the
  moment it's introduced instead of at the end.
- **`build-after-task.json`** (`PostTaskExec`) — runs `next build` after a spec
  task is marked complete, catching type or compile errors at task boundaries
  before we build the next slice on top.

**Why they helped:** together they enforced the spec's per-task "demo" gate
automatically. We never advanced to the next task on top of failing tests or a
broken build, which matters most when you're moving fast against a deadline.

## Result

Spec + steering + hooks let us go from an empty repo to a tested, building,
end-to-end app — upload → extract → structure → visualize → ask — with the
process itself (not just the output) captured in the committed `.kiro/` folder.
