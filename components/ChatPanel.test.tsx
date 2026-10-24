import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import ChatPanel from "./ChatPanel";
import { sampleBudget } from "@/lib/__fixtures__/budget";

describe("ChatPanel", () => {
  beforeEach(() => {
    vi.restoreAllMocks();
  });
  afterEach(() => {
    vi.restoreAllMocks();
  });

  it("shows suggestion prompts before any messages", () => {
    render(<ChatPanel budget={sampleBudget} text="raw" />);
    expect(screen.getByText(/Try asking:/i)).toBeInTheDocument();
    expect(
      screen.getByRole("button", { name: /What is the total budget\?/i }),
    ).toBeInTheDocument();
  });

  it("submits a question and renders the grounded answer", async () => {
    const fetchMock = vi.fn().mockResolvedValue({
      ok: true,
      json: async () => ({ answer: "The total budget is $95M." }),
    });
    vi.stubGlobal("fetch", fetchMock);

    render(<ChatPanel budget={sampleBudget} text="raw budget text" />);

    const input = screen.getByLabelText(/Ask a question about the budget/i);
    fireEvent.change(input, { target: { value: "What is the total?" } });
    fireEvent.click(screen.getByRole("button", { name: /^Ask$/i }));

    // User message appears immediately.
    expect(screen.getByText("What is the total?")).toBeInTheDocument();

    // Answer appears after the mocked fetch resolves.
    await waitFor(() =>
      expect(screen.getByText("The total budget is $95M.")).toBeInTheDocument(),
    );

    // The request carried the question and budget context.
    expect(fetchMock).toHaveBeenCalledWith(
      "/api/ask",
      expect.objectContaining({ method: "POST" }),
    );
    const bodySent = JSON.parse(fetchMock.mock.calls[0][1].body);
    expect(bodySent.question).toBe("What is the total?");
    expect(bodySent.text).toBe("raw budget text");
  });

  it("shows an error when the request fails", async () => {
    const fetchMock = vi.fn().mockResolvedValue({
      ok: false,
      json: async () => ({ error: "Model unavailable." }),
    });
    vi.stubGlobal("fetch", fetchMock);

    render(<ChatPanel budget={sampleBudget} text="raw" />);
    const input = screen.getByLabelText(/Ask a question about the budget/i);
    fireEvent.change(input, { target: { value: "hi" } });
    fireEvent.click(screen.getByRole("button", { name: /^Ask$/i }));

    await waitFor(() =>
      expect(screen.getByRole("alert")).toHaveTextContent("Model unavailable."),
    );
  });
});
