import type { VisualizerRenderer, VisualizerMode } from "./types";
import { barsVisualizer } from "./bars";
import { waveformVisualizer } from "./waveform";
import { scopeVisualizer } from "./scope";
import { ambianceVisualizer } from "./ambiance";

export const visualizers: Record<VisualizerMode, VisualizerRenderer> = {
  bars: barsVisualizer,
  waveform: waveformVisualizer,
  scope: scopeVisualizer,
  ambiance: ambianceVisualizer,
};

export { barsVisualizer, waveformVisualizer, scopeVisualizer, ambianceVisualizer };
export type { VisualizerRenderer, VisualizerMode };
