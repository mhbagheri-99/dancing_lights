import { describe, it, expect, vi } from "vitest";
import { render, screen, fireEvent } from "@testing-library/react";
import { MicrophoneButton } from "@/components/MicrophoneButton";
import type { MicrophoneError, PermissionState } from "@/hooks/useMicrophone";

describe("MicrophoneButton", () => {
  const defaultProps = {
    isActive: false,
    isRequesting: false,
    permissionState: "prompt" as PermissionState,
    error: null as MicrophoneError | null,
    onClick: vi.fn(),
  };

  it("should render 'Start' button in initial state", () => {
    render(<MicrophoneButton {...defaultProps} />);

    expect(screen.getByText("Start")).toBeInTheDocument();
    expect(screen.getByRole("button")).not.toBeDisabled();
  });

  it("should render 'Stop' button when active", () => {
    render(<MicrophoneButton {...defaultProps} isActive={true} />);

    expect(screen.getByText("Stop")).toBeInTheDocument();
  });

  it("should render 'Requesting...' when requesting", () => {
    render(<MicrophoneButton {...defaultProps} isRequesting={true} />);

    expect(screen.getByText("Requesting...")).toBeInTheDocument();
    expect(screen.getByRole("button")).toBeDisabled();
  });

  it("should render 'Blocked' when permission denied", () => {
    render(<MicrophoneButton {...defaultProps} permissionState="denied" />);

    expect(screen.getByText("Blocked")).toBeInTheDocument();
    expect(screen.getByRole("button")).toBeDisabled();
  });

  it("should render 'Unavailable' when microphone unavailable", () => {
    render(<MicrophoneButton {...defaultProps} permissionState="unavailable" />);

    expect(screen.getByText("Unavailable")).toBeInTheDocument();
    expect(screen.getByRole("button")).toBeDisabled();
  });

  it("should call onClick when clicked", () => {
    const onClick = vi.fn();
    render(<MicrophoneButton {...defaultProps} onClick={onClick} />);

    fireEvent.click(screen.getByRole("button"));

    expect(onClick).toHaveBeenCalledTimes(1);
  });

  it("should not call onClick when disabled", () => {
    const onClick = vi.fn();
    render(<MicrophoneButton {...defaultProps} onClick={onClick} isRequesting={true} />);

    fireEvent.click(screen.getByRole("button"));

    expect(onClick).not.toHaveBeenCalled();
  });

  it("should display error message when error is present", () => {
    const error: MicrophoneError = {
      type: "NotAllowedError",
      message: "Microphone access denied",
    };

    render(<MicrophoneButton {...defaultProps} error={error} />);

    expect(screen.getByText("Microphone access denied")).toBeInTheDocument();
  });

  it("should have correct accessibility label when inactive", () => {
    render(<MicrophoneButton {...defaultProps} />);

    expect(screen.getByRole("button")).toHaveAttribute("aria-label", "Start microphone");
  });

  it("should have correct accessibility label when active", () => {
    render(<MicrophoneButton {...defaultProps} isActive={true} />);

    expect(screen.getByRole("button")).toHaveAttribute("aria-label", "Stop microphone");
  });

  it("should apply pulse animation class when active", () => {
    render(<MicrophoneButton {...defaultProps} isActive={true} />);

    const button = screen.getByRole("button");
    expect(button.className).toContain("pulse-glow");
  });

  it("should apply error styling when denied", () => {
    render(<MicrophoneButton {...defaultProps} permissionState="denied" />);

    const button = screen.getByRole("button");
    expect(button.className).toContain("red");
  });

  it("should show loading spinner when requesting", () => {
    render(<MicrophoneButton {...defaultProps} isRequesting={true} />);

    // The button should contain an SVG with animate-spin class
    const button = screen.getByRole("button");
    const svg = button.querySelector("svg");
    expect(svg?.className.baseVal).toContain("animate-spin");
  });

  it("should render microphone icon in different states", () => {
    const { rerender } = render(<MicrophoneButton {...defaultProps} />);

    // Check SVG is present
    let button = screen.getByRole("button");
    expect(button.querySelector("svg")).toBeInTheDocument();

    // Active state
    rerender(<MicrophoneButton {...defaultProps} isActive={true} />);
    button = screen.getByRole("button");
    expect(button.querySelector("svg")).toBeInTheDocument();

    // Denied state
    rerender(<MicrophoneButton {...defaultProps} permissionState="denied" />);
    button = screen.getByRole("button");
    expect(button.querySelector("svg")).toBeInTheDocument();
  });
});
