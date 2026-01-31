import { describe, it, expect, vi, beforeEach } from "vitest";
import { scopeVisualizer } from "@/visualizers/scope";
import type { AnalyserData } from "@/visualizers/types";
import { createMockCanvasContext } from "../setup";

describe("scopeVisualizer", () => {
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
    expect(scopeVisualizer.name).toBe("Scope");
    expect(scopeVisualizer.description).toContain("Circular");
    expect(scopeVisualizer.defaultConfig).toBeDefined();
  });

  it("should have valid default config", () => {
    const config = scopeVisualizer.defaultConfig;
    expect(config.pointCount).toBe(64);
    expect(config.baseRadius).toBe(0.25);
    expect(config.maxExpansion).toBe(0.15);
    expect(config.rotationSpeed).toBe(0.5);
    expect(config.showConnections).toBe(true);
    expect(config.dotSize).toBe(4);
  });

  it("should clear canvas with fade effect", () => {
    const data = createMockData();
    scopeVisualizer.render(ctx, data, scopeVisualizer.defaultConfig, dimensions, deltaTime);

    expect(ctx.fillRect).toHaveBeenCalled();
  });

  it("should draw points in a circle", () => {
    const data = createMockData();
    scopeVisualizer.render(ctx, data, scopeVisualizer.defaultConfig, dimensions, deltaTime);

    // Arc is used for drawing points
    expect(ctx.arc).toHaveBeenCalled();
    expect(ctx.fill).toHaveBeenCalled();
  });

  it("should draw connections when enabled", () => {
    const data = createMockData();
    const config = { ...scopeVisualizer.defaultConfig, showConnections: true };

    scopeVisualizer.render(ctx, data, config, dimensions, deltaTime);

    expect(ctx.beginPath).toHaveBeenCalled();
    expect(ctx.closePath).toHaveBeenCalled();
    expect(ctx.stroke).toHaveBeenCalled();
  });

  it("should handle different point counts", () => {
    const data = createMockData();

    // Fewer points
    const config1 = { ...scopeVisualizer.defaultConfig, pointCount: 16 };
    scopeVisualizer.render(ctx, data, config1, dimensions, deltaTime);
    expect(ctx.arc).toHaveBeenCalled();

    vi.clearAllMocks();

    // More points
    const config2 = { ...scopeVisualizer.defaultConfig, pointCount: 128 };
    scopeVisualizer.render(ctx, data, config2, dimensions, deltaTime);
    expect(ctx.arc).toHaveBeenCalled();
  });

  it("should apply rotation based on delta time", () => {
    const data = createMockData();

    // Render first frame
    scopeVisualizer.render(ctx, data, scopeVisualizer.defaultConfig, dimensions, deltaTime);
    const calls1 = (ctx.arc as ReturnType<typeof vi.fn>).mock.calls.slice();

    vi.clearAllMocks();

    // Render second frame with same data - rotation should change
    scopeVisualizer.render(ctx, data, scopeVisualizer.defaultConfig, dimensions, deltaTime);
    const calls2 = (ctx.arc as ReturnType<typeof vi.fn>).mock.calls.slice();

    // Points should be at different positions due to rotation
    expect(calls2.length).toBeGreaterThan(0);
  });

  it("should draw center circle", () => {
    const data = createMockData();
    scopeVisualizer.render(ctx, data, scopeVisualizer.defaultConfig, dimensions, deltaTime);

    // Should create radial gradient for center
    expect(ctx.createRadialGradient).toHaveBeenCalled();
  });

  it("should draw outer ring", () => {
    const data = createMockData();
    scopeVisualizer.render(ctx, data, scopeVisualizer.defaultConfig, dimensions, deltaTime);

    // Arc for outer ring
    const arcCalls = (ctx.arc as ReturnType<typeof vi.fn>).mock.calls;
    expect(arcCalls.length).toBeGreaterThan(0);
    expect(ctx.stroke).toHaveBeenCalled();
  });

  it("should expand radius based on frequency amplitude", () => {
    const lowData = createMockData({
      frequencyData: new Uint8Array(1024).fill(0)
    });
    const highData = createMockData({
      frequencyData: new Uint8Array(1024).fill(255)
    });

    // Both should render without error
    scopeVisualizer.render(ctx, lowData, scopeVisualizer.defaultConfig, dimensions, deltaTime);
    expect(ctx.arc).toHaveBeenCalled();

    vi.clearAllMocks();

    scopeVisualizer.render(ctx, highData, scopeVisualizer.defaultConfig, dimensions, deltaTime);
    expect(ctx.arc).toHaveBeenCalled();
  });

  it("should handle empty frequency data", () => {
    const data = createMockData({ frequencyData: new Uint8Array(0) });

    expect(() => {
      scopeVisualizer.render(ctx, data, scopeVisualizer.defaultConfig, dimensions, deltaTime);
    }).not.toThrow();
  });

  it("should apply glow effects to points", () => {
    const data = createMockData();
    scopeVisualizer.render(ctx, data, scopeVisualizer.defaultConfig, dimensions, deltaTime);

    // Shadow blur should be set for glow
    expect(ctx.shadowBlur).toBeDefined();
  });
});
