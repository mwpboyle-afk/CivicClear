/** @type {import('next').NextConfig} */
const nextConfig = {
  // pdfjs-dist must run in the Node runtime (not edge). Mark it external so
  // Next doesn't try to bundle its internals (fonts, cmaps, worker).
  experimental: {
    serverComponentsExternalPackages: ["pdfjs-dist"],
  },
};

export default nextConfig;
