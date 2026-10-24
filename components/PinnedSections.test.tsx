import { describe, it, expect, vi } from "vitest";
import { render, screen, fireEvent } from "@testing-library/react";
import PinnedSections, { type PinnedSection } from "./PinnedSections";

const sections: PinnedSection[] = [
  {
    id: "pin-taxes",
    title: "Taxes",
    question: "Anything about taxes?",
    answer: "The levy rises 2.5% annually.",
  },
];

describe("PinnedSections", () => {
  it("shows an empty-state prompt and an Add button when empty", () => {
    render(<PinnedSections sections={[]} onChange={vi.fn()} />);
    expect(screen.getByText("Your Sections")).toBeInTheDocument();
    expect(
      screen.getByRole("button", { name: /Add section/i }),
    ).toBeInTheDocument();
    expect(screen.getByText(/to build your report/i)).toBeInTheDocument();
  });

  it("renders pinned cards with title, question, and answer", () => {
    render(<PinnedSections sections={sections} onChange={vi.fn()} />);
    expect(screen.getByRole("heading", { name: "Taxes" })).toBeInTheDocument();
    expect(screen.getByText(/rises 2.5% annually/i)).toBeInTheDocument();
  });

  it("removes a section via onChange", () => {
    const onChange = vi.fn();
    render(<PinnedSections sections={sections} onChange={onChange} />);
    fireEvent.click(screen.getByRole("button", { name: /Remove Taxes section/i }));
    expect(onChange).toHaveBeenCalledWith([]);
  });

  it("adds a blank custom section via onChange", () => {
    const onChange = vi.fn();
    render(<PinnedSections sections={sections} onChange={onChange} />);
    fireEvent.click(screen.getByRole("button", { name: /Add section/i }));
    const next = onChange.mock.calls[0][0];
    expect(next).toHaveLength(2);
    expect(next[1].title).toBe("New Section");
    expect(next[1].answer).toBe("");
  });

  it("edits a section's title and content", () => {
    const onChange = vi.fn();
    render(<PinnedSections sections={sections} onChange={onChange} />);
    // Enter edit mode.
    fireEvent.click(screen.getByRole("button", { name: /^Edit$/i }));
    const titleInput = screen.getByLabelText(/Section title/i);
    fireEvent.change(titleInput, { target: { value: "Tax Notes" } });
    expect(onChange).toHaveBeenCalledWith([
      expect.objectContaining({ id: "pin-taxes", title: "Tax Notes" }),
    ]);

    const contentInput = screen.getByLabelText(/Section content/i);
    fireEvent.change(contentInput, { target: { value: "Edited body" } });
    expect(onChange).toHaveBeenCalledWith([
      expect.objectContaining({ id: "pin-taxes", answer: "Edited body" }),
    ]);
  });
});
