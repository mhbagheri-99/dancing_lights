import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { renderHook } from "@testing-library/react";
import { useAnimationFrame } from "@/hooks/useAnimationFrame";

describe("useAnimationFrame", () => {
  let rafSpy: ReturnType<typeof vi.spyOn>;
  let cafSpy: ReturnType<typeof vi.spyOn>;

  beforeEach(() => {
    vi.useFakeTimers();
    // Create proper spies
    rafSpy = vi.spyOn(global, "requestAnimationFrame");
    cafSpy = vi.spyOn(global, "cancelAnimationFrame");
  });

  afterEach(() => {
    vi.useRealTimers();
    vi.restoreAllMocks();
  });

  it("should request animation frame when active", () => {
    const callback = vi.fn();
    renderHook(() => useAnimationFrame(callback, true));

    expect(rafSpy).toHaveBeenCalled();
  });

  it("should not request animation frame when inactive", () => {
    rafSpy.mockClear();
    const callback = vi.fn();
    renderHook(() => useAnimationFrame(callback, false));

    expect(rafSpy).not.toHaveBeenCalled();
  });

  it("should call callback with delta time", async () => {
    const callback = vi.fn();
    renderHook(() => useAnimationFrame(callback, true));

    // Advance timers to trigger RAF callbacks
    await vi.advanceTimersByTimeAsync(16); // First frame
    await vi.advanceTimersByTimeAsync(16); // Second frame (delta time calculated)

    expect(callback).toHaveBeenCalled();
  });

  it("should cancel animation frame on unmount", () => {
    const callback = vi.fn();
    const { unmount } = renderHook(() => useAnimationFrame(callback, true));

    unmount();

    expect(cafSpy).toHaveBeenCalled();
  });

  it("should cancel and restart when isActive changes", async () => {
    const callback = vi.fn();
    const { rerender } = renderHook(
      ({ isActive }) => useAnimationFrame(callback, isActive),
      { initialProps: { isActive: true } }
    );

    // Disable
    rerender({ isActive: false });
    expect(cafSpy).toHaveBeenCalled();

    // Re-enable
    cafSpy.mockClear();
    rafSpy.mockClear();
    rerender({ isActive: true });
    expect(rafSpy).toHaveBeenCalled();
  });

  it("should use latest callback version", async () => {
    const callback1 = vi.fn();
    const callback2 = vi.fn();

    const { rerender } = renderHook(
      ({ callback }) => useAnimationFrame(callback, true),
      { initialProps: { callback: callback1 } }
    );

    // Update callback
    rerender({ callback: callback2 });

    // Advance timers
    await vi.advanceTimersByTimeAsync(32);

    // The new callback should be called
    expect(callback2).toHaveBeenCalled();
  });

  it("should continue animation loop while active", async () => {
    const callback = vi.fn();
    renderHook(() => useAnimationFrame(callback, true));

    const initialCalls = rafSpy.mock.calls.length;

    await vi.advanceTimersByTimeAsync(16);
    await vi.advanceTimersByTimeAsync(16);
    await vi.advanceTimersByTimeAsync(16);

    const finalCalls = rafSpy.mock.calls.length;

    // Should have called RAF multiple times
    expect(finalCalls).toBeGreaterThan(initialCalls);
  });
});
