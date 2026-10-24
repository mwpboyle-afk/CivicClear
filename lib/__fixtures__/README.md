# Test fixtures

- `sample.pdf` — a small, real, text-based PDF used by `lib/pdf.test.ts` to
  verify `extractPdfText`. It was generated from `scripts/sample-budget.txt`
  with macOS `cupsfilter`:

  ```bash
  cupsfilter scripts/sample-budget.txt > lib/__fixtures__/sample.pdf
  ```

- `budget.ts` — a typed `BudgetData` fixture used by component and route tests.
