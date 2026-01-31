"use client";

import { useRef, useEffect, useCallback } from "react";
import { useAnimationFrame } from "@/hooks/useAnimationFrame";
import type { AnalyserData, VisualizerMode } from "@/visualizers/types";
import { visualizers } from "@/visualizers";

interface VisualizerCanvasProps {
  getData: () => AnalyserData;
  mode: VisualizerMode;
  isActive: boolean;
}

export function VisualizerCanvas({ getData, mode, isActive }: VisualizerCanvasProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const dimensionsRef = useRef({ width: 0, height: 0 });

  // Handle canvas resize
  useEffect(() => {
    const container = containerRef.current;
    const canvas = canvasRef.current;
    if (!container || !canvas) return;

    const updateSize = () => {
      const rect = container.getBoundingClientRect();
      const dpr = window.devicePixelRatio || 1;

      // Set canvas size accounting for device pixel ratio
      canvas.width = rect.width * dpr;
      canvas.height = rect.height * dpr;

      // Set CSS size
      canvas.style.width = `${rect.width}px`;
      canvas.style.height = `${rect.height}px`;

      // Scale context for high-DPI displays
      const ctx = canvas.getContext("2d");
      if (ctx) {
        ctx.scale(dpr, dpr);
      }

      dimensionsRef.current = { width: rect.width, height: rect.height };
    };

    // Initial size
    updateSize();

    // Resize observer for responsive sizing
    const resizeObserver = new ResizeObserver(updateSize);
    resizeObserver.observe(container);

    return () => resizeObserver.disconnect();
  }, []);

  // Render loop
  const render = useCallback(
    (deltaTime: number) => {
      const canvas = canvasRef.current;
      if (!canvas) return;

      const ctx = canvas.getContext("2d");
      if (!ctx) return;

      const { width, height } = dimensionsRef.current;
      const data = getData();
      const visualizer = visualizers[mode];

      if (visualizer) {
        visualizer.render(ctx, data, visualizer.defaultConfig, { width, height }, deltaTime);
      }
    },
    [getData, mode]
  );

  // Animation loop
  useAnimationFrame(render, isActive);

  // Draw idle state when not active
  useEffect(() => {
    if (isActive) return;

    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    const { width, height } = dimensionsRef.current;

    // Clear canvas
    ctx.clearRect(0, 0, width, height);
    ctx.fillStyle = "var(--bg-primary)";
    ctx.fillRect(0, 0, width, height);

    // Draw idle message
    ctx.fillStyle = "var(--text-secondary)";
    ctx.font = "16px system-ui, sans-serif";
    ctx.textAlign = "center";
    ctx.textBaseline = "middle";
    ctx.fillText("Click 'Start' to enable microphone", width / 2, height / 2);
  }, [isActive]);

  return (
    <div ref={containerRef} className="absolute inset-0 bg-[var(--bg-primary)]">
      <canvas ref={canvasRef} className="block w-full h-full" />
    </div>
  );
}
