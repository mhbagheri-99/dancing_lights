export interface AnalyserData {
  frequencyData: Uint8Array;
  timeDomainData: Uint8Array;
  averageFrequency: number;
  peakFrequency: number;
}

export interface VisualizerConfig {
  [key: string]: unknown;
}

export interface VisualizerRenderer {
  name: string;
  description: string;
  render: (
    ctx: CanvasRenderingContext2D,
    data: AnalyserData,
    config: VisualizerConfig,
    dimensions: { width: number; height: number },
    deltaTime: number
  ) => void;
  defaultConfig: VisualizerConfig;
}

export type VisualizerMode = "bars" | "waveform" | "scope" | "ambiance";
