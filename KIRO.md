# How we used Kiro to build CivicClear

CivicClear was built in the **Kiro IDE** using a **spec-driven** workflow, backed
by **steering docs** and **agent hooks**, then iterated on turn by turn with the
agent. Everything referenced here is committed under [`.kiro/`](./.kiro).

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

## Iterating with Kiro

Past the initial spec, we kept using the Kiro agent to extend and harden the
app turn by turn, each change kept green by the hooks:

- **Grew the product** from a viewer into a report builder — pin chat answers as
  sections, add custom notes/lists, drag-to-reorder and edit them, an editable
  report title, save/reopen reports (localStorage), and print-to-PDF export that
  excludes the chat.
- **Diagnosed real production bugs with the agent.** A pdfjs worker wasn't traced
  into the Vercel serverless bundle (worked locally, 404'd in prod); a Gemini
  call 401'd because the API key had a stray trailing character. In both cases we
  used the agent to reproduce, find the root cause, and fix — rather than guess.
- **Tuned for a data tool.** We set the model to `temperature 0` (plus `topK 1`,
  `topP 0`) so the same budget yields the same analysis run to run — important
  for a factual civic tool — and verified the determinism live.

## What we didn't use (and why)

In the interest of an honest write-up: we did not use MCP, property-based
testing, or Kiro powers on this project. Our testing is example-based (Vitest +
Testing Library, ~100 tests). Given the fixed deadline we focused our Kiro usage
on spec-driven development, steering, and hooks, which gave the most leverage
for this app.

## Result

Spec + steering + hooks let us go from an empty repo to a tested, building,
deployed app — upload a budget → explore it visually → ask grounded questions →
build and export a report — with the process itself (not just the output)
captured in the committed `.kiro/` folder.
