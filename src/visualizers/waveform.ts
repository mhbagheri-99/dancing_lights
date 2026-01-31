import type { VisualizerRenderer, AnalyserData, VisualizerConfig } from "./types";
import { wmpColors } from "@/utils/colorPalettes";

interface WaveformConfig extends VisualizerConfig {
  lineWidth: number;
  glowIntensity: number;
  fillMode: boolean;
  color: string;
}

export const waveformVisualizer: VisualizerRenderer = {
  name: "Waveform",
  description: "Real-time oscilloscope display with CRT-style glow",

  render(
    ctx: CanvasRenderingContext2D,
    data: AnalyserData,
    config: VisualizerConfig,
    { width, height }: { width: number; height: number }
  ) {
    const { timeDomainData, averageFrequency } = data;
    const { lineWidth, glowIntensity, fillMode, color } = config as WaveformConfig;

    // Clear canvas with high opacity for sharp lines (less ghosting)
    ctx.fillStyle = "rgba(10, 10, 15, 0.85)";
    ctx.fillRect(0, 0, width, height);

    if (timeDomainData.length === 0) {
      // Draw idle line
      ctx.strokeStyle = "rgba(0, 255, 127, 0.3)";
      ctx.lineWidth = 1;
      ctx.beginPath();
      ctx.moveTo(0, height / 2);
      ctx.lineTo(width, height / 2);
      ctx.stroke();
      return;
    }

    const centerY = height / 2;
    const amplitudeScale = height * 0.85;  // Much taller waves on y-axis
    const sliceWidth = width / timeDomainData.length;

    // Smooth linear boost - not aggressive
    const boostFactor = 1.8 + averageFrequency * 1.5;

    // Sharp neon glow effect
    ctx.shadowColor = color;
    ctx.shadowBlur = glowIntensity * (1 + averageFrequency * 0.5);

    // Single crisp pass for sharp neon line
    ctx.strokeStyle = color;
    ctx.lineWidth = lineWidth;
    ctx.lineCap = "round";
    ctx.lineJoin = "round";

    ctx.beginPath();
    for (let i = 0; i < timeDomainData.length; i++) {
      // Simple linear normalization - smooth, not aggressive
      const normalized = (timeDomainData[i] - 128) / 128;
      const x = i * sliceWidth;
      const y = centerY + normalized * amplitudeScale * boostFactor;

      if (i === 0) {
        ctx.moveTo(x, y);
      } else {
        ctx.lineTo(x, y);
      }
    }
    ctx.stroke();

    // Add bright core line for neon effect
    ctx.shadowBlur = 0;
    ctx.strokeStyle = `rgba(255, 255, 255, ${0.5 + averageFrequency * 0.4})`;
    ctx.lineWidth = lineWidth * 0.5;
    ctx.beginPath();
    for (let i = 0; i < timeDomainData.length; i++) {
      const normalized = (timeDomainData[i] - 128) / 128;
      const x = i * sliceWidth;
      const y = centerY + normalized * amplitudeScale * boostFactor;
      if (i === 0) {
        ctx.moveTo(x, y);
      } else {
        ctx.lineTo(x, y);
      }
    }
    ctx.stroke();

    // Restore shadow for fill
    ctx.shadowColor = color;
    ctx.shadowBlur = glowIntensity * 0.5;

    // Fill mode (area under curve)
    if (fillMode) {
      ctx.beginPath();
      ctx.moveTo(0, centerY);

      for (let i = 0; i < timeDomainData.length; i++) {
        const normalized = (timeDomainData[i] - 128) / 128;
        const x = i * sliceWidth;
        const y = centerY + normalized * amplitudeScale * boostFactor;
        ctx.lineTo(x, y);
      }

      ctx.lineTo(width, centerY);
      ctx.closePath();

      const gradient = ctx.createLinearGradient(0, centerY - amplitudeScale, 0, centerY + amplitudeScale);
      gradient.addColorStop(0, `${color}44`);
      gradient.addColorStop(0.5, `${color}18`);
      gradient.addColorStop(1, `${color}44`);
      ctx.fillStyle = gradient;
      ctx.fill();
    }

    // Draw center line
    ctx.shadowBlur = 0;
    ctx.strokeStyle = "rgba(255, 255, 255, 0.1)";
    ctx.lineWidth = 1;
    ctx.setLineDash([5, 5]);
    ctx.beginPath();
    ctx.moveTo(0, centerY);
    ctx.lineTo(width, centerY);
    ctx.stroke();
    ctx.setLineDash([]);

    // Draw grid lines
    ctx.strokeStyle = "rgba(255, 255, 255, 0.05)";
    for (let i = 1; i < 4; i++) {
      const y = (height / 4) * i;
      ctx.beginPath();
      ctx.moveTo(0, y);
      ctx.lineTo(width, y);
      ctx.stroke();
    }
    for (let i = 1; i < 8; i++) {
      const x = (width / 8) * i;
      ctx.beginPath();
      ctx.moveTo(x, 0);
      ctx.lineTo(x, height);
      ctx.stroke();
    }
  },

  defaultConfig: {
    lineWidth: 2.5,
    glowIntensity: 10,  // Brighter neon glow with amplified peaks
    fillMode: true,
    color: wmpColors.green,
  } as WaveformConfig,
};
