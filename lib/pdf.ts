/**
 * PDF text extraction using pdfjs-dist (a current pdf.js). Runs in the Node
 * runtime only. We use the legacy build and disable the worker so it runs in a
 * plain Node process without a DOM or separate worker thread.
 */

export class PdfExtractionError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "PdfExtractionError";
  }
}

/**
 * Thrown when a PDF is valid but has no extractable text layer — i.e. it is
 * scanned/image-only. The caller can catch this specifically to fall back to
 * the multimodal (image) analysis path.
 */
export class NoTextLayerError extends PdfExtractionError {
  constructor(message: string) {
    super(message);
    this.name = "NoTextLayerError";
  }
}

/**
 * Extract plain text from a PDF buffer.
 * @throws NoTextLayerError when the PDF is valid but has no extractable text
 * (scanned/image-only) — the caller can fall back to the image path.
 * @throws PdfExtractionError when the buffer is empty or not a PDF.
 */
export async function extractPdfText(buffer: Buffer): Promise<string> {
  if (!buffer || buffer.length === 0) {
    throw new PdfExtractionError("The uploaded file is empty.");
  }

  // A PDF file begins with the "%PDF" marker.
  const header = buffer.subarray(0, 5).toString("latin1");
  if (!header.startsWith("%PDF")) {
    throw new PdfExtractionError("The uploaded file does not look like a PDF.");
  }

  let fullText: string;
  try {
    // Lazy, legacy build: safe to load in a Node serverless function.
    const pdfjs = await import("pdfjs-dist/legacy/build/pdf.mjs");

    // pdfjs-dist 4.x always wants a worker module, even on the main thread.
    // Point it at the real worker file (resolved from the installed package)
    // so it loads in Node and in Vercel's serverless bundle instead of failing
    // with "Cannot find module pdf.worker.mjs".
    try {
      const { createRequire } = await import("module");
      const require = createRequire(import.meta.url);
      pdfjs.GlobalWorkerOptions.workerSrc = require.resolve(
        "pdfjs-dist/legacy/build/pdf.worker.mjs",
      );
    } catch {
      // If resolution fails, fall through; getDocument may still work.
    }

    const data = new Uint8Array(buffer);
    const loadingTask = pdfjs.getDocument({
      data,
      // Keep pdf.js from trying to fetch standard fonts over the network.
      isEvalSupported: false,
      useSystemFonts: true,
    });

    const doc = await loadingTask.promise;
    const parts: string[] = [];
    for (let pageNum = 1; pageNum <= doc.numPages; pageNum++) {
      const page = await doc.getPage(pageNum);
      const content = await page.getTextContent();
      const pageText = content.items
        .map((item) => ("str" in item ? item.str : ""))
        .join(" ");
      parts.push(pageText);
    }
    await doc.destroy();
    fullText = parts.join("\n").replace(/[ \t]+/g, " ").trim();
  } catch (err) {
    throw new PdfExtractionError(
      `Could not read the PDF: ${
        err instanceof Error ? err.message : "unknown error"
      }`,
    );
  }

  if (fullText.length === 0) {
    throw new NoTextLayerError(
      "No extractable text layer (likely a scanned/image-only PDF).",
    );
  }

  return fullText;
}
