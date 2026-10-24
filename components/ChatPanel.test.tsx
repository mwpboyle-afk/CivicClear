import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import ChatPanel from "./ChatPanel";
import { sampleBudget } from "@/lib/__fixtures__/budget";

const noop = () => {};
const emptyPinned = new Set<string>();

describe("ChatPanel", () => {
  beforeEach(() => {
    vi.restoreAllMocks();
  });
  afterEach(() => {
    vi.restoreAllMocks();
  });

  it("shows suggestion prompts before any messages", () => {
    render(
      <ChatPanel
        budget={sampleBudget}
        text="raw"
        onPin={noop}
        pinnedIds={emptyPinned}
      />,
    );
    expect(
      screen.getByRole("button", { name: /Suggestions/i }),
    ).toBeInTheDocument();
    expect(
      screen.getByRole("button", { name: /What is the total budget\?/i }),
    ).toBeInTheDocument();
  });

  it("collapses and expands the suggestions", () => {
    render(
      <ChatPanel
        budget={sampleBudget}
        text="raw"
        onPin={noop}
        pinnedIds={emptyPinned}
      />,
    );
    const toggle = screen.getByRole("button", { name: /Suggestions/i });
    // Starts open.
    expect(
      screen.getByRole("button", { name: /What is the total budget\?/i }),
    ).toBeInTheDocument();
    // Collapse hides the chips.
    fireEvent.click(toggle);
    expect(
      screen.queryByRole("button", { name: /What is the total budget\?/i }),
    ).not.toBeInTheDocument();
    // Expand shows them again.
    fireEvent.click(toggle);
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

    render(
      <ChatPanel
        budget={sampleBudget}
        text="raw budget text"
        onPin={noop}
        pinnedIds={emptyPinned}
      />,
    );

    const input = screen.getByLabelText(/Ask a question about the budget/i);
    fireEvent.change(input, { target: { value: "What is the total?" } });
    fireEvent.click(screen.getByRole("button", { name: /^Ask$/i }));

    expect(screen.getByText("What is the total?")).toBeInTheDocument();

    await waitFor(() =>
      expect(screen.getByText("The total budget is $95M.")).toBeInTheDocument(),
    );

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

    render(
      <ChatPanel
        budget={sampleBudget}
        text="raw"
        onPin={noop}
        pinnedIds={emptyPinned}
      />,
    );
    const input = screen.getByLabelText(/Ask a question about the budget/i);
    fireEvent.change(input, { target: { value: "hi" } });
    fireEvent.click(screen.getByRole("button", { name: /^Ask$/i }));

    await waitFor(() =>
      expect(screen.getByRole("alert")).toHaveTextContent("Model unavailable."),
    );
  });

  it("offers a Pin button on an answer and calls onPin with the derived section", async () => {
    const fetchMock = vi.fn().mockResolvedValue({
      ok: true,
      json: async () => ({ answer: "The levy rises 2.5% annually." }),
    });
    vi.stubGlobal("fetch", fetchMock);
    const onPin = vi.fn();

    render(
      <ChatPanel
        budget={sampleBudget}
        text="raw"
        onPin={onPin}
        pinnedIds={emptyPinned}
      />,
    );

    const input = screen.getByLabelText(/Ask a question about the budget/i);
    fireEvent.change(input, {
      target: { value: "Is there anything about taxes?" },
    });
    fireEvent.click(screen.getByRole("button", { name: /^Ask$/i }));

    await waitFor(() =>
      expect(
        screen.getByText("The levy rises 2.5% annually."),
      ).toBeInTheDocument(),
    );

    fireEvent.click(screen.getByRole("button", { name: /Pin as section/i }));

    expect(onPin).toHaveBeenCalledOnce();
    const section = onPin.mock.calls[0][0];
    expect(section.title).toBe("Taxes");
    expect(section.answer).toBe("The levy rises 2.5% annually.");
    expect(section.question).toBe("Is there anything about taxes?");
  });

  it("shows the remaining-questions counter", () => {
    render(
      <ChatPanel
        budget={sampleBudget}
        text="raw"
        onPin={noop}
        pinnedIds={emptyPinned}
      />,
    );
    expect(screen.getByText(/20 questions left this session/i)).toBeInTheDocument();
  });
});
