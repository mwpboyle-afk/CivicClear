# Sample budgets

The home screen lists these PDFs as sample buttons; picking one runs it through
the normal analysis flow. Offering several towns shows the app works across
different municipalities, not just one hardcoded document.

## How to add a sample

1. Drop a **text-based** municipal budget PDF in this folder, e.g.
   `public/samples/boston-fy26-budget.pdf`.
2. Add an entry to `manifest.json`:

   ```json
   {
     "samples": [
       { "file": "amherst-fy27-budget.pdf", "label": "Amherst, MA — FY27 Proposed Budget" },
       { "file": "boston-fy26-budget.pdf",  "label": "Boston, MA — FY26 Budget" }
     ]
   }
   ```

   - `file` — the exact filename in this folder.
   - `label` — the button text shown on the home screen.

3. Commit both the PDF and the updated `manifest.json`.

Notes:
- Text-based PDFs analyze best; scanned/image PDFs fall back to Gemini vision.
- Mid-size budgets (roughly under ~120 pages) are analyzed in full; very large
  PDFs are analyzed up to a character cap.
- If `manifest.json` is empty or missing, the sample buttons are hidden and
  users can still upload their own PDF.
