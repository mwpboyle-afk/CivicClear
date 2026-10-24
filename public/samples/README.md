# Sample budgets

The "Try a sample budget" button on the home page picks one of these PDFs at
random and runs it through the normal analysis flow. This shows the app works
across different municipalities, not just one hardcoded document.

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
   - `label` — shown to the user after a random pick (so they know which budget
     loaded).

3. Commit both the PDF and the updated `manifest.json`.

Notes:
- Only text-based PDFs work (scanned/image-only PDFs can't be read).
- If `manifest.json` is empty or missing, the sample button is hidden and users
  can still upload their own PDF.
