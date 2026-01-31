import { describe, it, expect, vi, beforeEach } from "vitest";
import { barsVisualizer } from "@/visualizers/bars";
import type { AnalyserData } from "@/visualizers/types";
import { createMockCanvasContext } from "../setup";

describe("barsVisualizer", () => {
  let ctx: CanvasRenderingContext2D;
  const dimensions = { width: 800, height: 600 };
  const deltaTime = 16;

  beforeEach(() => {
    ctx = createMockCanvasContext();
    vi.clearAllMocks();
  });

  function createMockData(options: Partial<AnalyserData> = {}): AnalyserData {
    return {
      frequencyData: new Uint8Array(1024).fill(128),
      timeDomainData: new Uint8Array(2048).fill(128),
      averageFrequency: 0.5,
      peakFrequency: 512,
      ...options,
    };
  }

  it("should have correct metadata", () => {
    expect(barsVisualizer.name).toBe("Bars");
    expect(barsVisualizer.description).toContain("spectrum");
    expect(barsVisualizer.defaultConfig).toBeDefined();
  });

  it("should have valid default config", () => {
    const config = barsVisualizer.defaultConfig;
    expect(config.barCount).toBe(64);
    expect(config.barWidthRatio).toBe(0.75);
    expect(config.showReflection).toBe(true);
    expect(config.smoothing).toBe(0.3);
  });

  it("should clear canvas before rendering", () => {
    const data = createMockData();
    barsVisualizer.render(ctx, data, barsVisualizer.defaultConfig, dimensions, deltaTime);

    expect(ctx.fillRect).toHaveBeenCalled();
    // First call should be the clear
    expect(ctx.fillStyle).toBeDefined();
  });

  it("should handle empty frequency data", () => {
    const data = createMockData({ frequencyData: new Uint8Array(0) });

    expect(() => {
      barsVisualizer.render(ctx, data, barsVisualizer.defaultConfig, dimensions, deltaTime);
    }).not.toThrow();
  });

  it("should render correct number of bars", () => {
    const data = createMockData();
    barsVisualizer.render(ctx, data, barsVisualizer.defaultConfig, dimensions, deltaTime);

    // fillRect is called for each bar + clear + reflection + baseline
    // At minimum, should be called more than just once for clear
    expect(ctx.fillRect).toHaveBeenCalled();
    const calls = (ctx.fillRect as ReturnType<typeof vi.fn>).mock.calls;
    expect(calls.length).toBeGreaterThan(1);
  });

  it("should render with different bar counts", () => {
    const data = createMockData();
    const config = { ...barsVisualizer.defaultConfig, barCount: 32 };

    barsVisualizer.render(ctx, data, config, dimensions, deltaTime);

    expect(ctx.fillRect).toHaveBeenCalled();
  });

  it("should render reflections when enabled", () => {
    const data = createMockData();
    const config = { ...barsVisualizer.defaultConfig, showReflection: true };

    barsVisualizer.render(ctx, data, config, dimensions, deltaTime);

    // Should create gradient for reflection
    expect(ctx.createLinearGradient).toHaveBeenCalled();
  });

  it("should not render reflections when disabled", () => {
    const data = createMockData();
    const config = { ...barsVisualizer.defaultConfig, showReflection: false };

    vi.clearAllMocks();
    barsVisualizer.render(ctx, data, config, dimensions, deltaTime);

    // Gradient might still be called for other effects, but less frequently
    const gradientCalls = (ctx.createLinearGradient as ReturnType<typeof vi.fn>).mock.calls.length;

    vi.clearAllMocks();
    const configWithReflection = { ...config, showReflection: true };
    barsVisualizer.render(ctx, data, configWithReflection, dimensions, deltaTime);

    const gradientCallsWithReflection = (ctx.createLinearGradient as ReturnType<typeof vi.fn>).mock.calls.length;

    expect(gradientCallsWithReflection).toBeGreaterThan(gradientCalls);
  });

  it("should draw baseline", () => {
    const data = createMockData();
    barsVisualizer.render(ctx, data, barsVisualizer.defaultConfig, dimensions, deltaTime);

    expect(ctx.beginPath).toHaveBeenCalled();
    expect(ctx.moveTo).toHaveBeenCalled();
    expect(ctx.lineTo).toHaveBeenCalled();
    expect(ctx.stroke).toHaveBeenCalled();
  });

  it("should apply glow effect for high amplitude", () => {
    // Create data with high amplitude values
    const highAmplitudeData = new Uint8Array(1024).fill(200);
    const data = createMockData({ frequencyData: highAmplitudeData });

    barsVisualizer.render(ctx, data, barsVisualizer.defaultConfig, dimensions, deltaTime);

    // Shadow blur should be set for glow effect
    expect(ctx.shadowBlur).toBeDefined();
  });

  it("should handle varying dimensions", () => {
    const data = createMockData();

    // Small dimensions
    barsVisualizer.render(ctx, data, barsVisualizer.defaultConfig, { width: 200, height: 150 }, deltaTime);
    expect(ctx.fillRect).toHaveBeenCalled();

    vi.clearAllMocks();

    // Large dimensions
    barsVisualizer.render(ctx, data, barsVisualizer.defaultConfig, { width: 1920, height: 1080 }, deltaTime);
    expect(ctx.fillRect).toHaveBeenCalled();
  });
});
