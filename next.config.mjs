/** @type {import('next').NextConfig} */
const nextConfig = {
  // pdfjs-dist must run in the Node runtime (not edge). Mark it external so
  // Next doesn't try to bundle its internals (fonts, cmaps, worker).
  experimental: {
    serverComponentsExternalPackages: ["pdfjs-dist"],
    // Ensure the pdfjs worker file is traced into the serverless function
    // bundle on Vercel. Without this, the API route fails at runtime with
    // "Cannot find module pdf.worker.mjs".
    outputFileTracingIncludes: {
      "/api/analyze": ["./node_modules/pdfjs-dist/legacy/build/pdf.worker.mjs"],
      "/api/analyze-sample": [
        "./node_modules/pdfjs-dist/legacy/build/pdf.worker.mjs",
      ],
    },
  },
};

export default nextConfig;
