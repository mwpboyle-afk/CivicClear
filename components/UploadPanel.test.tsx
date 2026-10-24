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

  it("shows no sample chooser when no samples are available", () => {
    render(<UploadPanel onAnalyze={vi.fn()} loading={false} error={null} />);
    expect(screen.queryByText(/try a sample budget/i)).not.toBeInTheDocument();
  });

  it("lists each sample and analyzes the chosen one", () => {
    const onAnalyzeSample = vi.fn();
    const samples = [
      { file: "hadley.pdf", label: "Town of Hadley, MA" },
      { file: "winchester.pdf", label: "Town of Winchester, MA" },
    ];
    render(
      <UploadPanel
        onAnalyze={vi.fn()}
        samples={samples}
        onAnalyzeSample={onAnalyzeSample}
        loading={false}
        error={null}
      />,
    );
    // Each sample shows as its own button.
    expect(
      screen.getByRole("button", { name: /Town of Hadley, MA/i }),
    ).toBeInTheDocument();
    const winchester = screen.getByRole("button", {
      name: /Town of Winchester, MA/i,
    });
    fireEvent.click(winchester);
    expect(onAnalyzeSample).toHaveBeenCalledWith(samples[1]);
  });
});
