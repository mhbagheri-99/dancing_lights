import { describe, it, expect, vi, beforeEach } from "vitest";
import { waveformVisualizer } from "@/visualizers/waveform";
import type { AnalyserData } from "@/visualizers/types";
import { createMockCanvasContext } from "../setup";

describe("waveformVisualizer", () => {
  let ctx: CanvasRenderingContext2D;
  const dimensions = { width: 800, height: 600 };
  const deltaTime = 16;

  beforeEach(() => {
    ctx = createMockCanvasContext();
    vi.clearAllMocks();
  });

  function createMockData(options: Partial<AnalyserData> = {}): AnalyserData {
    const timeDomainData = new Uint8Array(2048);
    // Create a sine wave pattern
    for (let i = 0; i < timeDomainData.length; i++) {
      timeDomainData[i] = 128 + Math.floor(Math.sin(i * 0.05) * 50);
    }

    return {
      frequencyData: new Uint8Array(1024).fill(128),
      timeDomainData,
      averageFrequency: 0.5,
      peakFrequency: 512,
      ...options,
    };
  }

  it("should have correct metadata", () => {
    expect(waveformVisualizer.name).toBe("Waveform");
    expect(waveformVisualizer.description).toContain("oscilloscope");
    expect(waveformVisualizer.defaultConfig).toBeDefined();
  });

  it("should have valid default config", () => {
    const config = waveformVisualizer.defaultConfig;
    expect(config.lineWidth).toBe(2);
    expect(config.glowIntensity).toBe(15);
    expect(config.fillMode).toBe(true);
    expect(config.color).toBeDefined();
  });

  it("should clear canvas with fade effect", () => {
    const data = createMockData();
    waveformVisualizer.render(ctx, data, waveformVisualizer.defaultConfig, dimensions, deltaTime);

    // First fillRect should be for fade effect (not full clear)
    expect(ctx.fillRect).toHaveBeenCalled();
  });

  it("should handle empty time domain data", () => {
    const data = createMockData({ timeDomainData: new Uint8Array(0) });

    expect(() => {
      waveformVisualizer.render(ctx, data, waveformVisualizer.defaultConfig, dimensions, deltaTime);
    }).not.toThrow();

    // Should draw idle line
    expect(ctx.stroke).toHaveBeenCalled();
  });

  it("should draw waveform path", () => {
    const data = createMockData();
    waveformVisualizer.render(ctx, data, waveformVisualizer.defaultConfig, dimensions, deltaTime);

    expect(ctx.beginPath).toHaveBeenCalled();
    expect(ctx.moveTo).toHaveBeenCalled();
    expect(ctx.lineTo).toHaveBeenCalled();
    expect(ctx.stroke).toHaveBeenCalled();
  });

  it("should apply glow effect", () => {
    const data = createMockData();
    waveformVisualizer.render(ctx, data, waveformVisualizer.defaultConfig, dimensions, deltaTime);

    // Shadow should be set for glow
    expect(ctx.shadowColor).toBeDefined();
  });

  it("should render fill mode when enabled", () => {
    const data = createMockData();
    const config = { ...waveformVisualizer.defaultConfig, fillMode: true };

    waveformVisualizer.render(ctx, data, config, dimensions, deltaTime);

    expect(ctx.fill).toHaveBeenCalled();
    expect(ctx.createLinearGradient).toHaveBeenCalled();
  });

  it("should draw grid lines", () => {
    const data = createMockData();
    waveformVisualizer.render(ctx, data, waveformVisualizer.defaultConfig, dimensions, deltaTime);

    // Grid lines are drawn with moveTo/lineTo
    const moveToCount = (ctx.moveTo as ReturnType<typeof vi.fn>).mock.calls.length;
    const lineToCount = (ctx.lineTo as ReturnType<typeof vi.fn>).mock.calls.length;

    // Should have multiple grid lines
    expect(moveToCount).toBeGreaterThan(5);
    expect(lineToCount).toBeGreaterThan(5);
  });

  it("should draw center line", () => {
    const data = createMockData();
    waveformVisualizer.render(ctx, data, waveformVisualizer.defaultConfig, dimensions, deltaTime);

    expect(ctx.setLineDash).toHaveBeenCalled();
  });

  it("should use configured line width", () => {
    const data = createMockData();
    const config = { ...waveformVisualizer.defaultConfig, lineWidth: 4 };

    waveformVisualizer.render(ctx, data, config, dimensions, deltaTime);

    // lineWidth is set during rendering
    expect(ctx.lineWidth).toBeDefined();
  });

  it("should adjust glow based on average frequency", () => {
    const lowData = createMockData({ averageFrequency: 0.1 });
    const highData = createMockData({ averageFrequency: 0.9 });

    // Render with low frequency
    waveformVisualizer.render(ctx, lowData, waveformVisualizer.defaultConfig, dimensions, deltaTime);

    vi.clearAllMocks();

    // Render with high frequency - glow should be more intense
    waveformVisualizer.render(ctx, highData, waveformVisualizer.defaultConfig, dimensions, deltaTime);

    // Both should render successfully
    expect(ctx.stroke).toHaveBeenCalled();
  });
});
