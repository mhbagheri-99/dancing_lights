import { describe, it, expect, vi, beforeEach } from "vitest";
import { renderHook, act } from "@testing-library/react";
import { useAnalyser } from "@/hooks/useAnalyser";

// Create a mock analyser for testing
function createMockAnalyser(): AnalyserNode {
  return {
    fftSize: 2048,
    frequencyBinCount: 1024,
    smoothingTimeConstant: 0.8,
    minDecibels: -90,
    maxDecibels: -10,
    connect: vi.fn(),
    disconnect: vi.fn(),
    getByteFrequencyData: vi.fn((array: Uint8Array) => {
      for (let i = 0; i < array.length; i++) {
        array[i] = i % 256;
      }
    }),
    getByteTimeDomainData: vi.fn((array: Uint8Array) => {
      for (let i = 0; i < array.length; i++) {
        array[i] = 128 + Math.floor(Math.sin(i * 0.1) * 50);
      }
    }),
  } as unknown as AnalyserNode;
}

describe("useAnalyser", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("should initialize with null analyser", () => {
    const { result } = renderHook(() => useAnalyser());

    const data = result.current.getData();

    expect(data.frequencyData.length).toBe(0);
    expect(data.timeDomainData.length).toBe(0);
    expect(data.averageFrequency).toBe(0);
    expect(data.peakFrequency).toBe(0);
  });

  it("should set analyser and pre-allocate arrays", () => {
    const { result } = renderHook(() => useAnalyser());
    const mockAnalyser = createMockAnalyser();

    act(() => {
      result.current.setAnalyser(mockAnalyser);
    });

    const data = result.current.getData();

    // Should have pre-allocated arrays based on analyser config
    expect(data.frequencyData.length).toBe(mockAnalyser.frequencyBinCount);
    expect(data.timeDomainData.length).toBe(mockAnalyser.fftSize);
  });

  it("should get frequency data from analyser", () => {
    const { result } = renderHook(() => useAnalyser());
    const mockAnalyser = createMockAnalyser();

    act(() => {
      result.current.setAnalyser(mockAnalyser);
    });

    const data = result.current.getData();

    expect(mockAnalyser.getByteFrequencyData).toHaveBeenCalled();
    expect(data.frequencyData.length).toBeGreaterThan(0);
  });

  it("should get time domain data from analyser", () => {
    const { result } = renderHook(() => useAnalyser());
    const mockAnalyser = createMockAnalyser();

    act(() => {
      result.current.setAnalyser(mockAnalyser);
    });

    const data = result.current.getData();

    expect(mockAnalyser.getByteTimeDomainData).toHaveBeenCalled();
    expect(data.timeDomainData.length).toBeGreaterThan(0);
  });

  it("should calculate average frequency", () => {
    const { result } = renderHook(() => useAnalyser());
    const mockAnalyser = createMockAnalyser();

    act(() => {
      result.current.setAnalyser(mockAnalyser);
    });

    const data = result.current.getData();

    expect(data.averageFrequency).toBeGreaterThanOrEqual(0);
    expect(data.averageFrequency).toBeLessThanOrEqual(1);
  });

  it("should calculate peak frequency index", () => {
    const { result } = renderHook(() => useAnalyser());
    const mockAnalyser = createMockAnalyser();

    act(() => {
      result.current.setAnalyser(mockAnalyser);
    });

    const data = result.current.getData();

    expect(data.peakFrequency).toBeGreaterThanOrEqual(0);
    expect(data.peakFrequency).toBeLessThan(mockAnalyser.frequencyBinCount);
  });

  it("should handle null analyser after being set", () => {
    const { result } = renderHook(() => useAnalyser());
    const mockAnalyser = createMockAnalyser();

    act(() => {
      result.current.setAnalyser(mockAnalyser);
    });

    act(() => {
      result.current.setAnalyser(null);
    });

    const data = result.current.getData();

    expect(data.frequencyData.length).toBe(0);
    expect(data.timeDomainData.length).toBe(0);
  });

  it("should reuse the same typed arrays for performance", () => {
    const { result } = renderHook(() => useAnalyser());
    const mockAnalyser = createMockAnalyser();

    act(() => {
      result.current.setAnalyser(mockAnalyser);
    });

    const data1 = result.current.getData();
    const data2 = result.current.getData();

    // Same underlying arrays should be used
    expect(data1.frequencyData).toBe(data2.frequencyData);
    expect(data1.timeDomainData).toBe(data2.timeDomainData);
  });
});
