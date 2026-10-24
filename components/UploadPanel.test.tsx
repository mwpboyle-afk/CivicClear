import { describe, it, expect, vi } from "vitest";
import { render, screen, fireEvent } from "@testing-library/react";
import UploadPanel from "./UploadPanel";

describe("UploadPanel", () => {
  it("calls onAnalyze with the chosen file", () => {
    const onAnalyze = vi.fn();
    const { container } = render(
      <UploadPanel onAnalyze={onAnalyze} loading={false} error={null} />,
    );
    const input = container.querySelector(
      'input[type="file"]',
    ) as HTMLInputElement;
    const file = new File([new Uint8Array([1, 2, 3])], "budget.pdf", {
      type: "application/pdf",
    });
    fireEvent.change(input, { target: { files: [file] } });
    expect(onAnalyze).toHaveBeenCalledOnce();
    expect(onAnalyze.mock.calls[0][0]).toBe(file);
  });

  it("shows a loading indicator while analyzing", () => {
    render(<UploadPanel onAnalyze={vi.fn()} loading={true} error={null} />);
    expect(screen.getByRole("status")).toBeInTheDocument();
    expect(screen.getByText(/Analyzing the budget/i)).toBeInTheDocument();
  });

  it("displays an error message", () => {
    render(<UploadPanel onAnalyze={vi.fn()} loading={false} error="Bad PDF" />);
    expect(screen.getByRole("alert")).toHaveTextContent("Bad PDF");
  });

  it("hides the sample button when no samples are available", () => {
    render(<UploadPanel onAnalyze={vi.fn()} loading={false} error={null} />);
    expect(
      screen.queryByRole("button", { name: /Try a sample budget/i }),
    ).not.toBeInTheDocument();
  });

  it("shows the sample button and triggers a random sample", () => {
    const onTrySample = vi.fn();
    render(
      <UploadPanel
        onAnalyze={vi.fn()}
        onTrySample={onTrySample}
        sampleCount={3}
        loading={false}
        error={null}
      />,
    );
    const btn = screen.getByRole("button", { name: /Try a sample budget/i });
    expect(btn).toHaveTextContent("3 available");
    fireEvent.click(btn);
    expect(onTrySample).toHaveBeenCalledOnce();
  });
});
