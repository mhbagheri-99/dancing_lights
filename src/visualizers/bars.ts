import type { VisualizerRenderer, AnalyserData, VisualizerConfig } from "./types";
import { getBarColor } from "@/utils/colorPalettes";

interface BarsConfig extends VisualizerConfig {
  barCount: number;
  barWidthRatio: number;
  showReflection: boolean;
  smoothing: number;
}

// Store previous values for smooth animation
let previousHeights: number[] = [];
// Random offsets for each bar (regenerated periodically)
let randomOffsets: number[] = [];
let lastOffsetUpdate = 0;

export const barsVisualizer: VisualizerRenderer = {
  name: "Bars",
  description: "Classic frequency spectrum analyzer with gradient coloring",

  render(
    ctx: CanvasRenderingContext2D,
    data: AnalyserData,
    config: VisualizerConfig,
    { width, height }: { width: number; height: number }
  ) {
    const { averageFrequency } = data;
    const { barCount, barWidthRatio, showReflection, smoothing } = config as BarsConfig;

    // Clear canvas
    ctx.fillStyle = "#0a0a0f";
    ctx.fillRect(0, 0, width, height);

    // Initialize arrays if needed
    if (previousHeights.length !== barCount) {
      previousHeights = new Array(barCount).fill(0);
    }
    if (randomOffsets.length !== barCount) {
      randomOffsets = new Array(barCount).fill(0).map(() => Math.random());
    }

    // Update random offsets frequently for energetic movement
    const now = Date.now();
    if (now - lastOffsetUpdate > 30 + (1 - averageFrequency) * 50) {
      // More aggressive random shifts
      for (let i = 0; i < barCount; i++) {
        randomOffsets[i] += (Math.random() - 0.5) * 0.5;
        randomOffsets[i] = Math.max(0, Math.min(1, randomOffsets[i]));
      }
      lastOffsetUpdate = now;
    }

    const totalBarWidth = width / barCount;
    const barWidth = totalBarWidth * barWidthRatio;
    const gap = totalBarWidth * (1 - barWidthRatio);
    const maxBarHeight = height * 0.85;
    const baseY = height * 0.9;

    for (let i = 0; i < barCount; i++) {
      // Boost weak signals and add random variation for energetic movement
      const boostedFreq = Math.pow(averageFrequency, 0.5) * 1.5;  // Square root boost for weak signals
      const randomVariation = 0.4 + randomOffsets[i] * 1.4;  // 0.4 to 1.8 range
      const amplitude = Math.min(1, boostedFreq * randomVariation + 0.05);  // Floor of 0.05

      // Calculate target height
      const targetHeight = amplitude * maxBarHeight;

      // Smooth animation
      const currentHeight = previousHeights[i] + (targetHeight - previousHeights[i]) * (1 - smoothing);
      previousHeights[i] = currentHeight;

      // Bar position
      const x = i * totalBarWidth + gap / 2;
      const barHeight = Math.max(2, currentHeight);

      // Get color based on amplitude and frequency position
      const colorIntensity = (i / barCount + amplitude) / 2;
      const color = getBarColor(colorIntensity);

      // Draw main bar
      ctx.fillStyle = color;
      const y = baseY - barHeight;
      ctx.fillRect(x, y, barWidth, barHeight);

      // Add glow effect for high amplitude
      if (amplitude > 0.6) {
        ctx.shadowColor = color;
        ctx.shadowBlur = 15;
        ctx.fillRect(x, y, barWidth, barHeight);
        ctx.shadowBlur = 0;
      }

      // Draw reflection
      if (showReflection) {
        const gradient = ctx.createLinearGradient(0, baseY, 0, baseY + barHeight * 0.4);
        gradient.addColorStop(0, color.replace(")", ", 0.3)").replace("rgb", "rgba"));
        gradient.addColorStop(1, "transparent");
        ctx.fillStyle = gradient;
        ctx.fillRect(x, baseY, barWidth, barHeight * 0.4);
      }

      // Draw bar cap (small highlight at top)
      ctx.fillStyle = `rgba(255, 255, 255, ${amplitude * 0.3})`;
      ctx.fillRect(x, y, barWidth, 2);
    }

    // Draw baseline
    ctx.strokeStyle = "rgba(255, 255, 255, 0.1)";
    ctx.lineWidth = 1;
    ctx.beginPath();
    ctx.moveTo(0, baseY);
    ctx.lineTo(width, baseY);
    ctx.stroke();
  },

  defaultConfig: {
    barCount: 64,
    barWidthRatio: 0.75,
    showReflection: true,
    smoothing: 0.3,
  } as BarsConfig,
};
