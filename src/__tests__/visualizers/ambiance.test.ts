import { describe, it, expect, vi, beforeEach } from "vitest";
import { ambianceVisualizer } from "@/visualizers/ambiance";
import type { AnalyserData } from "@/visualizers/types";
import { createMockCanvasContext } from "../setup";

describe("ambianceVisualizer", () => {
  let ctx: CanvasRenderingContext2D;
  const dimensions = { width: 800, height: 600 };
  const deltaTime = 16;

  beforeEach(() => {
    ctx = createMockCanvasContext();
    vi.clearAllMocks();
  });

  function createMockData(options: Partial<AnalyserData> = {}): AnalyserData {
    const frequencyData = new Uint8Array(1024);
    // Create realistic frequency distribution
    for (let i = 0; i < frequencyData.length; i++) {
      frequencyData[i] = Math.max(0, 200 - i * 0.2);
    }

    return {
      frequencyData,
      timeDomainData: new Uint8Array(2048).fill(128),
      averageFrequency: 0.5,
      peakFrequency: 50,
      ...options,
    };
  }

  it("should have correct metadata", () => {
    expect(ambianceVisualizer.name).toBe("Ambiance");
    expect(ambianceVisualizer.description).toContain("particles");
    expect(ambianceVisualizer.defaultConfig).toBeDefined();
  });

  it("should have valid default config", () => {
    const config = ambianceVisualizer.defaultConfig;
    expect(config.particleCount).toBe(80);
    expect(config.maxSize).toBe(40);
    expect(config.minSize).toBe(10);
    expect(config.flowSpeed).toBe(1);
    expect(config.reactivity).toBe(2);
  });

  it("should clear canvas with heavy fade for trails", () => {
    const data = createMockData();
    ambianceVisualizer.render(ctx, data, ambianceVisualizer.defaultConfig, dimensions, deltaTime);

    expect(ctx.fillRect).toHaveBeenCalled();
  });

  it("should draw particles", () => {
    const data = createMockData();
    ambianceVisualizer.render(ctx, data, ambianceVisualizer.defaultConfig, dimensions, deltaTime);

    // Particles are drawn with arc
    expect(ctx.arc).toHaveBeenCalled();
    expect(ctx.fill).toHaveBeenCalled();
  });

  it("should create radial gradients for particles", () => {
    const data = createMockData();
    ambianceVisualizer.render(ctx, data, ambianceVisualizer.defaultConfig, dimensions, deltaTime);

    expect(ctx.createRadialGradient).toHaveBeenCalled();
  });

  it("should handle different particle counts", () => {
    const data = createMockData();

    // Fewer particles
    const config1 = { ...ambianceVisualizer.defaultConfig, particleCount: 20 };
    ambianceVisualizer.render(ctx, data, config1, dimensions, deltaTime);
    const arcCalls1 = (ctx.arc as ReturnType<typeof vi.fn>).mock.calls.length;

    vi.clearAllMocks();

    // More particles
    const config2 = { ...ambianceVisualizer.defaultConfig, particleCount: 100 };
    ambianceVisualizer.render(ctx, data, config2, dimensions, deltaTime);
    const arcCalls2 = (ctx.arc as ReturnType<typeof vi.fn>).mock.calls.length;

    // More particles should result in more draw calls
    expect(arcCalls2).toBeGreaterThan(arcCalls1);
  });

  it("should react to bass energy", () => {
    const highBassData = createMockData({
      frequencyData: new Uint8Array(1024).map((_, i) => i < 100 ? 255 : 0),
    });

    ambianceVisualizer.render(ctx, highBassData, ambianceVisualizer.defaultConfig, dimensions, deltaTime);

    // Should still render
    expect(ctx.arc).toHaveBeenCalled();
  });

  it("should apply glow effects", () => {
    const data = createMockData();
    ambianceVisualizer.render(ctx, data, ambianceVisualizer.defaultConfig, dimensions, deltaTime);

    // Shadow should be set for glow
    expect(ctx.shadowBlur).toBeDefined();
  });

  it("should draw background gradient", () => {
    const data = createMockData();
    ambianceVisualizer.render(ctx, data, ambianceVisualizer.defaultConfig, dimensions, deltaTime);

    // Background gradient for ambient effect
    expect(ctx.createRadialGradient).toHaveBeenCalled();
    expect(ctx.fillRect).toHaveBeenCalled();
  });

  it("should handle empty frequency data", () => {
    const data = createMockData({ frequencyData: new Uint8Array(0) });

    expect(() => {
      ambianceVisualizer.render(ctx, data, ambianceVisualizer.defaultConfig, dimensions, deltaTime);
    }).not.toThrow();
  });

  it("should animate particles over multiple frames", () => {
    const data = createMockData();

    // Render multiple frames
    ambianceVisualizer.render(ctx, data, ambianceVisualizer.defaultConfig, dimensions, deltaTime);
    ambianceVisualizer.render(ctx, data, ambianceVisualizer.defaultConfig, dimensions, deltaTime);
    ambianceVisualizer.render(ctx, data, ambianceVisualizer.defaultConfig, dimensions, deltaTime);

    // Should continue to render
    expect(ctx.arc).toHaveBeenCalled();
  });

  it("should use reactivity config", () => {
    const data = createMockData();

    // Low reactivity
    const config1 = { ...ambianceVisualizer.defaultConfig, reactivity: 0.5 };
    ambianceVisualizer.render(ctx, data, config1, dimensions, deltaTime);
    expect(ctx.arc).toHaveBeenCalled();

    vi.clearAllMocks();

    // High reactivity
    const config2 = { ...ambianceVisualizer.defaultConfig, reactivity: 5 };
    ambianceVisualizer.render(ctx, data, config2, dimensions, deltaTime);
    expect(ctx.arc).toHaveBeenCalled();
  });

  it("should draw inner bright cores on particles", () => {
    const data = createMockData();
    ambianceVisualizer.render(ctx, data, ambianceVisualizer.defaultConfig, dimensions, deltaTime);

    // Multiple arcs per particle (main + core)
    const arcCalls = (ctx.arc as ReturnType<typeof vi.fn>).mock.calls.length;
    const particleCount = ambianceVisualizer.defaultConfig.particleCount as number;

    // Should have at least as many arc calls as particles
    expect(arcCalls).toBeGreaterThanOrEqual(particleCount);
  });
});
