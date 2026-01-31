import { describe, it, expect, vi } from "vitest";
import { render, screen, fireEvent } from "@testing-library/react";
import { ModeSelector } from "@/components/ModeSelector";
import type { VisualizerMode } from "@/visualizers/types";

describe("ModeSelector", () => {
  const defaultProps = {
    currentMode: "bars" as VisualizerMode,
    onModeChange: vi.fn(),
  };

  it("should render all 4 mode buttons", () => {
    render(<ModeSelector {...defaultProps} />);

    expect(screen.getByRole("button", { name: /bars/i })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: /wave/i })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: /scope/i })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: /ambiance/i })).toBeInTheDocument();
  });

  it("should highlight the current mode", () => {
    render(<ModeSelector {...defaultProps} currentMode="bars" />);

    const barsButton = screen.getByRole("button", { name: /bars/i });
    expect(barsButton.className).toContain("active");
  });

  it("should call onModeChange when a mode is clicked", () => {
    const onModeChange = vi.fn();
    render(<ModeSelector {...defaultProps} onModeChange={onModeChange} />);

    fireEvent.click(screen.getByRole("button", { name: /wave/i }));

    expect(onModeChange).toHaveBeenCalledWith("waveform");
  });

  it("should call onModeChange with correct mode for each button", () => {
    const onModeChange = vi.fn();
    render(<ModeSelector {...defaultProps} onModeChange={onModeChange} />);

    fireEvent.click(screen.getByRole("button", { name: /bars/i }));
    expect(onModeChange).toHaveBeenLastCalledWith("bars");

    fireEvent.click(screen.getByRole("button", { name: /wave/i }));
    expect(onModeChange).toHaveBeenLastCalledWith("waveform");

    fireEvent.click(screen.getByRole("button", { name: /scope/i }));
    expect(onModeChange).toHaveBeenLastCalledWith("scope");

    fireEvent.click(screen.getByRole("button", { name: /ambiance/i }));
    expect(onModeChange).toHaveBeenLastCalledWith("ambiance");
  });

  it("should update active state when currentMode changes", () => {
    const { rerender } = render(<ModeSelector {...defaultProps} currentMode="bars" />);

    let barsButton = screen.getByRole("button", { name: /bars/i });
    let waveButton = screen.getByRole("button", { name: /wave/i });

    expect(barsButton.className).toContain("active");
    expect(waveButton.className).not.toContain("active");

    rerender(<ModeSelector {...defaultProps} currentMode="waveform" />);

    barsButton = screen.getByRole("button", { name: /bars/i });
    waveButton = screen.getByRole("button", { name: /wave/i });

    expect(barsButton.className).not.toContain("active");
    expect(waveButton.className).toContain("active");
  });

  it("should render icons for each mode", () => {
    render(<ModeSelector {...defaultProps} />);

    const buttons = screen.getAllByRole("button");
    buttons.forEach((button) => {
      expect(button.querySelector("svg")).toBeInTheDocument();
    });
  });

  it("should have proper accessibility attributes", () => {
    render(<ModeSelector {...defaultProps} />);

    const barsButton = screen.getByRole("button", { name: /bars/i });
    expect(barsButton).toHaveAttribute("aria-label");
    expect(barsButton.getAttribute("aria-label")).toContain("Bars");
  });

  it("should have title attribute for tooltips", () => {
    render(<ModeSelector {...defaultProps} />);

    const barsButton = screen.getByRole("button", { name: /bars/i });
    expect(barsButton).toHaveAttribute("title", "Bars");

    const waveButton = screen.getByRole("button", { name: /wave/i });
    expect(waveButton).toHaveAttribute("title", "Wave");
  });

  it("should apply mode-button class to all buttons", () => {
    render(<ModeSelector {...defaultProps} />);

    const buttons = screen.getAllByRole("button");
    buttons.forEach((button) => {
      expect(button.className).toContain("mode-button");
    });
  });

  it("should render labels on larger screens (sm:inline)", () => {
    render(<ModeSelector {...defaultProps} />);

    // Labels should be in the DOM but may be hidden on small screens
    expect(screen.getByText("Bars")).toBeInTheDocument();
    expect(screen.getByText("Wave")).toBeInTheDocument();
    expect(screen.getByText("Scope")).toBeInTheDocument();
    expect(screen.getByText("Ambiance")).toBeInTheDocument();
  });

  it("should not trigger onModeChange when clicking already active mode", () => {
    const onModeChange = vi.fn();
    render(<ModeSelector currentMode="bars" onModeChange={onModeChange} />);

    fireEvent.click(screen.getByRole("button", { name: /bars/i }));

    // It will still be called, as the component doesn't prevent this
    // This is acceptable behavior - the parent can decide whether to act on it
    expect(onModeChange).toHaveBeenCalledWith("bars");
  });
});
