// @vitest-environment node
import { describe, it, expect, vi, beforeEach } from "vitest";

// Mock the shared analyzer and the fs/manifest layer.
vi.mock("@/lib/analyze", () => ({
  AnalyzeError: class AnalyzeError extends Error {
    status: number;
    constructor(message: string, status: number) {
      super(message);
      this.status = status;
    }
  },
  analyzeBudgetPdf: vi.fn(),
}));

vi.mock("fs", () => ({
  promises: {
    readFile: vi.fn(),
  },
}));

import { promises as fs } from "fs";
import { analyzeBudgetPdf } from "@/lib/analyze";
import { POST } from "./route";

const MANIFEST = JSON.stringify({
  samples: [{ file: "town-operating-budget-schedule-iii.pdf", label: "x" }],
});

function makeRequest(body: unknown): Request {
  return new Request("http://localhost/api/analyze-sample", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });
}

describe("POST /api/analyze-sample", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    // manifest read returns the allow-list; PDF read returns bytes.
    (fs.readFile as any).mockImplementation((p: string) =>
      String(p).endsWith("manifest.json")
        ? Promise.resolve(MANIFEST)
        : Promise.resolve(Buffer.from("%PDF-1.4 fake")),
    );
  });

  it("analyzes a manifest-listed sample from disk", async () => {
    (analyzeBudgetPdf as any).mockResolvedValue({
      budget: { municipality: "Town" },
      text: "t",
      scanned: false,
    });
    const res = await POST(
      makeRequest({ file: "town-operating-budget-schedule-iii.pdf" }) as any,
    );
    expect(res.status).toBe(200);
    expect(analyzeBudgetPdf).toHaveBeenCalledOnce();
    const body = await res.json();
    expect(body.budget.municipality).toBe("Town");
  });

  it("rejects a filename not in the manifest", async () => {
    const res = await POST(makeRequest({ file: "secrets.pdf" }) as any);
    expect(res.status).toBe(400);
    expect(analyzeBudgetPdf).not.toHaveBeenCalled();
  });

  it("rejects path traversal attempts", async () => {
    const res = await POST(
      makeRequest({ file: "../../.env.local" }) as any,
    );
    expect(res.status).toBe(400);
    expect(analyzeBudgetPdf).not.toHaveBeenCalled();
  });

  it("returns 400 when no file is specified", async () => {
    const res = await POST(makeRequest({}) as any);
    expect(res.status).toBe(400);
  });
});
