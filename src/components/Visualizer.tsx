"use client";

import { useEffect, useState, useCallback } from "react";
import { useVisualizerState } from "@/hooks/useVisualizerState";
import { VisualizerCanvas } from "./VisualizerCanvas";
import { MicrophoneButton } from "./MicrophoneButton";
import { ModeSelector } from "./ModeSelector";
import type { VisualizerMode } from "@/visualizers/types";

export function Visualizer() {
  const {
    currentMode,
    isActive,
    isRequesting,
    permissionState,
    error,
    toggleMicrophone,
    setMode,
    getData,
  } = useVisualizerState();

  const [showControls, setShowControls] = useState(true);
  const [isFullscreen, setIsFullscreen] = useState(false);

  // Handle keyboard shortcuts
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Ignore if typing in an input
      if (e.target instanceof HTMLInputElement || e.target instanceof HTMLTextAreaElement) {
        return;
      }

      switch (e.key) {
        case " ": // Space - toggle microphone
          e.preventDefault();
          toggleMicrophone();
          break;
        case "1":
          setMode("bars");
          break;
        case "2":
          setMode("waveform");
          break;
        case "3":
          setMode("scope");
          break;
        case "4":
          setMode("ambiance");
          break;
        case "f": // Fullscreen
        case "F":
          toggleFullscreen();
          break;
        case "h": // Toggle controls visibility
        case "H":
          setShowControls((prev) => !prev);
          break;
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [toggleMicrophone, setMode]);

  // Track fullscreen state
  useEffect(() => {
    const handleFullscreenChange = () => {
      setIsFullscreen(!!document.fullscreenElement);
    };

    document.addEventListener("fullscreenchange", handleFullscreenChange);
    return () => document.removeEventListener("fullscreenchange", handleFullscreenChange);
  }, []);

  const toggleFullscreen = useCallback(async () => {
    try {
      if (!document.fullscreenElement) {
        await document.documentElement.requestFullscreen();
      } else {
        await document.exitFullscreen();
      }
    } catch (err) {
      console.error("Fullscreen error:", err);
    }
  }, []);

  // Auto-hide controls after 3 seconds of inactivity when active
  useEffect(() => {
    if (!isActive) {
      setShowControls(true);
      return;
    }

    let timeout: NodeJS.Timeout;

    const resetTimer = () => {
      setShowControls(true);
      clearTimeout(timeout);
      timeout = setTimeout(() => setShowControls(false), 3000);
    };

    resetTimer();

    window.addEventListener("mousemove", resetTimer);
    window.addEventListener("click", resetTimer);

    return () => {
      clearTimeout(timeout);
      window.removeEventListener("mousemove", resetTimer);
      window.removeEventListener("click", resetTimer);
    };
  }, [isActive]);

  return (
    <div className="relative w-full h-screen overflow-hidden bg-[var(--bg-primary)]">
      {/* Canvas */}
      <VisualizerCanvas getData={getData} mode={currentMode} isActive={isActive} />

      {/* Controls overlay */}
      <div
        className={`controls-overlay absolute inset-x-0 bottom-0 p-6 flex flex-col items-center gap-4 ${
          showControls ? "opacity-100" : "opacity-0 pointer-events-none"
        }`}
      >
        {/* Mode selector */}
        <ModeSelector currentMode={currentMode} onModeChange={setMode} />

        {/* Microphone button */}
        <MicrophoneButton
          isActive={isActive}
          isRequesting={isRequesting}
          permissionState={permissionState}
          error={error}
          onClick={toggleMicrophone}
        />

        {/* Keyboard hints */}
        <div className="flex gap-4 text-xs text-[var(--text-secondary)]">
          <span>Space: Toggle mic</span>
          <span>1-4: Switch mode</span>
          <span>F: Fullscreen</span>
          <span>H: Hide controls</span>
        </div>
      </div>

      {/* Fullscreen button (always visible in corner) */}
      <button
        onClick={toggleFullscreen}
        className="absolute top-4 right-4 p-2 rounded-lg bg-[var(--bg-secondary)] text-[var(--text-secondary)] hover:text-[var(--text-primary)] transition-colors"
        aria-label={isFullscreen ? "Exit fullscreen" : "Enter fullscreen"}
      >
        {isFullscreen ? <ExitFullscreenIcon /> : <FullscreenIcon />}
      </button>

      {/* Mode indicator (always visible) */}
      <div className="absolute top-4 left-4 px-3 py-1.5 rounded-full bg-[var(--bg-secondary)] text-[var(--text-secondary)] text-sm">
        {getModeLabel(currentMode)}
      </div>
    </div>
  );
}

function getModeLabel(mode: VisualizerMode): string {
  const labels: Record<VisualizerMode, string> = {
    bars: "Bars",
    waveform: "Waveform",
    scope: "Scope",
    ambiance: "Ambiance",
  };
  return labels[mode];
}

function FullscreenIcon() {
  return (
    <svg
      width="20"
      height="20"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <path d="M8 3H5a2 2 0 0 0-2 2v3" />
      <path d="M21 8V5a2 2 0 0 0-2-2h-3" />
      <path d="M3 16v3a2 2 0 0 0 2 2h3" />
      <path d="M16 21h3a2 2 0 0 0 2-2v-3" />
    </svg>
  );
}

function ExitFullscreenIcon() {
  return (
    <svg
      width="20"
      height="20"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <path d="M8 3v3a2 2 0 0 1-2 2H3" />
      <path d="M21 8h-3a2 2 0 0 1-2-2V3" />
      <path d="M3 16h3a2 2 0 0 1 2 2v3" />
      <path d="M16 21v-3a2 2 0 0 1 2-2h3" />
    </svg>
  );
}
