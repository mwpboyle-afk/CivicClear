import { describe, it, expect, vi } from "vitest";
import { render, screen, fireEvent } from "@testing-library/react";
import UploadPanel from "./UploadPanel";

describe("UploadPanel", () => {
  it("shows the sample button and triggers analysis", () => {
    const onAnalyzeSample = vi.fn();
    render(
      <UploadPanel
        onAnalyze={vi.fn()}
        onAnalyzeSample={onAnalyzeSample}
        loading={false}
        error={null}
      />,
    );
    const sampleBtn = screen.getByRole("button", {
      name: /Load Amherst FY27 sample/i,
    });
    fireEvent.click(sampleBtn);
    expect(onAnalyzeSample).toHaveBeenCalledOnce();
  });

  it("shows a loading indicator while analyzing", () => {
    render(
      <UploadPanel
        onAnalyze={vi.fn()}
        onAnalyzeSample={vi.fn()}
        loading={true}
        error={null}
      />,
    );
    expect(screen.getByRole("status")).toBeInTheDocument();
    expect(screen.getByText(/Analyzing the budget/i)).toBeInTheDocument();
  });

  it("displays an error message", () => {
    render(
      <UploadPanel
        onAnalyze={vi.fn()}
        onAnalyzeSample={vi.fn()}
        loading={false}
        error="Bad PDF"
      />,
    );
    expect(screen.getByRole("alert")).toHaveTextContent("Bad PDF");
  });
});
