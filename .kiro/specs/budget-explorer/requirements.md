# Requirements — CivicLens Budget Explorer

## Introduction
Municipal budgets are published as long, dense PDFs that most residents cannot
realistically parse. CivicLens lets a resident upload a local government budget
PDF, explore it through visualizations, and ask plain-English questions
answered from the document itself. Target track: Civic Services (Hackachusetts).

## Requirement 1 — Upload a budget PDF
**User story:** As a resident, I want to upload a municipal budget PDF, so that
I can analyze a budget relevant to me.

### Acceptance criteria
1. WHEN a user selects or drops a PDF file THEN the system SHALL accept it and
   begin analysis.
2. WHEN a user clicks "Load Amherst FY27 sample" THEN the system SHALL analyze a
   bundled sample budget without requiring a file upload.
3. IF the uploaded file is not a PDF or has no extractable text THEN the system
   SHALL show a clear, friendly error instead of crashing.
4. WHILE analysis is running THE system SHALL display a loading indicator.

## Requirement 2 — Structured extraction
**User story:** As a resident, I want the budget turned into structured data, so
that it can be visualized and queried.

### Acceptance criteria
1. WHEN a PDF is analyzed THEN the system SHALL extract its text and produce a
   structured `BudgetData` object (title, municipality, fiscal year, total,
   departments, categories, revenue, expenditures, optional year-over-year,
   summary).
2. WHEN the model returns data THEN the system SHALL validate it against a Zod
   schema before using it.
3. WHEN currency values appear as strings (e.g., "$1,234,567") THEN the system
   SHALL normalize them to numbers.

## Requirement 3 — Visual exploration
**User story:** As a resident, I want visualizations, so that I can understand
the budget at a glance.

### Acceptance criteria
1. WHEN budget data is available THEN the system SHALL show KPI stat cards
   (total budget, largest department, number of departments).
2. WHEN budget data is available THEN the system SHALL show a spending-by-
   category/department pie chart.
3. WHEN budget data is available THEN the system SHALL show a revenue vs.
   expenditure comparison.
4. IF the document contains multi-year data THEN the system SHALL show a
   year-over-year comparison; OTHERWISE it SHALL hide that section gracefully.

## Requirement 4 — Grounded Q&A
**User story:** As a resident, I want to ask questions about the budget, so that
I can get answers without reading the whole document.

### Acceptance criteria
1. WHEN a user asks a question THEN the system SHALL answer using only the
   analyzed budget as context.
2. IF the document does not contain the answer THEN the system SHALL say so
   rather than inventing an answer.
3. WHILE an answer is being generated THE system SHALL display a loading state.
4. WHEN multiple questions are asked THEN the system SHALL keep a visible
   message history for the session.

## Requirement 5 — Accessibility & polish
**User story:** As any resident, including those using assistive technology, I
want an accessible, understandable interface.

### Acceptance criteria
1. WHEN charts render THEN they SHALL have labels/alt text and high-contrast
   colors.
2. WHEN a user navigates by keyboard THEN interactive elements SHALL be
   reachable and focus SHALL be visible.
3. WHEN the app first loads THEN it SHALL briefly explain what it does.

## Non-functional / scope
- Hackathon prototype: single session, no auth, no database.
- Runtime LLM: Google Gemini (`gemini-3.5-flash`, override via `GEMINI_MODEL`),
  `GEMINI_API_KEY` required.
- Deployed publicly on Vercel for judging.
- `.kiro/` artifacts committed (not gitignored).
