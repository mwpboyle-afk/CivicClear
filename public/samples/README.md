# Sample budget data

The "Load Amherst FY27 sample" button on the home page fetches a PDF from:

    /samples/amherst-fy27-budget.pdf

To enable it, place the **Amherst FY27 Town Manager's Proposed Municipal
Budget** PDF in this folder with exactly that filename:

    public/samples/amherst-fy27-budget.pdf

The file is intentionally not committed if it is large; if you want the sample
button to work on the deployed site, commit the PDF here (or add it as a build
asset). Any text-based municipal budget PDF works — just match the filename or
update `SAMPLE_PDF_URL` in `app/page.tsx`.
