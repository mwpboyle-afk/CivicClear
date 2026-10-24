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
  it("renders nothing when empty", () => {
    const { container } = render(
      <PinnedSections sections={[]} onRemove={vi.fn()} />,
    );
    expect(container.firstChild).toBeNull();
  });

  it("renders pinned cards with title, question, and answer", () => {
    render(<PinnedSections sections={sections} onRemove={vi.fn()} />);
    expect(screen.getByText("Your Questions")).toBeInTheDocument();
    expect(screen.getByRole("heading", { name: "Taxes" })).toBeInTheDocument();
    expect(screen.getByText(/rises 2.5% annually/i)).toBeInTheDocument();
  });

  it("calls onRemove with the section id", () => {
    const onRemove = vi.fn();
    render(<PinnedSections sections={sections} onRemove={onRemove} />);
    fireEvent.click(screen.getByRole("button", { name: /Remove Taxes section/i }));
    expect(onRemove).toHaveBeenCalledWith("pin-taxes");
  });
});
