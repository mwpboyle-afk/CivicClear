import { NextRequest, NextResponse } from "next/server";
import { promises as fs } from "fs";
import path from "path";
import { analyzeBudgetPdf, AnalyzeError } from "@/lib/analyze";

export const runtime = "nodejs";
export const maxDuration = 60;

const SAMPLES_DIR = path.join(process.cwd(), "public", "samples");

type Manifest = { samples?: Array<{ file?: string; label?: string }> };

/** The set of filenames the manifest allows, to prevent arbitrary file reads. */
async function allowedFiles(): Promise<Set<string>> {
  try {
    const raw = await fs.readFile(
      path.join(SAMPLES_DIR, "manifest.json"),
      "utf8",
    );
    const manifest = JSON.parse(raw) as Manifest;
    const files = (manifest.samples ?? [])
      .map((s) => s.file)
      .filter((f): f is string => typeof f === "string");
    return new Set(files);
  } catch {
    return new Set();
  }
}

/**
 * Analyze a bundled sample PDF read directly from disk on the server. This
 * avoids round-tripping the file through the browser, which would hit Vercel's
 * 4.5 MB request-body limit for the larger samples.
 */
export async function POST(req: NextRequest) {
  let file: string;
  try {
    const body = (await req.json()) as { file?: unknown };
    file = typeof body.file === "string" ? body.file : "";
  } catch {
    return NextResponse.json({ error: "Invalid request body." }, { status: 400 });
  }

  if (!file) {
    return NextResponse.json(
      { error: "No sample file was specified." },
      { status: 400 },
    );
  }

  // Only allow exact filenames listed in the manifest. Reject anything with a
  // path separator or traversal, and anything not on the allow-list.
  const base = path.basename(file);
  const allowed = await allowedFiles();
  if (base !== file || !allowed.has(file)) {
    return NextResponse.json(
      { error: "Unknown sample file." },
      { status: 400 },
    );
  }

  let buffer: Buffer;
  try {
    buffer = await fs.readFile(path.join(SAMPLES_DIR, base));
  } catch {
    return NextResponse.json(
      { error: "The sample file could not be read." },
      { status: 404 },
    );
  }

  try {
    const result = await analyzeBudgetPdf(buffer);
    return NextResponse.json(result);
  } catch (err) {
    if (err instanceof AnalyzeError) {
      return NextResponse.json({ error: err.message }, { status: err.status });
    }
    return NextResponse.json(
      { error: "Something went wrong analyzing the sample." },
      { status: 500 },
    );
  }
}
