import { describe, it, expect, vi, beforeEach } from "vitest";
import { renderHook, act } from "@testing-library/react";
import { useAudioContext } from "@/hooks/useAudioContext";

describe("useAudioContext", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("should initialize with default state", () => {
    const { result } = renderHook(() => useAudioContext());

    expect(result.current.audioContext).toBeNull();
    expect(result.current.analyser).toBeNull();
    expect(result.current.isInitialized).toBe(false);
    expect(result.current.error).toBeNull();
  });

  it("should initialize audio context successfully", async () => {
    const { result } = renderHook(() => useAudioContext());

    await act(async () => {
      await result.current.initializeAudioContext();
    });

    expect(result.current.audioContext).not.toBeNull();
    expect(result.current.analyser).not.toBeNull();
    expect(result.current.isInitialized).toBe(true);
    expect(result.current.error).toBeNull();
  });

  it("should return existing context if already initialized", async () => {
    const { result } = renderHook(() => useAudioContext());

    let context1: AudioContext | undefined;
    let context2: AudioContext | undefined;

    await act(async () => {
      context1 = await result.current.initializeAudioContext();
    });

    await act(async () => {
      context2 = await result.current.initializeAudioContext();
    });

    expect(context1).toBe(context2);
  });

  it("should connect media stream source", async () => {
    const { result } = renderHook(() => useAudioContext());

    await act(async () => {
      await result.current.initializeAudioContext();
    });

    const mockStream = new MediaStream();
    let analyser: AnalyserNode | null = null;

    act(() => {
      analyser = result.current.connectSource(mockStream);
    });

    expect(analyser).not.toBeNull();
  });

  it("should return null when connecting source without initialization", () => {
    const { result } = renderHook(() => useAudioContext());

    const mockStream = new MediaStream();
    let analyser: AnalyserNode | null = null;

    act(() => {
      analyser = result.current.connectSource(mockStream);
    });

    expect(analyser).toBeNull();
  });

  it("should cleanup resources", async () => {
    const { result } = renderHook(() => useAudioContext());

    await act(async () => {
      await result.current.initializeAudioContext();
    });

    expect(result.current.isInitialized).toBe(true);

    act(() => {
      result.current.cleanup();
    });

    expect(result.current.audioContext).toBeNull();
    expect(result.current.analyser).toBeNull();
    expect(result.current.isInitialized).toBe(false);
  });

  it("should configure analyser with correct defaults", async () => {
    const { result } = renderHook(() => useAudioContext());

    await act(async () => {
      await result.current.initializeAudioContext();
    });

    const analyser = result.current.analyser;
    expect(analyser).not.toBeNull();
    if (analyser) {
      expect(analyser.fftSize).toBe(2048);
      expect(analyser.smoothingTimeConstant).toBe(0.8);
      expect(analyser.minDecibels).toBe(-90);
      expect(analyser.maxDecibels).toBe(-10);
    }
  });
});
